"""Database tasks (bin/cloud-db.sh): run by invoking a Lambda directly with {"db_task": ...}."""

from conftest import call, load_service, sql


def run_task(task):
    return load_service("auth").handler({"db_task": task})


def counts():
    return sql("SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM projects) AS projects")[0]


def test_reset_empty_leaves_tables_without_data():
    assert run_task("reset_empty") == {"ok": True, "task": "reset_empty", "users": 0, "projects": 0}
    assert call("auth", "GET", "/setup").json == {"signup_open": True}


def test_seed_adds_sample_data_and_is_safe_to_repeat():
    run_task("reset_empty")
    assert run_task("seed") == {"ok": True, "task": "seed", "users": 12, "projects": 7}
    assert run_task("seed") == {"ok": True, "task": "seed", "users": 12, "projects": 7}


def test_reset_variants():
    assert run_task("reset_seed_only")["users"] == 3
    assert run_task("reset") == {"ok": True, "task": "reset", "users": 12, "projects": 7}


def test_unknown_task_changes_nothing():
    result = run_task("drop_everything")
    assert result["ok"] is False and "Unknown task" in result["error"]
    assert counts() == {"users": 3, "projects": 1}


def test_a_web_request_can_never_run_a_task():
    # Function URL events always carry requestContext; extra keys there are just ignored.
    event = {"rawPath": "/setup", "requestContext": {"http": {"method": "GET"}}, "db_task": "reset_empty",
             "queryStringParameters": {"db_task": "reset_empty"}, "body": '{"db_task": "reset_empty"}'}
    response = load_service("auth").handler(event)
    assert response["statusCode"] == 200
    assert counts() == {"users": 3, "projects": 1}


def test_reset_forgets_the_cached_signing_key():
    shared_auth = load_service("auth").auth
    shared_auth._stored_secret = "old-key"
    run_task("reset_empty")
    assert shared_auth._stored_secret is None
