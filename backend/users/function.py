"""Users service: people, their roles and reporting lines. DELETE archives; nobody is ever deleted.

Routes (under /api/users):
    GET    /               admin: everyone (?role=, ?manager_id=, ?include_archived=true);
                           manager: themselves and their active employees
    GET    /{id}           admin: anyone; manager: themselves or their employees; employee: themselves
    POST   /               admin: create a user
    PUT    /{id}           admin: any field; manager: their own employees, except role and manager_id
    DELETE /{id}           admin: archive a user
    POST   /{id}/restore   admin: un-archive a user
    POST   /{id}/password  admin, or the employee's own manager: set a new password
"""

from shared import auth, db
from shared.access import can_manage_user
from shared.activity import changed_fields, full_name, log_activity, notify
from shared.auth import ADMIN, EMPLOYEE, MANAGER
from shared.http import conflict, forbidden, not_found
from shared.people import find_active_manager
from shared.router import Router
from shared.sql import person_json, save, update_sql
from shared.validation import Validator

router = Router("users")

ROLES = {ADMIN, MANAGER, EMPLOYEE}
BOOLEAN = {"true", "false"}

USER_SQL = f"""
    SELECT u.id, u.display_id, u.username, u.first_name, u.last_name, u.email, u.job_title, u.role,
           u.manager_id, u.annual_salary, u.archived_at, {person_json('mgr')} AS manager,
           (SELECT count(*) FROM project_members pm
            WHERE pm.employee_id = u.id AND pm.removed_at IS NULL) AS project_count
    FROM users u
    LEFT JOIN users mgr ON mgr.id = u.manager_id
"""

USER_FIELDS = ("id", "display_id", "username", "first_name", "last_name", "email", "job_title", "role", "archived_at")

# The columns PUT /{id} may change. Column names in an UPDATE only ever come from here.
EDITABLE_COLUMNS = (
    "first_name", "last_name", "username", "email", "job_title", "role", "manager_id", "annual_salary",
)

# Which unique index a clash came from, and what to tell the client.
UNIQUE_FIELDS = {
    "username_unique": ("username", "This username is already taken."),
    "email_unique": ("email", "This email is already in use."),
}


def user_json(user, viewer):
    """The user as the API returns them; salary and project count only where they apply."""
    body = {field: user[field] for field in USER_FIELDS}
    body["name"] = full_name(user)
    body["manager"] = user["manager"]
    if user["role"] == EMPLOYEE:
        body["project_count"] = user["project_count"]
    # Salaries are only for admins and the employee's own manager.
    if viewer["role"] == ADMIN or (user["manager_id"] is not None and user["manager_id"] == viewer["id"]):
        body["annual_salary"] = user["annual_salary"]
    return body


def can_view_user(viewer, user):
    """Everyone can see themselves; admins and managers also see the people they manage."""
    return viewer["id"] == user["id"] or can_manage_user(viewer, user)


def find_user(conn, viewer, user_id, lock=False):
    """The user if the viewer may see them; otherwise 404, so other people's existence isn't revealed."""
    user = conn.execute(USER_SQL + " WHERE u.id = %s" + (" FOR UPDATE OF u" if lock else ""), (user_id,)).fetchone()
    if user is None or not can_view_user(viewer, user):
        raise not_found("User not found.")
    return user


def check_employee_fields(v, role, manager_id, annual_salary):
    """Matches the employee_has_manager and employee_has_salary CHECKs, with clear messages."""
    for field, value, label in (("manager_id", manager_id, "a manager"), ("annual_salary", annual_salary, "a salary")):
        if field in v.errors:
            continue
        if role == EMPLOYEE and value is None:
            v.add_error(field, f"Employees must have {label}.")
        elif role != EMPLOYEE and value is not None:
            v.add_error(field, f"Only employees have {label}.")


def require_no_reports(conn, manager, action, current_only=False):
    """409 while employees report to the manager or projects name them as manager.

    For a role change everyone counts, archived employees and closed projects too, because the
    foreign keys require their manager to be a manager. For archiving, only active employees
    and open projects count.
    """
    employees_filter = " AND archived_at IS NULL" if current_only else ""
    projects_filter = " AND status = 'in_progress' AND archived_at IS NULL" if current_only else ""
    counts = conn.execute(
        f"""
        SELECT (SELECT count(*) FROM users WHERE manager_id = %s{employees_filter}) AS employees,
               (SELECT count(*) FROM projects WHERE manager_id = %s{projects_filter}) AS projects
        """,
        (manager["id"], manager["id"]),
    ).fetchone()
    if counts["employees"]:
        raise conflict(f"Reassign {full_name(manager)}'s employees to another manager before {action}.")
    if counts["projects"]:
        raise conflict(f"Reassign {full_name(manager)}'s projects to another manager before {action}.")


