-- Sample data for local development. Run after schema.sql:
--   psql -h localhost -U postgres -d project_tracker -f backend/db/seed.sql
-- Safe to run more than once: rows whose email already exists are skipped.

INSERT INTO users (name, email, role) VALUES
    ('Alex Admin',     'alex@example.com',   'admin'),
    ('Morgan Manager', 'morgan@example.com', 'manager'),
    ('Emery Employee', 'emery@example.com',  'employee')
ON CONFLICT (email) DO NOTHING;
