from datetime import date

import pytest

from conftest import call, load_service, sign_in, sql

# The seed's sample data is in October 2026: Emery (id 3, $83,200 = $40.00/hour) is on
# Customer Portal (id 1), milestone Design (id 1), with logs on Thu 1 Oct (id 1) and Fri 2 Oct (id 2).
MONDAY = date(2026, 10, 5)
TUESDAY = date(2026, 10, 6)
SATURDAY = date(2026, 10, 10)


@pytest.fixture(autouse=True)
def today(monkeypatch):
    """Sets the work-logs service's "today". Defaults to Monday 5 October 2026."""
    clock = load_service("work-logs").clock

    def set_today(day):
        monkeypatch.setattr(clock, "today", lambda: day)

    set_today(MONDAY)
    return set_today


@pytest.fixture
def design_available():
    """The seed has a review of Design waiting; keeping it open makes Design available again."""
    sql("UPDATE milestone_reviews SET decision = 'kept_open', decided_by = 2, decided_at = now()")


@pytest.fixture
def other_team():
    """A second manager (id 4, omanager4) and their employee (id 5, oemployee5, $104,000 = $50.00/hour),
    who is also on Customer Portal with a log on Monday."""
    sql("""INSERT INTO users (first_name, last_name, email, job_title, role, password_hash)
           SELECT 'Olive', 'Manager', 'olive@example.com', 'Manager', 'manager', password_hash FROM users WHERE id = 2""")
    sql("""INSERT INTO users (first_name, last_name, email, job_title, role, manager_id, annual_salary, password_hash)
           SELECT 'Owen', 'Employee', 'owen@example.com', 'Engineer', 'employee', 4, 104000, password_hash
           FROM users WHERE id = 2""")
    sql("INSERT INTO project_members (project_id, employee_id, milestone_id) VALUES (1, 5, 1)")
    sql("""INSERT INTO work_logs (employee_id, project_id, milestone_id, work_date, hourly_rate, entered_by)
           VALUES (5, 1, 1, '2026-10-05', 50, 5)""")


@pytest.fixture
def second_project():
    """Data Platform (id 2), managed by Morgan, with one milestone, Ingest (id 5)."""
    sql("""INSERT INTO projects (name, manager_id, start_date, end_date, budget)
           VALUES ('Data Platform', 2, '2026-10-01', '2026-12-31', 1000)""")
    sql("INSERT INTO milestones (project_id, name, start_date, end_date) VALUES (2, 'Ingest', '2026-10-01', '2026-10-31')")


def activity(action):
    return sql("SELECT * FROM activity_log WHERE action = %s ORDER BY id", (action,))


# --- GET / and GET /{id} -------------------------------------------------------------------

def test_list_requires_sign_in():
    assert call("work-logs", "GET", "/").status == 401


def test_admin_sees_all_logs_newest_first_with_pay(admin_token):
    r = call("work-logs", "GET", "/", token=admin_token)
    assert r.status == 200
    assert [log["work_date"] for log in r.json] == ["2026-10-02", "2026-10-01"]
    log = r.json[0]
    assert log["employee"] == {"id": 3, "name": "Emery Employee"}
    assert log["project"] == {"id": 1, "name": "Customer Portal"}
    assert log["milestone"] == {"id": 1, "name": "Design"}
    assert log["entered_by"] == {"id": 3, "name": "Emery Employee"}
    assert log["hours"] == 8
    assert log["historical"] is False
    assert log["hourly_rate"] == 40.0 and log["cost"] == 320.0
    assert log["created_at"]


def test_employee_sees_own_logs_without_pay(employee_token, other_team):
    r = call("work-logs", "GET", "/", token=employee_token)
    assert r.status == 200
    assert [log["id"] for log in r.json] == [2, 1]
    assert all("hourly_rate" not in log and "cost" not in log for log in r.json)


def test_employee_no_longer_sees_logs_once_removed_from_project(employee_token):
    sql("UPDATE project_members SET removed_at = now() WHERE employee_id = 3")
    assert call("work-logs", "GET", "/", token=employee_token).json == []
    assert call("work-logs", "GET", "/1", token=employee_token).status == 404


