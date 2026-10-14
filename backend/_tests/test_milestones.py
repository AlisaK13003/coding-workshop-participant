"""Milestones service tests. Seed data: project 1 (Customer Portal, managed by Morgan, id 2)
has milestones 1 Design, 2 Backend API, 3 Frontend and 4 Launch. Backend API and Frontend
depend on Design; Launch depends on both. Emery (id 3) is on Design, with two work logs and
a waiting review request (id 1)."""

from datetime import date

import pytest

from conftest import call, load_service, sign_in, sql

DESIGN, BACKEND, FRONTEND, LAUNCH = 1, 2, 3, 4
WEDNESDAY, SATURDAY = date(2026, 10, 14), date(2026, 10, 17)


@pytest.fixture(autouse=True)
def today(monkeypatch):
    """Sets the milestones service's "today" (review requests log the day). Defaults to Wed 14 Oct 2026."""
    clock = load_service("milestones").clock

    def set_today(day):
        monkeypatch.setattr(clock, "today", lambda: day)

    set_today(WEDNESDAY)
    return set_today


# ---------- helpers ----------

def add_user(first, last, role, manager_id=None):
    """Creates a user with the seed password and returns their generated username."""
    salary = 52000 if role == "employee" else None
    row = sql(
        """
        INSERT INTO users (first_name, last_name, email, job_title, role, manager_id, annual_salary, password_hash)
        SELECT %s, %s, %s, 'Tester', %s, %s, %s, password_hash FROM users WHERE id = 1
        RETURNING username
        """,
        (first, last, f"{first.lower()}@example.com", role, manager_id, salary),
    )
    return row[0]["username"]


def add_other_project():
    """A second project with its own manager and one milestone. Returns (project id, milestone id, manager token)."""
    username = add_user("Olive", "Other", "manager")
    project = sql(
        """
        INSERT INTO projects (name, manager_id, start_date, end_date, budget)
        SELECT 'Other Project', id, '2026-10-01', '2026-12-31', 1000 FROM users WHERE username = %s
        RETURNING id
        """,
        (username,),
    )[0]["id"]
    milestone = sql(
        "INSERT INTO milestones (project_id, name, start_date, end_date) VALUES (%s, 'Elsewhere', '2026-10-01', '2026-10-31') RETURNING id",
        (project,),
    )[0]["id"]
    return project, milestone, sign_in(username)


def complete_design():
    """Completes Design directly in the database, as if it had been accepted earlier."""
    sql("UPDATE milestone_reviews SET decision = 'accepted', decided_by = 2, decided_at = now() WHERE id = 1")
    sql("UPDATE milestones SET completed_at = now() WHERE id = 1")


def keep_design_open():
    """Resolves the seed's waiting review, so Design is available again."""
    sql("UPDATE milestone_reviews SET decision = 'kept_open', decided_by = 2, decided_at = now() WHERE id = 1")


def close_project():
    sql("UPDATE projects SET status = 'abandoned' WHERE id = 1")


def activity(action):
    return sql("SELECT * FROM activity_log WHERE action = %s ORDER BY id", (action,))


def notifications(recipient_id):
    return sql("SELECT title, detail, milestone_id FROM notifications WHERE recipient_id = %s ORDER BY id",
               (recipient_id,))


def new_milestone(token, **fields):
    body = {"project_id": 1, "name": "Docs", "start_date": "2026-10-05", "end_date": "2026-10-20", **fields}
    return call("milestones", "POST", "/", body, token)


@pytest.fixture
def other_manager_token():
    return sign_in(add_user("Pat", "Peer", "manager"))


# ---------- GET / ----------

def test_list_requires_project_id(admin_token):
    r = call("milestones", "GET", "/", token=admin_token)
    assert r.status == 400
    assert r.json["error"]["code"] == "project_id_required"
    assert call("milestones", "GET", "/", token=admin_token, query={"project_id": "abc"}).status == 400


def test_list_requires_sign_in():
    assert call("milestones", "GET", "/", query={"project_id": "1"}).status == 401


