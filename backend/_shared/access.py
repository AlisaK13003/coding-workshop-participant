"""Who can see and manage which projects and people. Every service uses these checks,
so the rules live in one place.

Visibility:
- Admins see every project, including closed and archived ones.
- Managers see their own projects while in progress and not archived.
- Employees see projects they're a current member of, while in progress and not archived.

A project you can't see answers 404 rather than 403, so its existence isn't revealed.
"""

from .auth import ADMIN, EMPLOYEE, MANAGER
from .http import forbidden, not_found

PROJECT_COLUMNS = """
    p.id, p.name, p.manager_id, p.start_date, p.end_date, p.budget, p.status, p.archived_at, p.created_at
"""


def visible_projects_filter(user, alias="p"):
    """A SQL condition (and its params) limiting projects to those the user can see."""
    if user["role"] == ADMIN:
        return "TRUE", ()
    active = f"{alias}.status = 'in_progress' AND {alias}.archived_at IS NULL"
    if user["role"] == MANAGER:
        return f"{alias}.manager_id = %s AND {active}", (user["id"],)
    return (
        f"""{active} AND EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = {alias}.id AND pm.employee_id = %s AND pm.removed_at IS NULL)""",
        (user["id"],),
    )


def get_visible_project(conn, user, project_id, lock=False):
    """The project if the user can see it; otherwise 404. lock=True reads and locks the row
    in one query, holding the lock until the transaction ends."""
    condition, params = visible_projects_filter(user)
    project = conn.execute(
        f"SELECT {PROJECT_COLUMNS} FROM projects p WHERE p.id = %s AND {condition}"
        + (" FOR UPDATE OF p" if lock else ""),
        (project_id, *params),
    ).fetchone()
    if project is None:
        raise not_found("Project not found.")
    return project


def get_managed_project(conn, user, project_id, lock=False):
    """The project if the user may change it: any project for admins, their own active
    projects for managers. Employees can see but never manage. lock=True holds a row lock
    until the transaction ends, so concurrent changes can't interleave. The row returned is the
    locked one, so it can't be out of date."""
    project = get_visible_project(conn, user, project_id, lock)
    if user["role"] == EMPLOYEE:
        raise forbidden()
    return project


def is_project_open(project):
    """Open projects can still change: in progress and not archived."""
    return project["status"] == "in_progress" and project["archived_at"] is None


def require_open_project(project):
    """403 unless the project is open."""
    if not is_project_open(project):
        raise forbidden("This project is closed or archived, so it can't be changed.")


def can_manage_user(actor, target):
    """Admins manage everyone; managers manage their own employees; employees manage no one."""
    if actor["role"] == ADMIN:
        return True
    return actor["role"] == MANAGER and target["role"] == EMPLOYEE and target["manager_id"] == actor["id"]
