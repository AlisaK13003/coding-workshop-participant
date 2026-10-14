"""Helpers for building and running SQL that several services share."""

from psycopg import sql
from psycopg.errors import UniqueViolation

from .http import ApiError


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
    with sql.Identifier. Only the values are passed as parameters.

        query, params = update_sql("projects", 5, {"name": "New name"}, EDITABLE)
        # UPDATE "projects" SET "name" = %s WHERE id = %s RETURNING id
    """
    unknown = set(values) - set(allowed)
    if unknown:
        raise ValueError(f"Not editable columns of {table}: {', '.join(sorted(unknown))}")
    assignments = sql.SQL(", ").join(sql.SQL("{} = %s").format(sql.Identifier(column)) for column in values)
    query = sql.SQL("UPDATE {} SET {} WHERE id = %s RETURNING id").format(sql.Identifier(table), assignments)
    return query, (*values.values(), row_id)


def save(conn, query, params, unique_fields):
    """Runs an INSERT or UPDATE and returns its first row.

    unique_fields is {unique constraint or index name: (field, message)}. A clash with one
    of them becomes a 409 with that message on that field, so the form can show it.
    """
    try:
        return conn.execute(query, params).fetchone()
    except UniqueViolation as error:
        field, message = unique_fields[error.diag.constraint_name]
        raise ApiError(409, "conflict", message, {field: message})
