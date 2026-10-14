"""Looking up people for the users and projects services."""


def find_active_manager(conn, v, manager_id):
    """The manager row, held with a share lock so they can't be archived or demoted until we commit.
    Raises a field error on manager_id (through the Validator v) if they aren't an active manager."""
    manager = conn.execute(
        """
        SELECT id, first_name, last_name FROM users
        WHERE id = %s AND role = 'manager' AND archived_at IS NULL
        FOR SHARE
        """,
        (manager_id,),
    ).fetchone()
    if manager is None:
        v.add_error("manager_id", "Must be an active manager.")
        v.raise_if_invalid()
    return manager
