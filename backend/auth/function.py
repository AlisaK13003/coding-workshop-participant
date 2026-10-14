"""Auth service: sign-in, token refresh, first-admin sign-up, and the current user's profile.

Routes (under /api/auth):
    GET  /setup       public: whether sign-up is open (only before any user exists)
    POST /signup      public: create the first admin
    POST /login       public: username + password -> tokens
    POST /refresh     public: refresh token -> new tokens
    GET  /me          signed in: the current user
    PUT  /me/password signed in: change your own password
"""

from shared import auth, db
from shared.activity import full_name, log_activity
from shared.http import conflict, unauthorized
from shared.router import Router
from shared.validation import Validator

router = Router("auth")

PROFILE_FIELDS = ("id", "display_id", "username", "first_name", "last_name", "email", "job_title", "role", "manager_id")


def profile(user):
    return {field: user[field] for field in PROFILE_FIELDS}


def signed_in(user):
    return {**auth.create_tokens(user), "user": profile(user)}


@router.route("GET", "/setup")
def setup_status(request):
    has_users = db.fetch_one("SELECT EXISTS (SELECT 1 FROM users) AS has_users")["has_users"]
    return {"signup_open": not has_users}


@router.route("POST", "/signup")
def signup(request):
    v = Validator(request.json())
    first_name = v.text("first_name", required=True, max_length=100)
    last_name = v.text("last_name", required=True, max_length=100)
    email = v.email("email", required=True)
    job_title = v.text("job_title", required=True, max_length=100)
    password = v.password("password", required=True)
    v.raise_if_invalid()

    with db.transaction() as conn:
        # The lock makes two simultaneous sign-ups wait for each other, so only one can win.
        conn.execute("LOCK TABLE users IN EXCLUSIVE MODE")
        if conn.execute("SELECT EXISTS (SELECT 1 FROM users) AS has_users").fetchone()["has_users"]:
            raise conflict("Sign-up is closed. Ask an admin to create your account.", "signup_closed")
        user = conn.execute(
            """
            INSERT INTO users (first_name, last_name, email, job_title, role, password_hash)
            VALUES (%s, %s, %s, %s, 'admin', %s)
            RETURNING id
            """,
            (first_name, last_name, email, job_title, auth.hash_password(password)),
        ).fetchone()
        user = conn.execute(auth.CURRENT_USER_SQL, (user["id"],)).fetchone()
        log_activity(conn, user, "user.signup", "user", user["id"], f"{full_name(user)} signed up as the first admin.")
    return 201, signed_in(user)


@router.route("POST", "/login")
def login(request):
    v = Validator(request.json())
    username = v.text("username", required=True)
    password = v.raw("password", required=True)
    v.raise_if_invalid()

    row = db.fetch_one(
        "SELECT id, password_hash, archived_at FROM users WHERE lower(username) = lower(%s)",
        (username,),
    )
    # Same message whether the username or the password is wrong, so it doesn't reveal which accounts exist.
    valid = auth.verify_password(password, row["password_hash"] if row else None)
    if not valid or row["archived_at"] is not None:
        raise unauthorized("Incorrect username or password.", "invalid_credentials")
    return signed_in(auth.load_active_user(row["id"]))


@router.route("POST", "/refresh")
def refresh(request):
    v = Validator(request.json())
    token = v.text("refresh_token", required=True, max_length=2000)
    v.raise_if_invalid()
    user = auth.load_active_user(auth.decode_token(token, "refresh"))
    return signed_in(user)


@router.route("GET", "/me", roles=auth.ANY_ROLE)
def me(request):
    return profile(request.user)


@router.route("PUT", "/me/password", roles=auth.ANY_ROLE)
def change_password(request):
    v = Validator(request.json())
    current = v.raw("current_password", required=True)
    new = v.password("new_password", required=True)
    v.raise_if_invalid()

    with db.transaction() as conn:
        stored = conn.execute("SELECT password_hash FROM users WHERE id = %s", (request.user["id"],)).fetchone()
        if not auth.verify_password(current, stored["password_hash"]):
            v.add_error("current_password", "Incorrect password.")
            v.raise_if_invalid()
        conn.execute("UPDATE users SET password_hash = %s WHERE id = %s", (auth.hash_password(new), request.user["id"]))
        log_activity(conn, request.user, "user.password_change", "user", request.user["id"],
                     f"{full_name(request.user)} changed their password.")
    return 204, None


def handler(event, context=None):
    return router.handle(event)
