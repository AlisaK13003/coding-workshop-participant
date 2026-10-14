from conftest import call, sql

# The seed has one notification (id 1): Morgan (manager, id 2) is told Emery requested a review of Design.


def add_notification(recipient_id, title):
    sql("INSERT INTO notifications (recipient_id, title, detail) VALUES (%s, %s, 'detail')", (recipient_id, title))


def test_requires_sign_in():
    assert call("notifications", "GET", "/").status == 401
    assert call("notifications", "POST", "/read-all").status == 401


def test_lists_own_notifications_newest_first(manager_token, employee_token):
    add_notification(2, "Later")
    r = call("notifications", "GET", "/", token=manager_token)
    assert r.status == 200
    assert [n["title"] for n in r.json["items"]] == ["Later", "Milestone review requested"]
    assert r.json["unread_count"] == 2
    seeded = r.json["items"][1]
    assert seeded["detail"] == "Emery Employee · Design"
    assert (seeded["project_id"], seeded["milestone_id"]) == (1, 1)
    assert seeded["read"] is False and seeded["read_at"] is None and seeded["created_at"]
    # Emery has none of their own and can't see Morgan's.
    assert call("notifications", "GET", "/", token=employee_token).json == {"items": [], "unread_count": 0}


def test_unread_filter(manager_token):
    add_notification(2, "Later")
    sql("UPDATE notifications SET read_at = now() WHERE id = 1")
    r = call("notifications", "GET", "/", token=manager_token, query={"unread": "true"})
    assert [n["title"] for n in r.json["items"]] == ["Later"]
    assert r.json["unread_count"] == 1
    assert len(call("notifications", "GET", "/", token=manager_token).json["items"]) == 2


def test_mark_one_read_is_idempotent(manager_token):
    first = call("notifications", "POST", "/1/read", token=manager_token)
    assert first.status == 200
    assert first.json["read"] is True and first.json["read_at"]
    again = call("notifications", "POST", "/1/read", token=manager_token)
    assert again.status == 200 and again.json["read_at"] == first.json["read_at"]
    assert call("notifications", "GET", "/", token=manager_token).json["unread_count"] == 0


def test_cannot_mark_someone_elses_notification(employee_token, admin_token):
    assert call("notifications", "POST", "/1/read", token=employee_token).status == 404
    assert call("notifications", "POST", "/1/read", token=admin_token).status == 404
    assert call("notifications", "POST", "/999/read", token=employee_token).status == 404
    assert sql("SELECT read_at FROM notifications WHERE id = 1")[0]["read_at"] is None


def test_mark_all_read_only_touches_own(manager_token, employee_token):
    add_notification(2, "Second")
    add_notification(3, "For Emery")
    r = call("notifications", "POST", "/read-all", token=manager_token)
    assert r.status == 200 and r.json == {"updated": 2}
    assert call("notifications", "POST", "/read-all", token=manager_token).json == {"updated": 0}
    assert call("notifications", "GET", "/", token=employee_token).json["unread_count"] == 1


def test_no_create_or_delete_routes(admin_token):
    assert call("notifications", "POST", "/", {"title": "x"}, token=admin_token).status == 405
    assert call("notifications", "DELETE", "/1/read", token=admin_token).status == 405