def test_list_returns_milestones_in_order_with_details(manager_token):
    r = call("milestones", "GET", "/", token=manager_token, query={"project_id": "1"})
    assert r.status == 200
    assert [m["id"] for m in r.json] == [DESIGN, BACKEND, FRONTEND, LAUNCH]
    design, backend, _, launch = r.json
    assert design["name"] == "Design"
    assert design["start_date"] == "2026-10-01" and design["completed_at"] is None
    assert design["status"] == "awaiting_review"
    assert design["members"] == [{"id": 3, "name": "Emery Employee"}]
    assert design["hours"] == 16
    assert design["pending_review"]["id"] == 1
    assert design["pending_review"]["requested_by"] == {"id": 3, "name": "Emery Employee"}
    assert design["pending_review"]["requested_at"]
    assert backend["status"] == "blocked" and backend["prerequisite_ids"] == [DESIGN]
    assert backend["members"] == [] and backend["hours"] == 0 and backend["pending_review"] is None
    assert launch["prerequisite_ids"] == [BACKEND, FRONTEND]


def test_list_visible_to_member_employee(employee_token):
    assert call("milestones", "GET", "/", token=employee_token, query={"project_id": "1"}).status == 200
    sql("UPDATE project_members SET removed_at = now()")
    assert call("milestones", "GET", "/", token=employee_token, query={"project_id": "1"}).status == 404


def test_list_hidden_from_other_managers_and_on_closed_projects(other_manager_token, manager_token, admin_token):
    assert call("milestones", "GET", "/", token=other_manager_token, query={"project_id": "1"}).status == 404
    close_project()
    assert call("milestones", "GET", "/", token=manager_token, query={"project_id": "1"}).status == 404
    assert call("milestones", "GET", "/", token=admin_token, query={"project_id": "1"}).status == 200


# ---------- GET /{id} ----------

def test_get_includes_review_history_newest_first(employee_token):
    sql("""INSERT INTO milestone_reviews (milestone_id, requested_by, requested_at, decision, decided_by, decided_at, feedback)
           VALUES (1, 3, '2026-10-01 10:00-04', 'kept_open', 2, '2026-10-01 12:00-04', 'Not yet')""")
    r = call("milestones", "GET", f"/{DESIGN}", token=employee_token)
    assert r.status == 200
    assert r.json["name"] == "Design" and r.json["members"] == [{"id": 3, "name": "Emery Employee"}]
    waiting, older = r.json["reviews"]
    assert waiting["id"] == 1 and waiting["decision"] is None and waiting["decided_by"] is None
    assert older["decision"] == "kept_open" and older["feedback"] == "Not yet"
    assert older["decided_by"] == {"id": 2, "name": "Morgan Manager"}
    assert older["requested_by"] == {"id": 3, "name": "Emery Employee"}


def test_get_unknown_or_hidden_milestone_is_404(admin_token, other_manager_token):
    assert call("milestones", "GET", "/999", token=admin_token).status == 404
    assert call("milestones", "GET", f"/{DESIGN}", token=other_manager_token).status == 404


# ---------- POST / ----------

def test_create_milestone(manager_token):
    r = new_milestone(manager_token, prerequisite_ids=[BACKEND, BACKEND, FRONTEND])
    assert r.status == 201
    assert r.json["name"] == "Docs" and r.json["project_id"] == 1
    assert r.json["prerequisite_ids"] == [BACKEND, FRONTEND]
    assert r.json["status"] == "blocked"
    [entry] = activity("milestone.create")
    assert entry["entity_id"] == r.json["id"] and entry["project_id"] == 1 and entry["actor_id"] == 2


def test_create_validates_fields(admin_token):
    r = call("milestones", "POST", "/", {"prerequisite_ids": "1"}, admin_token)
    assert r.status == 400
    assert set(r.json["error"]["fields"]) == {"project_id", "name", "start_date", "end_date", "prerequisite_ids"}


def test_create_keeps_dates_within_the_project(admin_token):
    r = new_milestone(admin_token, start_date="2026-09-30", end_date="2027-01-01")
    assert r.status == 400
    assert set(r.json["error"]["fields"]) == {"start_date", "end_date"}
    r = new_milestone(admin_token, start_date="2026-10-10", end_date="2026-10-09")
    assert r.json["error"]["fields"] == {"end_date": "Must be on or after the start date."}


def test_create_rejects_prerequisites_from_elsewhere(admin_token):
    _, elsewhere, _ = add_other_project()
    r = new_milestone(admin_token, prerequisite_ids=[DESIGN, elsewhere, 999])
    assert r.status == 400
    assert str(elsewhere) in r.json["error"]["fields"]["prerequisite_ids"]


