"""Reads and checks filters from the query string, like ?project_id=3&from=2026-10-01.

Query values always arrive as text, so each one is converted here. Like Validator,
it collects every problem before failing, so the client can show all of them at once:

    q = QueryParams(request.query)
    project_id = q.id("project_id")
    q.raise_if_invalid()

The same code is in work_log_filters.py in the work-logs service; it's a candidate for _shared.
"""

from datetime import date

from shared.http import ApiError


class QueryParams:
    def __init__(self, query):
        self.query = query
        self.errors = {}

    def _get(self, name):
        value = (self.query.get(name) or "").strip()
        return value or None

    def _whole_number(self, value):
        return int(value) if value.isascii() and value.isdigit() else None

    def id(self, name):
        """A record id: a whole number from 1 up."""
        value = self._get(name)
        if value is None:
            return None
        number = self._whole_number(value)
        if number is None or number < 1:
            self.errors[name] = "Must be a whole number from 1 up."
            return None
        return number

    def integer(self, name, default, minimum=0, maximum=None):
        value = self._get(name)
        if value is None:
            return default
        number = self._whole_number(value)
        if number is None or number < minimum or (maximum is not None and number > maximum):
            limit = f"between {minimum} and {maximum}" if maximum is not None else f"at least {minimum}"
            self.errors[name] = f"Must be a whole number {limit}."
            return default
        return number

    def date(self, name):
        value = self._get(name)
        if value is None:
            return None
        try:
            return date.fromisoformat(value)
        except ValueError:
            self.errors[name] = "Must be a date in YYYY-MM-DD format."
            return None

    def text(self, name, max_length=100):
        value = self._get(name)
        if value is not None and len(value) > max_length:
            self.errors[name] = f"Must be at most {max_length} characters."
            return None
        return value

    def choice(self, name, options):
        value = self._get(name)
        if value is not None and value not in options:
            self.errors[name] = "Must be one of: " + ", ".join(sorted(options)) + "."
            return None
        return value

    def add_error(self, name, message):
        self.errors[name] = message

    def raise_if_invalid(self):
        if self.errors:
            raise ApiError(400, "validation_error", "Some filters need fixing.", self.errors)