def test_manager_sees_every_log_on_own_projects_but_only_own_employees_pay(manager_token, other_team):
    r = call("work-logs", "GET", "/", token=manager_token)
    assert [log["employee"]["id"] for log in r.json] == [5, 3, 3]
    # Owen reports to Olive, so Morgan sees his day on Customer Portal but not his pay.
    assert "cost" not in r.json[0] and "hourly_rate" not in r.json[0]
    assert r.json[1]["cost"] == 320.0
    # Olive manages Owen, but Customer Portal isn't her project.
    assert call("work-logs", "GET", "/", token=sign_in("omanager4")).json == []


def test_managers_and_employees_lose_sight_of_closed_projects(manager_token, employee_token):
    sql("UPDATE projects SET status = 'completed' WHERE id = 1")
    assert call("work-logs", "GET", "/", token=manager_token).json == []
    assert call("work-logs", "GET", "/", token=employee_token).json == []


def test_list_filters(admin_token, other_team):
    def ids(**query):
        r = call("work-logs", "GET", "/", token=admin_token, query={k.rstrip("_"): v for k, v in query.items()})
        assert r.status == 200, r
        return [log["id"] for log in r.json]

    assert ids() == [3, 2, 1]
    assert ids(employee_id="5") == [3]
    assert ids(project_id="1", milestone_id="1") == [3, 2, 1]
    assert ids(milestone_id="2") == []
    assert ids(from_="2026-10-02") == [3, 2]
    assert ids(from_="2026-10-01", to="2026-10-01") == [1]


def test_list_rejects_bad_filters(admin_token):
    r = call("work-logs", "GET", "/", token=admin_token,
             query={"project_id": "abc", "employee_id": "0", "milestone_id": "-1", "from": "2026-13-01"})
    assert r.status == 400
    assert set(r.json["error"]["fields"]) == {"project_id", "employee_id", "milestone_id", "from"}
    r = call("work-logs", "GET", "/", token=admin_token, query={"from": "2026-10-05", "to": "2026-10-01"})
    assert r.status == 400 and "to" in r.json["error"]["fields"]


def test_get_one_log(admin_token, employee_token, manager_token, other_team):
    r = call("work-logs", "GET", "/1", token=admin_token)
    assert r.status == 200 and r.json["work_date"] == "2026-10-01"
    assert "cost" not in call("work-logs", "GET", "/1", token=employee_token).json
    assert call("work-logs", "GET", "/1", token=manager_token).json["cost"] == 320.0
    # Owen's log: not Emery's; Morgan sees it (his project) without pay (not his employee).
    assert call("work-logs", "GET", "/3", token=employee_token).status == 404
    owen = call("work-logs", "GET", "/3", token=manager_token)
    assert owen.status == 200 and "cost" not in owen.json
    assert call("work-logs", "GET", "/999", token=admin_token).status == 404


def test_delete_is_not_allowed(admin_token):
    assert call("work-logs", "DELETE", "/1", token=admin_token).status == 405


# --- POST / by an employee -----------------------------------------------------------------

def test_employee_logs_today_on_current_milestone(employee_token, design_available):
    r = call("work-logs", "POST", "/", {"project_id": 1}, token=employee_token)
    assert r.status == 201, r
    assert r.json["work_date"] == "2026-10-05"
    assert r.json["milestone"] == {"id": 1, "name": "Design"}
    assert r.json["entered_by"]["id"] == 3 and r.json["historical"] is False
    assert "hourly_rate" not in r.json
    stored = sql("SELECT hours, hourly_rate, entered_by FROM work_logs WHERE id = %s", (r.json["id"],))[0]
    assert stored == {"hours": 8, "hourly_rate": 40, "entered_by": 3}
    # An employee's own daily log isn't written to the activity log.
    assert sql("SELECT count(*) AS n FROM activity_log WHERE entity_type = 'work_log'")[0]["n"] == 0


def test_employee_can_only_log_once_a_day(employee_token, design_available):
    assert call("work-logs", "POST", "/", {"project_id": 1}, token=employee_token).status == 201
    r = call("work-logs", "POST", "/", {"project_id": 1}, token=employee_token)
    assert r.status == 409
    assert r.json["error"]["message"] == "You've already logged work today."


