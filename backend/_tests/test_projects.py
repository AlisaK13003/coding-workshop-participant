from conftest import call, sign_in, sql

# Seed data: Customer Portal (id 1, 2026-10-01..2026-12-31, budget 50000) managed by Morgan Manager (2),
# milestones Design (1), Backend API (2), Frontend (3), Launch (4); Emery Employee (3) is member 1 on
# Design, with two logged days at $40/hour.

NEW_PROJECT = {"name": "Data Platform", "manager_id": 2, "start_date": "2026-11-01", "end_date": "2027-03-31",
               "budget": 120000}


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


def add_project(name, manager_id=2):
    return sql("INSERT INTO projects (name, manager_id, start_date, end_date, budget) "
               "VALUES (%s, %s, '2026-10-01', '2026-12-31', 1000) RETURNING id", (name, manager_id))[0]["id"]


def last_activity():
    return sql("SELECT * FROM activity_log ORDER BY id DESC LIMIT 1")[0]


def notifications(user_id):
    return sql("SELECT title, detail, project_id, milestone_id FROM notifications WHERE recipient_id = %s ORDER BY id",
               (user_id,))


def complete_milestones(*ids):
    sql("UPDATE milestones SET completed_at = now() WHERE id = ANY(%s)", (list(ids),))


# GET / and GET /{id}

def test_admin_sees_project_with_totals(admin_token):
    r = call("projects", "GET", "/", token=admin_token)
    assert r.status == 200
    [project] = r.json
    assert project["name"] == "Customer Portal"
    assert project["manager"] == {"id": 2, "name": "Morgan Manager"}
    assert project["start_date"] == "2026-10-01"
    assert project["member_count"] == 1
    assert project["milestones"] == {"completed": 0, "total": 4}
    assert project["hours"] == 16.0
    assert project["budget"] == 50000.0
    assert project["cost"] == 640.0


def test_employee_does_not_get_money(employee_token, manager_token):
    project = call("projects", "GET", "/1", token=employee_token).json
    assert project["hours"] == 16.0
    assert "budget" not in project and "cost" not in project
    assert call("projects", "GET", "/1", token=manager_token).json["cost"] == 640.0


def test_visibility_rules(admin_token, manager_token, employee_token):
    other_manager = add_project("Other Manager's", add_user("Other", "manager"))
    closed = add_project("Closed")
    sql("UPDATE projects SET status = 'completed' WHERE id = %s", (closed,))
    archived = add_project("Archived")
    sql("UPDATE projects SET archived_at = now() WHERE id = %s", (archived,))
    sql("INSERT INTO project_members (project_id, employee_id) VALUES (%s, 3)", (closed,))

    ids = lambda token, query=None: {p["id"] for p in call("projects", "GET", "/", token=token, query=query).json}
    assert ids(admin_token) == {1, other_manager, closed, archived}
    assert ids(manager_token) == {1}
    assert ids(employee_token) == {1}
    assert ids(admin_token, {"status": "completed"}) == {closed}
    assert ids(admin_token, {"archived": "true"}) == {archived}
    assert ids(admin_token, {"archived": "false", "status": "in_progress"}) == {1, other_manager}
    assert call("projects", "GET", "/", token=admin_token, query={"status": "done"}).status == 400

    for project_id in (other_manager, closed, archived):
        assert call("projects", "GET", f"/{project_id}", token=manager_token).status == 404
        assert call("projects", "GET", f"/{project_id}", token=employee_token).status == 404
    assert call("projects", "GET", f"/{closed}", token=admin_token).status == 200


def test_employee_only_sees_projects_they_are_on(employee_token):
    sql("UPDATE project_members SET removed_at = now()")
    assert call("projects", "GET", "/", token=employee_token).json == []
    assert call("projects", "GET", "/1", token=employee_token).status == 404


# POST /

def test_admin_creates_project_and_notifies_manager(admin_token):
    r = call("projects", "POST", "/", NEW_PROJECT, token=admin_token)
    assert r.status == 201
    assert r.json["status"] == "in_progress"
    assert r.json["budget"] == 120000.0
    assert r.json["milestones"] == {"completed": 0, "total": 0}
    assert r.json["hours"] == 0 and r.json["cost"] == 0
    entry = last_activity()
    assert entry["action"] == "project.create"
    assert entry["summary"] == "Created project Data Platform, managed by Morgan Manager."
    assert notifications(2)[-1] == {"title": "New project assigned", "detail": "Data Platform",
                                    "project_id": r.json["id"], "milestone_id": None}


