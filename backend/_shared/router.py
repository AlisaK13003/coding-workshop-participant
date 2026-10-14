"""Maps method + path to a handler function, and turns errors into JSON responses.

Routes are written relative to the service. Locally the proxy strips
"/api/<service>" from the path, while on AWS CloudFront passes it through, so the
router removes that prefix itself and both environments behave the same.

Usage in a service's function.py:

    router = Router("projects")

    @router.route("GET", "/{id}", roles=ANY_ROLE)   # GET /api/projects/5
    def get_project(request):
        project_id = request.path_params["id"]
        ...
        return 200, {...}

    def handler(event, context=None):
        return router.handle(event)
"""

import logging
import re

from . import auth
from .http import ApiError, Request, error_response, response

logger = logging.getLogger()
logger.setLevel(logging.INFO)

_PARAM = re.compile(r"\{(\w+)\}")


class Router:
    """One per service: holds its routes and answers every request for it."""

    def __init__(self, service):
        self._prefix = f"/api/{service}"
        self._routes = []

    def route(self, method, pattern, roles=None):
        """Registers a handler.

        roles=None means the route is public (no token needed). Otherwise it's the
        set of roles allowed, checked centrally here before the handler runs.
        Path parameters like {id} must be whole numbers and arrive as ints.
        """
        regex = re.compile("^" + _PARAM.sub(r"(?P<\1>\\d+)", pattern.rstrip("/")) + "/?$")

        def register(func):
            self._routes.append((method.upper(), regex, roles, func))
            return func

        return register

    def handle(self, event):
        """Runs the matching handler for a Lambda event and returns the Lambda response."""
        request = Request(event)
        try:
            if request.method == "OPTIONS":
                return response(204)
            func, roles, params = self._match(request)
            request.path_params = {k: int(v) for k, v in params.items()}
            if roles is not None:
                # Authentication first, authorization second.
                request.user = auth.authenticate(request)
                auth.authorize(request.user, roles)
            result = func(request)
            status, body = result if isinstance(result, tuple) else (200, result)
            return response(status, body)
        except ApiError as error:
            return error_response(error)
        except Exception:
            logger.exception("Unhandled error for %s %s", request.method, request.path)
            return error_response(ApiError(500, "server_error", "Something went wrong. Please try again."))

    def _relative_path(self, path):
        if path == self._prefix or path.startswith(self._prefix + "/"):
            path = path[len(self._prefix):]
        return path or "/"

    def _match(self, request):
        path = self._relative_path(request.path)
        path_matched = False
        for method, regex, roles, func in self._routes:
            match = regex.match(path)
            if not match:
                continue
            path_matched = True
            if method == request.method:
                return func, roles, match.groupdict()
        if path_matched:
            raise ApiError(405, "method_not_allowed", f"{request.method} is not supported here.")
        raise ApiError(404, "not_found", "Not found.")
