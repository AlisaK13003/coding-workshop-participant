"""Milestones service: a project's milestones, their prerequisites, completion and review requests.

Routes (under /api/milestones):
    GET    /?project_id=                  signed in: the milestones of a project you can see
    GET    /{id}                          signed in: one milestone with its review history
    POST   /                              admin or the project's manager: create a milestone
    PUT    /{id}                          admin or the project's manager: rename or change dates
    DELETE /{id}                          admin or the project's manager: delete a milestone with no history
    PUT    /{id}/dependencies             admin or the project's manager: replace its prerequisites
    POST   /{id}/complete                 admin or the project's manager: complete it and move its members
    POST   /{id}/reviews                  employee on the milestone: ask for a review (also logs today)
    POST   /{id}/reviews/{review_id}/decision
                                          admin or the project's manager: accept or keep open

Changes need an open project (in progress, not archived). Completed milestones can't be
changed, deleted or reopened. Completion rules live in completion.py, prerequisite rules
in dependencies.py, and the response shapes in milestone_json.py.
"""

import milestone_json
from completion import DESTINATION, complete_milestone
from dependencies import (
    FIELD as PREREQUISITES, add_prerequisites, check_prerequisites, current_prerequisites,
    reject_completed, reject_cycle, remove_prerequisites,
)
from shared import auth, clock, db
from shared.access import get_managed_project, get_visible_project, require_open_project
from shared.activity import changed_fields, full_name, log_activity, notify
from shared.http import bad_request, conflict, forbidden, not_found
from shared.milestones import AVAILABLE, AWAITING_REVIEW, BLOCKED, COMPLETED, milestone_status
from shared.router import Router
from shared.sql import update_sql
from shared.validation import Validator
from shared.worklogs import is_weekday, log_day_unless_logged

router = Router("milestones")

MILESTONE_COLUMNS = "id, project_id, name, start_date, end_date, completed_at"

# The columns PUT /{id} may change. Column names in an UPDATE only ever come from here.
EDITABLE_COLUMNS = ("name", "start_date", "end_date")

# Why an employee can't ask for a review, by milestone status.
REVIEW_BLOCKERS = {
    COMPLETED: "This milestone is already completed.",
    AWAITING_REVIEW: "This milestone is already waiting for a review.",
    BLOCKED: "This milestone is blocked until its prerequisites are completed.",
}


def find_milestone(conn, user, milestone_id):
    """The milestone and its project if the user can see the project; otherwise 404."""
    milestone = conn.execute(f"SELECT {MILESTONE_COLUMNS} FROM milestones WHERE id = %s", (milestone_id,)).fetchone()
    if milestone is None:
        raise not_found("Milestone not found.")
    return milestone, get_visible_project(conn, user, milestone["project_id"])


def find_managed_milestone(conn, user, milestone_id):
    """The milestone (row locked) and its project (row locked), if the user manages that
    open project. Locks are taken project first, then milestone, everywhere."""
    milestone, _ = find_milestone(conn, user, milestone_id)
    project = get_managed_project(conn, user, milestone["project_id"], lock=True)
    require_open_project(project)
    milestone = conn.execute(
        f"SELECT {MILESTONE_COLUMNS} FROM milestones WHERE id = %s FOR UPDATE", (milestone_id,)
    ).fetchone()
    return milestone, project


def require_not_completed(milestone, message="Completed milestones can't be changed."):
    """409 if the milestone is completed."""
    if milestone["completed_at"] is not None:
        raise conflict(message, "milestone_completed")


def check_dates(v, project, start_date, end_date):
    """Field errors unless start_date..end_date is in order and within the project's dates."""
    for field, value in (("start_date", start_date), ("end_date", end_date)):
        if value and not project["start_date"] <= value <= project["end_date"]:
            v.add_error(field, f"Must be within the project's dates ({project['start_date']} to {project['end_date']}).")
    v.check_date_order(start_date, end_date)


