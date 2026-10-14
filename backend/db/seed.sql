-- Sample data for local development. Run after schema.sql:
--   psql -h localhost -U postgres -d project_tracker -f backend/db/seed.sql
-- Safe to run more than once: rows that already exist are skipped.

-- Usernames are left out so the set_username trigger generates them.
-- Every sample user's password is Password123! (local development only).
INSERT INTO users (first_name, last_name, email, job_title, role, password_hash) VALUES
    ('Alex',   'Admin',   'alex@example.com',   'Operations Director', 'admin',
        '$2b$10$E9zP.L166VZ/0RHNkvSExeLcBwDn2.5VnpygqEfZBDxEk6Ls6JCcC'),
    ('Morgan', 'Manager', 'morgan@example.com', 'Engineering Manager', 'manager',
        '$2b$10$E9zP.L166VZ/0RHNkvSExeLcBwDn2.5VnpygqEfZBDxEk6Ls6JCcC')
ON CONFLICT ((lower(email))) DO NOTHING;

-- Employees are added after managers so their manager's id can be looked up by email.
INSERT INTO users (first_name, last_name, email, job_title, role, manager_id, annual_salary, password_hash) VALUES
    ('Emery', 'Employee', 'emery@example.com', 'Software Engineer', 'employee',
        (SELECT id FROM users WHERE email = 'morgan@example.com'), 83200.00,
        '$2b$10$E9zP.L166VZ/0RHNkvSExeLcBwDn2.5VnpygqEfZBDxEk6Ls6JCcC')
ON CONFLICT ((lower(email))) DO NOTHING;

INSERT INTO projects (name, manager_id, start_date, end_date, budget)
SELECT 'Customer Portal', id, '2026-10-01', '2026-12-31', 50000.00
FROM users
WHERE email = 'morgan@example.com'
ON CONFLICT ((lower(name))) DO NOTHING;

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

-- Activity matching the sample data above.
INSERT INTO activity_log (actor_id, actor_role, action, entity_type, entity_id, project_id, summary, created_at)
SELECT actor.id, actor.role, a.action, a.entity_type, a.entity_id, a.project_id, a.summary, a.created_at
FROM (
    SELECT 'alex@example.com' AS actor_email, 'user.create' AS action, 'user' AS entity_type,
           (SELECT id FROM users WHERE email = 'morgan@example.com') AS entity_id, NULL::integer AS project_id,
           'Created manager Morgan Manager.' AS summary, TIMESTAMPTZ '2026-09-28 09:00-04' AS created_at
    UNION ALL
    SELECT 'alex@example.com', 'user.create', 'user',
           (SELECT id FROM users WHERE email = 'emery@example.com'), NULL,
           'Created employee Emery Employee, reporting to Morgan Manager.', '2026-09-28 09:05-04'
    UNION ALL
    SELECT 'alex@example.com', 'project.create', 'project',
           (SELECT id FROM projects WHERE name = 'Customer Portal'),
           (SELECT id FROM projects WHERE name = 'Customer Portal'),
           'Created project Customer Portal, managed by Morgan Manager.', '2026-09-28 09:30-04'
    UNION ALL
    SELECT 'morgan@example.com', 'member.assign', 'project_member',
           (SELECT pm.id FROM project_members pm JOIN projects p ON p.id = pm.project_id
            WHERE p.name = 'Customer Portal' AND pm.employee_id = (SELECT id FROM users WHERE email = 'emery@example.com')),
           (SELECT id FROM projects WHERE name = 'Customer Portal'),
           'Emery Employee assigned to Design.', '2026-09-30 10:00-04'
    UNION ALL
    SELECT 'emery@example.com', 'review.request', 'milestone_review',
           (SELECT r.id FROM milestone_reviews r JOIN milestones m ON m.id = r.milestone_id WHERE m.name = 'Design'),
           (SELECT id FROM projects WHERE name = 'Customer Portal'),
           'Requested review of Design.', '2026-10-02 16:30-04'
) AS a
JOIN users actor ON actor.email = a.actor_email
WHERE NOT EXISTS (
    SELECT 1 FROM activity_log l
    WHERE l.action = a.action AND l.entity_type = a.entity_type AND l.entity_id = a.entity_id
);

-- Morgan's notification about Emery's waiting review of Design.
INSERT INTO notifications (recipient_id, title, detail, project_id, milestone_id, created_at)
SELECT mgr.id, 'Milestone review requested', 'Emery Employee · Design', p.id, m.id, TIMESTAMPTZ '2026-10-02 16:30-04'
FROM projects p
JOIN users mgr    ON mgr.id = p.manager_id
JOIN milestones m ON m.project_id = p.id AND m.name = 'Design'
WHERE p.name = 'Customer Portal'
  AND NOT EXISTS (SELECT 1 FROM notifications n
                  WHERE n.recipient_id = mgr.id AND n.milestone_id = m.id AND n.title = 'Milestone review requested');
