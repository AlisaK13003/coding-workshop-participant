"""The database helpers in _shared/db.py and _shared/sql.py, run against the test database."""

from datetime import date, datetime, timezone
from decimal import Decimal

import pg8000.dbapi
import pytest

from conftest import load_service

# The users service imports db, log_activity and update_sql from its copy of _shared,
# so the tests reach them through it.
users = load_service("users")
db = users.db


def test_parameters_and_columns_keep_their_python_types():
    when = datetime(2026, 3, 4, 15, 30, tzinfo=timezone.utc)
    with db.transaction() as conn:
        conn.execute(
            "UPDATE projects SET budget = %s, end_date = %s, archived_at = %s WHERE id = 1",
            (Decimal("1234.56"), date(2027, 1, 31), when),
        )
        users.log_activity(conn, {"id": 1, "role": "admin"}, "project.update", "project", 1, "Test.",
                           project_id=1, changes={"budget": {"from": Decimal("1.50"), "to": None}})
        project = conn.execute("SELECT budget, end_date, archived_at, created_at FROM projects WHERE id = 1").fetchone()
        entry = conn.execute("SELECT changes FROM activity_log ORDER BY id DESC LIMIT 1").fetchone()

    assert project["budget"] == Decimal("1234.56") and isinstance(project["budget"], Decimal)
    assert project["end_date"] == date(2027, 1, 31) and type(project["end_date"]) is date
    assert project["archived_at"] == when and project["archived_at"].tzinfo is not None
    assert isinstance(project["created_at"], datetime)
    # JSONB goes in as a json.dumps string and comes back as a dict.
    assert entry["changes"] == {"budget": {"from": "1.50", "to": None}}


def test_null_parameters_and_results():
    row = db.fetch_one("SELECT %s::text AS nothing, archived_at FROM users WHERE id = %s", (None, 1))
    assert row == {"nothing": None, "archived_at": None}


def test_fetch_helpers_return_dicts():
    assert db.fetch_one("SELECT id, username FROM users WHERE id = %s", (1,)) == {"id": 1, "username": "aadmin1"}
    assert db.fetch_one("SELECT id FROM users WHERE id = %s", (9999,)) is None
    rows = db.fetch_all("SELECT id FROM users WHERE id = ANY(%s) ORDER BY id", ([1, 2],))
    assert rows == [{"id": 1}, {"id": 2}]


@pytest.mark.parametrize("query, error, constraint", [
    ("UPDATE users SET username = 'aadmin1' WHERE id = 2", db.UniqueViolation, "username_unique"),
    ("UPDATE projects SET manager_id = 9999 WHERE id = 1", db.ForeignKeyViolation, "manager_is_a_manager"),
    ("UPDATE projects SET budget = -1 WHERE id = 1", db.CheckViolation, "projects_budget_check"),
])
def test_constraint_errors_name_the_constraint(query, error, constraint):
    with pytest.raises(error) as raised:
        with db.transaction() as conn:
            conn.execute(query)
    assert raised.value.constraint == constraint
    # The failed transaction was rolled back, so the same connection still works.
    assert db.fetch_one("SELECT 1 AS one") == {"one": 1}


def test_other_database_errors_are_raised_unchanged():
    with pytest.raises(pg8000.dbapi.DatabaseError) as raised:
        db.fetch_one("SELEC 1")
    assert db.constraint_violation(raised.value) is None


def test_transaction_rolls_back_when_the_block_raises():
    with pytest.raises(RuntimeError):
        with db.transaction() as conn:
            conn.execute("UPDATE projects SET name = 'Renamed' WHERE id = 1")
            raise RuntimeError("something went wrong")
    assert db.fetch_one("SELECT name FROM projects WHERE id = 1")["name"] != "Renamed"


def test_update_sql_quotes_names_and_rejects_unknown_columns():
    assert users.update_sql("projects", 5, {"name": "New"}, ["name"]) == (
        'UPDATE "projects" SET "name" = %s WHERE id = %s RETURNING id', ("New", 5))
    # A double quote inside a name is doubled, so it can't end the quoting.
    assert users.update_sql("t", 1, {'odd"name': 1}, ['odd"name'])[0].startswith('UPDATE "t" SET "odd""name" = %s')
    with pytest.raises(ValueError):
        users.update_sql("projects", 5, {"budget": 1}, ["name"])
