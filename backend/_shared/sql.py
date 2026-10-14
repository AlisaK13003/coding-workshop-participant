"""Helpers for building and running SQL that several services share."""

from .db import UniqueViolation
from .http import ApiError


def quote_identifier(name):
    """A table or column name quoted for SQL: wrapped in double quotes, with any double
    quote inside it doubled, so the name can't end the quoting and add its own SQL."""
    return '"' + name.replace('"', '""') + '"'


def person_json(alias):
    """SQL building {"id": 2, "name": "Morgan Manager"} from the users row `alias`,
    or NULL when there's no such row (for example after a LEFT JOIN)."""
    return (
        f"CASE WHEN {alias}.id IS NULL THEN NULL "
        f"ELSE json_build_object('id', {alias}.id, 'name', {alias}.first_name || ' ' || {alias}.last_name) END"
    )


def update_sql(table, row_id, values, allowed):
    """An UPDATE setting only the given columns of one row, and its params.

    values is {column: new value}. Every column must be in `allowed`, a fixed list written
    in the code, so a column name can never come from the request; names are also quoted
    with quote_identifier. Only the values are passed as parameters.

        query, params = update_sql("projects", 5, {"name": "New name"}, EDITABLE)
        # UPDATE "projects" SET "name" = %s WHERE id = %s RETURNING id
    """
    unknown = set(values) - set(allowed)
    if unknown:
        raise ValueError(f"Not editable columns of {table}: {', '.join(sorted(unknown))}")
    assignments = ", ".join(f"{quote_identifier(column)} = %s" for column in values)
    query = f"UPDATE {quote_identifier(table)} SET {assignments} WHERE id = %s RETURNING id"
    return query, (*values.values(), row_id)


def save(conn, query, params, unique_fields):
    """Runs an INSERT or UPDATE and returns its first row.

    unique_fields is {unique constraint or index name: (field, message)}. A clash with one
    of them becomes a 409 with that message on that field, so the form can show it.
    """
    try:
        return conn.execute(query, params).fetchone()
    except UniqueViolation as error:
        field, message = unique_fields[error.constraint]
        raise ApiError(409, "conflict", message, {field: message})
