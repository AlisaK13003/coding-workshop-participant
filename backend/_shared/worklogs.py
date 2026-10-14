"""Saving work logs, shared by the work-logs service and review requests (which log the day too)."""

from decimal import ROUND_HALF_UP, Decimal

WORK_HOURS_PER_YEAR = 2080  # 52 weeks * 40 hours


def hourly_rate(annual_salary):
    """The salary spread over a standard working year, rounded to cents (half up, as Postgres does)."""
    return (Decimal(annual_salary) / WORK_HOURS_PER_YEAR).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def is_weekday(day):
    """Monday to Friday."""
    return day.isoweekday() < 6


def insert_log(conn, employee_id, project_id, milestone_id, work_date, rate, entered_by):
    """Saves a new log and returns its id. Raises db.UniqueViolation if the employee already
    has a log that day (one project per day)."""
    return conn.execute(
        """
        INSERT INTO work_logs (employee_id, project_id, milestone_id, work_date, hourly_rate, entered_by)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (employee_id, project_id, milestone_id, work_date, rate, entered_by),
    ).fetchone()["id"]


def log_day_unless_logged(conn, employee_id, project_id, milestone_id, work_date):
    """Logs an 8-hour day for the employee at their current pay rate, entered by themselves,
    unless they already have a log that day. Returns the new log's id, or None if skipped."""
    row = conn.execute(
        """
        INSERT INTO work_logs (employee_id, project_id, milestone_id, work_date, hourly_rate, entered_by)
        SELECT u.id, %s, %s, %s, round(u.annual_salary / %s, 2), u.id
        FROM users u WHERE u.id = %s
        ON CONFLICT (employee_id, work_date) DO NOTHING
        RETURNING id
        """,
        (project_id, milestone_id, work_date, WORK_HOURS_PER_YEAR, employee_id),
    ).fetchone()
    return row["id"] if row else None
