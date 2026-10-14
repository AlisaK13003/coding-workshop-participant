"""Reads milestones and reviews in the shape the API returns.

A milestone:
    {id, project_id, name, start_date, end_date, completed_at, status,
     prerequisite_ids: [3, 4], members: [{id, name}], hours,
     pending_review: {id, requested_by: {id, name}, requested_at} or null}

A review:
    {id, milestone_id, requested_by: {id, name}, requested_at,
     decision, decided_by: {id, name} or null, decided_at, feedback}
"""

from shared.milestones import STATUS_SQL
from shared.sql import person_json


MILESTONE_SQL = f"""
    SELECT m.id, m.project_id, m.name, m.start_date, m.end_date, m.completed_at,
           {STATUS_SQL} AS status,
           ARRAY(SELECT d.prerequisite_id FROM milestone_dependencies d
                 WHERE d.milestone_id = m.id ORDER BY d.prerequisite_id) AS prerequisite_ids,
           COALESCE((SELECT json_agg({person_json('u')} ORDER BY u.first_name, u.last_name, u.id)
                     FROM project_members pm JOIN users u ON u.id = pm.employee_id
                     WHERE pm.milestone_id = m.id AND pm.removed_at IS NULL), '[]') AS members,
           (SELECT COALESCE(sum(w.hours), 0) FROM work_logs w WHERE w.milestone_id = m.id) AS hours,
           (SELECT json_build_object('id', r.id, 'requested_by', {person_json('u')}, 'requested_at', r.requested_at)
            FROM milestone_reviews r JOIN users u ON u.id = r.requested_by
            WHERE r.milestone_id = m.id AND r.decision IS NULL) AS pending_review
    FROM milestones m
"""

REVIEW_SQL = f"""
    SELECT r.id, r.milestone_id, {person_json('requester')} AS requested_by, r.requested_at,
           r.decision,
           {person_json('decider')} AS decided_by,
           r.decided_at, r.feedback
    FROM milestone_reviews r
    JOIN users requester   ON requester.id = r.requested_by
    LEFT JOIN users decider ON decider.id = r.decided_by
"""


def project_milestones(conn, project_id):
    """Every milestone of the project, in date order."""
    return conn.execute(f"{MILESTONE_SQL} WHERE m.project_id = %s ORDER BY m.start_date, m.id", (project_id,)).fetchall()


def milestone(conn, milestone_id):
    """One milestone, without its reviews."""
    return conn.execute(f"{MILESTONE_SQL} WHERE m.id = %s", (milestone_id,)).fetchone()


def milestone_with_reviews(conn, milestone_id):
    """One milestone plus its full review history, newest first."""
    reviews = conn.execute(
        f"{REVIEW_SQL} WHERE r.milestone_id = %s ORDER BY r.requested_at DESC, r.id DESC", (milestone_id,)
    ).fetchall()
    return {**milestone(conn, milestone_id), "reviews": reviews}


def review(conn, review_id):
    """One review request."""
    return conn.execute(f"{REVIEW_SQL} WHERE r.id = %s", (review_id,)).fetchone()
