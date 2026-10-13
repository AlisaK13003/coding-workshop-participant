-- Sample data for local development. Run after schema.sql:
--   psql -h localhost -U postgres -d project_tracker -f backend/db/seed.sql
-- Safe to run more than once: rows whose email already exists are skipped.

INSERT INTO users (name, email, role) VALUES
    ('Alex Admin',     'alex@example.com',   'admin'),
    ('Morgan Manager', 'morgan@example.com', 'manager')
ON CONFLICT (email) DO NOTHING;

-- Employees are added after managers so their manager's id can be looked up by email.
INSERT INTO users (name, email, role, manager_id, annual_salary) VALUES
    ('Emery Employee', 'emery@example.com', 'employee',
        (SELECT id FROM users WHERE email = 'morgan@example.com'), 83200.00)
ON CONFLICT (email) DO NOTHING;