def test_create_project_validation(admin_token):
    r = call("projects", "POST", "/", {"start_date": "2026-13-01", "budget": -5}, token=admin_token)
    assert r.status == 400
    assert set(r.json["error"]["fields"]) == {"name", "manager_id", "start_date", "end_date", "budget"}
    r = call("projects", "POST", "/", {**NEW_PROJECT, "end_date": "2026-10-01"}, token=admin_token)
    assert r.status == 400 and "end_date" in r.json["error"]["fields"]
    r = call("projects", "POST", "/", {**NEW_PROJECT, "manager_id": 3}, token=admin_token)
    assert r.status == 400
    assert r.json["error"]["fields"]["manager_id"] == "Must be an active manager."


def test_create_project_duplicate_name_is_409(admin_token):
    r = call("projects", "POST", "/", {**NEW_PROJECT, "name": "customer PORTAL"}, token=admin_token)
    assert r.status == 409
    assert "name" in r.json["error"]["fields"]


def test_only_admins_create_projects(manager_token, employee_token):
    assert call("projects", "POST", "/", NEW_PROJECT, token=manager_token).status == 403
    assert call("projects", "POST", "/", NEW_PROJECT, token=employee_token).status == 403


# PUT /{id}

def test_manager_updates_own_project(manager_token):
    r = call("projects", "PUT", "/1", {"budget": 60000, "end_date": "2027-01-31"}, token=manager_token)
    assert r.status == 200
    assert r.json["budget"] == 60000.0
    assert r.json["end_date"] == "2027-01-31"
    entry = last_activity()
    assert entry["action"] == "project.update"
    assert entry["summary"] == "Updated project Customer Portal."
    assert entry["changes"]["budget"] == {"from": "50000.00", "to": "60000.00"}


def test_update_rejects_dates_that_leave_milestones_outside(admin_token):
    r = call("projects", "PUT", "/1", {"start_date": "2026-10-15", "end_date": "2026-12-20"}, token=admin_token)
    assert r.status == 400
    fields = r.json["error"]["fields"]
    assert "Design" in fields["start_date"]
    assert "Launch" in fields["end_date"]
    r = call("projects", "PUT", "/1", {"end_date": "2026-09-01"}, token=admin_token)
    assert r.status == 400 and "end_date" in r.json["error"]["fields"]


def test_update_permissions(manager_token, employee_token, admin_token):
    assert call("projects", "PUT", "/1", {"manager_id": 2}, token=manager_token).status == 403
    assert call("projects", "PUT", "/1", {"budget": 1}, token=employee_token).status == 403
    other = add_project("Other", add_user("Other", "manager"))
    assert call("projects", "PUT", f"/{other}", {"budget": 1}, token=manager_token).status == 404
    sql("UPDATE projects SET status = 'abandoned' WHERE id = %s", (other,))
    assert call("projects", "PUT", f"/{other}", {"budget": 1}, token=admin_token).status == 403


def test_update_duplicate_name_and_null_manager(admin_token):
    add_project("Taken")
    r = call("projects", "PUT", "/1", {"name": "TAKEN"}, token=admin_token)
    assert r.status == 409 and "name" in r.json["error"]["fields"]
    r = call("projects", "PUT", "/1", {"manager_id": None}, token=admin_token)
    assert r.status == 400 and "manager_id" in r.json["error"]["fields"]


def test_admin_reassigns_project(admin_token):
    new_manager = add_user("Sam", "manager")
    r = call("projects", "PUT", "/1", {"manager_id": new_manager}, token=admin_token)
    assert r.status == 200
    assert r.json["manager"] == {"id": new_manager, "name": "Sam Test"}
    assert last_activity()["summary"] == "Project Customer Portal reassigned from Morgan Manager to Sam Test."
    assert notifications(new_manager)[-1]["title"] == "New project assigned"


# DELETE /{id}, complete, abandon, unarchive

def test_archive_project(admin_token, manager_token):
    assert call("projects", "DELETE", "/1", token=manager_token).status == 403
    assert call("projects", "DELETE", "/1", token=admin_token).status == 204
    assert last_activity()["action"] == "project.archive"
    assert call("projects", "DELETE", "/1", token=admin_token).status == 409
    assert call("projects", "GET", "/1", token=manager_token).status == 404


