"""Projects service: projects, their lifecycle, and who works on them. DELETE archives; nothing is deleted.

Routes (under /api/projects):
    GET    /                          signed in: visible projects (admin: ?status=, ?archived=true|false)
    GET    /{id}                      signed in: one visible project
    POST   /                          admin: create a project
    PUT    /{id}                      admin, or its manager: edit an open project (manager_id: admin only)
    DELETE /{id}                      admin: archive a completed or abandoned project
    POST   /{id}/complete             admin, or its manager: complete once every milestone is complete
    POST   /{id}/abandon              admin: abandon an open project
    POST   /{id}/unarchive            admin: unarchive and reopen; clears the manager and the members
    GET    /{id}/members              signed in: current members of a visible project
    POST   /{id}/members              admin, or its manager: add an employee
    PUT    /{id}/members/{member_id}  admin, or its manager: change a member's milestone
    DELETE /{id}/members/{member_id}  admin, or its manager: remove a member
"""

from shared import auth, db
from shared.access import get_managed_project, get_visible_project, require_open_project, visible_projects_filter
from shared.activity import changed_fields, full_name, log_activity, notify
from shared.auth import ADMIN, MANAGER
from shared.http import conflict, forbidden, not_found
from shared.milestones import STATUS_SQL
from shared.people import find_active_manager
from shared.router import Router
from shared.sql import person_json, save, update_sql
from shared.validation import Validator

router = Router("projects")

STATUSES = {"in_progress", "completed", "abandoned"}
BOOLEAN = {"true", "false"}

PROJECT_SQL = f"""
    SELECT p.id, p.name, p.manager_id, {person_json('mgr')} AS manager,
           p.start_date, p.end_date, p.budget, p.status, p.archived_at, p.created_at,
           (SELECT count(*) FROM project_members pm
            WHERE pm.project_id = p.id AND pm.removed_at IS NULL) AS member_count,
           (SELECT count(*) FROM milestones m
            WHERE m.project_id = p.id AND m.completed_at IS NOT NULL) AS milestones_completed,
           (SELECT count(*) FROM milestones m WHERE m.project_id = p.id) AS milestones_total,
           (SELECT coalesce(sum(w.hours), 0) FROM work_logs w WHERE w.project_id = p.id) AS hours,
           (SELECT coalesce(sum(w.hours * w.hourly_rate), 0) FROM work_logs w WHERE w.project_id = p.id) AS cost
    FROM projects p
    LEFT JOIN users mgr ON mgr.id = p.manager_id
"""

PROJECT_FIELDS = (
    "id", "name", "start_date", "end_date", "status", "archived_at", "created_at", "member_count", "hours",
)

# The columns PUT /{id} may change. Column names in an UPDATE only ever come from here.
EDITABLE_COLUMNS = ("name", "manager_id", "start_date", "end_date", "budget")

# Which unique index a clash came from, and what to tell the client.
UNIQUE_FIELDS = {
    "project_name_unique": ("name", "A project with this name already exists."),
}

MEMBER_SQL = f"""
    SELECT pm.id, pm.added_at, pm.employee_id, u.first_name, u.last_name, u.job_title, u.display_id,
           pm.milestone_id, m.name AS milestone_name, {STATUS_SQL} AS milestone_status
    FROM project_members pm
    JOIN users u ON u.id = pm.employee_id
    LEFT JOIN milestones m ON m.id = pm.milestone_id
"""


def project_json(project, viewer):
    """The project as the API returns it, with its totals; money only for admins and managers."""
    body = {field: project[field] for field in PROJECT_FIELDS}
    body["manager"] = project["manager"]
    body["milestones"] = {"completed": project["milestones_completed"], "total": project["milestones_total"]}
    # Money is for admins and managers only; employees don't get the keys at all.
    if viewer["role"] in auth.ADMIN_OR_MANAGER:
        body["budget"] = project["budget"]
        body["cost"] = project["cost"]
    return body


