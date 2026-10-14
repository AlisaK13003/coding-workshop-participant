-- Extra demo data for trying the app by hand. Loaded after seed.sql by reset.sh
-- (skip it with `reset.sh <db> --seed-only`, as the automated tests do).
--
-- Dates are relative to the day you reset, so "ends in a week" stays true.
-- Every new account's password is Password123!, like the seed's.
--
-- People                                Projects they're on
--   Priya Shah     admin (second admin)
--   Riley Chen     manager of 1 project   Support Portal
--   Jordan Park    manager of 0 projects
--   Emery          employee (Morgan)      Customer Portal, Mobile App Refresh, Data Warehouse Migration
--   Devon Brooks   employee (Morgan)      Data Warehouse Migration, Mobile App Refresh
--   Casey Lopez    employee (Morgan)      Mobile App Refresh
--   Avery Kim      employee (Riley)       Support Portal
--   Blake Rivera   employee (Riley)       Support Portal
--   Quinn Patel    employee (Jordan)      none
--   Taylor Reed    employee (Riley), archived
--
-- Projects (D = the reset date)
--   Mobile App Refresh        Morgan  ends D+7    budget nearly used (~94%)
--   Data Warehouse Migration  Morgan  ends D+30   over budget (~118%)
--   Support Portal            Riley   ends D+90   under budget (~35%)
--   Vendor Onboarding         Morgan  abandoned (admins only)
--   Legacy Billing Cleanup    Morgan  completed and archived (Archive page)
--   Intranet Redesign         none    unarchived, waiting for a new manager (previously Riley)

-- Logs one 8-hour day for an employee on every matching weekday in a date range, at the
-- employee's current pay rate. Days already logged (one project per day) are skipped.
CREATE FUNCTION pg_temp.log_days(employee INTEGER, milestone INTEGER, first_day DATE, last_day DATE,
                                 weekdays INTEGER[] DEFAULT '{1,2,3,4,5}')
RETURNS VOID AS $$
    INSERT INTO work_logs (employee_id, project_id, milestone_id, work_date, hourly_rate, entered_by, created_at)
    SELECT u.id, m.project_id, m.id, day::date, round(u.annual_salary / 2080, 2), u.id, day + interval '17 hours'
    FROM users u, milestones m, generate_series(first_day, least(last_day, current_date - 1), interval '1 day') AS day
    WHERE u.id = employee AND m.id = milestone
      AND EXTRACT(ISODOW FROM day) = ANY (weekdays)
    ON CONFLICT (employee_id, work_date) DO NOTHING
$$ LANGUAGE sql;

-- Sets a project's budget so its labor cost uses `share` of it (1.18 = 18% over budget).
CREATE FUNCTION pg_temp.budget_for_share(project INTEGER, share NUMERIC) RETURNS VOID AS $$
    UPDATE projects SET budget = round((SELECT sum(hours * hourly_rate) FROM work_logs WHERE project_id = project) / share, -2)
    WHERE id = project
$$ LANGUAGE sql;

