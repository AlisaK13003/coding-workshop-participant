"""Completing a milestone. Used by POST /{id}/complete and by accepting a review, so both
follow exactly the same rules.

Completing:
- needs every prerequisite completed, and the milestone not completed already
- moves every current member on it to the destination milestone, or clears their
  milestone_id when there's no destination, and tells each of them
- marks a waiting review request as accepted
- is logged as 'milestone.complete'
"""

from shared.activity import log_activity, notify
from shared.http import ApiError, conflict

DESTINATION = "destination_milestone_id"


def _check_destination(conn, milestone, destination_id):
    """The destination milestone row, or a field error if it can't take the members."""
    destination = conn.execute(
        "SELECT id, name, completed_at FROM milestones WHERE id = %s AND project_id = %s FOR UPDATE",
        (destination_id, milestone["project_id"]),
    ).fetchone()
    if destination is None:
        problem = "Must be a milestone of the same project."
    elif destination["id"] == milestone["id"]:
        problem = "Must be a different milestone from the one being completed."
    elif destination["completed_at"] is not None:
        problem = "Must be a milestone that isn't completed."
    else:
        return destination
    raise ApiError(400, "validation_error", "Some fields need fixing.", {DESTINATION: problem})


def complete_milestone(conn, actor, project, milestone_id, destination_id=None, feedback=None):
    """Completes the milestone inside the caller's transaction. The caller has already
    checked that the actor manages this open project, and locked the project row. feedback is saved on the waiting
    review, if there is one. Returns the accepted review's id, or None."""
    # Locked until the transaction ends, so two completions (or a completion and a new
    # review request) can't run at the same time.
    milestone = conn.execute(
        "SELECT id, project_id, name, completed_at FROM milestones WHERE id = %s FOR UPDATE", (milestone_id,)
    ).fetchone()
    if milestone["completed_at"] is not None:
        raise conflict("This milestone is already completed.", "milestone_completed")

    unfinished = conn.execute(
        """
        SELECT pre.name
        FROM milestone_dependencies d JOIN milestones pre ON pre.id = d.prerequisite_id
        WHERE d.milestone_id = %s AND pre.completed_at IS NULL
        ORDER BY pre.start_date, pre.id
        """,
        (milestone_id,),
    ).fetchall()
    if unfinished:
        names = ", ".join(row["name"] for row in unfinished)
        raise conflict(f"Complete its prerequisites first: {names}.", "prerequisites_incomplete")

    destination = _check_destination(conn, milestone, destination_id) if destination_id is not None else None

    completed_at = conn.execute(
        "UPDATE milestones SET completed_at = now() WHERE id = %s RETURNING completed_at", (milestone_id,)
    ).fetchone()["completed_at"]

    moved = conn.execute(
        """
        UPDATE project_members SET milestone_id = %s
        WHERE milestone_id = %s AND removed_at IS NULL
        RETURNING employee_id
        """,
        (destination["id"] if destination else None, milestone_id),
    ).fetchall()

    accepted = conn.execute(
        """
        UPDATE milestone_reviews
        SET decision = 'accepted', decided_by = %s, decided_at = now(), feedback = %s
        WHERE milestone_id = %s AND decision IS NULL
        RETURNING id
        """,
        (actor["id"], feedback, milestone_id),
    ).fetchone()

    if destination:
        title, notice_milestone_id = f"Moved to {destination['name']}", destination["id"]
        where = f"moved to {destination['name']}"
    else:
        title, notice_milestone_id = "Milestone completed: assignment needed", milestone_id
        where = "waiting for a new assignment"
    for member in moved:
        notify(conn, member["employee_id"], title, f"{project['name']} · {milestone['name']} completed",
               project["id"], notice_milestone_id)

    members = "1 member" if len(moved) == 1 else f"{len(moved)} members"
    log_activity(
        conn, actor, "milestone.complete", "milestone", milestone_id,
        f"Completed {milestone['name']}; {members} {where}.",
        project_id=project["id"],
        changes={"completed_at": {"from": None, "to": completed_at}},
    )
    return accepted["id"] if accepted else None
