#!/usr/bin/env python3
"""Local API server: serves every backend service without LocalStack.

Turns each HTTP request for /api/<service>/... into the event a Lambda Function
URL would send, calls backend/<service>/function.py's handler(), and returns its
response. Restart it to pick up code changes.

Usage (from the repository root, with the .venv from backend/requirements-dev.txt):
    .venv/bin/python bin/local-api.py            # http://localhost:3002, database project_tracker
    POSTGRES_NAME=postgres .venv/bin/python bin/local-api.py --port 3002

Then run the frontend against it:
    VITE_API_URL=http://localhost:3002 npm run dev --prefix frontend
"""

import argparse
import importlib
import json
import os
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"

os.environ.setdefault("IS_LOCAL", "true")
os.environ.setdefault("POSTGRES_NAME", "project_tracker")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


def load_services():
    """Imports every service. Each has its own `function` module and `shared` package,
    so they're loaded one at a time and their modules kept apart in sys.modules."""
    subprocess.run([str(ROOT / "bin" / "sync-backend-shared.sh")], check=True, capture_output=True)
    services = {}
    for function_file in sorted(BACKEND.glob("*/function.py")):
        name = function_file.parent.name
        if name.startswith("_"):
            continue
        local_modules = {path.stem for path in function_file.parent.glob("*.py")} | {"shared"}
        for module in list(sys.modules):
            if module.split(".")[0] in local_modules:
                del sys.modules[module]
        sys.path.insert(0, str(function_file.parent))
        try:
            services[name] = importlib.import_module("function").handler
        finally:
            sys.path.pop(0)
    return services


class Handler(BaseHTTPRequestHandler):
    services = {}

    def _respond(self, status, headers, body):
        self.send_response(status)
        for key, value in {**CORS_HEADERS, **headers}.items():
            self.send_header(key, value)
        self.end_headers()
        if body:
            self.wfile.write(body.encode("utf-8"))

    def _dispatch(self):
        url = urlsplit(self.path)
        parts = url.path.strip("/").split("/")
        if len(parts) < 2 or parts[0] != "api" or parts[1] not in self.services:
            self._respond(404, {"Content-Type": "application/json"},
                          json.dumps({"error": {"code": "not_found", "message": "Unknown service."}}))
            return
        length = int(self.headers.get("Content-Length") or 0)
        event = {
            "rawPath": url.path,
            "requestContext": {"http": {"method": self.command}},
            "headers": {key.lower(): value for key, value in self.headers.items()},
            "queryStringParameters": dict(parse_qsl(url.query)) or None,
            "body": self.rfile.read(length).decode("utf-8") if length else None,
        }
        result = self.services[parts[1]](event)
        self._respond(result["statusCode"], result.get("headers", {}), result.get("body"))

    def do_OPTIONS(self):
        self._respond(204, {}, None)

    do_GET = do_POST = do_PUT = do_DELETE = _dispatch


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--port", type=int, default=3002)
    port = parser.parse_args().port
    Handler.services = load_services()
    print(f"Serving {', '.join(Handler.services)} on http://localhost:{port}/api/<service> "
          f"(database: {os.environ['POSTGRES_NAME']})", flush=True)
    # One request at a time: each service reuses a single database connection.
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
