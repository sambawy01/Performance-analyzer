-- ============================================================================
-- Coach M8 — Wellness Check-In Table
-- Captures daily subjective wellness + objective wearable overnight data
-- for injury prevention and recovery monitoring.
--
-- Reference: Saw et al. (2016) — Monitoring athletic fatigue via wellness
-- Reference: Plews et al. (2013) — HRV as a training monitoring tool
-- ============================================================================

CREATE TABLE wellness_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  date date NOT NULL,

  -- Subjective (1-5 scales)
  soreness int CHECK (soreness BETWEEN 1 AND 5),     -- 1=none, 5=severe
  energy int CHECK (energy BETWEEN 1 AND 5),          -- 1=exhausted, 5=high
  sleep_quality int CHECK (sleep_quality BETWEEN 1 AND 5), -- 1=terrible, 5=great
  mood int CHECK (mood BETWEEN 1 AND 5),              -- 1=low, 5=great

  -- Objective
  sleep_hours numeric(3,1),       -- total sleep duration
  hrv_rmssd numeric(6,2),         -- HRV RMSSD in ms (from wearable overnight)
  resting_hr int,                 -- resting heart rate (from wearable overnight)

  -- Free text
  notes text,

  created_at timestamptz DEFAULT now(),

  -- One check-in per player per day
  UNIQUE(player_id, date)
);

-- Index for fast lookups by player + date range
CREATE INDEX idx_wellness_player_date ON wellness_checkins(player_id, date DESC);

-- Enable RLS (policies to be added based on app auth model)
ALTER TABLE wellness_checkins ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read wellness data for their academy's players
CREATE POLICY "Users can read wellness for their academy players"
  ON wellness_checkins FOR SELECT
  USING (
    player_id IN (
      SELECT p.id FROM players p
      JOIN users u ON u.academy_id = p.academy_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Allow authenticated users to insert wellness data for their academy's players
CREATE POLICY "Users can insert wellness for their academy players"
  ON wellness_checkins FOR INSERT
  WITH CHECK (
    player_id IN (
      SELECT p.id FROM players p
      JOIN users u ON u.academy_id = p.academy_id
      WHERE u.auth_user_id = auth.uid()
    )
  );