def test_complete_project_rules(manager_token, employee_token):
    assert call("projects", "POST", "/1/complete", token=employee_token).status == 403
    r = call("projects", "POST", "/1/complete", token=manager_token)
    assert r.status == 409
    assert "Design, Backend API, Frontend, Launch" in r.json["error"]["message"]
    complete_milestones(1, 2, 3, 4)
    r = call("projects", "POST", "/1/complete", token=manager_token)
    assert r.status == 200
    assert r.json["status"] == "completed"
    assert last_activity()["action"] == "project.complete"


def test_complete_project_needs_a_milestone(admin_token):
    empty = add_project("Empty")
    r = call("projects", "POST", f"/{empty}/complete", token=admin_token)
    assert r.status == 409
    assert "at least one milestone" in r.json["error"]["message"]


def test_abandon_project(admin_token, manager_token):
    assert call("projects", "POST", "/1/abandon", token=manager_token).status == 403
    r = call("projects", "POST", "/1/abandon", token=admin_token)
    assert r.status == 200 and r.json["status"] == "abandoned"
    assert last_activity()["action"] == "project.abandon"
    assert call("projects", "POST", "/1/abandon", token=admin_token).status == 403


def test_unarchive_clears_manager_and_members(admin_token, manager_token):
    complete_milestones(1)
    assert call("projects", "POST", "/1/unarchive", token=admin_token).status == 409
    call("projects", "DELETE", "/1", token=admin_token)
    assert call("projects", "POST", "/1/unarchive", token=manager_token).status == 403

    r = call("projects", "POST", "/1/unarchive", token=admin_token)
    assert r.status == 200
    assert r.json["archived_at"] is None
    assert r.json["manager"] is None
    assert r.json["member_count"] == 0
    assert r.json["milestones"]["completed"] == 1
    assert r.json["status"] == "in_progress"
    entry = last_activity()
    assert entry["action"] == "project.unarchive"
    assert entry["changes"] == {"manager_id": {"from": 2, "to": None}}

    r = call("projects", "PUT", "/1", {"manager_id": 2}, token=admin_token)
    assert r.status == 200 and r.json["manager"]["id"] == 2
    assert last_activity()["summary"] == "Assigned project Customer Portal to Morgan Manager."


def test_unarchive_reopens_a_closed_project_so_it_can_be_reassigned(admin_token, manager_token):
    complete_milestones(1, 2, 3, 4)
    assert call("projects", "POST", "/1/complete", token=manager_token).status == 200
    assert call("projects", "DELETE", "/1", token=admin_token).status == 204

    r = call("projects", "POST", "/1/unarchive", token=admin_token)
    assert r.status == 200
    assert r.json["status"] == "in_progress"
    assert r.json["manager"] is None
    assert last_activity()["changes"] == {
        "manager_id": {"from": 2, "to": None},
        "status": {"from": "completed", "to": "in_progress"},
    }
    # Hidden from the old manager until it's reassigned, then visible and editable again.
    assert call("projects", "GET", "/1", token=manager_token).status == 404
    assert call("projects", "PUT", "/1", {"manager_id": 2}, token=admin_token).status == 200
    assert call("projects", "GET", "/1", token=manager_token).status == 200
    assert call("projects", "PUT", "/1", {"budget": 60000}, token=manager_token).status == 200


# Members

def test_list_members(employee_token, manager_token):
    r = call("projects", "GET", "/1/members", token=employee_token)
    assert r.status == 200
    [member] = r.json
    assert member["user"] == {"id": 3, "name": "Emery Employee", "job_title": "Software Engineer",
                              "display_id": "USR-0003"}
    assert member["milestone"] == {"id": 1, "name": "Design", "status": "awaiting_review"}
    assert member["added_at"]
    other = add_project("Other", add_user("Other", "manager"))
    assert call("projects", "GET", f"/{other}/members", token=manager_token).status == 404


def test_manager_adds_own_employee_and_notifies(manager_token):
    new_employee = add_user("Jo", "employee", 2, 50000)
    r = call("projects", "POST", "/1/members", {"employee_id": new_employee, "milestone_id": 2}, token=manager_token)
    assert r.status == 201
    assert r.json["user"]["id"] == new_employee
    assert r.json["milestone"] == {"id": 2, "name": "Backend API", "status": "blocked"}
    entry = last_activity()
    assert entry["action"] == "member.add"
    assert entry["summary"] == "Added Jo Test to Customer Portal on Backend API."
    assert notifications(new_employee) == [{"title": "Added to project", "detail": "Customer Portal · Backend API",
                                            "project_id": 1, "milestone_id": 2}]