@router.route("GET", "/", roles=auth.ANY_ROLE)
def list_milestones(request):
    project_id = request.query.get("project_id", "")
    if not project_id.isdigit():
        raise bad_request("Add ?project_id= to choose a project.", "project_id_required")
    with db.transaction() as conn:
        get_visible_project(conn, request.user, int(project_id))
        return milestone_json.project_milestones(conn, int(project_id))


@router.route("GET", "/{id}", roles=auth.ANY_ROLE)
def get_milestone(request):
    with db.transaction() as conn:
        milestone, _ = find_milestone(conn, request.user, request.path_params["id"])
        return milestone_json.milestone_with_reviews(conn, milestone["id"])


@router.route("POST", "/", roles=auth.ADMIN_OR_MANAGER)
def create_milestone(request):
    v = Validator(request.json())
    project_id = v.integer("project_id", required=True, minimum=1)
    name = v.text("name", required=True)
    start_date = v.date("start_date", required=True)
    end_date = v.date("end_date", required=True)
    prerequisite_ids = v.id_list(PREREQUISITES, label="milestone ids") or []
    v.raise_if_invalid()

    with db.transaction() as conn:
        project = get_managed_project(conn, request.user, project_id, lock=True)
        require_open_project(project)
        check_dates(v, project, start_date, end_date)
        prerequisites = check_prerequisites(conn, v, project_id, None, prerequisite_ids)
        v.raise_if_invalid()
        reject_completed(prerequisites.values(), "added")

        milestone = conn.execute(
            "INSERT INTO milestones (project_id, name, start_date, end_date) VALUES (%s, %s, %s, %s) RETURNING id",
            (project_id, name, start_date, end_date),
        ).fetchone()
        add_prerequisites(conn, project_id, milestone["id"], prerequisite_ids)
        # A brand-new milestone has nothing depending on it yet, so this never fails; it's
        # checked anyway so every path that adds prerequisites follows the same rule.
        reject_cycle(conn, milestone["id"], prerequisites)

        log_activity(conn, request.user, "milestone.create", "milestone", milestone["id"],
                     f"Created milestone {name} in {project['name']}.", project_id=project_id)
        return 201, milestone_json.milestone(conn, milestone["id"])


@router.route("PUT", "/{id}", roles=auth.ADMIN_OR_MANAGER)
def update_milestone(request):
    v = Validator(request.json(), partial=True)
    fields = {
        "name": v.text("name", required=True),
        "start_date": v.date("start_date", required=True),
        "end_date": v.date("end_date", required=True),
    }
    v.raise_if_invalid()

    with db.transaction() as conn:
        before, project = find_managed_milestone(conn, request.user, request.path_params["id"])
        require_not_completed(before)
        after = {field: value for field, value in fields.items() if v.has(field)}
        check_dates(v, project, after.get("start_date", before["start_date"]), after.get("end_date", before["end_date"]))
        v.raise_if_invalid()

        changes = changed_fields(before, after)
        if changes:
            new_values = {field: change["to"] for field, change in changes.items()}
            conn.execute(*update_sql("milestones", before["id"], new_values, EDITABLE_COLUMNS))
            log_activity(conn, request.user, "milestone.update", "milestone", before["id"],
                         f"Updated milestone {after.get('name', before['name'])}.",
                         project_id=project["id"], changes=changes)
        return milestone_json.milestone(conn, before["id"])