DO $$
DECLARE
    d DATE := current_date;
    pw TEXT := (SELECT password_hash FROM users WHERE username = 'eemployee3');
    alex INT := (SELECT id FROM users WHERE username = 'aadmin1');
    morgan INT := (SELECT id FROM users WHERE username = 'mmanager2');
    emery INT := (SELECT id FROM users WHERE username = 'eemployee3');
    priya INT; riley INT; jordan INT; casey INT; devon INT; avery INT; blake INT; quinn INT; taylor INT;
    mobile INT; warehouse INT; support INT; vendor INT; legacy INT; intranet INT;
    m_ux INT; m_build INT; m_release INT;
    m_schema INT; m_load INT; m_validation INT;
    m_discovery INT; m_kb INT; m_chatbot INT; m_golive INT;
    m_research INT; m_integration INT; m_audit INT; m_cleanup INT; m_requirements INT; m_pages INT;
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE lower(email) = 'priya@example.com') THEN
        RAISE NOTICE 'Demo data is already loaded.';
        RETURN;
    END IF;

    -- People ------------------------------------------------------------------------------
    INSERT INTO users (first_name, last_name, email, job_title, role, password_hash)
        VALUES ('Priya', 'Shah', 'priya@example.com', 'Head of Operations', 'admin', pw) RETURNING id INTO priya;
    INSERT INTO users (first_name, last_name, email, job_title, role, password_hash)
        VALUES ('Riley', 'Chen', 'riley@example.com', 'Product Manager', 'manager', pw) RETURNING id INTO riley;
    INSERT INTO users (first_name, last_name, email, job_title, role, password_hash)
        VALUES ('Jordan', 'Park', 'jordan@example.com', 'Delivery Manager', 'manager', pw) RETURNING id INTO jordan;
    INSERT INTO users (first_name, last_name, email, job_title, role, manager_id, annual_salary, password_hash)
        VALUES ('Casey', 'Lopez', 'casey@example.com', 'Frontend Engineer', 'employee', morgan, 72800, pw) RETURNING id INTO casey;
    INSERT INTO users (first_name, last_name, email, job_title, role, manager_id, annual_salary, password_hash)
        VALUES ('Devon', 'Brooks', 'devon@example.com', 'Data Engineer', 'employee', morgan, 93600, pw) RETURNING id INTO devon;
    INSERT INTO users (first_name, last_name, email, job_title, role, manager_id, annual_salary, password_hash)
        VALUES ('Avery', 'Kim', 'avery@example.com', 'QA Analyst', 'employee', riley, 62400, pw) RETURNING id INTO avery;
    INSERT INTO users (first_name, last_name, email, job_title, role, manager_id, annual_salary, password_hash)
        VALUES ('Blake', 'Rivera', 'blake@example.com', 'Support Engineer', 'employee', riley, 78000, pw) RETURNING id INTO blake;
    INSERT INTO users (first_name, last_name, email, job_title, role, manager_id, annual_salary, password_hash)
        VALUES ('Quinn', 'Patel', 'quinn@example.com', 'UX Designer', 'employee', jordan, 70720, pw) RETURNING id INTO quinn;
    INSERT INTO users (first_name, last_name, email, job_title, role, manager_id, annual_salary, password_hash, archived_at)
        VALUES ('Taylor', 'Reed', 'taylor@example.com', 'Technical Writer', 'employee', riley, 66560, pw, d - 10)
        RETURNING id INTO taylor;

    -- Projects and milestones -------------------------------------------------------------
    -- Mobile App Refresh: ends in a week, budget nearly used.
    INSERT INTO projects (name, manager_id, start_date, end_date, budget, created_at)
        VALUES ('Mobile App Refresh', morgan, d - 77, d + 7, 1, d - 80) RETURNING id INTO mobile;
    INSERT INTO milestones (project_id, name, start_date, end_date, completed_at)
        VALUES (mobile, 'UX Design', d - 77, d - 50, d - 50) RETURNING id INTO m_ux;
    INSERT INTO milestones (project_id, name, start_date, end_date)
        VALUES (mobile, 'Build', d - 49, d + 2) RETURNING id INTO m_build;
    INSERT INTO milestones (project_id, name, start_date, end_date)
        VALUES (mobile, 'Store Release', d + 3, d + 7) RETURNING id INTO m_release;
    INSERT INTO milestone_dependencies VALUES (m_build, m_ux, mobile), (m_release, m_build, mobile);

    -- Data Warehouse Migration: ends in a month, over budget.
    INSERT INTO projects (name, manager_id, start_date, end_date, budget, created_at)
        VALUES ('Data Warehouse Migration', morgan, d - 60, d + 30, 1, d - 62) RETURNING id INTO warehouse;
    INSERT INTO milestones (project_id, name, start_date, end_date, completed_at)
        VALUES (warehouse, 'Schema Mapping', d - 60, d - 35, d - 35) RETURNING id INTO m_schema;
    INSERT INTO milestones (project_id, name, start_date, end_date)
        VALUES (warehouse, 'Data Load', d - 34, d + 10) RETURNING id INTO m_load;
    INSERT INTO milestones (project_id, name, start_date, end_date)
        VALUES (warehouse, 'Validation', d + 11, d + 30) RETURNING id INTO m_validation;
    INSERT INTO milestone_dependencies VALUES (m_load, m_schema, warehouse), (m_validation, m_load, warehouse);

    -- Support Portal: ends in three months, under budget, with two parallel branches.
    INSERT INTO projects (name, manager_id, start_date, end_date, budget, created_at)
        VALUES ('Support Portal', riley, d - 20, d + 90, 1, d - 22) RETURNING id INTO support;
    INSERT INTO milestones (project_id, name, start_date, end_date, completed_at)
        VALUES (support, 'Discovery', d - 20, d - 6, d - 6) RETURNING id INTO m_discovery;
    INSERT INTO milestones (project_id, name, start_date, end_date)
        VALUES (support, 'Knowledge Base', d - 5, d + 40) RETURNING id INTO m_kb;
    INSERT INTO milestones (project_id, name, start_date, end_date)
        VALUES (support, 'Chatbot', d - 5, d + 50) RETURNING id INTO m_chatbot;
    INSERT INTO milestones (project_id, name, start_date, end_date)
        VALUES (support, 'Go Live', d + 51, d + 90) RETURNING id INTO m_golive;
    INSERT INTO milestone_dependencies VALUES
        (m_kb, m_discovery, support), (m_chatbot, m_discovery, support),
        (m_golive, m_kb, support), (m_golive, m_chatbot, support);

    -- Vendor Onboarding: abandoned, not archived (only admins see it).
    INSERT INTO projects (name, manager_id, start_date, end_date, budget, status, created_at)
        VALUES ('Vendor Onboarding', morgan, d - 120, d - 30, 20000, 'abandoned', d - 122) RETURNING id INTO vendor;
    INSERT INTO milestones (project_id, name, start_date, end_date, completed_at)
        VALUES (vendor, 'Vendor Research', d - 120, d - 90, d - 90) RETURNING id INTO m_research;
    INSERT INTO milestones (project_id, name, start_date, end_date)
        VALUES (vendor, 'Integration', d - 89, d - 30) RETURNING id INTO m_integration;
    INSERT INTO milestone_dependencies VALUES (m_integration, m_research, vendor);

    -- Legacy Billing Cleanup: completed and archived (Archive page).
    INSERT INTO projects (name, manager_id, start_date, end_date, budget, status, archived_at, created_at)
        VALUES ('Legacy Billing Cleanup', morgan, d - 200, d - 100, 1, 'completed', d - 90, d - 202) RETURNING id INTO legacy;
    INSERT INTO milestones (project_id, name, start_date, end_date, completed_at)
        VALUES (legacy, 'Audit', d - 200, d - 150, d - 150) RETURNING id INTO m_audit;
    INSERT INTO milestones (project_id, name, start_date, end_date, completed_at)
        VALUES (legacy, 'Cleanup', d - 149, d - 100, d - 100) RETURNING id INTO m_cleanup;
    INSERT INTO milestone_dependencies VALUES (m_cleanup, m_audit, legacy);

    -- Intranet Redesign: abandoned under Riley, archived, then unarchived. Reopened with no
    -- manager or members until an admin assigns one.
    INSERT INTO projects (name, manager_id, start_date, end_date, budget, created_at)
        VALUES ('Intranet Redesign', NULL, d - 30, d + 60, 18000, d - 32) RETURNING id INTO intranet;
    INSERT INTO milestones (project_id, name, start_date, end_date, completed_at)
        VALUES (intranet, 'Requirements', d - 30, d - 21, d - 21) RETURNING id INTO m_requirements;
    INSERT INTO milestones (project_id, name, start_date, end_date)
        VALUES (intranet, 'Build Pages', d - 20, d + 60) RETURNING id INTO m_pages;
    INSERT INTO milestone_dependencies VALUES (m_pages, m_requirements, intranet);

    -- Memberships (each employee on one milestone per project) ----------------------------
    INSERT INTO project_members (project_id, employee_id, milestone_id, added_at) VALUES
        (mobile, emery, m_build, d - 50),
        (mobile, casey, m_build, d - 77),
        (mobile, devon, m_release, d - 10),      -- waiting on a blocked milestone
        (warehouse, emery, m_load, d - 40),
        (warehouse, devon, m_load, d - 60),
        (support, avery, m_kb, d - 20),
        (support, blake, m_chatbot, d - 20),
        (vendor, casey, m_integration, d - 120),
        (legacy, devon, m_cleanup, d - 200);
    INSERT INTO project_members (project_id, employee_id, milestone_id, added_at, removed_at) VALUES
        (intranet, blake, m_pages, d - 30, d - 3);  -- cleared when the project was unarchived

    -- Work history (weekdays only; one project per person per day) -------------------------
    PERFORM pg_temp.log_days(casey, m_ux, d - 77, d - 50);
    PERFORM pg_temp.log_days(casey, m_build, d - 49, d - 1);
    PERFORM pg_temp.log_days(emery, m_build, d - 49, d - 1, '{1,3,5}');
    PERFORM pg_temp.log_days(devon, m_schema, d - 60, d - 35, '{1,3,5}');
    PERFORM pg_temp.log_days(devon, m_load, d - 34, d - 1, '{1,3,5}');
    PERFORM pg_temp.log_days(emery, m_schema, d - 60, d - 35, '{2,4}');
    PERFORM pg_temp.log_days(emery, m_load, d - 34, d - 1, '{2,4}');
    PERFORM pg_temp.log_days(avery, m_discovery, d - 20, d - 6);
    PERFORM pg_temp.log_days(avery, m_kb, d - 5, d - 1);
    PERFORM pg_temp.log_days(blake, m_requirements, d - 30, d - 21);
    PERFORM pg_temp.log_days(blake, m_discovery, d - 20, d - 6, '{2,4}');
    PERFORM pg_temp.log_days(blake, m_chatbot, d - 5, d - 1);
    PERFORM pg_temp.log_days(casey, m_research, d - 120, d - 90, '{1,2,3}');
    PERFORM pg_temp.log_days(casey, m_integration, d - 89, d - 78, '{1,2,3}');
    PERFORM pg_temp.log_days(devon, m_audit, d - 200, d - 150, '{2,4}');
    PERFORM pg_temp.log_days(devon, m_cleanup, d - 149, d - 100, '{2,4}');
    -- One correction entered by an admin, so the "historical" marker shows up.
    UPDATE work_logs SET entered_by = priya
        WHERE id = (SELECT min(id) FROM work_logs WHERE employee_id = casey AND milestone_id = m_build);

    PERFORM pg_temp.budget_for_share(mobile, 0.94);
    PERFORM pg_temp.budget_for_share(warehouse, 1.18);
    PERFORM pg_temp.budget_for_share(support, 0.35);
    PERFORM pg_temp.budget_for_share(legacy, 0.88);

    -- Reviews -----------------------------------------------------------------------------
    INSERT INTO milestone_reviews (milestone_id, requested_by, requested_at, decision, decided_by, decided_at, feedback) VALUES
        (m_ux, casey, d - 53, 'kept_open', morgan, d - 52, 'Tablet layouts still need a pass.'),
        (m_ux, casey, d - 51, 'accepted', morgan, d - 50, 'Looks great, thanks!'),
        (m_schema, devon, d - 36, 'accepted', morgan, d - 35, NULL),
        (m_discovery, avery, d - 7, 'accepted', riley, d - 6, 'Clear findings. Split into two tracks.');
    -- Waiting for Morgan's decision.
    INSERT INTO milestone_reviews (milestone_id, requested_by, requested_at)
        VALUES (m_load, devon, d - 1);

    -- Notifications -----------------------------------------------------------------------
    INSERT INTO notifications (recipient_id, title, detail, project_id, milestone_id, created_at, read_at) VALUES
        (morgan, 'Milestone review requested', 'Devon Brooks · Data Load', warehouse, m_load, d - 1, NULL),
        (devon, 'Milestone assignment changed', 'Mobile App Refresh · Store Release', mobile, m_release, d - 10, NULL),
        (casey, 'Review accepted', 'Looks great, thanks!', mobile, m_ux, d - 50, d - 49),
        (casey, 'Moved to Build', 'Mobile App Refresh · UX Design completed', mobile, m_build, d - 50, d - 49),
        (avery, 'Review accepted', 'Clear findings. Split into two tracks.', support, m_discovery, d - 6, NULL),
        (avery, 'Moved to Knowledge Base', 'Support Portal · Discovery completed', support, m_kb, d - 6, NULL),
        (blake, 'Moved to Chatbot', 'Support Portal · Discovery completed', support, m_chatbot, d - 6, d - 5),
        (blake, 'Removed from project', 'Intranet Redesign', intranet, NULL, d - 3, NULL),
        (riley, 'New project assigned', 'Support Portal', support, NULL, d - 22, d - 21),
        (emery, 'Added to project', 'Data Warehouse Migration', warehouse, NULL, d - 40, d - 39);

    -- Activity ----------------------------------------------------------------------------
    INSERT INTO activity_log (actor_id, actor_role, action, entity_type, entity_id, project_id, summary, changes, created_at) VALUES
        (alex, 'admin', 'user.create', 'user', priya, NULL, 'Created admin Priya Shah.', NULL, d - 210),
        (priya, 'admin', 'project.create', 'project', legacy, legacy, 'Created project Legacy Billing Cleanup, managed by Morgan Manager.', NULL, d - 202),
        (morgan, 'manager', 'project.complete', 'project', legacy, legacy, 'Completed project Legacy Billing Cleanup.', NULL, d - 95),
        (priya, 'admin', 'project.archive', 'project', legacy, legacy, 'Archived project Legacy Billing Cleanup.', NULL, d - 90),
        (priya, 'admin', 'project.create', 'project', vendor, vendor, 'Created project Vendor Onboarding, managed by Morgan Manager.', NULL, d - 122),
        (alex, 'admin', 'project.abandon', 'project', vendor, vendor, 'Abandoned project Vendor Onboarding.', NULL, d - 30),
        (alex, 'admin', 'project.create', 'project', mobile, mobile, 'Created project Mobile App Refresh, managed by Morgan Manager.', NULL, d - 80),
        (alex, 'admin', 'project.create', 'project', warehouse, warehouse, 'Created project Data Warehouse Migration, managed by Morgan Manager.', NULL, d - 62),
        (priya, 'admin', 'project.create', 'project', support, support, 'Created project Support Portal, managed by Riley Chen.', NULL, d - 22),
        (riley, 'manager', 'review.accept', 'milestone', m_discovery, support, 'Accepted the review of Discovery.', NULL, d - 6),
        (morgan, 'manager', 'project.update', 'project', warehouse, warehouse, 'Updated Data Warehouse Migration.',
            jsonb_build_object('end_date', jsonb_build_object('from', d + 15, 'to', d + 30)), d - 20),
        (priya, 'admin', 'project.abandon', 'project', intranet, intranet, 'Abandoned project Intranet Redesign.', NULL, d - 5),
        (priya, 'admin', 'project.archive', 'project', intranet, intranet, 'Archived project Intranet Redesign.', NULL, d - 4),
        (alex, 'admin', 'project.unarchive', 'project', intranet, intranet,
            'Unarchived and reopened project Intranet Redesign; its manager and members were cleared.',
            jsonb_build_object('manager_id', jsonb_build_object('from', riley, 'to', NULL),
                               'status', jsonb_build_object('from', 'abandoned', 'to', 'in_progress')), d - 3),
        (alex, 'admin', 'user.archive', 'user', taylor, NULL, 'Archived Taylor Reed.', NULL, d - 10),
        (devon, 'employee', 'review.request', 'milestone_review',
            (SELECT max(id) FROM milestone_reviews WHERE milestone_id = m_load), warehouse, 'Requested review of Data Load.', NULL, d - 1);
END
$$;
