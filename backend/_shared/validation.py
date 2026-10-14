"""Reads and checks fields from a JSON request body.

Collects every problem before failing, so the client can show all of them at once:

    v = Validator(request.json())
    name = v.text("name", required=True, max_length=200)
    budget = v.money("budget", required=True)
    v.raise_if_invalid()
"""

from datetime import date
from decimal import Decimal, InvalidOperation

from .http import ApiError


class Validator:
    def __init__(self, data, partial=False):
        """partial=True is for updates: missing fields are skipped instead of required."""
        self.data = data
        self.partial = partial
        self.errors = {}

    def has(self, field):
        return field in self.data

    def _get(self, field, required):
        value = self.data.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            if required and not (self.partial and field not in self.data):
                self.errors[field] = "This field is required."
            return None
        return value

    def raw(self, field, required=False):
        """The value as sent, unchecked. For secrets like a current password that only need to exist."""
        value = self._get(field, required)
        return None if value is None else str(value)

    def text(self, field, required=False, max_length=200):
        value = self._get(field, required)
        if value is None:
            return None
        if not isinstance(value, str):
            self.errors[field] = "Must be text."
            return None
        value = value.strip()
        if len(value) > max_length:
            self.errors[field] = f"Must be at most {max_length} characters."
        return value

    def integer(self, field, required=False, minimum=None):
        value = self._get(field, required)
        if value is None:
            return None
        if isinstance(value, bool) or not isinstance(value, int):
            self.errors[field] = "Must be a whole number."
            return None
        if minimum is not None and value < minimum:
            self.errors[field] = f"Must be at least {minimum}."
        return value

    def money(self, field, required=False):
        value = self._get(field, required)
        if value is None:
            return None
        try:
            amount = Decimal(str(value))
        except InvalidOperation:
            self.errors[field] = "Must be a number."
            return None
        if isinstance(value, bool) or not amount.is_finite() or amount < 0:
            self.errors[field] = "Must be zero or more."
            return None
        return amount.quantize(Decimal("0.01"))

    def date(self, field, required=False):
        value = self._get(field, required)
        if value is None:
            return None
        try:
            return date.fromisoformat(value)
        except (TypeError, ValueError):
            self.errors[field] = "Must be a date in YYYY-MM-DD format."
            return None

    def choice(self, field, options, required=False):
        value = self._get(field, required)
        if value is None:
            return None
        if value not in options:
            self.errors[field] = "Must be one of: " + ", ".join(sorted(options)) + "."
            return None
        return value

    def email(self, field, required=False):
        value = self.text(field, required, max_length=254)
        if value and ("@" not in value or value.startswith("@") or value.endswith("@")):
            self.errors[field] = "Must be a valid email address."
        return value

    def password(self, field, required=False):
        value = self._get(field, required)
        if value is None:
            return None
        if not isinstance(value, str) or len(value) < 8:
            self.errors[field] = "Must be at least 8 characters."
            return None
        if len(value.encode("utf-8")) > 72:
            # bcrypt only uses the first 72 bytes.
            self.errors[field] = "Must be at most 72 characters."
            return None
        return value

    def add_error(self, field, message):
        self.errors[field] = message

    def raise_if_invalid(self):
        if self.errors:
            raise ApiError(400, "validation_error", "Some fields need fixing.", self.errors)
