"""Notifications service: each signed-in user reads and marks their own notifications.

Routes (under /api/notifications):
    GET  /           signed in: your notifications, newest first, as {items, unread_count}
                     filter: ?unread=true for unread ones only
    POST /{id}/read  signed in: mark one of yours as read (marking it again changes nothing)
    POST /read-all   signed in: mark all of yours as read, as {updated: n}

Notifications are created by the other services, in the same transaction as the event
that causes them (see shared/activity.py notify), so there's no create route here.
Someone else's notification answers 404, so its existence isn't revealed.
"""

from shared import db
from shared.auth import ANY_ROLE
from shared.http import not_found
from shared.router import Router

router = Router("notifications")

NOTIFICATION_COLUMNS = "id, title, detail, project_id, milestone_id, created_at, read_at"


def to_json(notification):
    return {
        "id": notification["id"],
        "title": notification["title"],
        "detail": notification["detail"],
        "project_id": notification["project_id"],
        "milestone_id": notification["milestone_id"],
        "created_at": notification["created_at"],
        "read_at": notification["read_at"],
        "read": notification["read_at"] is not None,
    }


@router.route("GET", "/", roles=ANY_ROLE)
def list_notifications(request):
    unread_only = (request.query.get("unread") or "").lower() == "true"
    unread_filter = "AND read_at IS NULL" if unread_only else ""
    user_id = request.user["id"]
    with db.transaction() as conn:
        notifications = conn.execute(
            f"""
            SELECT {NOTIFICATION_COLUMNS} FROM notifications
            WHERE recipient_id = %s {unread_filter}
            ORDER BY created_at DESC, id DESC
            """,
            (user_id,),
        ).fetchall()
        unread = conn.execute(
            "SELECT count(*) AS unread_count FROM notifications WHERE recipient_id = %s AND read_at IS NULL",
            (user_id,),
        ).fetchone()
    return {"items": [to_json(n) for n in notifications], "unread_count": unread["unread_count"]}


@router.route("POST", "/{id}/read", roles=ANY_ROLE)
def mark_read(request):
    # COALESCE keeps the first read time, so marking again changes nothing.
    notification = db.fetch_one(
        f"""
        UPDATE notifications SET read_at = COALESCE(read_at, now())
        WHERE id = %s AND recipient_id = %s
        RETURNING {NOTIFICATION_COLUMNS}
        """,
        (request.path_params["id"], request.user["id"]),
    )
    if notification is None:
        raise not_found("Notification not found.")
    return to_json(notification)


@router.route("POST", "/read-all", roles=ANY_ROLE)
def mark_all_read(request):
    with db.transaction() as conn:
        updated = conn.execute(
            "UPDATE notifications SET read_at = now() WHERE recipient_id = %s AND read_at IS NULL",
            (request.user["id"],),
        ).rowcount
    return {"updated": updated}


def handler(event, context=None):
    return router.handle(event)