def end_memberships(conn, user_id):
    """Takes an employee off every project they're currently on (history is kept)."""
    conn.execute("UPDATE project_members SET removed_at = now() WHERE employee_id = %s AND removed_at IS NULL",
                 (user_id,))


def read_user(conn, viewer, user_id):
    """The user as stored now, in the API's shape."""
    return user_json(find_user(conn, viewer, user_id), viewer)


@router.route("GET", "/", roles=auth.ADMIN_OR_MANAGER)
def list_users(request):
    viewer = request.user
    conditions, params = [], []
    if viewer["role"] == ADMIN:
        v = Validator(request.query)
        role = v.choice("role", ROLES)
        include_archived = v.choice("include_archived", BOOLEAN) == "true"
        manager_id = v.text("manager_id")
        if manager_id is not None and not manager_id.isdigit():
            v.add_error("manager_id", "Must be a whole number.")
        v.raise_if_invalid()
        if role:
            conditions.append("u.role = %s")
            params.append(role)
        if manager_id:
            conditions.append("u.manager_id = %s")
            params.append(int(manager_id))
        if not include_archived:
            conditions.append("u.archived_at IS NULL")
    else:
        conditions.append("(u.id = %s OR (u.manager_id = %s AND u.archived_at IS NULL))")
        params += [viewer["id"], viewer["id"]]

    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    users = db.fetch_all(USER_SQL + where + " ORDER BY u.last_name, u.first_name, u.id", params)
    return [user_json(user, viewer) for user in users]


@router.route("GET", "/{id}", roles=auth.ANY_ROLE)
def get_user(request):
    with db.transaction() as conn:
        user = find_user(conn, request.user, request.path_params["id"])
        memberships = conn.execute(
            """
            SELECT p.id AS project_id, p.name AS project_name, m.id AS milestone_id, m.name AS milestone_name
            FROM project_members pm
            JOIN projects p ON p.id = pm.project_id
            LEFT JOIN milestones m ON m.id = pm.milestone_id
            WHERE pm.employee_id = %s AND pm.removed_at IS NULL
            ORDER BY p.name
            """,
            (user["id"],),
        ).fetchall()
    body = user_json(user, request.user)
    body["projects"] = [
        {
            "project": {"id": row["project_id"], "name": row["project_name"]},
            "milestone": {"id": row["milestone_id"], "name": row["milestone_name"]} if row["milestone_id"] else None,
        }
        for row in memberships
    ]
    return body


