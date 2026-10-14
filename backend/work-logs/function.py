"""Work logs service: employees log a day's work; admins enter past days and correct mistakes.

Routes (under /api/work-logs):
    GET  /      signed in: logs you can see, newest first
                filters: ?project_id= ?employee_id= ?milestone_id= ?from=YYYY-MM-DD ?to=YYYY-MM-DD
    GET  /{id}  signed in: one log you can see
    POST /      employee: log today on your current milestone
                admin: enter a past day for any employee
    PUT  /{id}  admin: correct a log's project, milestone or date

There's no DELETE: wrong entries are corrected in place, and the activity log keeps the history.

Every log is 8 hours on a weekday, one per employee per day. Hourly rate and cost are
shown only to admins and to the employee's own manager.
"""

from decimal import ROUND_HALF_UP, Decimal

from psycopg.errors import UniqueViolation

from shared import clock, db
from shared.access import get_visible_project, visible_projects_filter
from shared.activity import changed_fields, full_name, log_activity, notify
from shared.auth import ADMIN, ADMIN_ONLY, ANY_ROLE, EMPLOYEE, MANAGER
from shared.http import conflict, not_found
from shared.milestones import AVAILABLE, milestone_status
from shared.query import QueryParams
from shared.router import Router
from shared.sql import person_json
from shared.validation import Validator

router = Router("work-logs")

ADMIN_OR_EMPLOYEE = frozenset({ADMIN, EMPLOYEE})
WORK_HOURS_PER_YEAR = 2080  # 52 weeks * 40 hours

LOG_SQL = f"""
    SELECT wl.id, wl.work_date, wl.hours, wl.hourly_rate, wl.created_at,
           wl.employee_id, {person_json('e')} AS employee, e.manager_id AS employee_manager_id,
           wl.project_id, p.name AS project_name,
           wl.milestone_id, m.name AS milestone_name,
           {person_json('eb')} AS entered_by
    FROM work_logs wl
    JOIN users e      ON e.id = wl.employee_id
    JOIN users eb     ON eb.id = wl.entered_by
    JOIN projects p   ON p.id = wl.project_id
    JOIN milestones m ON m.id = wl.milestone_id
"""


def visible_logs_filter(user):
    """A SQL condition (and its params) limiting logs to those the user can see:
    admins see all; managers see their own employees' logs on projects they can see;
    employees see their own logs on projects they can still see."""
    if user["role"] == ADMIN:
        return "TRUE", ()
    project_condition, project_params = visible_projects_filter(user)
    owner = "e.manager_id = %s" if user["role"] == MANAGER else "wl.employee_id = %s"
    return f"{owner} AND {project_condition}", (user["id"], *project_params)


def sees_pay(user, log):
    """Pay is shown only to admins and to the employee's own manager."""
    return user["role"] == ADMIN or log["employee_manager_id"] == user["id"]


def to_json(log, user):
    """The log as the API returns it; pay only for those who may see it."""
    body = {
        "id": log["id"],
        "work_date": log["work_date"],
        "employee": log["employee"],
        "project": {"id": log["project_id"], "name": log["project_name"]},
        "milestone": {"id": log["milestone_id"], "name": log["milestone_name"]},
        "hours": log["hours"],
        "entered_by": log["entered_by"],
        # Entered by someone else (an admin) rather than the employee on the day.
        "historical": log["entered_by"]["id"] != log["employee_id"],
        "created_at": log["created_at"],
    }
    if sees_pay(user, log):
        body["hourly_rate"] = log["hourly_rate"]
        body["cost"] = (log["hours"] * log["hourly_rate"]).quantize(Decimal("0.01"))
    return body


def hourly_rate(annual_salary):
    """The salary spread over a standard working year, rounded to cents (half up, as Postgres does)."""
    return (Decimal(annual_salary) / WORK_HOURS_PER_YEAR).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def is_weekday(day):
    """Monday to Friday."""
    return day.isoweekday() < 6


def fetch_log(conn, user, log_id, lock=False):
    """The log if the user can see it; otherwise 404. lock=True holds a row lock on it."""
    condition, params = visible_logs_filter(user)
    log = conn.execute(
        f"{LOG_SQL} WHERE wl.id = %s AND {condition} {'FOR UPDATE OF wl' if lock else ''}",
        (log_id, *params),
    ).fetchone()
    if log is None:
        raise not_found("Work log not found.")
    return log