def test_create_rejects_completed_prerequisites(admin_token):
    complete_design()
    r = new_milestone(admin_token, prerequisite_ids=[DESIGN])
    assert r.status == 409
    assert "Design" in r.json["error"]["message"]


def test_create_permissions(employee_token, other_manager_token, admin_token):
    assert new_milestone(employee_token).status == 403
    assert new_milestone(other_manager_token).status == 404
    close_project()
    assert new_milestone(admin_token).status == 403
    assert not activity("milestone.create")


# ---------- PUT /{id} ----------

def test_update_milestone(manager_token):
    r = call("milestones", "PUT", f"/{FRONTEND}", {"name": "Web UI", "end_date": "2026-12-20"}, manager_token)
    assert r.status == 200
    assert r.json["name"] == "Web UI" and r.json["end_date"] == "2026-12-20"
    assert r.json["start_date"] == "2026-11-01"
    [entry] = activity("milestone.update")
    assert entry["changes"] == {"name": {"from": "Frontend", "to": "Web UI"},
                                "end_date": {"from": "2026-12-15", "to": "2026-12-20"}}


def test_update_keeps_dates_within_the_project(admin_token):
    r = call("milestones", "PUT", f"/{LAUNCH}", {"end_date": "2027-01-15"}, admin_token)
    assert r.status == 400 and set(r.json["error"]["fields"]) == {"end_date"}
    r = call("milestones", "PUT", f"/{LAUNCH}", {"start_date": "2027-01-01"}, admin_token)
    assert r.status == 400 and set(r.json["error"]["fields"]) == {"start_date", "end_date"}
    r = call("milestones", "PUT", f"/{LAUNCH}", {"name": ""}, admin_token)
    assert r.status == 400 and set(r.json["error"]["fields"]) == {"name"}


def test_update_completed_milestone_is_409(admin_token):
    complete_design()
    assert call("milestones", "PUT", f"/{DESIGN}", {"name": "X"}, admin_token).status == 409


def test_update_permissions(employee_token, other_manager_token):
    assert call("milestones", "PUT", f"/{LAUNCH}", {"name": "X"}, employee_token).status == 403
    assert call("milestones", "PUT", f"/{LAUNCH}", {"name": "X"}, other_manager_token).status == 404


# ---------- DELETE /{id} ----------

def test_delete_milestone_without_history(manager_token):
    docs = new_milestone(manager_token, prerequisite_ids=[DESIGN]).json["id"]
    sql("INSERT INTO milestone_dependencies VALUES (4, %s, 1)", (docs,))
    r = call("milestones", "DELETE", f"/{docs}", token=manager_token)
    assert r.status == 204
    assert not sql("SELECT 1 FROM milestones WHERE id = %s", (docs,))
    assert not sql("SELECT 1 FROM milestone_dependencies WHERE %s IN (milestone_id, prerequisite_id)", (docs,))
    [entry] = activity("milestone.delete")
    assert entry["changes"] == {"prerequisite_ids": {"from": [DESIGN], "to": []}}


def test_delete_milestone_with_history_is_409(admin_token):
    r = call("milestones", "DELETE", f"/{DESIGN}", token=admin_token)
    assert r.status == 409
    message = r.json["error"]["message"]
    assert "work logs" in message and "assigned" in message and "review" in message


def test_delete_milestone_a_past_member_was_on_is_409(admin_token):
    sql("UPDATE project_members SET milestone_id = 3, removed_at = now()")
    r = call("milestones", "DELETE", f"/{FRONTEND}", token=admin_token)
    assert r.status == 409 and "assigned" in r.json["error"]["message"]


def test_delete_completed_milestone_is_409(admin_token):
    sql("UPDATE milestones SET completed_at = now() WHERE id = 4")
    r = call("milestones", "DELETE", f"/{LAUNCH}", token=admin_token)
    assert r.status == 409 and "completed" in r.json["error"]["message"]


def test_delete_permissions(employee_token, other_manager_token):
    assert call("milestones", "DELETE", f"/{LAUNCH}", token=employee_token).status == 403
    assert call("milestones", "DELETE", f"/{LAUNCH}", token=other_manager_token).status == 404


# ---------- PUT /{id}/dependencies ----------