def test_employee_can_only_log_on_weekdays(employee_token, design_available, today):
    today(SATURDAY)
    r = call("work-logs", "POST", "/", {"project_id": 1}, token=employee_token)
    assert r.status == 409
    assert r.json["error"]["message"] == "You can only log work on weekdays."


def test_employee_milestone_must_be_their_current_one(employee_token, design_available):
    r = call("work-logs", "POST", "/", {"project_id": 1, "milestone_id": 2}, token=employee_token)
    assert r.status == 400 and "milestone_id" in r.json["error"]["fields"]
    r = call("work-logs", "POST", "/", {"project_id": 1, "milestone_id": 1}, token=employee_token)
    assert r.status == 201


def test_employee_needs_an_available_milestone(employee_token):
    # Seed state: Design is awaiting review.
    r = call("work-logs", "POST", "/", {"project_id": 1}, token=employee_token)
    assert r.status == 409 and "awaiting review" in r.json["error"]["message"]

    sql("UPDATE project_members SET milestone_id = 2 WHERE employee_id = 3")  # Backend API waits for Design
    r = call("work-logs", "POST", "/", {"project_id": 1}, token=employee_token)
    assert r.status == 409 and "blocked" in r.json["error"]["message"]

    sql("UPDATE project_members SET milestone_id = NULL WHERE employee_id = 3")
    r = call("work-logs", "POST", "/", {"project_id": 1}, token=employee_token)
    assert r.status == 409 and r.json["error"]["code"] == "no_milestone"


def test_employee_must_be_a_current_member_of_an_open_project(employee_token, design_available, second_project):
    assert call("work-logs", "POST", "/", {"project_id": 2}, token=employee_token).status == 404
    assert call("work-logs", "POST", "/", {"project_id": 999}, token=employee_token).status == 404
    sql("UPDATE projects SET archived_at = now() WHERE id = 1")
    assert call("work-logs", "POST", "/", {"project_id": 1}, token=employee_token).status == 404


def test_employee_post_validates_body(employee_token):
    r = call("work-logs", "POST", "/", {"project_id": "one"}, token=employee_token)
    assert r.status == 400 and "project_id" in r.json["error"]["fields"]
    assert call("work-logs", "POST", "/", {}, token=employee_token).status == 400


def test_managers_cannot_log_work(manager_token):
    assert call("work-logs", "POST", "/", {"project_id": 1}, token=manager_token).status == 403


# --- POST / by an admin --------------------------------------------------------------------

def past_entry(**overrides):
    return {"employee_id": 3, "project_id": 1, "milestone_id": 1, "work_date": "2026-10-05", **overrides}


def test_admin_enters_a_past_day(admin_token, today):
    today(TUESDAY)
    r = call("work-logs", "POST", "/", past_entry(), token=admin_token)
    assert r.status == 201, r
    assert r.json["work_date"] == "2026-10-05"
    assert r.json["entered_by"] == {"id": 1, "name": "Alex Admin"}
    assert r.json["historical"] is True
    assert r.json["hourly_rate"] == 40.0 and r.json["cost"] == 320.0
    [entry] = activity("work_log.create")
    assert entry["entity_id"] == r.json["id"] and entry["project_id"] == 1
    assert entry["summary"] == "Logged 2026-10-05 for Emery Employee on Customer Portal · Design."


def test_admin_entry_may_cover_a_past_assignment_at_a_given_rate(admin_token):
    # Backend API is blocked and isn't Emery's current milestone; that's fine for past entries.
    r = call("work-logs", "POST", "/", past_entry(milestone_id=2, hourly_rate=45.5), token=admin_token)
    assert r.status == 201, r
    assert r.json["milestone"]["name"] == "Backend API"
    assert r.json["hourly_rate"] == 45.5 and r.json["cost"] == 364.0


def test_admin_entry_dates(admin_token):
    r = call("work-logs", "POST", "/", past_entry(work_date="2026-10-06"), token=admin_token)
    assert r.status == 400 and r.json["error"]["fields"]["work_date"] == "Can't be in the future."
    r = call("work-logs", "POST", "/", past_entry(work_date="2026-10-03"), token=admin_token)
    assert r.status == 400 and r.json["error"]["fields"]["work_date"] == "Must be a weekday."
    r = call("work-logs", "POST", "/", past_entry(work_date="2026-10-01"), token=admin_token)
    assert r.status == 409 and r.json["error"]["code"] == "already_logged"


