-- 00013_create_player_baselines.sql
-- Rolling averages for comparison and injury risk alerts. Recalculated after each session.

CREATE TABLE player_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  period text NOT NULL CHECK (period IN ('7d', '14d', '28d')),
  avg_distance_m numeric(8,2),
  avg_max_speed_kmh numeric(5,2),
  avg_sprint_count numeric(5,2),
  avg_hr numeric(5,2),
  avg_trimp numeric(8,2),
  avg_decel_events numeric(5,2),
  calculated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, period)
);

CREATE INDEX idx_baselines_player ON player_baselines(player_id);

COMMENT ON TABLE player_baselines IS 'Rolling averages per player. UNIQUE on (player_id, period) — upserted after each session.';
