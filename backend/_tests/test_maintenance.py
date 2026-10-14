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
    assert run_task("seed") == {"ok": True, "task": "seed", "users": 12, "projects": 8}
    assert run_task("seed") == {"ok": True, "task": "seed", "users": 12, "projects": 8}


def test_reset_variants():
    assert run_task("reset_seed_only")["users"] == 3
    assert run_task("reset") == {"ok": True, "task": "reset", "users": 12, "projects": 8}


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


def test_reset_keeps_the_signing_key():
    # Running Lambdas cache the key, so a reset must not replace it.
    sql("INSERT INTO app_settings (name, value) VALUES ('jwt_secret', 'kept-key')")
    run_task("reset")
    run_task("reset_empty")
    assert sql("SELECT value FROM app_settings WHERE name = 'jwt_secret'") == [{"value": "kept-key"}]


def test_reset_works_without_a_stored_key():
    sql("DELETE FROM app_settings")
    assert run_task("reset")["ok"] is True
    assert sql("SELECT count(*) AS n FROM app_settings")[0]["n"] == 0