def test_admin_entry_validates_people_and_places(admin_token, second_project):
    r = call("work-logs", "POST", "/", {}, token=admin_token)
    assert r.status == 400
    assert set(r.json["error"]["fields"]) == {"employee_id", "project_id", "milestone_id", "work_date"}
    r = call("work-logs", "POST", "/", past_entry(employee_id=2), token=admin_token)
    assert r.status == 400 and "employee_id" in r.json["error"]["fields"]
    r = call("work-logs", "POST", "/", past_entry(milestone_id=5), token=admin_token)
    assert r.status == 400 and "milestone_id" in r.json["error"]["fields"]
    r = call("work-logs", "POST", "/", past_entry(project_id=999), token=admin_token)
    assert r.status == 400 and "project_id" in r.json["error"]["fields"]
    sql("UPDATE users SET archived_at = now() WHERE id = 3")
    r = call("work-logs", "POST", "/", past_entry(), token=admin_token)
    assert r.status == 400 and "employee_id" in r.json["error"]["fields"]


# --- PUT /{id} -----------------------------------------------------------------------------

def test_admin_corrects_milestone(admin_token):
    r = call("work-logs", "PUT", "/1", {"milestone_id": 2}, token=admin_token)
    assert r.status == 200, r
    assert r.json["milestone"] == {"id": 2, "name": "Backend API"}
    [entry] = activity("work_log.correct")
    assert entry["summary"] == ("Corrected work log Emery Employee · 2026-10-01. "
                                "Changed milestone from Design to Backend API.")
    assert entry["changes"] == {"milestone_id": {"from": 1, "to": 2}}
    [note] = sql("SELECT * FROM notifications WHERE recipient_id = 3")
    assert note["title"] == "Work log corrected" and note["milestone_id"] == 2


def test_admin_corrects_project_milestone_and_date_together(admin_token, second_project):
    r = call("work-logs", "PUT", "/1", {"project_id": 2, "milestone_id": 5, "work_date": "2026-10-05"},
             token=admin_token)
    assert r.status == 200, r
    assert r.json["project"]["name"] == "Data Platform" and r.json["work_date"] == "2026-10-05"
    [entry] = activity("work_log.correct")
    assert entry["summary"].endswith("Changed project from Customer Portal to Data Platform, "
                                     "milestone from Design to Ingest and date from 2026-10-01 to 2026-10-05.")
    assert entry["changes"]["work_date"] == {"from": "2026-10-01", "to": "2026-10-05"}
    assert entry["project_id"] == 2


def test_correction_validation(admin_token, second_project):
    def put(body):
        return call("work-logs", "PUT", "/1", body, token=admin_token)

    assert put({"milestone_id": 5}).status == 400   # Ingest isn't in Customer Portal
    assert put({"project_id": 2}).status == 400     # Design isn't in Data Platform
    assert put({"project_id": 999, "milestone_id": 5}).status == 400
    assert put({"work_date": "2026-10-06"}).status == 400
    assert put({"work_date": "2026-10-04"}).status == 400
    assert put({"milestone_id": None}).status == 400
    r = put({"work_date": "2026-10-02"})
    assert r.status == 409 and r.json["error"]["code"] == "already_logged"
    assert activity("work_log.correct") == []


def test_correction_without_changes_logs_nothing(admin_token):
    r = call("work-logs", "PUT", "/1", {"milestone_id": 1}, token=admin_token)
    assert r.status == 200
    assert activity("work_log.correct") == []


def test_only_admins_correct(manager_token, employee_token, admin_token):
    assert call("work-logs", "PUT", "/1", {"milestone_id": 2}, token=manager_token).status == 403
    assert call("work-logs", "PUT", "/1", {"milestone_id": 2}, token=employee_token).status == 403
    assert call("work-logs", "PUT", "/999", {"milestone_id": 2}, token=admin_token).status == 404
