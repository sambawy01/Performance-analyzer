-- 00004_create_sessions.sql
-- Training sessions and matches.

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES academies(id),
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('training', 'match', 'friendly')),
  location text NOT NULL CHECK (location IN ('October', 'New Cairo', 'Maadi', 'HQ')),
  duration_minutes int,
  age_group text NOT NULL CHECK (age_group IN ('2010', '2012', '2013')),
  weather_conditions text,
  coach_id uuid REFERENCES users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_academy_date ON sessions(academy_id, date DESC);
CREATE INDEX idx_sessions_age_group ON sessions(academy_id, age_group);
CREATE INDEX idx_sessions_coach ON sessions(coach_id) WHERE coach_id IS NOT NULL;

COMMENT ON TABLE sessions IS 'Training sessions, matches, and friendlies.';
