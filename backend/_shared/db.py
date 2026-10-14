"""PostgreSQL connection, reused across invocations of the same Lambda container.

Uses pg8000, a driver written in pure Python, so the packages pip installs work on any
Python version (the Lambdas run 3.13 even if this machine runs something newer).
Queries use %s placeholders and rows come back as dicts.
"""

from contextlib import contextmanager

import pg8000.dbapi

from . import config

_connection = None


class ConstraintViolation(Exception):
    """A query broke a database constraint. `constraint` is its name, for example "users_email_key"."""

    def __init__(self, constraint):
        super().__init__(constraint)
        self.constraint = constraint


class UniqueViolation(ConstraintViolation):
    """A row with the same value of a UNIQUE column (or unique index) already exists."""


class ForeignKeyViolation(ConstraintViolation):
    """A row points at a row that doesn't exist, or other rows still point at it."""


class CheckViolation(ConstraintViolation):
    """A value failed a CHECK constraint."""


# PostgreSQL's error codes (SQLSTATE) for the constraint errors above.
_VIOLATIONS = {
    "23505": UniqueViolation,
    "23503": ForeignKeyViolation,
    "23514": CheckViolation,
}


def constraint_violation(error):
    """The exception to raise instead of a pg8000 error, or None if it isn't a constraint error.

    pg8000 puts the server's error fields in a dict: "C" is the SQLSTATE code and "n" the
    constraint name.
    """
    fields = error.args[0] if error.args and isinstance(error.args[0], dict) else {}
    violation = _VIOLATIONS.get(fields.get("C"))
    return violation(fields.get("n")) if violation else None


class Result:
    """The rows of one query, like a cursor: fetchone() and fetchall() return dicts."""

    def __init__(self, cursor):
        self._cursor = cursor
        self._columns = [column[0] for column in cursor.description or []]
        self.rowcount = cursor.rowcount

    def fetchone(self):
        row = self._cursor.fetchone()
        return None if row is None else dict(zip(self._columns, row))

    def fetchall(self):
        return [dict(zip(self._columns, row)) for row in self._cursor.fetchall()]


class Connection:
    """A pg8000 connection with an execute() that returns a Result.

    Usage:
        row = conn.execute("SELECT * FROM users WHERE id = %s", (5,)).fetchone()
    """

    def __init__(self, raw):
        self.raw = raw

    def execute(self, sql, params=None):
        cursor = self.raw.cursor()
        try:
            cursor.execute(sql, params or ())
        except pg8000.dbapi.DatabaseError as error:
            violation = constraint_violation(error)
            if violation:
                raise violation from error
            raise
        return Result(cursor)


def _connect():
    options = dict(config.POSTGRES, port=int(config.POSTGRES["port"]), timeout=15)
    # AWS Aurora requires SSL; the local Postgres doesn't.
    if not config.IS_LOCAL and config.POSTGRES["host"] not in ("localhost", "127.0.0.1"):
        options["ssl_context"] = True
    return Connection(pg8000.dbapi.connect(**options))


def get_connection():
    """Returns the open connection, connecting first if there isn't one."""
    global _connection
    if _connection is None:
        _connection = _connect()
    return _connection


def _drop_connection():
    """Forgets a broken connection so the next call reconnects."""
    global _connection
    try:
        _connection.raw.close()
    except Exception:
        pass  # It's already broken; closing is only tidying up.
    _connection = None


@contextmanager
def transaction():
    """Runs a block in one transaction: commits if it succeeds, rolls back if it raises.

    Usage:
        with transaction() as conn:
            conn.execute(...)
    """
    conn = get_connection()
    try:
        yield conn
        conn.raw.commit()
    except Exception:
        try:
            conn.raw.rollback()
        except Exception:
            # The rollback failed too, so the connection is broken (for example the network dropped).
            _drop_connection()
        raise


def fetch_all(sql, params=None):
    """Every row of one query, run in its own transaction."""
    with transaction() as conn:
        return conn.execute(sql, params).fetchall()


def fetch_one(sql, params=None):
    """The first row of one query (or None), run in its own transaction."""
    with transaction() as conn:
        return conn.execute(sql, params).fetchone()
