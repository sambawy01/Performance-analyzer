-- 00001_create_academies.sql
-- Academies table — multi-tenancy root. Single row for The Maker initially.

CREATE TABLE academies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL DEFAULT 'EG',
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE academies IS 'Football academies using the Performance Analyzer';