@router.route("POST", "/", roles=auth.ADMIN_ONLY)
def create_user(request):
    v = Validator(request.json())
    first_name = v.text("first_name", required=True, max_length=100)
    last_name = v.text("last_name", required=True, max_length=100)
    username = v.text("username", max_length=100)
    email = v.email("email", required=True)
    job_title = v.text("job_title", required=True, max_length=100)
    role = v.choice("role", ROLES, required=True)
    password = v.password("password", required=True)
    manager_id = v.integer("manager_id", minimum=1)
    annual_salary = v.money("annual_salary")
    if role:
        check_employee_fields(v, role, manager_id, annual_salary)
    v.raise_if_invalid()

    with db.transaction() as conn:
        manager = find_active_manager(conn, v, manager_id) if role == EMPLOYEE else None
        # A missing username stays NULL here, so the set_username trigger generates one.
        created = save(
            conn,
            """
            INSERT INTO users (first_name, last_name, username, email, job_title, role, manager_id, annual_salary,
                               password_hash)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (first_name, last_name, username, email, job_title, role, manager_id, annual_salary,
             auth.hash_password(password)),
            UNIQUE_FIELDS,
        )
        user = find_user(conn, request.user, created["id"])
        summary = f"Created {role} {full_name(user)}"
        summary += f", reporting to {full_name(manager)}." if manager else "."
        log_activity(conn, request.user, "user.create", "user", user["id"], summary)
    return 201, user_json(user, request.user)


@router.route("PUT", "/{id}", roles=auth.ADMIN_OR_MANAGER)
def update_user(request):
    actor = request.user
    v = Validator(request.json(), partial=True)
    if actor["role"] == MANAGER and (v.has("role") or v.has("manager_id")):
        raise forbidden("Only an admin can change a user's role or manager.")
    first_name = v.text("first_name", required=True, max_length=100)
    last_name = v.text("last_name", required=True, max_length=100)
    username = v.text("username", required=True, max_length=100)
    email = v.email("email", required=True)
    job_title = v.text("job_title", required=True, max_length=100)
    role = v.choice("role", ROLES, required=True)
    manager_id = v.integer("manager_id", minimum=1)
    annual_salary = v.money("annual_salary")
    v.raise_if_invalid()

    with db.transaction() as conn:
        user = find_user(conn, actor, request.path_params["id"], lock=True)
        if not can_manage_user(actor, user):
            raise forbidden("You can't edit this user.")

        new_role = role or user["role"]

        def final(field, value):
            # A field that wasn't sent keeps its value, unless the new role can't have it.
            if v.has(field):
                return value
            return user[field] if new_role == EMPLOYEE else None

        new_manager_id = final("manager_id", manager_id)
        new_salary = final("annual_salary", annual_salary)
        check_employee_fields(v, new_role, new_manager_id, new_salary)
        v.raise_if_invalid()

        role_changed = new_role != user["role"]
        if role_changed and user["id"] == actor["id"]:
            raise forbidden("You can't change your own role.")
        if role_changed and user["role"] == MANAGER:
            require_no_reports(conn, user, "changing their role")

        manager_changed = new_manager_id != user["manager_id"]
        new_manager = find_active_manager(conn, v, new_manager_id) if manager_changed and new_manager_id else None

        updates = {
            "first_name": first_name, "last_name": last_name, "username": username, "email": email,
            "job_title": job_title, "role": role,
        }
        updates = {field: value for field, value in updates.items() if v.has(field)}
        updates.update(manager_id=new_manager_id, annual_salary=new_salary)
        changes = changed_fields(user, updates)
        if not changes:
            return user_json(user, actor)

        new_values = {field: change["to"] for field, change in changes.items()}
        save(conn, *update_sql("users", user["id"], new_values, EDITABLE_COLUMNS), UNIQUE_FIELDS)

        name = full_name({**user, **updates})
        if role_changed:
            summary = f"Changed {name}'s role from {user['role']} to {new_role}."
            if user["role"] == EMPLOYEE:
                end_memberships(conn, user["id"])
        elif manager_changed:
            summary = f"Reporting manager changed from {user['manager']['name']} to {full_name(new_manager)}."
            notify(conn, user["id"], "Reporting manager changed", f"You now report to {full_name(new_manager)}.")
        else:
            summary = f"Updated {name}."
        log_activity(conn, actor, "user.update", "user", user["id"], summary, changes=changes)
        return read_user(conn, actor, user["id"])


@router.route("DELETE", "/{id}", roles=auth.ADMIN_ONLY)
def archive_user(request):
    with db.transaction() as conn:
        user = find_user(conn, request.user, request.path_params["id"], lock=True)
        if user["id"] == request.user["id"]:
            raise forbidden("You can't archive your own account.")
        if user["archived_at"] is not None:
            raise conflict("This user is already archived.")
        if user["role"] == MANAGER:
            require_no_reports(conn, user, "archiving them", current_only=True)
        conn.execute("UPDATE users SET archived_at = now() WHERE id = %s", (user["id"],))
        if user["role"] == EMPLOYEE:
            end_memberships(conn, user["id"])
        log_activity(conn, request.user, "user.archive", "user", user["id"], f"Archived {full_name(user)}.")
    return 204, None


@router.route("POST", "/{id}/restore", roles=auth.ADMIN_ONLY)
def restore_user(request):
    with db.transaction() as conn:
        user = find_user(conn, request.user, request.path_params["id"], lock=True)
        if user["archived_at"] is None:
            raise conflict("This user isn't archived.")
        if user["manager_id"] is not None:
            manager = conn.execute("SELECT archived_at FROM users WHERE id = %s FOR SHARE",
                                   (user["manager_id"],)).fetchone()
            if manager["archived_at"] is not None:
                raise conflict(f"{user['manager']['name']} is archived. Give {full_name(user)} a new manager first.")
        conn.execute("UPDATE users SET archived_at = NULL WHERE id = %s", (user["id"],))
        log_activity(conn, request.user, "user.restore", "user", user["id"], f"Restored {full_name(user)}.")
        return read_user(conn, request.user, user["id"])


@router.route("POST", "/{id}/password", roles=auth.ADMIN_OR_MANAGER)
def reset_password(request):
    v = Validator(request.json())
    password = v.password("password", required=True)
    v.raise_if_invalid()

    with db.transaction() as conn:
        user = find_user(conn, request.user, request.path_params["id"], lock=True)
        if not can_manage_user(request.user, user):
            raise forbidden("Change your own password from your profile.")
        conn.execute("UPDATE users SET password_hash = %s WHERE id = %s", (auth.hash_password(password), user["id"]))
        # The password itself is never logged.
        log_activity(conn, request.user, "user.password_reset", "user", user["id"],
                     f"Reset {full_name(user)}'s password.")
    return 204, None


def handler(event, context=None):
    return router.handle(event)