@router.route("DELETE", "/{id}", roles=auth.ADMIN_OR_MANAGER)
def delete_milestone(request):
    try:
        with db.transaction() as conn:
            milestone, project = find_managed_milestone(conn, request.user, request.path_params["id"])
            history = conn.execute(
                """
                SELECT m.completed_at IS NOT NULL AS completed,
                       EXISTS (SELECT 1 FROM work_logs WHERE milestone_id = m.id) AS has_work_logs,
                       EXISTS (SELECT 1 FROM project_members WHERE milestone_id = m.id) AS has_members,
                       EXISTS (SELECT 1 FROM milestone_reviews WHERE milestone_id = m.id) AS has_reviews,
                       EXISTS (SELECT 1 FROM notifications WHERE milestone_id = m.id) AS has_notifications
                FROM milestones m WHERE m.id = %s
                """,
                (milestone["id"],),
            ).fetchone()
            reasons = [reason for key, reason in (
                ("completed", "it is completed"),
                ("has_work_logs", "it has work logs"),
                ("has_members", "employees are or were assigned to it"),
                ("has_reviews", "it has review requests"),
                ("has_notifications", "notifications refer to it"),
            ) if history[key]]
            if reasons:
                raise conflict(f"{milestone['name']} can't be deleted because {' and '.join(reasons)}.",
                               "milestone_has_history")

            prerequisite_ids = list(current_prerequisites(conn, milestone["id"]))
            conn.execute("DELETE FROM milestone_dependencies WHERE milestone_id = %s OR prerequisite_id = %s",
                         (milestone["id"], milestone["id"]))
            conn.execute("DELETE FROM milestones WHERE id = %s", (milestone["id"],))
            log_activity(conn, request.user, "milestone.delete", "milestone", milestone["id"],
                         f"Deleted milestone {milestone['name']} from {project['name']}.", project_id=project["id"],
                         changes={PREREQUISITES: {"from": prerequisite_ids, "to": []}} if prerequisite_ids else None)
    except db.ForeignKeyViolation:
        # Something else still points at the milestone; the checks above should catch it first.
        raise conflict("This milestone can't be deleted because other records refer to it.", "milestone_has_history")
    return 204, None


@router.route("PUT", "/{id}/dependencies", roles=auth.ADMIN_OR_MANAGER)
def replace_dependencies(request):
    v = Validator(request.json())
    proposed_ids = v.id_list(PREREQUISITES, required=True, label="milestone ids")
    v.raise_if_invalid()

    with db.transaction() as conn:
        milestone, project = find_managed_milestone(conn, request.user, request.path_params["id"])
        require_not_completed(milestone, "A completed milestone's prerequisites can't be changed.")
        proposed = check_prerequisites(conn, v, project["id"], milestone["id"], proposed_ids)
        v.raise_if_invalid()

        current = current_prerequisites(conn, milestone["id"])
        added = [proposed[i] for i in proposed if i not in current]
        removed = [current[i] for i in current if i not in proposed]
        reject_completed(added, "added")
        reject_completed(removed, "removed")
        reject_cycle(conn, milestone["id"], proposed)

        if added or removed:
            remove_prerequisites(conn, milestone["id"], [row["id"] for row in removed])
            add_prerequisites(conn, project["id"], milestone["id"], [row["id"] for row in added])
            log_activity(conn, request.user, "milestone.dependencies_update", "milestone", milestone["id"],
                         f"Changed the prerequisites of {milestone['name']}.", project_id=project["id"],
                         changes={PREREQUISITES: {"from": list(current), "to": proposed_ids}})
        return milestone_json.milestone(conn, milestone["id"])


@router.route("POST", "/{id}/complete", roles=auth.ADMIN_OR_MANAGER)
def complete(request):
    v = Validator(request.json())
    destination_id = v.integer(DESTINATION, minimum=1)
    v.raise_if_invalid()

    with db.transaction() as conn:
        milestone, project = find_managed_milestone(conn, request.user, request.path_params["id"])
        complete_milestone(conn, request.user, project, milestone["id"], destination_id)
        return milestone_json.milestone_with_reviews(conn, milestone["id"])