def member_json(member):
    """A project member as the API returns them, with their milestone if they have one."""
    milestone = None
    if member["milestone_id"]:
        milestone = {"id": member["milestone_id"], "name": member["milestone_name"],
                     "status": member["milestone_status"]}
    return {
        "id": member["id"],
        "user": {"id": member["employee_id"], "name": full_name(member), "job_title": member["job_title"],
                 "display_id": member["display_id"]},
        "milestone": milestone,
        "added_at": member["added_at"],
    }


def read_project(conn, viewer, project_id):
    """The project with its totals. Callers check access first: after completing a project,
    for example, its manager can no longer see it but still gets the result."""
    return project_json(conn.execute(PROJECT_SQL + " WHERE p.id = %s", (project_id,)).fetchone(), viewer)


def read_member(conn, member_id):
    """The member as stored now, in the API's shape."""
    return member_json(conn.execute(MEMBER_SQL + " WHERE pm.id = %s", (member_id,)).fetchone())


def check_milestone(conn, v, project_id, milestone_id):
    """A member's milestone must belong to this project and not be completed yet."""
    milestone = conn.execute(
        "SELECT id, name, completed_at FROM milestones WHERE id = %s AND project_id = %s",
        (milestone_id, project_id),
    ).fetchone()
    if milestone is None:
        v.add_error("milestone_id", "Must be a milestone of this project.")
    elif milestone["completed_at"] is not None:
        v.add_error("milestone_id", "This milestone is already completed.")
    v.raise_if_invalid()
    return milestone


def check_milestones_fit(conn, v, project_id, start_date, end_date):
    """New project dates must still contain every milestone; names the ones that wouldn't fit."""
    milestones = conn.execute(
        "SELECT name, start_date, end_date FROM milestones WHERE project_id = %s ORDER BY start_date, id",
        (project_id,),
    ).fetchall()
    too_early = [m["name"] for m in milestones if m["start_date"] < start_date]
    too_late = [m["name"] for m in milestones if m["end_date"] > end_date]
    if too_early:
        v.add_error("start_date", "These milestones would start before the project: " + ", ".join(too_early) + ".")
    if too_late:
        v.add_error("end_date", "These milestones would end after the project: " + ", ".join(too_late) + ".")
    v.raise_if_invalid()


def find_member(conn, project_id, member_id):
    """A current member of the project, locked so concurrent changes to it wait."""
    member = conn.execute(
        MEMBER_SQL + " WHERE pm.id = %s AND pm.project_id = %s AND pm.removed_at IS NULL FOR UPDATE OF pm",
        (member_id, project_id),
    ).fetchone()
    if member is None:
        raise not_found("Member not found.")
    return member


@router.route("GET", "/", roles=auth.ANY_ROLE)
def list_projects(request):
    viewer = request.user
    condition, params = visible_projects_filter(viewer)
    conditions, params = [condition], list(params)
    if viewer["role"] == ADMIN:
        v = Validator(request.query)
        status = v.choice("status", STATUSES)
        archived = v.choice("archived", BOOLEAN)
        v.raise_if_invalid()
        if status:
            conditions.append("p.status = %s")
            params.append(status)
        if archived:
            conditions.append("p.archived_at IS NOT NULL" if archived == "true" else "p.archived_at IS NULL")
    projects = db.fetch_all(PROJECT_SQL + " WHERE " + " AND ".join(conditions) + " ORDER BY p.name", params)
    return [project_json(project, viewer) for project in projects]


@router.route("GET", "/{id}", roles=auth.ANY_ROLE)
def get_project(request):
    with db.transaction() as conn:
        project = get_visible_project(conn, request.user, request.path_params["id"])
        return read_project(conn, request.user, project["id"])


