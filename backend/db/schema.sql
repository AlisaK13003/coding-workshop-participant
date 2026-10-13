-- Table definitions for the project tracker database.
-- Run against an empty database:
--   psql -h localhost -U postgres -d project_tracker -f backend/db/schema.sql

CREATE TABLE users (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- shown on screen, e.g. USR-0003; always matches id and can't be edited
    display_id    TEXT GENERATED ALWAYS AS ('USR-' || lpad(id::text, 4, '0')) STORED,
    first_name    TEXT NOT NULL,
    last_name     TEXT NOT NULL,
    -- filled in by set_username below when not given; can be edited later
    username      TEXT NOT NULL,
    email         TEXT NOT NULL,
    job_title     TEXT NOT NULL,
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

-- usernames and emails are unique ignoring capitals: Emery.E clashes with emery.e
CREATE UNIQUE INDEX username_unique ON users (lower(username));
CREATE UNIQUE INDEX email_unique    ON users (lower(email));

-- Trigger: Postgres runs this function automatically just before each new user is saved.
-- If no username was given, it builds one: first initial + last name + id, lowercase
-- letters only (Emery Employee with id 3 -> eemployee3). The id already exists at this point.
CREATE FUNCTION set_username() RETURNS trigger AS $$
BEGIN
    IF NEW.username IS NULL THEN
        NEW.username := lower(
            left(regexp_replace(NEW.first_name, '[^A-Za-z]', '', 'g'), 1)
            || regexp_replace(NEW.last_name, '[^A-Za-z]', '', 'g')
        ) || NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_username
    BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION set_username();

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

-- project names are unique ignoring capitals
CREATE UNIQUE INDEX project_name_unique ON projects (lower(name));

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

    -- lets other tables require that a milestone belongs to a given project
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

-- Removing a member fills in removed_at instead of deleting the row, so history is kept.
-- The backend checks that employee_id is an employee when adding a member. A plain foreign
-- key is used so past memberships don't block promoting that employee later.
CREATE TABLE project_members (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects (id),
    employee_id  INTEGER NOT NULL REFERENCES users (id),
    added_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    removed_at   TIMESTAMPTZ,
    -- the employee's current milestone in this project; empty = none yet, or waiting to be reassigned
    milestone_id INTEGER,

    CONSTRAINT milestone_in_members_project
        FOREIGN KEY (milestone_id, project_id) REFERENCES milestones (id, project_id)
);

-- an employee can only be on a project once at a time
CREATE UNIQUE INDEX one_active_membership
    ON project_members (project_id, employee_id)
    WHERE removed_at IS NULL;

-- An employee flags a milestone as done; the project's manager (or an admin) accepts it or keeps it open.
-- Accepting also completes the milestone and moves its employees, in one transaction in the backend.
CREATE TABLE milestone_reviews (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    milestone_id INTEGER NOT NULL REFERENCES milestones (id),
    requested_by INTEGER NOT NULL REFERENCES users (id),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    decision     TEXT CHECK (decision IN ('accepted', 'kept_open')),  -- empty = still waiting
    decided_by   INTEGER REFERENCES users (id),
    decided_at   TIMESTAMPTZ,
    feedback     TEXT,  -- optional

    -- a decision always records who made it and when
    CONSTRAINT decision_is_complete CHECK (
        (decision IS NULL) = (decided_by IS NULL) AND (decision IS NULL) = (decided_at IS NULL))
);

-- only one waiting request per milestone
CREATE UNIQUE INDEX one_open_review
    ON milestone_reviews (milestone_id)
    WHERE decision IS NULL;

-- One row per employee per workday. hourly_rate is saved when the log is made, so later
-- salary changes never alter past costs. A day's cost is hours * hourly_rate.
-- Wrong entries are corrected in place by an admin; the activity log records the change.
-- The backend checks: only employees log; employees log today only, admins may enter past
-- dates, no future dates; the employee is a current member on that milestone, the milestone
-- is available, and the project is in progress and not archived.
CREATE TABLE work_logs (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id  INTEGER NOT NULL REFERENCES users (id),
    project_id   INTEGER NOT NULL REFERENCES projects (id),
    milestone_id INTEGER NOT NULL,
    work_date    DATE NOT NULL,
    hours        NUMERIC(4, 2) NOT NULL DEFAULT 8 CHECK (hours = 8),
    hourly_rate  NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),  -- annual salary / 2080 on the day
    entered_by   INTEGER NOT NULL REFERENCES users (id),            -- the employee, or an admin for past entries
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- one project per employee per day
    CONSTRAINT one_log_per_day UNIQUE (employee_id, work_date),
    CONSTRAINT log_milestone_in_project FOREIGN KEY (milestone_id, project_id) REFERENCES milestones (id, project_id),
    -- ISODOW: Monday = 1 ... Sunday = 7
    CONSTRAINT weekdays_only CHECK (EXTRACT(ISODOW FROM work_date) < 6)
);

-- A record of who did what. The backend writes an entry in the same transaction as each
-- change made by an admin or manager, and when an employee flags a milestone for review.
-- Valid action codes are kept in the backend. Only admins can see this log.
CREATE TABLE activity_log (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id    INTEGER NOT NULL REFERENCES users (id),
    -- the actor's role at the time, so later promotions don't change old entries
    actor_role  TEXT NOT NULL CHECK (actor_role IN ('admin', 'manager', 'employee')),
    action      TEXT NOT NULL,                    -- e.g. 'project.update', 'member.assign'
    entity_type TEXT NOT NULL,                    -- e.g. 'project', 'user', 'milestone', 'work_log'
    entity_id   INTEGER NOT NULL,
    project_id  INTEGER REFERENCES projects (id), -- the related project, if any
    summary     TEXT NOT NULL,                    -- the sentence shown on screen, as it read at the time
    changes     JSONB,                            -- before and after values, e.g. {"budget": {"from": 220000, "to": 240000}}
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- In-app notifications, one row per recipient. The backend creates them in the same
-- transaction as the event that causes them, and users only see and mark their own.
-- Marking as read fills in read_at; notifications are never deleted.
CREATE TABLE notifications (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES users (id),
    title        TEXT NOT NULL,  -- e.g. "Milestone review requested"
    detail       TEXT,           -- e.g. "Emery Employee · Design"
    project_id   INTEGER REFERENCES projects (id),
    milestone_id INTEGER,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at      TIMESTAMPTZ,    -- empty = unread

    CONSTRAINT notification_milestone_in_project
        FOREIGN KEY (milestone_id, project_id) REFERENCES milestones (id, project_id)
);