def test_add_member_rules(admin_token, manager_token):
    other_manager = add_user("Other", "manager")
    theirs = add_user("Theirs", "employee", other_manager, 50000)
    archived = add_user("Gone", "employee", 2, 50000)
    sql("UPDATE users SET archived_at = now() WHERE id = %s", (archived,))
    mine = add_user("Mine", "employee", 2, 50000)

    add = lambda body, token=admin_token: call("projects", "POST", "/1/members", body, token=token)
    assert add({}).json["error"]["fields"] == {"employee_id": "This field is required."}
    assert add({"employee_id": 2}).json["error"]["fields"]["employee_id"] == "Must be an active employee."
    assert add({"employee_id": archived}).status == 400
    assert add({"employee_id": theirs}, manager_token).status == 403
    assert add({"employee_id": theirs}).status == 201
    assert add({"employee_id": 3}).status == 409

    other_project = add_project("Other")
    sql("INSERT INTO milestones (project_id, name, start_date, end_date) VALUES (%s, 'X', '2026-10-01', '2026-10-02')",
        (other_project,))
    r = add({"employee_id": mine, "milestone_id": 5})
    assert r.status == 400 and r.json["error"]["fields"]["milestone_id"] == "Must be a milestone of this project."
    complete_milestones(1)
    r = add({"employee_id": mine, "milestone_id": 1})
    assert r.status == 400 and r.json["error"]["fields"]["milestone_id"] == "This milestone is already completed."

    sql("UPDATE projects SET archived_at = now() WHERE id = 1")
    assert add({"employee_id": mine}).status == 403


def test_reassign_member_milestone(manager_token, employee_token):
    assert call("projects", "PUT", "/1/members/1", {"milestone_id": 3}, token=employee_token).status == 403
    r = call("projects", "PUT", "/1/members/1", {"milestone_id": 3}, token=manager_token)
    assert r.status == 200
    assert r.json["milestone"]["name"] == "Frontend"
    entry = last_activity()
    assert entry["summary"] == "Emery Employee assigned to Frontend."
    assert entry["changes"] == {"milestone_id": {"from": 1, "to": 3}}
    assert notifications(3)[-1]["title"] == "Milestone assignment changed"

    r = call("projects", "PUT", "/1/members/1", {"milestone_id": None}, token=manager_token)
    assert r.status == 200 and r.json["milestone"] is None
    assert last_activity()["summary"] == "Emery Employee unassigned from Frontend."


def test_reassign_member_rules(admin_token):
    r = call("projects", "PUT", "/1/members/1", {}, token=admin_token)
    assert r.status == 400 and "milestone_id" in r.json["error"]["fields"]
    complete_milestones(2)
    assert call("projects", "PUT", "/1/members/1", {"milestone_id": 2}, token=admin_token).status == 400
    assert call("projects", "PUT", "/1/members/99", {"milestone_id": 3}, token=admin_token).status == 404
    before = len(sql("SELECT id FROM activity_log"))
    assert call("projects", "PUT", "/1/members/1", {"milestone_id": 1}, token=admin_token).status == 200
    assert len(sql("SELECT id FROM activity_log")) == before


def test_remove_member(manager_token, employee_token):
    assert call("projects", "DELETE", "/1/members/1", token=employee_token).status == 403
    assert call("projects", "DELETE", "/1/members/1", token=manager_token).status == 204
    assert sql("SELECT removed_at FROM project_members WHERE id = 1")[0]["removed_at"] is not None
    assert last_activity()["action"] == "member.remove"
    assert notifications(3)[-1]["title"] == "Removed from project"
    assert call("projects", "DELETE", "/1/members/1", token=manager_token).status == 404
    assert call("projects", "GET", "/1", token=employee_token).status == 404
    # Removed members can be added again; history is kept.
    assert call("projects", "POST", "/1/members", {"employee_id": 3}, token=manager_token).status == 201
    assert len(sql("SELECT id FROM project_members WHERE employee_id = 3")) == 2


def test_new_member_can_sign_in_and_see_project(admin_token):
    r = call("users", "POST", "/", {"first_name": "Kai", "last_name": "New", "email": "kai@example.com",
                                    "job_title": "Engineer", "role": "employee", "password": "longenough",
                                    "manager_id": 2, "annual_salary": 50000}, token=admin_token)
    kai = r.json["id"]
    call("projects", "POST", "/1/members", {"employee_id": kai}, token=admin_token)
    token = sign_in(r.json["username"], "longenough")
    assert [p["id"] for p in call("projects", "GET", "/", token=token).json] == [1]