@router.route("POST", "/", roles=auth.ADMIN_ONLY)
def create_project(request):
    v = Validator(request.json())
    name = v.text("name", required=True, max_length=200)
    manager_id = v.integer("manager_id", required=True, minimum=1)
    start_date = v.date("start_date", required=True)
    end_date = v.date("end_date", required=True)
    budget = v.money("budget", required=True)
    v.check_date_order(start_date, end_date)
    v.raise_if_invalid()

    with db.transaction() as conn:
        manager = find_active_manager(conn, v, manager_id)
        project = save(
            conn,
            """
            INSERT INTO projects (name, manager_id, start_date, end_date, budget)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, name
            """,
            (name, manager_id, start_date, end_date, budget),
            UNIQUE_FIELDS,
        )
        log_activity(conn, request.user, "project.create", "project", project["id"],
                     f"Created project {project['name']}, managed by {full_name(manager)}.", project_id=project["id"])
        notify(conn, manager["id"], "New project assigned", project["name"], project_id=project["id"])
        return 201, read_project(conn, request.user, project["id"])


@router.route("PUT", "/{id}", roles=auth.ADMIN_OR_MANAGER)
def update_project(request):
    actor = request.user
    v = Validator(request.json(), partial=True)
    if actor["role"] == MANAGER and v.has("manager_id"):
        raise forbidden("Only an admin can change a project's manager.")
    name = v.text("name", required=True, max_length=200)
    manager_id = v.integer("manager_id", required=True, minimum=1)
    start_date = v.date("start_date", required=True)
    end_date = v.date("end_date", required=True)
    budget = v.money("budget", required=True)
    v.raise_if_invalid()

    with db.transaction() as conn:
        project = get_managed_project(conn, actor, request.path_params["id"], lock=True)
        require_open_project(project)

        new_start = start_date or project["start_date"]
        new_end = end_date or project["end_date"]
        v.check_date_order(new_start, new_end)
        v.raise_if_invalid()
        check_milestones_fit(conn, v, project["id"], new_start, new_end)

        updates = {"name": name, "manager_id": manager_id, "start_date": start_date, "end_date": end_date,
                   "budget": budget}
        changes = changed_fields(project, {field: value for field, value in updates.items() if v.has(field)})
        if not changes:
            return read_project(conn, actor, project["id"])

        manager = find_active_manager(conn, v, manager_id) if "manager_id" in changes else None
        new_values = {field: change["to"] for field, change in changes.items()}
        save(conn, *update_sql("projects", project["id"], new_values, EDITABLE_COLUMNS), UNIQUE_FIELDS)

        project_name = name or project["name"]
        if manager is None:
            summary = f"Updated project {project_name}."
        else:
            if project["manager_id"] is None:  # e.g. after unarchiving
                summary = f"Assigned project {project_name} to {full_name(manager)}."
            else:
                previous = conn.execute("SELECT first_name, last_name FROM users WHERE id = %s",
                                        (project["manager_id"],)).fetchone()
                summary = f"Project {project_name} reassigned from {full_name(previous)} to {full_name(manager)}."
            notify(conn, manager["id"], "New project assigned", project_name, project_id=project["id"])
        log_activity(conn, actor, "project.update", "project", project["id"], summary, project_id=project["id"],
                     changes=changes)
        return read_project(conn, actor, project["id"])


@router.route("DELETE", "/{id}", roles=auth.ADMIN_ONLY)
def archive_project(request):
    with db.transaction() as conn:
        project = get_managed_project(conn, request.user, request.path_params["id"], lock=True)
        if project["archived_at"] is not None:
            raise conflict("This project is already archived.")
        # Archiving files away a finished project, so a running one must be completed or abandoned first.
        if project["status"] == "in_progress":
            raise conflict("Only completed or abandoned projects can be archived. Mark it completed or abandoned first.",
                           "project_not_closed")
        conn.execute("UPDATE projects SET archived_at = now() WHERE id = %s", (project["id"],))
        log_activity(conn, request.user, "project.archive", "project", project["id"],
                     f"Archived project {project['name']}.", project_id=project["id"])
    return 204, None


