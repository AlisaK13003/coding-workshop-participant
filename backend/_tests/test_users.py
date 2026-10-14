from conftest import SEED_PASSWORD, call, sign_in, sql

# Seed data: 1 Alex Admin, 2 Morgan Manager, 3 Emery Employee (reports to Morgan, on Customer Portal).

NEW_EMPLOYEE = {"first_name": "Jordan", "last_name": "Lee", "email": "jordan@example.com", "job_title": "Analyst",
                "role": "employee", "password": "longenough1", "manager_id": 2, "annual_salary": 62400}


def add_user(first_name, role, manager_id=None, salary=None):
    """Inserts a user straight into the database and returns their id."""
    return sql(
        """
        INSERT INTO users (first_name, last_name, email, job_title, role, manager_id, annual_salary, password_hash)
        SELECT %s, 'Test', lower(%s) || '@example.com', 'Tester', %s, %s, %s, password_hash FROM users WHERE id = 1
        RETURNING id
        """,
        (first_name, first_name, role, manager_id, salary),
    )[0]["id"]


def last_activity():
    return sql("SELECT * FROM activity_log ORDER BY id DESC LIMIT 1")[0]


# GET /

def test_admin_lists_everyone_with_salaries(admin_token):
    r = call("users", "GET", "/", token=admin_token)
    assert r.status == 200
    by_id = {u["id"]: u for u in r.json}
    assert set(by_id) == {1, 2, 3}
    emery = by_id[3]
    assert emery["name"] == "Emery Employee"
    assert emery["manager"] == {"id": 2, "name": "Morgan Manager"}
    assert emery["annual_salary"] == 83200.0
    assert emery["project_count"] == 1
    assert "project_count" not in by_id[2]
    assert all("password_hash" not in u for u in r.json)


def test_admin_filters_users(admin_token):
    archived = add_user("Old", "employee", 2, 50000)
    sql("UPDATE users SET archived_at = now() WHERE id = %s", (archived,))
    other_manager = add_user("Other", "manager")
    add_user("Theirs", "employee", other_manager, 50000)

    ids = lambda query: {u["id"] for u in call("users", "GET", "/", token=admin_token, query=query).json}
    assert ids({"role": "manager"}) == {2, other_manager}
    assert ids({"manager_id": "2"}) == {3}
    assert ids({"manager_id": "2", "include_archived": "true"}) == {3, archived}
    r = call("users", "GET", "/", token=admin_token, query={"role": "boss", "manager_id": "x"})
    assert r.status == 400
    assert set(r.json["error"]["fields"]) == {"role", "manager_id"}


def test_manager_lists_self_and_active_employees(manager_token):
    archived = add_user("Old", "employee", 2, 50000)
    sql("UPDATE users SET archived_at = now() WHERE id = %s", (archived,))
    other_manager = add_user("Other", "manager")
    add_user("Theirs", "employee", other_manager, 50000)

    r = call("users", "GET", "/", token=manager_token)
    assert r.status == 200
    by_id = {u["id"]: u for u in r.json}
    assert set(by_id) == {2, 3}
    assert by_id[3]["annual_salary"] == 83200.0


def test_employee_cannot_list_users(employee_token):
    assert call("users", "GET", "/", token=employee_token).status == 403


# GET /{id}

def test_get_user_includes_memberships(admin_token):
    r = call("users", "GET", "/3", token=admin_token)
    assert r.status == 200
    assert r.json["projects"] == [{"project": {"id": 1, "name": "Customer Portal"},
                                   "milestone": {"id": 1, "name": "Design"}}]


def test_get_user_visibility(manager_token, employee_token):
    other_manager = add_user("Other", "manager")
    theirs = add_user("Theirs", "employee", other_manager, 50000)

    assert call("users", "GET", "/2", token=manager_token).status == 200
    assert call("users", "GET", "/3", token=manager_token).json["annual_salary"] == 83200.0
    assert call("users", "GET", f"/{theirs}", token=manager_token).status == 404
    assert call("users", "GET", "/1", token=manager_token).status == 404

    own = call("users", "GET", "/3", token=employee_token)
    assert own.status == 200
    assert "annual_salary" not in own.json
    assert call("users", "GET", "/2", token=employee_token).status == 404
    assert call("users", "GET", "/999", token=employee_token).status == 404


