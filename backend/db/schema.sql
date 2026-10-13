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

CREATE TABLE projects (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name         TEXT NOT NULL,
    -- empty after unarchiving, until an admin assigns a new manager
    manager_id   INTEGER,
    manager_role TEXT NOT NULL DEFAULT 'manager' CHECK (manager_role = 'manager'),
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,  -- predicted end date
    budget       NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
    status       TEXT NOT NULL DEFAULT 'in_progress'
                 CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    archived_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT manager_is_a_manager FOREIGN KEY (manager_id, manager_role) REFERENCES users (id, role),
    CONSTRAINT end_after_start CHECK (end_date >= start_date)
);

-- Removing a member fills in removed_at instead of deleting the row, so history is kept.
-- The backend checks that employee_id is an employee when adding a member. A plain foreign
-- key is used so past memberships don't block promoting that employee later.
CREATE TABLE project_members (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id  INTEGER NOT NULL REFERENCES projects (id),
    employee_id INTEGER NOT NULL REFERENCES users (id),
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    removed_at  TIMESTAMPTZ
);

-- an employee can only be on a project once at a time
CREATE UNIQUE INDEX one_active_membership
    ON project_members (project_id, employee_id)
    WHERE removed_at IS NULL;

-- Status is worked out, not stored: completed (completed_at is set), awaiting review
-- (open review request), blocked (a prerequisite is unfinished), or available.
-- The backend keeps milestone dates within the project's dates and never clears completed_at.
CREATE TABLE milestones (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects (id),
    name         TEXT NOT NULL,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    completed_at TIMESTAMPTZ,  -- empty = not completed

    -- lets milestone_dependencies require both milestones to be in the same project
    UNIQUE (id, project_id),
    CONSTRAINT milestone_end_after_start CHECK (end_date >= start_date)
);

-- Each row means: milestone_id can't start until prerequisite_id is completed.
-- Removing a dependency deletes its row; the activity log records the change.
-- The backend rejects circular dependencies and changes involving completed milestones.
CREATE TABLE milestone_dependencies (
    milestone_id    INTEGER NOT NULL,
    prerequisite_id INTEGER NOT NULL,
    project_id      INTEGER NOT NULL,

    PRIMARY KEY (milestone_id, prerequisite_id),
    CONSTRAINT not_its_own_prerequisite CHECK (milestone_id <> prerequisite_id),
    CONSTRAINT milestone_in_project     FOREIGN KEY (milestone_id, project_id)    REFERENCES milestones (id, project_id),
    CONSTRAINT prerequisite_in_project  FOREIGN KEY (prerequisite_id, project_id) REFERENCES milestones (id, project_id)
);
