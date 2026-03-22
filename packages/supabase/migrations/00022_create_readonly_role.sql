-- 00022_create_readonly_role.sql
-- Read-only Postgres role for AI NL query engine (text-to-SQL safety).

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'analyzer_readonly') THEN
    CREATE ROLE analyzer_readonly NOLOGIN;
  END IF;
END $$;

-- Grant read-only on all current tables
GRANT USAGE ON SCHEMA public TO analyzer_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analyzer_readonly;

-- Auto-grant on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO analyzer_readonly;

COMMENT ON ROLE analyzer_readonly IS 'Read-only role for AI NL query engine. SET ROLE at function entry, semicolon rejection before execution.';
