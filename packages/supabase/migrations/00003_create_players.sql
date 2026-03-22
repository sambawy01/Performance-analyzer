-- 00003_create_players.sql
-- Player profiles for all academy scholars.

CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES academies(id),
  name text NOT NULL,
  dob date NOT NULL,
  position text NOT NULL CHECK (position IN ('GK', 'CB', 'FB', 'CM', 'CAM', 'W', 'ST')),
  jersey_number int NOT NULL,
  age_group text NOT NULL CHECK (age_group IN ('2010', '2012', '2013')),
  height_cm int,
  weight_kg numeric(5,2),
  dominant_foot text NOT NULL DEFAULT 'right' CHECK (dominant_foot IN ('left', 'right', 'both')),
  photo_url text,
  hr_max_measured int,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'injured', 'inactive')),
  consent_status text NOT NULL DEFAULT 'pending' CHECK (consent_status IN ('pending', 'granted', 'revoked')),
  consent_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_academy ON players(academy_id);
CREATE INDEX idx_players_age_group ON players(academy_id, age_group);

COMMENT ON TABLE players IS 'Academy players. consent_status required before data collection (youth data privacy).';
