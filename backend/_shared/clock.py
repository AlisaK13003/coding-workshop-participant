"""The current date in the business's time zone."""

from datetime import datetime
from zoneinfo import ZoneInfo

from . import config


def today():
    """Today's date in config.TIMEZONE."""
    return datetime.now(ZoneInfo(config.TIMEZONE)).date()
