"""Writes activity log entries and notifications.

Both take the caller's connection, so they're saved in the same transaction as
the change they describe: either everything is saved, or nothing is.
"""

import json


def full_name(user):
    return f"{user['first_name']} {user['last_name']}"


def log_activity(conn, actor, action, entity_type, entity_id, summary, project_id=None, changes=None):
    """action is a short code like 'project.update'; summary is the sentence shown on screen."""
    conn.execute(
        """
        INSERT INTO activity_log (actor_id, actor_role, action, entity_type, entity_id, project_id, summary, changes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (actor["id"], actor["role"], action, entity_type, entity_id, project_id, summary,
         json.dumps(changes, default=str) if changes else None),
    )


def changed_fields(before, after):
    """{field: {"from": old, "to": new}} for every field in `after` whose value differs."""
    return {
        field: {"from": before.get(field), "to": value}
        for field, value in after.items()
        if before.get(field) != value
    }


def notify(conn, recipient_id, title, detail=None, project_id=None, milestone_id=None):
    conn.execute(
        """
        INSERT INTO notifications (recipient_id, title, detail, project_id, milestone_id)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (recipient_id, title, detail, project_id, milestone_id),
    )
