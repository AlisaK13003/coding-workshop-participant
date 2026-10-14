"""Requests and responses in the Lambda Function URL format."""

import base64
import json
from datetime import date, datetime
from decimal import Decimal


class ApiError(Exception):
    """Raise anywhere in a handler to return a consistent JSON error.

    The body is always {"error": {"code": ..., "message": ...}}, plus "fields"
    ({field name: problem}) for validation errors.
    """

    def __init__(self, status, code, message, fields=None):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.fields = fields


def bad_request(message, code="bad_request"):
    return ApiError(400, code, message)


def unauthorized(message="Sign in to continue.", code="unauthorized"):
    return ApiError(401, code, message)


def forbidden(message="You don't have permission to do that."):
    return ApiError(403, "forbidden", message)


def not_found(message="Not found."):
    return ApiError(404, "not_found", message)


def conflict(message, code="conflict"):
    return ApiError(409, code, message)


class Request:
    """The parts of a Lambda Function URL event a handler needs."""

    def __init__(self, event):
        http = (event.get("requestContext") or {}).get("http") or {}
        self.method = (http.get("method") or event.get("httpMethod") or "GET").upper()
        self.path = event.get("rawPath") or event.get("path") or "/"
        # Header names are case-insensitive; store them lowercased.
        self.headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
        self.query = event.get("queryStringParameters") or {}
        self.path_params = {}
        self.user = None  # set by the auth check
        body = event.get("body")
        if body and event.get("isBase64Encoded"):
            body = base64.b64decode(body).decode("utf-8")
        self._raw_body = body

    def json(self):
        """The request body as a dict. An empty body counts as {}."""
        if not self._raw_body:
            return {}
        try:
            data = json.loads(self._raw_body)
        except json.JSONDecodeError:
            raise bad_request("The request body must be valid JSON.", "invalid_json")
        if not isinstance(data, dict):
            raise bad_request("The request body must be a JSON object.", "invalid_json")
        return data


def _to_json(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    raise TypeError(f"Can't convert {type(value).__name__} to JSON")


def response(status, body=None):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": "" if body is None else json.dumps(body, default=_to_json),
    }


def error_response(error):
    body = {"code": error.code, "message": error.message}
    if error.fields:
        body["fields"] = error.fields
    return response(error.status, {"error": body})