def insert_log(conn, employee_id, project_id, milestone_id, work_date, rate, entered_by):
    """Saves a new log and returns its id."""
    return conn.execute(
        """
        INSERT INTO work_logs (employee_id, project_id, milestone_id, work_date, hourly_rate, entered_by)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (employee_id, project_id, milestone_id, work_date, rate, entered_by),
    ).fetchone()["id"]


def milestone_in_project(conn, milestone_id, project_id):
    """The milestone's id and name if it belongs to the project; otherwise None."""
    return conn.execute(
        "SELECT id, name FROM milestones WHERE id = %s AND project_id = %s",
        (milestone_id, project_id),
    ).fetchone()


def check_work_date(v, work_date):
    """Admins may enter past weekdays, never future ones."""
    if work_date is None:
        return
    if work_date > clock.today():
        v.add_error("work_date", "Can't be in the future.")
    elif not is_weekday(work_date):
        v.add_error("work_date", "Must be a weekday.")


@router.route("GET", "/", roles=ANY_ROLE)
def list_logs(request):
    q = QueryParams(request.query)
    project_id = q.id("project_id")
    employee_id = q.id("employee_id")
    milestone_id = q.id("milestone_id")
    date_from = q.date("from")
    date_to = q.date("to")
    if date_from and date_to and date_from > date_to:
        q.add_error("to", "Must be on or after the 'from' date.")
    q.raise_if_invalid()

    condition, params = visible_logs_filter(request.user)
    conditions, params = [condition], list(params)
    for column, value in (("wl.project_id = %s", project_id), ("wl.employee_id = %s", employee_id),
                          ("wl.milestone_id = %s", milestone_id), ("wl.work_date >= %s", date_from),
                          ("wl.work_date <= %s", date_to)):
        if value is not None:
            conditions.append(column)
            params.append(value)

    logs = db.fetch_all(
        f"{LOG_SQL} WHERE {' AND '.join(conditions)} ORDER BY wl.work_date DESC, wl.id DESC",
        params,
    )
    return [to_json(log, request.user) for log in logs]


@router.route("GET", "/{id}", roles=ANY_ROLE)
def get_log(request):
    with db.transaction() as conn:
        log = fetch_log(conn, request.user, request.path_params["id"])
    return to_json(log, request.user)


@router.route("POST", "/", roles=ADMIN_OR_EMPLOYEE)
def create_log(request):
    try:
        if request.user["role"] == EMPLOYEE:
            return log_today(request)
        return enter_past_day(request)
    except UniqueViolation:
        # The one_log_per_day constraint: one log per employee per day.
        if request.user["role"] == EMPLOYEE:
            raise conflict("You've already logged work today.", "already_logged")
        raise conflict("This employee already has a work log on that day.", "already_logged")


def log_today(request):
    """An employee logs today's work on their current, available milestone."""
    user = request.user
    v = Validator(request.json())
    project_id = v.integer("project_id", required=True, minimum=1)
    milestone_id = v.integer("milestone_id", minimum=1)
    v.raise_if_invalid()

    today = clock.today()
    if not is_weekday(today):
        raise conflict("You can only log work on weekdays.", "not_a_weekday")

    with db.transaction() as conn:
        # Employees only see open projects they're a current member of, so this also
        # checks membership and that the project is in progress and not archived.
        get_visible_project(conn, user, project_id)
        member = conn.execute(
            """
            SELECT milestone_id FROM project_members
            WHERE project_id = %s AND employee_id = %s AND removed_at IS NULL
            FOR UPDATE
            """,
            (project_id, user["id"]),
        ).fetchone()
        current = member["milestone_id"]
        if current is None:
            raise conflict("You aren't assigned to a milestone on this project yet.", "no_milestone")
        if milestone_id is not None and milestone_id != current:
            v.add_error("milestone_id", "You can only log work on your current milestone.")
            v.raise_if_invalid()
        status = milestone_status(conn, current)
        if status != AVAILABLE:
            raise conflict(f"You can't log work while your milestone is {status.replace('_', ' ')}.",
                           "milestone_unavailable")

        salary = conn.execute("SELECT annual_salary FROM users WHERE id = %s", (user["id"],)).fetchone()
        log_id = insert_log(conn, user["id"], project_id, current, today,
                            hourly_rate(salary["annual_salary"]), user["id"])
        # An employee's own daily log isn't an activity entry, by the user's decision.
        log = fetch_log(conn, user, log_id)
    return 201, to_json(log, user)


def enter_past_day(request):
    """An admin enters a day for any employee, for example to record past work.

    Current membership and milestone status aren't checked, because the entry may cover
    an earlier assignment. The rate is the employee's current salary unless one is given.
    """
    admin = request.user
    v = Validator(request.json())
    employee_id = v.integer("employee_id", required=True, minimum=1)
    project_id = v.integer("project_id", required=True, minimum=1)
    milestone_id = v.integer("milestone_id", required=True, minimum=1)
    work_date = v.date("work_date", required=True)
    rate = v.money("hourly_rate")
    check_work_date(v, work_date)
    v.raise_if_invalid()

    with db.transaction() as conn:
        employee = conn.execute(
            """
            SELECT id, first_name, last_name, annual_salary FROM users
            WHERE id = %s AND role = 'employee' AND archived_at IS NULL
            """,
            (employee_id,),
        ).fetchone()
        if employee is None:
            v.add_error("employee_id", "Must be an active employee.")
        project = conn.execute("SELECT id, name FROM projects WHERE id = %s", (project_id,)).fetchone()
        if project is None:
            v.add_error("project_id", "Project not found.")
        elif milestone_in_project(conn, milestone_id, project_id) is None:
            v.add_error("milestone_id", "Must be a milestone of this project.")
        v.raise_if_invalid()

        if rate is None:
            rate = hourly_rate(employee["annual_salary"])
        log_id = insert_log(conn, employee_id, project_id, milestone_id, work_date, rate, admin["id"])
        log = fetch_log(conn, admin, log_id)
        log_activity(conn, admin, "work_log.create", "work_log", log_id,
                     f"Logged {work_date} for {full_name(employee)} on {log['project_name']} · {log['milestone_name']}.",
                     project_id=project_id)
    return 201, to_json(log, admin)


# The fields an admin can correct: (label in the summary, column, name shown in the summary).
CORRECTABLE = (
    ("project", "project_id", "project_name"),
    ("milestone", "milestone_id", "milestone_name"),
    ("date", "work_date", "work_date"),
)


def describe_changes(before, after):
    """'Changed milestone from Design to Backend API.' for every corrected field."""
    parts = [f"{label} from {before[shown]} to {after[shown]}"
             for label, column, shown in CORRECTABLE if before[column] != after[column]]
    listed = parts[0] if len(parts) == 1 else ", ".join(parts[:-1]) + " and " + parts[-1]
    return f"Changed {listed}."


@router.route("PUT", "/{id}", roles=ADMIN_ONLY)
def correct_log(request):
    admin = request.user
    v = Validator(request.json(), partial=True)
    project_id = v.integer("project_id", required=True, minimum=1)
    milestone_id = v.integer("milestone_id", required=True, minimum=1)
    work_date = v.date("work_date", required=True)
    check_work_date(v, work_date)
    v.raise_if_invalid()

    try:
        with db.transaction() as conn:
            before = fetch_log(conn, admin, request.path_params["id"], lock=True)
            after = {field: value for field, value in
                     (("project_id", project_id), ("milestone_id", milestone_id), ("work_date", work_date))
                     if value is not None}
            changes = changed_fields(before, after)
            if not changes:
                return to_json(before, admin)

            new = {**before, **after}
            if "project_id" in changes and conn.execute(
                    "SELECT 1 FROM projects WHERE id = %s", (new["project_id"],)).fetchone() is None:
                v.add_error("project_id", "Project not found.")
            elif milestone_in_project(conn, new["milestone_id"], new["project_id"]) is None:
                v.add_error("milestone_id", "Must be a milestone of this project.")
            v.raise_if_invalid()

            conn.execute(
                "UPDATE work_logs SET project_id = %s, milestone_id = %s, work_date = %s WHERE id = %s",
                (new["project_id"], new["milestone_id"], new["work_date"], before["id"]),
            )
            log = fetch_log(conn, admin, before["id"])
            record = f"{before['employee']['name']} · {before['work_date']}"
            sentence = describe_changes(before, log)
            log_activity(conn, admin, "work_log.correct", "work_log", before["id"],
                         f"Corrected work log {record}. {sentence}", project_id=log["project_id"], changes=changes)
            notify(conn, before["employee_id"], "Work log corrected", f"{record}. {sentence}",
                   project_id=log["project_id"], milestone_id=log["milestone_id"])
    except UniqueViolation:
        raise conflict("This employee already has a work log on that day.", "already_logged")
    return to_json(log, admin)


def handler(event, context=None):
    return router.handle(event)
