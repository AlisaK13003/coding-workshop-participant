-- Table definitions for the project tracker database.
-- Run against an empty database:
--   psql -h localhost -U postgres -d project_tracker -f backend/db/schema.sql

CREATE TABLE users (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    role          TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    manager_id    INTEGER,
    -- always 'manager'; lets the foreign key below require that manager_id is a manager
    manager_role  TEXT NOT NULL DEFAULT 'manager' CHECK (manager_role = 'manager'),
    annual_salary NUMERIC(10, 2) CHECK (annual_salary >= 0),
    archived_at   TIMESTAMPTZ,

    UNIQUE (id, role),
    FOREIGN KEY (manager_id, manager_role) REFERENCES users (id, role),
    -- employees must have a manager; admins and managers must not
    CONSTRAINT employee_has_manager CHECK ((role = 'employee') = (manager_id IS NOT NULL)),
    -- employees must have a salary; admins and managers must not
    CONSTRAINT employee_has_salary  CHECK ((role = 'employee') = (annual_salary IS NOT NULL))
);
