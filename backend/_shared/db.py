"""PostgreSQL connection, reused across invocations of the same Lambda container."""

from contextlib import contextmanager

from psycopg import connect
from psycopg.rows import dict_row

from . import config

_connection = None


def _connect():
    options = dict(config.POSTGRES, connect_timeout=15, row_factory=dict_row)
    # AWS Aurora requires SSL; the local Postgres doesn't.
    if not config.IS_LOCAL and config.POSTGRES["host"] not in ("localhost", "127.0.0.1"):
        options["sslmode"] = "require"
    return connect(**options)


def get_connection():
    """Returns the open connection, reconnecting if needed. Rows come back as dicts."""
    global _connection
    if _connection is None or _connection.closed:
        _connection = _connect()
    return _connection


@contextmanager
def transaction():
    """Runs a block in one transaction: commits if it succeeds, rolls back if it raises.

    Usage:
        with transaction() as conn:
            conn.execute(...)
    """
    global _connection
    conn = get_connection()
    try:
        with conn.transaction():
            yield conn
    except Exception:
        # A broken connection is dropped so the next call reconnects.
        if conn.broken:
            _connection = None
        raise


def fetch_all(sql, params=None):
    """Every row of one query, run in its own transaction."""
    with transaction() as conn:
        return conn.execute(sql, params).fetchall()


def fetch_one(sql, params=None):
    """The first row of one query (or None), run in its own transaction."""
    with transaction() as conn:
        return conn.execute(sql, params).fetchone()