def test_replace_dependencies(manager_token):
    r = call("milestones", "PUT", f"/{LAUNCH}/dependencies", {"prerequisite_ids": [BACKEND]}, manager_token)
    assert r.status == 200
    assert r.json["prerequisite_ids"] == [BACKEND]
    [entry] = activity("milestone.dependencies_update")
    assert entry["changes"] == {"prerequisite_ids": {"from": [BACKEND, FRONTEND], "to": [BACKEND]}}


def test_unchanged_dependencies_are_not_logged(manager_token):
    r = call("milestones", "PUT", f"/{LAUNCH}/dependencies", {"prerequisite_ids": [FRONTEND, BACKEND]}, manager_token)
    assert r.status == 200 and not activity("milestone.dependencies_update")


def test_dependency_cycle_is_409_naming_the_cause(admin_token):
    r = call("milestones", "PUT", f"/{DESIGN}/dependencies", {"prerequisite_ids": [FRONTEND]}, admin_token)
    assert r.status == 409
    assert r.json["error"]["code"] == "dependency_cycle"
    assert "Frontend" in r.json["error"]["message"]
    # Indirect: Launch -> Backend API -> Design.
    r = call("milestones", "PUT", f"/{DESIGN}/dependencies", {"prerequisite_ids": [LAUNCH]}, admin_token)
    assert r.status == 409 and "Launch" in r.json["error"]["message"]


def test_dependencies_validation(admin_token):
    _, elsewhere, _ = add_other_project()
    path = f"/{LAUNCH}/dependencies"
    assert call("milestones", "PUT", path, {}, admin_token).status == 400
    assert call("milestones", "PUT", path, {"prerequisite_ids": [True]}, admin_token).status == 400
    r = call("milestones", "PUT", path, {"prerequisite_ids": [LAUNCH]}, admin_token)
    assert r.status == 400 and "own prerequisite" in r.json["error"]["fields"]["prerequisite_ids"]
    assert call("milestones", "PUT", path, {"prerequisite_ids": [elsewhere]}, admin_token).status == 400


def test_dependencies_of_completed_milestones(admin_token):
    complete_design()
    # A completed milestone's own prerequisites are frozen.
    assert call("milestones", "PUT", f"/{DESIGN}/dependencies", {"prerequisite_ids": []}, admin_token).status == 409
    # A completed prerequisite can't be removed or added...
    r = call("milestones", "PUT", f"/{BACKEND}/dependencies", {"prerequisite_ids": []}, admin_token)
    assert r.status == 409 and "Design" in r.json["error"]["message"]
    r = call("milestones", "PUT", f"/{LAUNCH}/dependencies", {"prerequisite_ids": [DESIGN, BACKEND, FRONTEND]},
             admin_token)
    assert r.status == 409
    # ...but keeping it while changing others is fine.
    r = call("milestones", "PUT", f"/{BACKEND}/dependencies", {"prerequisite_ids": [DESIGN, FRONTEND]}, admin_token)
    assert r.status == 200 and r.json["prerequisite_ids"] == [DESIGN, FRONTEND]


def test_dependencies_permissions(employee_token, other_manager_token):
    body = {"prerequisite_ids": []}
    assert call("milestones", "PUT", f"/{LAUNCH}/dependencies", body, employee_token).status == 403
    assert call("milestones", "PUT", f"/{LAUNCH}/dependencies", body, other_manager_token).status == 404


# ---------- POST /{id}/complete ----------

def test_complete_moves_members_and_accepts_waiting_review(manager_token):
    r = call("milestones", "POST", f"/{DESIGN}/complete", {"destination_milestone_id": BACKEND}, manager_token)
    assert r.status == 200
    assert r.json["status"] == "completed" and r.json["completed_at"]
    assert r.json["members"] == []
    assert r.json["reviews"][0]["decision"] == "accepted"
    assert r.json["reviews"][0]["decided_by"] == {"id": 2, "name": "Morgan Manager"}
    assert sql("SELECT milestone_id FROM project_members")[0]["milestone_id"] == BACKEND
    assert notifications(3) == [{"title": "Moved to Backend API", "detail": "Customer Portal · Design completed",
                                 "milestone_id": BACKEND}]
    [entry] = activity("milestone.complete")
    assert entry["entity_id"] == DESIGN and "moved to Backend API" in entry["summary"]


