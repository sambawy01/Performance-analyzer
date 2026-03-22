-- 00002_create_users.sql
-- Staff users: coaches, analysts, directors. Linked to Supabase Auth.

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES academies(id),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  role text NOT NULL CHECK (role IN ('coach', 'analyst', 'director')),
  age_groups_visible text[] NOT NULL DEFAULT '{}',
  notification_preferences jsonb DEFAULT '{}',
  auth_user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_academy ON users(academy_id);
CREATE INDEX idx_users_auth ON users(auth_user_id);

COMMENT ON TABLE users IS 'Staff users with role-based access. auth_user_id links to Supabase Auth.';
