-- Table definitions for the project tracker database.
-- Run against an empty database:
--   psql -h localhost -U postgres -d project_tracker -f backend/db/schema.sql

CREATE TABLE users (
    id    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role  TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee'))
);
