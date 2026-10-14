"""Test setup: a throwaway database, and helpers that call services like Lambda does.

Run from the repository root:
    .venv/bin/pytest backend/_tests

Every test starts from a freshly reset test database (schema + seed). It's named
`project_tracker_test` unless TEST_DB is set, so parallel runs can use separate ones.
"""

import importlib
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]
ROOT = BACKEND.parent
TEST_DB = os.getenv("TEST_DB", "project_tracker_test")
SEED_PASSWORD = "Password123!"

os.environ.update({"IS_LOCAL": "true", "POSTGRES_NAME": TEST_DB})

# Each Lambda gets its own copy of _shared; tests use the same copies.
subprocess.run([str(ROOT / "bin" / "sync-backend-shared.sh")], check=True, capture_output=True)

_services = {}


def load_service(name):
    """Imports backend/<name>/function.py. Every service has a module called `function`
    and a package called `shared`, so they're swapped in and out of sys.modules."""
    if name in _services:
        return _services[name]
    for module in [m for m in sys.modules if m == "function" or m == "shared" or m.startswith("shared.")]:
        del sys.modules[module]
    sys.path.insert(0, str(BACKEND / name))
    try:
        module = importlib.import_module("function")
    finally:
        sys.path.pop(0)
    _services[name] = module
    return module


class Response:
    def __init__(self, raw):
        self.status = raw["statusCode"]
        self.json = json.loads(raw["body"]) if raw["body"] else None

    def __repr__(self):
        return f"<Response {self.status} {self.json}>"


def call(service, method, path, body=None, token=None, query=None):
    """Calls a service the way a Lambda Function URL would. `path` is relative to the service."""
    headers = {"content-type": "application/json"}
    if token:
        headers["authorization"] = f"Bearer {token}"
    event = {
        "rawPath": path,
        "requestContext": {"http": {"method": method}},
        "headers": headers,
        "queryStringParameters": query,
        "body": json.dumps(body) if body is not None else None,
    }
    return Response(load_service(service).handler(event))


@pytest.fixture(autouse=True)
def fresh_db():
    subprocess.run([str(BACKEND / "db" / "reset.sh"), TEST_DB], check=True, capture_output=True)


def sign_in(username, password=SEED_PASSWORD):
    response = call("auth", "POST", "/login", {"username": username, "password": password})
    assert response.status == 200, response
    return response.json["access_token"]


@pytest.fixture
def admin_token():
    return sign_in("aadmin1")


@pytest.fixture
def manager_token():
    return sign_in("mmanager2")


@pytest.fixture
def employee_token():
    return sign_in("eemployee3")


def sql(query, params=None):
    """Runs SQL directly against the test database, for setting up or checking state."""
    import psycopg
    from psycopg.rows import dict_row

    with psycopg.connect(host="localhost", user="postgres", password="postgres123", dbname=TEST_DB,
                         row_factory=dict_row, autocommit=True) as conn:
        cursor = conn.execute(query, params)
        return cursor.fetchall() if cursor.description else None