def test_complete_without_destination_clears_assignments(admin_token):
    r = call("milestones", "POST", f"/{DESIGN}/complete", token=admin_token)
    assert r.status == 200
    assert sql("SELECT milestone_id FROM project_members")[0]["milestone_id"] is None
    assert notifications(3)[0]["title"] == "Milestone completed: assignment needed"


def test_complete_needs_prerequisites_completed(admin_token):
    r = call("milestones", "POST", f"/{LAUNCH}/complete", token=admin_token)
    assert r.status == 409
    assert "Backend API, Frontend" in r.json["error"]["message"]


def test_complete_twice_is_409(admin_token):
    assert call("milestones", "POST", f"/{DESIGN}/complete", token=admin_token).status == 200
    assert call("milestones", "POST", f"/{DESIGN}/complete", token=admin_token).status == 409


def test_complete_destination_must_be_valid(admin_token):
    _, elsewhere, _ = add_other_project()
    sql("UPDATE milestones SET completed_at = now() WHERE id = 3")
    for destination in (DESIGN, FRONTEND, elsewhere, 999):
        r = call("milestones", "POST", f"/{DESIGN}/complete", {"destination_milestone_id": destination}, admin_token)
        assert r.status == 400, destination
        assert "destination_milestone_id" in r.json["error"]["fields"]
    assert sql("SELECT completed_at FROM milestones WHERE id = 1")[0]["completed_at"] is None


def test_complete_permissions(employee_token, other_manager_token, admin_token):
    assert call("milestones", "POST", f"/{DESIGN}/complete", token=employee_token).status == 403
    assert call("milestones", "POST", f"/{DESIGN}/complete", token=other_manager_token).status == 404
    close_project()
    assert call("milestones", "POST", f"/{DESIGN}/complete", token=admin_token).status == 403


# ---------- POST /{id}/reviews ----------

def test_request_review(employee_token):
    keep_design_open()
    r = call("milestones", "POST", f"/{DESIGN}/reviews", token=employee_token)
    assert r.status == 201
    assert r.json["milestone_id"] == DESIGN and r.json["decision"] is None
    assert r.json["requested_by"] == {"id": 3, "name": "Emery Employee"}
    assert notifications(2)[-1] == {"title": "Milestone review requested", "detail": "Emery Employee · Design",
                                    "milestone_id": DESIGN}
    assert activity("review.request")[-1]["entity_id"] == r.json["id"]


def test_request_review_logs_todays_work(employee_token):
    keep_design_open()
    r = call("milestones", "POST", f"/{DESIGN}/reviews", token=employee_token)
    assert r.status == 201 and r.json["work_logged"] is True
    [log] = sql("SELECT project_id, milestone_id, hours, hourly_rate, entered_by FROM work_logs "
                "WHERE employee_id = 3 AND work_date = %s", (WEDNESDAY,))
    assert log == {"project_id": 1, "milestone_id": DESIGN, "hours": 8, "hourly_rate": 40, "entered_by": 3}


def test_request_review_after_logging_today_skips_the_log(employee_token):
    keep_design_open()
    sql("INSERT INTO work_logs (employee_id, project_id, milestone_id, work_date, hourly_rate, entered_by) "
        "VALUES (3, 1, 1, %s, 40, 3)", (WEDNESDAY,))
    r = call("milestones", "POST", f"/{DESIGN}/reviews", token=employee_token)
    assert r.status == 201 and r.json["work_logged"] is False
    assert len(sql("SELECT id FROM work_logs WHERE employee_id = 3 AND work_date = %s", (WEDNESDAY,))) == 1


def test_request_review_is_weekdays_only(today, employee_token):
    keep_design_open()
    today(SATURDAY)
    r = call("milestones", "POST", f"/{DESIGN}/reviews", token=employee_token)
    assert r.status == 409 and r.json["error"]["code"] == "not_a_weekday"
    assert sql("SELECT count(*) AS n FROM milestone_reviews WHERE decision IS NULL")[0]["n"] == 0


def test_request_review_needs_an_available_milestone(employee_token):
    r = call("milestones", "POST", f"/{DESIGN}/reviews", token=employee_token)
    assert r.status == 409 and r.json["error"]["code"] == "milestone_awaiting_review"
    sql("UPDATE project_members SET milestone_id = 2")
    r = call("milestones", "POST", f"/{BACKEND}/reviews", token=employee_token)
    assert r.status == 409 and r.json["error"]["code"] == "milestone_blocked"
    sql("UPDATE project_members SET milestone_id = 1")
    complete_design()
    r = call("milestones", "POST", f"/{DESIGN}/reviews", token=employee_token)
    assert r.status == 409 and r.json["error"]["code"] == "milestone_completed"


