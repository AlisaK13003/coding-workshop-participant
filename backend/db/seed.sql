-- Sample data for local development. Run after schema.sql:
--   psql -h localhost -U postgres -d project_tracker -f backend/db/seed.sql
-- Safe to run more than once: rows that already exist are skipped.

INSERT INTO users (name, email, role) VALUES
    ('Alex Admin',     'alex@example.com',   'admin'),
    ('Morgan Manager', 'morgan@example.com', 'manager')
ON CONFLICT (email) DO NOTHING;

-- Employees are added after managers so their manager's id can be looked up by email.
INSERT INTO users (name, email, role, manager_id, annual_salary) VALUES
    ('Emery Employee', 'emery@example.com', 'employee',
        (SELECT id FROM users WHERE email = 'morgan@example.com'), 83200.00)
ON CONFLICT (email) DO NOTHING;

-- Projects have no unique column like email, so skip by name instead of ON CONFLICT.
INSERT INTO projects (name, manager_id, start_date, end_date, budget)
SELECT 'Customer Portal', id, '2026-10-01', '2026-12-31', 50000.00
FROM users
WHERE email = 'morgan@example.com'
  AND NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Customer Portal');

INSERT INTO project_members (project_id, employee_id)
SELECT p.id, u.id
FROM projects p, users u
WHERE p.name = 'Customer Portal' AND u.email = 'emery@example.com'
ON CONFLICT (project_id, employee_id) WHERE removed_at IS NULL DO NOTHING;
