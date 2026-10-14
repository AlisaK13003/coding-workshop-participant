from conftest import SEED_PASSWORD, call, load_service, sign_in, sql


def test_login_returns_tokens_and_profile():
    r = call("auth", "POST", "/login", {"username": "EEmployee3", "password": SEED_PASSWORD})
    assert r.status == 200
    assert r.json["token_type"] == "Bearer"
    assert r.json["access_token"] and r.json["refresh_token"]
    assert r.json["user"]["username"] == "eemployee3"
    assert r.json["user"]["display_id"] == "USR-0003"
    assert "password_hash" not in r.json["user"]


def test_login_rejects_wrong_password_and_unknown_user_the_same_way():
    wrong_password = call("auth", "POST", "/login", {"username": "eemployee3", "password": "nope"})
    unknown_user = call("auth", "POST", "/login", {"username": "nobody", "password": "nope"})
    assert wrong_password.status == unknown_user.status == 401
    assert wrong_password.json == unknown_user.json


def test_login_requires_fields():
    r = call("auth", "POST", "/login", {})
    assert r.status == 400
    assert set(r.json["error"]["fields"]) == {"username", "password"}


def test_archived_user_cannot_log_in():
    sql("UPDATE users SET archived_at = now() WHERE username = 'eemployee3'")
    r = call("auth", "POST", "/login", {"username": "eemployee3", "password": SEED_PASSWORD})
    assert r.status == 401


def test_me_requires_a_token():
    assert call("auth", "GET", "/me").status == 401
    assert call("auth", "GET", "/me", token="not-a-jwt").json["error"]["code"] == "invalid_token"


def test_me_returns_current_user(manager_token):
    r = call("auth", "GET", "/me", token=manager_token)
    assert r.status == 200
    assert r.json["role"] == "manager"


def test_refresh_token_cannot_be_used_as_access_token():
    tokens = call("auth", "POST", "/login", {"username": "aadmin1", "password": SEED_PASSWORD}).json
    assert call("auth", "GET", "/me", token=tokens["refresh_token"]).status == 401
    refreshed = call("auth", "POST", "/refresh", {"refresh_token": tokens["refresh_token"]})
    assert refreshed.status == 200
    assert call("auth", "GET", "/me", token=refreshed.json["access_token"]).status == 200