@router.route("POST", "/{id}/complete", roles=auth.ADMIN_OR_MANAGER)
def complete_project(request):
    with db.transaction() as conn:
        project = get_managed_project(conn, request.user, request.path_params["id"], lock=True)
        require_open_project(project)
        milestones = conn.execute(
            "SELECT name, completed_at FROM milestones WHERE project_id = %s ORDER BY start_date, id",
            (project["id"],),
        ).fetchall()
        if not milestones:
            raise conflict("Add at least one milestone before completing the project.")
        unfinished = [m["name"] for m in milestones if m["completed_at"] is None]
        if unfinished:
            raise conflict("These milestones aren't complete yet: " + ", ".join(unfinished) + ".")
        conn.execute("UPDATE projects SET status = 'completed' WHERE id = %s", (project["id"],))
        log_activity(conn, request.user, "project.complete", "project", project["id"],
                     f"Completed project {project['name']}.", project_id=project["id"],
                     changes={"status": {"from": project["status"], "to": "completed"}})
        return read_project(conn, request.user, project["id"])


@router.route("POST", "/{id}/abandon", roles=auth.ADMIN_ONLY)
def abandon_project(request):
    with db.transaction() as conn:
        project = get_managed_project(conn, request.user, request.path_params["id"], lock=True)
        require_open_project(project)
        conn.execute("UPDATE projects SET status = 'abandoned' WHERE id = %s", (project["id"],))
        log_activity(conn, request.user, "project.abandon", "project", project["id"],
                     f"Abandoned project {project['name']}.", project_id=project["id"],
                     changes={"status": {"from": project["status"], "to": "abandoned"}})
        return read_project(conn, request.user, project["id"])


@router.route("POST", "/{id}/unarchive", roles=auth.ADMIN_ONLY)
def unarchive_project(request):
    with db.transaction() as conn:
        project = get_managed_project(conn, request.user, request.path_params["id"], lock=True)
        if project["archived_at"] is None:
            raise conflict("This project isn't archived.")
        # Unarchiving reopens the project so it can be reassigned: it comes back in progress,
        # without a manager or members, until an admin assigns a new manager.
        # Completed milestones stay completed.
        conn.execute(
            "UPDATE projects SET archived_at = NULL, manager_id = NULL, status = 'in_progress' WHERE id = %s",
            (project["id"],),
        )
        conn.execute("UPDATE project_members SET removed_at = now() WHERE project_id = %s AND removed_at IS NULL",
                     (project["id"],))
        log_activity(conn, request.user, "project.unarchive", "project", project["id"],
                     f"Unarchived and reopened project {project['name']}; its manager and members were cleared.",
                     project_id=project["id"],
                     changes=changed_fields(project, {"manager_id": None, "status": "in_progress"}))
        return read_project(conn, request.user, project["id"])


@router.route("GET", "/{id}/members", roles=auth.ANY_ROLE)
def list_members(request):
    with db.transaction() as conn:
        project = get_visible_project(conn, request.user, request.path_params["id"])
        members = conn.execute(
            MEMBER_SQL + " WHERE pm.project_id = %s AND pm.removed_at IS NULL ORDER BY u.last_name, u.first_name",
            (project["id"],),
        ).fetchall()
    return [member_json(member) for member in members]


