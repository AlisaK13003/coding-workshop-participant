"""Activity service: the read-only record of who did what. Admins only.

Routes (under /api/activity):
    GET /      admin: entries, newest first, as {items, total, limit, offset}
               filters: ?actor_id= ?role= ?action= (prefix, e.g. "project.") ?project_id=
                        ?entity_type= ?entity_id=
               paging:  ?limit= (default 50, max 200) ?offset=
    GET /{id}  admin: one entry

Entries are written by the other services, in the same transaction as the change they
describe (see shared/activity.py), so there are no routes that change anything here.
"""

from shared import db
from shared.auth import ADMIN_ONLY, ANY_ROLE
from shared.http import not_found
from shared.query import QueryParams
from shared.router import Router
from shared.sql import person_json

router = Router("activity")

DEFAULT_LIMIT = 50
MAX_LIMIT = 200

ENTRY_SQL = f"""
    SELECT a.id, a.created_at, {person_json('u')} AS actor, a.actor_role,
           a.action, a.entity_type, a.entity_id, a.project_id, p.name AS project_name, a.summary, a.changes
    FROM activity_log a
    JOIN users u         ON u.id = a.actor_id
    LEFT JOIN projects p ON p.id = a.project_id
"""


def to_json(entry):
    """The entry as the API returns it."""
    return {
        "id": entry["id"],
        "created_at": entry["created_at"],
        "actor": entry["actor"],
        "actor_role": entry["actor_role"],
        "action": entry["action"],
        "entity_type": entry["entity_type"],
        "entity_id": entry["entity_id"],
        "project": {"id": entry["project_id"], "name": entry["project_name"]} if entry["project_id"] else None,
        "summary": entry["summary"],
        "changes": entry["changes"],
    }


@router.route("GET", "/", roles=ADMIN_ONLY)
def list_activity(request):
    q = QueryParams(request.query)
    actor_id = q.id("actor_id")
    role = q.choice("role", ANY_ROLE)
    action = q.text("action")
    project_id = q.id("project_id")
    entity_type = q.text("entity_type")
    entity_id = q.id("entity_id")
    limit = q.integer("limit", DEFAULT_LIMIT, minimum=1, maximum=MAX_LIMIT)
    offset = q.integer("offset", 0)
    q.raise_if_invalid()

    conditions, params = ["TRUE"], []
    for condition, value in (("a.actor_id = %s", actor_id), ("a.actor_role = %s", role),
                             ("starts_with(a.action, %s)", action), ("a.project_id = %s", project_id),
                             ("a.entity_type = %s", entity_type), ("a.entity_id = %s", entity_id)):
        if value is not None:
            conditions.append(condition)
            params.append(value)
    where = " AND ".join(conditions)

    with db.transaction() as conn:
        total = conn.execute(f"SELECT count(*) AS total FROM activity_log a WHERE {where}", params).fetchone()
        entries = conn.execute(
            f"{ENTRY_SQL} WHERE {where} ORDER BY a.created_at DESC, a.id DESC LIMIT %s OFFSET %s",
            (*params, limit, offset),
        ).fetchall()
    return {"items": [to_json(entry) for entry in entries], "total": total["total"], "limit": limit, "offset": offset}


@router.route("GET", "/{id}", roles=ADMIN_ONLY)
def get_entry(request):
    entry = db.fetch_one(f"{ENTRY_SQL} WHERE a.id = %s", (request.path_params["id"],))
    if entry is None:
        raise not_found("Activity entry not found.")
    return to_json(entry)


def handler(event, context=None):
    return router.handle(event)
