"""Prerequisite rules: same project, never the milestone itself, no circular dependencies,
and no dependency changes involving completed milestones.

A row in milestone_dependencies means "milestone_id can't start until prerequisite_id is
completed". Following those rows from a milestone to its prerequisites, then to theirs,
and so on, walks "upward". A cycle exists when that walk comes back to where it started.
"""

from shared.http import conflict

FIELD = "prerequisite_ids"


def read_id_list(v, field=FIELD):
    """A list of whole numbers from the request body, without duplicates, or None if not sent.
    The shared Validator has no list type, so this reads v.data directly."""
    if not v.has(field) or v.data[field] is None:
        return None
    values = v.data[field]
    if not isinstance(values, list) or any(isinstance(x, bool) or not isinstance(x, int) for x in values):
        v.add_error(field, "Must be a list of milestone ids.")
        return None
    return sorted(set(values))


def check_prerequisites(conn, v, project_id, milestone_id, prerequisite_ids):
    """Field errors for ids that aren't other milestones in the same project.
    Returns {id: row} for the valid ones, so callers can check completed_at and names."""
    if milestone_id in prerequisite_ids:
        v.add_error(FIELD, "A milestone can't be its own prerequisite.")
    rows = conn.execute(
        "SELECT id, name, completed_at FROM milestones WHERE project_id = %s AND id = ANY(%s)",
        (project_id, prerequisite_ids),
    ).fetchall()
    found = {row["id"]: row for row in rows}
    missing = [i for i in prerequisite_ids if i not in found]
    if missing:
        v.add_error(FIELD, "Not milestones of this project: " + ", ".join(map(str, missing)) + ".")
    return found


def reject_completed(milestones, verb):
    """409 if any of these milestones is completed. verb reads 'add' or 'remove'."""
    completed = [m["name"] for m in milestones if m["completed_at"] is not None]
    if completed:
        raise conflict(
            f"Completed milestones can't be {verb} as prerequisites: {', '.join(completed)}.",
            "milestone_completed",
        )


def find_cycle(conn, milestone_id, prerequisite_ids):
    """The first proposed prerequisite whose own prerequisites (followed all the way up)
    lead back to milestone_id, or None if there's no cycle.

    The recursive query starts one walk per proposed prerequisite, remembering where each
    started, and repeatedly steps from a milestone to its prerequisites. UNION (not UNION
    ALL) drops rows already seen, so the walk always ends, even on bad data."""
    row = conn.execute(
        """
        WITH RECURSIVE upward (start_id, milestone_id) AS (
            SELECT id, id FROM unnest(%s::integer[]) AS id
            UNION
            SELECT upward.start_id, d.prerequisite_id
            FROM upward
            JOIN milestone_dependencies d ON d.milestone_id = upward.milestone_id
        )
        SELECT start_id FROM upward WHERE milestone_id = %s ORDER BY start_id LIMIT 1
        """,
        (prerequisite_ids, milestone_id),
    ).fetchone()
    return row["start_id"] if row else None


def reject_cycle(conn, milestone_id, prerequisites):
    """409 naming the prerequisite that would make the dependencies circular.
    prerequisites is {id: row} as returned by check_prerequisites."""
    cause = find_cycle(conn, milestone_id, list(prerequisites))
    if cause is not None:
        raise conflict(
            f"{prerequisites[cause]['name']} can't be a prerequisite: it already depends on this milestone, "
            "which would make the dependencies circular.",
            "dependency_cycle",
        )


def add_prerequisites(conn, project_id, milestone_id, prerequisite_ids):
    for prerequisite_id in prerequisite_ids:
        conn.execute(
            "INSERT INTO milestone_dependencies (milestone_id, prerequisite_id, project_id) VALUES (%s, %s, %s)",
            (milestone_id, prerequisite_id, project_id),
        )


def remove_prerequisites(conn, milestone_id, prerequisite_ids):
    conn.execute(
        "DELETE FROM milestone_dependencies WHERE milestone_id = %s AND prerequisite_id = ANY(%s)",
        (milestone_id, prerequisite_ids),
    )


def current_prerequisites(conn, milestone_id):
    """{id: row} for the milestone's prerequisites now, ordered by id."""
    rows = conn.execute(
        """
        SELECT pre.id, pre.name, pre.completed_at
        FROM milestone_dependencies d JOIN milestones pre ON pre.id = d.prerequisite_id
        WHERE d.milestone_id = %s
        ORDER BY pre.id
        """,
        (milestone_id,),
    ).fetchall()
    return {row["id"]: row for row in rows}
