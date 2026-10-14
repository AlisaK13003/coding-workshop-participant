"""Milestone status, worked out from the data rather than stored.

- completed:        completed_at is set
- awaiting_review:  an employee's review request is waiting for a decision
- blocked:          at least one prerequisite isn't completed
- available:        none of the above; employees on it can log work
"""

COMPLETED = "completed"
AWAITING_REVIEW = "awaiting_review"
BLOCKED = "blocked"
AVAILABLE = "available"

STATUS_SQL = """
    CASE
        WHEN m.completed_at IS NOT NULL THEN 'completed'
        WHEN EXISTS (SELECT 1 FROM milestone_reviews r
                     WHERE r.milestone_id = m.id AND r.decision IS NULL) THEN 'awaiting_review'
        WHEN EXISTS (SELECT 1 FROM milestone_dependencies d
                     JOIN milestones pre ON pre.id = d.prerequisite_id
                     WHERE d.milestone_id = m.id AND pre.completed_at IS NULL) THEN 'blocked'
        ELSE 'available'
    END
"""
"""Use as `SELECT ..., {STATUS_SQL} AS status FROM milestones m`."""


def milestone_status(conn, milestone_id):
    """The milestone's status now, or None if it doesn't exist."""
    row = conn.execute(f"SELECT {STATUS_SQL} AS status FROM milestones m WHERE m.id = %s", (milestone_id,)).fetchone()
    return row["status"] if row else None