@router.route("POST", "/{id}/members", roles=auth.ADMIN_OR_MANAGER)
def add_member(request):
    actor = request.user
    v = Validator(request.json())
    employee_id = v.integer("employee_id", required=True, minimum=1)
    milestone_id = v.integer("milestone_id", minimum=1)
    v.raise_if_invalid()

    with db.transaction() as conn:
        project = get_managed_project(conn, actor, request.path_params["id"], lock=True)
        require_open_project(project)
        # The share lock keeps the employee from being archived or promoted until we commit.
        employee = conn.execute(
            "SELECT id, first_name, last_name, role, manager_id, archived_at FROM users WHERE id = %s FOR SHARE",
            (employee_id,),
        ).fetchone()
        if employee is None or employee["role"] != auth.EMPLOYEE or employee["archived_at"] is not None:
            v.add_error("employee_id", "Must be an active employee.")
            v.raise_if_invalid()
        if actor["role"] == MANAGER and employee["manager_id"] != actor["id"]:
            raise forbidden("You can only add your own employees.")
        milestone = check_milestone(conn, v, project["id"], milestone_id) if milestone_id else None

        already = conn.execute(
            "SELECT 1 FROM project_members WHERE project_id = %s AND employee_id = %s AND removed_at IS NULL",
            (project["id"], employee["id"]),
        ).fetchone()
        if already:
            raise conflict(f"{full_name(employee)} is already on this project.")
        member = conn.execute(
            "INSERT INTO project_members (project_id, employee_id, milestone_id) VALUES (%s, %s, %s) RETURNING id",
            (project["id"], employee["id"], milestone_id),
        ).fetchone()

        detail = project["name"] + (f" · {milestone['name']}" if milestone else "")
        summary = f"Added {full_name(employee)} to {project['name']}"
        summary += f" on {milestone['name']}." if milestone else "."
        log_activity(conn, actor, "member.add", "project_member", member["id"], summary, project_id=project["id"])
        notify(conn, employee["id"], "Added to project", detail, project_id=project["id"], milestone_id=milestone_id)
        return 201, read_member(conn, member["id"])


@router.route("PUT", "/{id}/members/{member_id}", roles=auth.ADMIN_OR_MANAGER)
def assign_member(request):
    v = Validator(request.json())
    if not v.has("milestone_id"):
        v.add_error("milestone_id", "This field is required (use null for no milestone).")
    milestone_id = v.integer("milestone_id", minimum=1)
    v.raise_if_invalid()

    with db.transaction() as conn:
        project = get_managed_project(conn, request.user, request.path_params["id"], lock=True)
        require_open_project(project)
        member = find_member(conn, project["id"], request.path_params["member_id"])
        if milestone_id == member["milestone_id"]:
            return member_json(member)
        milestone = check_milestone(conn, v, project["id"], milestone_id) if milestone_id else None
        conn.execute("UPDATE project_members SET milestone_id = %s WHERE id = %s", (milestone_id, member["id"]))

        name = full_name(member)
        if milestone:
            summary, detail = f"{name} assigned to {milestone['name']}.", f"{project['name']} · {milestone['name']}"
        else:
            summary, detail = f"{name} unassigned from {member['milestone_name']}.", project["name"]
        log_activity(conn, request.user, "member.assign", "project_member", member["id"], summary,
                     project_id=project["id"],
                     changes={"milestone_id": {"from": member["milestone_id"], "to": milestone_id}})
        notify(conn, member["employee_id"], "Milestone assignment changed", detail, project_id=project["id"],
               milestone_id=milestone_id)
        return read_member(conn, member["id"])


@router.route("DELETE", "/{id}/members/{member_id}", roles=auth.ADMIN_OR_MANAGER)
def remove_member(request):
    with db.transaction() as conn:
        project = get_managed_project(conn, request.user, request.path_params["id"], lock=True)
        require_open_project(project)
        member = find_member(conn, project["id"], request.path_params["member_id"])
        conn.execute("UPDATE project_members SET removed_at = now() WHERE id = %s", (member["id"],))
        log_activity(conn, request.user, "member.remove", "project_member", member["id"],
                     f"Removed {full_name(member)} from {project['name']}.", project_id=project["id"])
        notify(conn, member["employee_id"], "Removed from project", project["name"], project_id=project["id"])
    return 204, None


def handler(event, context=None):
    return router.handle(event)