def test_expired_access_token_is_rejected_with_clear_code():
    import jwt
    from datetime import datetime, timedelta, timezone

    expired = jwt.encode(
        {"sub": "1", "role": "admin", "type": "access", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        "local-development-only-not-a-secret", algorithm="HS256")
    r = call("auth", "GET", "/me", token=expired)
    assert r.status == 401
    assert r.json["error"]["code"] == "token_expired"


def test_token_stops_working_once_user_is_archived(employee_token):
    sql("UPDATE users SET archived_at = now() WHERE username = 'eemployee3'")
    assert call("auth", "GET", "/me", token=employee_token).status == 401


def test_signup_is_closed_once_users_exist():
    assert call("auth", "GET", "/setup").json == {"signup_open": False}
    r = call("auth", "POST", "/signup", {"first_name": "A", "last_name": "B", "email": "a@b.com",
                                         "job_title": "Owner", "password": "Longenough1."})
    assert r.status == 409


def test_signup_creates_first_admin_when_empty():
    sql("TRUNCATE users RESTART IDENTITY CASCADE")
    assert call("auth", "GET", "/setup").json == {"signup_open": True}
    r = call("auth", "POST", "/signup", {"first_name": "Riley", "last_name": "Owner", "email": "riley@example.com",
                                         "job_title": "Founder", "password": "Longenough1."})
    assert r.status == 201
    assert r.json["user"]["role"] == "admin"
    assert r.json["user"]["username"] == "rowner1"
    assert sign_in("rowner1", "Longenough1.")


def test_signup_validates_fields():
    sql("TRUNCATE users RESTART IDENTITY CASCADE")
    r = call("auth", "POST", "/signup", {"email": "not-an-email", "password": "short"})
    assert r.status == 400
    fields = r.json["error"]["fields"]
    assert {"first_name", "last_name", "job_title", "email", "password"} <= set(fields)


def test_change_password(employee_token):
    wrong = call("auth", "PUT", "/me/password", {"current_password": "nope", "new_password": "Newpassword1."},
                 token=employee_token)
    assert wrong.status == 400 and "current_password" in wrong.json["error"]["fields"]
    ok = call("auth", "PUT", "/me/password", {"current_password": SEED_PASSWORD, "new_password": "Newpassword1."},
              token=employee_token)
    assert ok.status == 204
    assert sign_in("eemployee3", "Newpassword1.")


def test_unknown_route_and_wrong_method():
    assert call("auth", "GET", "/nope").status == 404
    assert call("auth", "GET", "/login").status == 405


def test_full_aws_style_path_also_works():
    r = call("auth", "POST", "/api/auth/login", {"username": "aadmin1", "password": SEED_PASSWORD})
    assert r.status == 200


def test_without_a_configured_key_a_random_one_is_stored_in_the_database(monkeypatch):
    # On AWS there's no JWT_SECRET: the backend generates a key once and keeps it in app_settings.
    service = load_service("auth")
    monkeypatch.setattr(service.auth.config, "JWT_SECRET", None)
    monkeypatch.setattr(service.auth, "_stored_secret", None)

    token = sign_in("aadmin1")
    [row] = sql("SELECT value FROM app_settings WHERE name = 'jwt_secret'")
    assert len(row["value"]) >= 60 and row["value"] != "local-development-only-not-a-secret"
    assert call("auth", "GET", "/me", token=token).status == 200

    # A fresh Lambda (no cached key) reads the same key back, so existing tokens stay valid.
    monkeypatch.setattr(service.auth, "_stored_secret", None)
    assert call("auth", "GET", "/me", token=token).status == 200
    assert len(sql("SELECT value FROM app_settings")) == 1


def test_new_passwords_need_uppercase_number_and_special_character(employee_token):
    cases = {
        "onlylowercase": "Must include an uppercase letter, a number and a special character like . or !.",
        "Uppercase1": "Must include a special character like . or !.",
        "Uppercase.": "Must include a number.",
        "lowercase1.": "Must include an uppercase letter.",
        "Has Space1": "Must include a special character like . or !.",  # a space doesn't count
    }
    for weak, message in cases.items():
        r = call("auth", "PUT", "/me/password", {"current_password": SEED_PASSWORD, "new_password": weak},
                 token=employee_token)
        assert r.status == 400 and r.json["error"]["fields"]["new_password"] == message, weak
    ok = call("auth", "PUT", "/me/password", {"current_password": SEED_PASSWORD, "new_password": "Period.1x"},
              token=employee_token)
    assert ok.status == 204


def test_signing_in_upgrades_an_older_password_hash():
    import bcrypt

    old_hash = bcrypt.hashpw(SEED_PASSWORD.encode(), bcrypt.gensalt(12)).decode()
    sql("UPDATE users SET password_hash = %s WHERE username = 'eemployee3'", (old_hash,))

    wrong = call("auth", "POST", "/login", {"username": "eemployee3", "password": "Wrong.123"})
    assert wrong.status == 401
    assert sql("SELECT password_hash FROM users WHERE username = 'eemployee3'")[0]["password_hash"] == old_hash

    assert sign_in("eemployee3")
    [row] = sql("SELECT password_hash FROM users WHERE username = 'eemployee3'")
    assert row["password_hash"].startswith("$2b$10$")
    assert sign_in("eemployee3")  # still works with the upgraded hash


def test_new_hashes_use_the_current_cost():
    shared_auth = load_service("auth").auth
    assert shared_auth.hash_password("Whatever.1").startswith(f"$2b${shared_auth.BCRYPT_COST}$")
    assert not shared_auth.needs_rehash(shared_auth.hash_password("Whatever.1"))
