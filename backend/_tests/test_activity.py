from conftest import call, sql

# The seed has five entries, oldest first: user.create (Morgan), user.create (Emery),
# project.create, member.assign (by Morgan) and review.request (by Emery).


def actions(response):
    return [entry["action"] for entry in response.json["items"]]


def test_only_admins_see_activity(manager_token, employee_token):
    assert call("activity", "GET", "/").status == 401
    assert call("activity", "GET", "/", token=manager_token).status == 403
    assert call("activity", "GET", "/", token=employee_token).status == 403
    assert call("activity", "GET", "/1", token=manager_token).status == 403


def test_list_newest_first_with_paging_info(admin_token):
    r = call("activity", "GET", "/", token=admin_token)
    assert r.status == 200
    assert actions(r) == ["review.request", "member.assign", "project.create", "user.create", "user.create"]
    assert (r.json["total"], r.json["limit"], r.json["offset"]) == (5, 50, 0)
    newest = r.json["items"][0]
    assert newest["actor"] == {"id": 3, "name": "Emery Employee"}
    assert newest["actor_role"] == "employee"
    assert newest["entity_type"] == "milestone_review"
    assert newest["project"] == {"id": 1, "name": "Customer Portal"}
    assert newest["summary"] == "Requested review of Design."
    assert newest["changes"] is None and newest["created_at"]


def test_filters(admin_token):
    def listed(**query):
        r = call("activity", "GET", "/", token=admin_token, query=query)
        assert r.status == 200, r
        return actions(r)

    assert listed(role="manager") == ["member.assign"]
    assert listed(actor_id="3") == ["review.request"]
    assert listed(action="user.") == ["user.create", "user.create"]
    assert listed(action="project.") == ["project.create"]
    assert listed(action="%") == []  # a plain prefix, not a LIKE pattern
    assert listed(project_id="1") == ["review.request", "member.assign", "project.create"]
    assert listed(entity_type="user", entity_id="2") == ["user.create"]


def test_paging(admin_token):
    r = call("activity", "GET", "/", token=admin_token, query={"limit": "2", "offset": "1"})
    assert actions(r) == ["member.assign", "project.create"]
    assert (r.json["total"], r.json["limit"], r.json["offset"]) == (5, 2, 1)
    r = call("activity", "GET", "/", token=admin_token, query={"role": "manager", "limit": "200", "offset": "5"})
    assert r.json["items"] == [] and r.json["total"] == 1


def test_rejects_bad_filters(admin_token):
    r = call("activity", "GET", "/", token=admin_token,
             query={"actor_id": "abc", "role": "boss", "limit": "201", "offset": "-1", "entity_id": "0"})
    assert r.status == 400
    assert set(r.json["error"]["fields"]) == {"actor_id", "role", "limit", "offset", "entity_id"}
    assert call("activity", "GET", "/", token=admin_token, query={"limit": "0"}).status == 400


def test_get_one_entry(admin_token):
    sql("""INSERT INTO activity_log (actor_id, actor_role, action, entity_type, entity_id, project_id, summary, changes)
           VALUES (1, 'admin', 'project.update', 'project', 1, 1, 'Changed budget.',
                   '{"budget": {"from": 50000, "to": 60000}}')""")
    r = call("activity", "GET", "/6", token=admin_token)
    assert r.status == 200
    assert r.json["changes"] == {"budget": {"from": 50000, "to": 60000}}
    assert r.json["actor"] == {"id": 1, "name": "Alex Admin"}
    first = call("activity", "GET", "/1", token=admin_token).json
    assert first["action"] == "user.create" and first["project"] is None
    assert call("activity", "GET", "/999", token=admin_token).status == 404


def test_read_only(admin_token):
    assert call("activity", "POST", "/", {}, token=admin_token).status == 405
    assert call("activity", "PUT", "/1", {}, token=admin_token).status == 405
    assert call("activity", "DELETE", "/1", token=admin_token).status == 405
