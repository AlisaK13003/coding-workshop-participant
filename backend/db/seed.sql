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

INSERT INTO milestones (project_id, name, start_date, end_date)
SELECT p.id, m.name, m.start_date, m.end_date
FROM projects p,
     (VALUES (1, 'Design',      DATE '2026-10-01', DATE '2026-10-31'),
             (2, 'Backend API', DATE '2026-11-01', DATE '2026-11-30'),
             (3, 'Frontend',    DATE '2026-11-01', DATE '2026-12-15'),
             (4, 'Launch',      DATE '2026-12-16', DATE '2026-12-31')) AS m (position, name, start_date, end_date)
WHERE p.name = 'Customer Portal'
  AND NOT EXISTS (SELECT 1 FROM milestones WHERE project_id = p.id AND name = m.name)
ORDER BY m.position;

INSERT INTO milestone_dependencies (milestone_id, prerequisite_id, project_id)
SELECT m.id, pre.id, p.id
FROM projects p
JOIN (VALUES ('Backend API', 'Design'),
             ('Frontend',    'Design'),
             ('Launch',      'Backend API'),
             ('Launch',      'Frontend')) AS d (milestone, prerequisite) ON true
JOIN milestones m   ON m.project_id = p.id   AND m.name = d.milestone
JOIN milestones pre ON pre.project_id = p.id AND pre.name = d.prerequisite
WHERE p.name = 'Customer Portal'
ON CONFLICT DO NOTHING;

-- Members are added after milestones so each can start on one.
INSERT INTO project_members (project_id, employee_id, milestone_id)
SELECT p.id, u.id, m.id
FROM projects p
JOIN users u      ON u.email = 'emery@example.com'
JOIN milestones m ON m.project_id = p.id AND m.name = 'Design'
WHERE p.name = 'Customer Portal'
ON CONFLICT (project_id, employee_id) WHERE removed_at IS NULL DO NOTHING;

INSERT INTO milestone_reviews (milestone_id, requested_by)
SELECT m.id, u.id
FROM milestones m
JOIN projects p ON p.id = m.project_id
JOIN users u    ON u.email = 'emery@example.com'
WHERE p.name = 'Customer Portal' AND m.name = 'Design'
ON CONFLICT (milestone_id) WHERE decision IS NULL DO NOTHING;

-- Emery's first two workdays on Design, at $83,200 / 2080 = $40.00 per hour.
INSERT INTO work_logs (employee_id, project_id, milestone_id, work_date, hourly_rate, entered_by)
SELECT u.id, p.id, m.id, d.work_date, round(u.annual_salary / 2080, 2), u.id
FROM users u
JOIN projects p   ON p.name = 'Customer Portal'
JOIN milestones m ON m.project_id = p.id AND m.name = 'Design'
JOIN (VALUES (DATE '2026-10-01'), (DATE '2026-10-02')) AS d (work_date) ON true
WHERE u.email = 'emery@example.com'
ON CONFLICT (employee_id, work_date) DO NOTHING;