# POST /

def test_admin_creates_employee(admin_token):
    r = call("users", "POST", "/", NEW_EMPLOYEE, token=admin_token)
    assert r.status == 201
    assert r.json["username"] == f"jlee{r.json['id']}"
    assert r.json["manager"] == {"id": 2, "name": "Morgan Manager"}
    assert r.json["annual_salary"] == 62400.0
    assert r.json["project_count"] == 0
    assert sign_in(r.json["username"], "longenough1")
    entry = last_activity()
    assert entry["action"] == "user.create"
    assert entry["summary"] == "Created employee Jordan Lee, reporting to Morgan Manager."


def test_admin_creates_manager_with_chosen_username(admin_token):
    body = {**NEW_EMPLOYEE, "role": "manager", "username": "jordan.lee"}
    del body["manager_id"], body["annual_salary"]
    r = call("users", "POST", "/", body, token=admin_token)
    assert r.status == 201
    assert r.json["username"] == "jordan.lee"
    assert r.json["manager"] is None


def test_create_user_validates_fields(admin_token):
    r = call("users", "POST", "/", {"email": "nope", "role": "boss", "password": "short"}, token=admin_token)
    assert r.status == 400
    assert {"first_name", "last_name", "email", "job_title", "role", "password"} <= set(r.json["error"]["fields"])


def test_create_user_enforces_employee_fields(admin_token):
    missing = {k: v for k, v in NEW_EMPLOYEE.items() if k not in ("manager_id", "annual_salary")}
    r = call("users", "POST", "/", missing, token=admin_token)
    assert r.status == 400
    assert set(r.json["error"]["fields"]) == {"manager_id", "annual_salary"}

    r = call("users", "POST", "/", {**NEW_EMPLOYEE, "role": "admin"}, token=admin_token)
    assert r.status == 400
    assert r.json["error"]["fields"]["manager_id"] == "Only employees have a manager."


def test_create_user_requires_active_manager(admin_token):
    r = call("users", "POST", "/", {**NEW_EMPLOYEE, "manager_id": 3}, token=admin_token)
    assert r.status == 400
    assert r.json["error"]["fields"]["manager_id"] == "Must be an active manager."
    sql("UPDATE users SET archived_at = now() WHERE id = 2")
    assert call("users", "POST", "/", NEW_EMPLOYEE, token=admin_token).status == 400


def test_create_user_duplicate_username_or_email_is_409(admin_token):
    r = call("users", "POST", "/", {**NEW_EMPLOYEE, "email": "EMERY@example.com"}, token=admin_token)
    assert r.status == 409
    assert "email" in r.json["error"]["fields"]
    r = call("users", "POST", "/", {**NEW_EMPLOYEE, "username": "EEmployee3"}, token=admin_token)
    assert r.status == 409
    assert "username" in r.json["error"]["fields"]


def test_only_admins_create_users(manager_token, employee_token):
    assert call("users", "POST", "/", NEW_EMPLOYEE, token=manager_token).status == 403
    assert call("users", "POST", "/", NEW_EMPLOYEE, token=employee_token).status == 403


# PUT /{id}

def test_admin_updates_user_and_logs_changes(admin_token):
    r = call("users", "PUT", "/3", {"job_title": "Senior Engineer", "annual_salary": 90000}, token=admin_token)
    assert r.status == 200
    assert r.json["job_title"] == "Senior Engineer"
    assert r.json["annual_salary"] == 90000.0
    entry = last_activity()
    assert entry["action"] == "user.update"
    assert entry["summary"] == "Updated Emery Employee."
    assert entry["changes"]["job_title"] == {"from": "Software Engineer", "to": "Senior Engineer"}


def test_update_without_changes_logs_nothing(admin_token):
    before = len(sql("SELECT id FROM activity_log"))
    assert call("users", "PUT", "/3", {"job_title": "Software Engineer"}, token=admin_token).status == 200
    assert len(sql("SELECT id FROM activity_log")) == before


