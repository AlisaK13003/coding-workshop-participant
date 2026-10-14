"""Database tasks run from inside AWS, where the database is reachable (bin/cloud-db.sh).

A task arrives as a direct, AWS-authenticated Lambda invoke with an event like
{"db_task": "reset_empty"}. Requests through the public Function URL always arrive with
the HTTP event shape (requestContext, rawPath…) and can't add top-level keys, so a task
can never be triggered from the web.

The SQL files are the same ones backend/db/reset.sh uses; bin/sync-backend-shared.sh copies
them next to this module.
"""

import os

import pg8000.native

from . import auth, db

SQL_DIR = os.path.dirname(os.path.abspath(__file__))

# task: (wipe and rebuild the tables first?, data files to load afterwards)
TASKS = {
    "reset_empty": (True, []),
    "reset_seed_only": (True, ["seed.sql"]),
    "reset": (True, ["seed.sql", "demo.sql"]),
    "seed": (False, ["seed.sql", "demo.sql"]),
    "seed_only": (False, ["seed.sql"]),
}


def is_task(event):
    """True for a direct-invoke task event; web requests always have requestContext."""
    return isinstance(event, dict) and "db_task" in event and "requestContext" not in event


def _read_sql(name):
    with open(os.path.join(SQL_DIR, name), encoding="utf-8") as file:
        return file.read()


def run(event):
    """Runs the task in one transaction (all or nothing) and reports what's in the database."""
    task = event.get("db_task")
    if task not in TASKS:
        return {"ok": False, "error": f"Unknown task {task!r}. Use one of: {', '.join(TASKS)}."}
    rebuild, files = TASKS[task]

    conn = pg8000.native.Connection(**db.connection_options())
    try:
        conn.execute_simple("BEGIN; SET LOCAL client_min_messages = warning;")
        if rebuild:
            conn.execute_simple("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
            conn.execute_simple(_read_sql("schema.sql"))
        for name in files:
            conn.execute_simple(_read_sql(name))
        conn.execute_simple("COMMIT;")
        counts = conn.run("SELECT (SELECT count(*) FROM users), (SELECT count(*) FROM projects)")[0]
    except Exception as error:
        conn.execute_simple("ROLLBACK;")
        return {"ok": False, "task": task, "error": str(error)}
    finally:
        conn.close()

    if rebuild:
        # The rebuilt app_settings table no longer holds the signing key this Lambda cached.
        auth._stored_secret = None
    return {"ok": True, "task": task, "users": counts[0], "projects": counts[1]}