def test_request_review_only_for_your_own_milestone(employee_token):
    keep_design_open()
    sql("UPDATE milestones SET completed_at = now() WHERE id = 1")
    assert call("milestones", "POST", f"/{BACKEND}/reviews", token=employee_token).status == 403


def test_request_review_permissions(admin_token, manager_token):
    keep_design_open()
    assert call("milestones", "POST", f"/{DESIGN}/reviews", token=admin_token).status == 403
    assert call("milestones", "POST", f"/{DESIGN}/reviews", token=manager_token).status == 403
    stranger = sign_in(add_user("Sam", "Stranger", "employee", manager_id=2))
    assert call("milestones", "POST", f"/{DESIGN}/reviews", token=stranger).status == 404


# ---------- POST /{id}/reviews/{review_id}/decision ----------

def decide(token, body, milestone_id=DESIGN, review_id=1):
    return call("milestones", "POST", f"/{milestone_id}/reviews/{review_id}/decision", body, token)


def test_accept_review_completes_the_milestone(manager_token):
    r = decide(manager_token, {"decision": "accepted", "feedback": "Great work", "destination_milestone_id": FRONTEND})
    assert r.status == 200
    assert r.json["decision"] == "accepted" and r.json["feedback"] == "Great work"
    assert r.json["decided_by"] == {"id": 2, "name": "Morgan Manager"} and r.json["decided_at"]
    assert sql("SELECT completed_at FROM milestones WHERE id = 1")[0]["completed_at"] is not None
    assert sql("SELECT milestone_id FROM project_members")[0]["milestone_id"] == FRONTEND
    titles = [(n["title"], n["detail"]) for n in notifications(3)]
    assert titles == [("Moved to Frontend", "Customer Portal · Design completed"), ("Review accepted", "Great work")]
    assert len(activity("review.accept")) == 1 and len(activity("milestone.complete")) == 1


def test_keep_review_open(admin_token):
    r = decide(admin_token, {"decision": "kept_open", "feedback": "  Needs tests  "})
    assert r.status == 200
    assert r.json["decision"] == "kept_open" and r.json["feedback"] == "Needs tests"
    assert r.json["decided_by"]["id"] == 1
    assert sql("SELECT completed_at FROM milestones WHERE id = 1")[0]["completed_at"] is None
    assert notifications(3) == [{"title": "Milestone kept open", "detail": "Needs tests", "milestone_id": DESIGN}]
    [entry] = activity("review.keep_open")
    assert entry["changes"] == {"decision": {"from": None, "to": "kept_open"}}
    status = call("milestones", "GET", f"/{DESIGN}", token=admin_token).json["status"]
    assert status == "available"


def test_decision_on_decided_or_other_review(admin_token):
    assert decide(admin_token, {"decision": "kept_open"}).status == 200
    r = decide(admin_token, {"decision": "accepted"})
    assert r.status == 409 and r.json["error"]["code"] == "review_decided"
    assert decide(admin_token, {"decision": "accepted"}, milestone_id=BACKEND).status == 404


def test_accepting_fails_cleanly_when_prerequisites_are_incomplete(admin_token):
    sql("INSERT INTO milestone_reviews (milestone_id, requested_by) VALUES (2, 3)")
    r = decide(admin_token, {"decision": "accepted"}, milestone_id=BACKEND, review_id=2)
    assert r.status == 409 and r.json["error"]["code"] == "prerequisites_incomplete"
    assert sql("SELECT decision FROM milestone_reviews WHERE id = 2")[0]["decision"] is None
    assert not notifications(3)


def test_decision_validation(admin_token):
    r = decide(admin_token, {"decision": "maybe"})
    assert r.status == 400 and "decision" in r.json["error"]["fields"]
    r = decide(admin_token, {"decision": "kept_open", "destination_milestone_id": BACKEND})
    assert r.status == 400 and "destination_milestone_id" in r.json["error"]["fields"]


def test_decision_permissions(employee_token, other_manager_token):
    assert decide(employee_token, {"decision": "accepted"}).status == 403
    assert decide(other_manager_token, {"decision": "accepted"}).status == 404