@router.route("POST", "/{id}/reviews", roles={auth.EMPLOYEE})
def request_review(request):
    """Flags the milestone for review and logs today's 8 hours on it, since asking for a
    review means the employee worked on it today. Weekdays only. If they already logged
    today (on any project), the review still goes through without a second log."""
    user = request.user
    today = clock.today()
    if not is_weekday(today):
        raise conflict("You can only request a review on a weekday.", "not_a_weekday")
    try:
        with db.transaction() as conn:
            # Employees only see open projects they're a current member of; anything else is a 404.
            milestone, project = find_milestone(conn, user, request.path_params["id"])
            membership = conn.execute(
                "SELECT milestone_id FROM project_members WHERE project_id = %s AND employee_id = %s AND removed_at IS NULL",
                (project["id"], user["id"]),
            ).fetchone()
            if membership["milestone_id"] != milestone["id"]:
                raise forbidden("You can only ask for a review of the milestone you're assigned to.")

            # Locked so a completion or a second request can't slip in between the check and the insert.
            conn.execute("SELECT 1 FROM milestones WHERE id = %s FOR UPDATE", (milestone["id"],))
            status = milestone_status(conn, milestone["id"])
            if status != AVAILABLE:
                raise conflict(REVIEW_BLOCKERS[status], f"milestone_{status}")

            # Logged first, while the milestone is still available to log on.
            log_id = log_day_unless_logged(conn, user["id"], project["id"], milestone["id"], today)
            review = conn.execute(
                "INSERT INTO milestone_reviews (milestone_id, requested_by) VALUES (%s, %s) RETURNING id",
                (milestone["id"], user["id"]),
            ).fetchone()
            if project["manager_id"] is not None:
                notify(conn, project["manager_id"], "Milestone review requested",
                       f"{full_name(user)} · {milestone['name']}", project["id"], milestone["id"])
            log_activity(conn, user, "review.request", "milestone_review", review["id"],
                         f"Requested review of {milestone['name']}.", project_id=project["id"])
            # work_logged: whether this request logged today's hours (false if already logged today).
            return 201, {**milestone_json.review(conn, review["id"]), "work_logged": log_id is not None}
    except db.UniqueViolation:
        # one_open_review: another request for this milestone was saved first.
        raise conflict(REVIEW_BLOCKERS[AWAITING_REVIEW], f"milestone_{AWAITING_REVIEW}")


@router.route("POST", "/{id}/reviews/{review_id}/decision", roles=auth.ADMIN_OR_MANAGER)
def decide_review(request):
    v = Validator(request.json())
    decision = v.choice("decision", {"accepted", "kept_open"}, required=True)
    feedback = v.text("feedback", max_length=2000) or None
    destination_id = v.integer(DESTINATION, minimum=1)
    if decision == "kept_open" and destination_id is not None:
        v.add_error(DESTINATION, "Only used when accepting.")
    v.raise_if_invalid()

    with db.transaction() as conn:
        milestone, project = find_managed_milestone(conn, request.user, request.path_params["id"])
        review = conn.execute(
            "SELECT id, requested_by, decision FROM milestone_reviews WHERE id = %s AND milestone_id = %s FOR UPDATE",
            (request.path_params["review_id"], milestone["id"]),
        ).fetchone()
        if review is None:
            raise not_found("Review not found.")
        if review["decision"] is not None:
            raise conflict("This review has already been decided.", "review_decided")

        if decision == "accepted":
            # Completing marks this review (the milestone's only waiting one) as accepted.
            complete_milestone(conn, request.user, project, milestone["id"], destination_id, feedback)
            title, action, summary = "Review accepted", "review.accept", f"Accepted the review of {milestone['name']}."
        else:
            conn.execute(
                """
                UPDATE milestone_reviews
                SET decision = 'kept_open', decided_by = %s, decided_at = now(), feedback = %s
                WHERE id = %s
                """,
                (request.user["id"], feedback, review["id"]),
            )
            title, action, summary = "Milestone kept open", "review.keep_open", \
                f"Kept {milestone['name']} open after review."

        notify(conn, review["requested_by"], title, feedback, project["id"], milestone["id"])
        if project["manager_id"] not in (None, request.user["id"]):
            # An admin decided on the manager's behalf; let the manager know.
            requester = conn.execute(
                "SELECT first_name, last_name FROM users WHERE id = %s", (review["requested_by"],)
            ).fetchone()
            verb = "accepted" if decision == "accepted" else "kept open"
            notify(conn, project["manager_id"], f"Review {verb} by an admin",
                   f"{full_name(request.user)} {verb} {full_name(requester)}'s review of {milestone['name']} "
                   "on your behalf.", project["id"], milestone["id"])
        log_activity(conn, request.user, action, "milestone_review", review["id"], summary,
                     project_id=project["id"], changes={"decision": {"from": None, "to": decision}})
        return milestone_json.review(conn, review["id"])


def handler(event, context=None):
    return router.handle(event)
