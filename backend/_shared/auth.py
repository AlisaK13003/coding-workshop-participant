"""Password hashing, JWTs, and the central authentication and role checks."""

import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from . import config, db
from .http import forbidden, unauthorized

ADMIN = "admin"
MANAGER = "manager"
EMPLOYEE = "employee"
ANY_ROLE = frozenset({ADMIN, MANAGER, EMPLOYEE})
ADMIN_ONLY = frozenset({ADMIN})
ADMIN_OR_MANAGER = frozenset({ADMIN, MANAGER})

_ALGORITHM = "HS256"
# Compared against when a username doesn't exist, so a wrong username takes as
# long as a wrong password and response times don't reveal which accounts exist.
_DUMMY_HASH = bcrypt.hashpw(b"dummy-password", bcrypt.gensalt(12))


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")


def verify_password(password, password_hash):
    stored = password_hash.encode("utf-8") if password_hash else _DUMMY_HASH
    matches = bcrypt.checkpw(password.encode("utf-8"), stored)
    return matches and password_hash is not None


_stored_secret = None


def _load_or_create_stored_secret():
    """The signing key kept in the database, created on first use. ON CONFLICT means two
    Lambdas starting at once still agree on one key."""
    with db.transaction() as conn:
        conn.execute(
            "INSERT INTO app_settings (name, value) VALUES ('jwt_secret', %s) ON CONFLICT (name) DO NOTHING",
            (secrets.token_urlsafe(48),),
        )
        return conn.execute("SELECT value FROM app_settings WHERE name = 'jwt_secret'").fetchone()["value"]


def _secret():
    """The key that signs and checks tokens: JWT_SECRET if configured (always set locally),
    otherwise a random key stored in the database, cached for the life of the Lambda."""
    global _stored_secret
    if config.JWT_SECRET:
        return config.JWT_SECRET
    if _stored_secret is None:
        _stored_secret = _load_or_create_stored_secret()
    return _stored_secret


def _create_token(user, token_type, lifetime):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user["id"]),
        "role": user["role"],
        "type": token_type,
        "iat": now,
        "exp": now + lifetime,
    }
    return jwt.encode(payload, _secret(), algorithm=_ALGORITHM)


def create_tokens(user):
    """Returns a short-lived access token and a longer-lived refresh token."""
    return {
        "access_token": _create_token(user, "access", timedelta(minutes=config.ACCESS_TOKEN_MINUTES)),
        "refresh_token": _create_token(user, "refresh", timedelta(days=config.REFRESH_TOKEN_DAYS)),
        "token_type": "Bearer",
        "expires_in": config.ACCESS_TOKEN_MINUTES * 60,
    }


def decode_token(token, expected_type):
    """Returns the token's user id, or raises a clear 401."""
    try:
        payload = jwt.decode(token, _secret(), algorithms=[_ALGORITHM], options={"require": ["exp", "sub", "type"]})
    except jwt.ExpiredSignatureError:
        raise unauthorized("Your session has expired. Sign in again.", "token_expired")
    except jwt.InvalidTokenError:
        raise unauthorized("Your session is invalid. Sign in again.", "invalid_token")
    if payload.get("type") != expected_type:
        raise unauthorized("Your session is invalid. Sign in again.", "invalid_token")
    return int(payload["sub"])


CURRENT_USER_SQL = """
    SELECT id, display_id, first_name, last_name, username, email, job_title, role, manager_id, archived_at
    FROM users WHERE id = %s
"""


def load_active_user(user_id):
    """The user as stored now. Archived or missing users can't act, even with a valid token."""
    user = db.fetch_one(CURRENT_USER_SQL, (user_id,))
    if user is None or user["archived_at"] is not None:
        raise unauthorized("Your account is no longer active.", "account_inactive")
    return user


def authenticate(request):
    """Reads the Bearer token and returns the current user.

    The role comes from the database rather than the token, so a role change
    or archiving takes effect immediately.
    """
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise unauthorized("Sign in to continue.", "missing_token")
    return load_active_user(decode_token(token.strip(), "access"))


def authorize(user, roles):
    """403 unless the user's role is one of `roles`."""
    if user["role"] not in roles:
        raise forbidden()