def test_update_validates_fields(admin_token):
    r = call("users", "PUT", "/3", {"first_name": None, "email": "nope", "role": "boss"}, token=admin_token)
    assert r.status == 400
    assert set(r.json["error"]["fields"]) == {"first_name", "email", "role"}
    r = call("users", "PUT", "/3", {"annual_salary": None}, token=admin_token)
    assert r.status == 400
    assert r.json["error"]["fields"]["annual_salary"] == "Employees must have a salary."


def test_update_duplicate_email_is_409(admin_token):
    r = call("users", "PUT", "/3", {"email": "Morgan@Example.com"}, token=admin_token)
    assert r.status == 409
    assert "email" in r.json["error"]["fields"]


def test_admin_transfers_employee_and_notifies_them(admin_token):
    new_manager = add_user("Sam", "manager")
    r = call("users", "PUT", "/3", {"manager_id": new_manager}, token=admin_token)
    assert r.status == 200
    assert r.json["manager"] == {"id": new_manager, "name": "Sam Test"}
    entry = last_activity()
    assert entry["summary"] == "Reporting manager changed from Morgan Manager to Sam Test."
    assert entry["changes"] == {"manager_id": {"from": 2, "to": new_manager}}
    notes = sql("SELECT title, detail FROM notifications WHERE recipient_id = 3")
    assert {"title": "Reporting manager changed", "detail": "You now report to Sam Test."} in notes


def test_transfer_requires_active_manager(admin_token):
    r = call("users", "PUT", "/3", {"manager_id": 1}, token=admin_token)
    assert r.status == 400
    assert r.json["error"]["fields"]["manager_id"] == "Must be an active manager."


def test_promoting_employee_clears_manager_salary_and_memberships(admin_token):
    r = call("users", "PUT", "/3", {"role": "manager"}, token=admin_token)
    assert r.status == 200
    assert r.json["role"] == "manager"
    assert r.json["manager"] is None
    assert r.json["annual_salary"] is None
    assert sql("SELECT count(*) AS n FROM project_members WHERE employee_id = 3 AND removed_at IS NULL")[0]["n"] == 0
    entry = last_activity()
    assert entry["summary"] == "Changed Emery Employee's role from employee to manager."
    assert entry["changes"]["manager_id"] == {"from": 2, "to": None}


def test_promotion_rejects_manager_or_salary(admin_token):
    r = call("users", "PUT", "/3", {"role": "admin", "annual_salary": 1}, token=admin_token)
    assert r.status == 400
    assert r.json["error"]["fields"]["annual_salary"] == "Only employees have a salary."


def test_demoting_manager_with_employees_is_409(admin_token):
    r = call("users", "PUT", "/2", {"role": "employee", "manager_id": 2, "annual_salary": 1}, token=admin_token)
    assert r.status == 409
    assert "employees" in r.json["error"]["message"]


def test_demoting_manager_with_projects_is_409(admin_token):
    other_manager = add_user("Other", "manager")
    sql("UPDATE users SET manager_id = %s WHERE id = 3", (other_manager,))
    r = call("users", "PUT", "/2", {"role": "admin"}, token=admin_token)
    assert r.status == 409
    assert "projects" in r.json["error"]["message"]


def test_demoting_manager_to_employee(admin_token):
    spare = add_user("Spare", "manager")
    r = call("users", "PUT", f"/{spare}", {"role": "employee"}, token=admin_token)
    assert r.status == 400
    assert set(r.json["error"]["fields"]) == {"manager_id", "annual_salary"}
    r = call("users", "PUT", f"/{spare}", {"role": "employee", "manager_id": 2, "annual_salary": 50000},
             token=admin_token)
    assert r.status == 200
    assert r.json["role"] == "employee"
    assert r.json["manager"]["id"] == 2


def test_admin_cannot_change_own_role(admin_token):
    assert call("users", "PUT", "/1", {"role": "manager"}, token=admin_token).status == 403


def test_manager_updates_own_employee(manager_token):
    r = call("users", "PUT", "/3", {"job_title": "Lead", "annual_salary": 95000}, token=manager_token)
    assert r.status == 200
    assert r.json["annual_salary"] == 95000.0
    assert last_activity()["actor_id"] == 2


def test_manager_update_limits(manager_token):
    other_manager = add_user("Other", "manager")
    theirs = add_user("Theirs", "employee", other_manager, 50000)
    assert call("users", "PUT", "/3", {"role": "manager"}, token=manager_token).status == 403
    assert call("users", "PUT", "/3", {"manager_id": other_manager}, token=manager_token).status == 403
    assert call("users", "PUT", "/2", {"job_title": "Boss"}, token=manager_token).status == 403
    assert call("users", "PUT", f"/{theirs}", {"job_title": "X"}, token=manager_token).status == 404
    assert call("users", "PUT", "/1", {"job_title": "X"}, token=manager_token).status == 404


def test_employee_cannot_update_users(employee_token):
    assert call("users", "PUT", "/3", {"job_title": "CEO"}, token=employee_token).status == 403


# DELETE /{id} and POST /{id}/restore

def test_archive_employee_removes_memberships(admin_token):
    assert call("users", "DELETE", "/3", token=admin_token).status == 204
    assert sql("SELECT archived_at FROM users WHERE id = 3")[0]["archived_at"] is not None
    assert sql("SELECT count(*) AS n FROM project_members WHERE employee_id = 3 AND removed_at IS NULL")[0]["n"] == 0
    assert last_activity()["action"] == "user.archive"
    assert call("users", "DELETE", "/3", token=admin_token).status == 409
    assert call("auth", "POST", "/login", {"username": "eemployee3", "password": SEED_PASSWORD}).status == 401


def test_archive_rules(admin_token):
    assert call("users", "DELETE", "/1", token=admin_token).status == 403
    r = call("users", "DELETE", "/2", token=admin_token)
    assert r.status == 409
    assert "employees" in r.json["error"]["message"]
    sql("UPDATE users SET archived_at = now() WHERE id = 3")
    r = call("users", "DELETE", "/2", token=admin_token)
    assert r.status == 409
    assert "projects" in r.json["error"]["message"]
    sql("UPDATE projects SET status = 'completed'")
    assert call("users", "DELETE", "/2", token=admin_token).status == 204


def test_only_admins_archive_or_restore(manager_token, employee_token):
    assert call("users", "DELETE", "/3", token=manager_token).status == 403
    assert call("users", "DELETE", "/3", token=employee_token).status == 403
    assert call("users", "POST", "/3/restore", token=manager_token).status == 403


def test_restore_user(admin_token):
    assert call("users", "POST", "/3/restore", token=admin_token).status == 409
    call("users", "DELETE", "/3", token=admin_token)
    r = call("users", "POST", "/3/restore", token=admin_token)
    assert r.status == 200
    assert r.json["archived_at"] is None
    assert last_activity()["action"] == "user.restore"
    assert sign_in("eemployee3")


def test_restore_needs_active_manager(admin_token):
    sql("UPDATE users SET archived_at = now() WHERE id IN (2, 3)")
    r = call("users", "POST", "/3/restore", token=admin_token)
    assert r.status == 409
    assert "Morgan Manager is archived" in r.json["error"]["message"]


# POST /{id}/password

def test_admin_and_manager_reset_passwords(admin_token, manager_token):
    assert call("users", "POST", "/3/password", {"password": "brandnew1"}, token=manager_token).status == 204
    assert sign_in("eemployee3", "brandnew1")
    entry = last_activity()
    assert entry["action"] == "user.password_reset"
    assert "brandnew1" not in str(entry)
    assert call("users", "POST", "/2/password", {"password": "brandnew2"}, token=admin_token).status == 204
    assert sign_in("mmanager2", "brandnew2")


def test_password_reset_rules(manager_token, employee_token, admin_token):
    r = call("users", "POST", "/3/password", {"password": "short"}, token=admin_token)
    assert r.status == 400 and "password" in r.json["error"]["fields"]
    assert call("users", "POST", "/2/password", {"password": "brandnew1"}, token=manager_token).status == 403
    assert call("users", "POST", "/1/password", {"password": "brandnew1"}, token=manager_token).status == 404
    assert call("users", "POST", "/3/password", {"password": "brandnew1"}, token=employee_token).status == 403
