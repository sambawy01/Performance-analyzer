-- 00010_create_wearable_metrics.sql
-- Aggregated wearable metrics per player per session. Pre-computed from hr_stream.

CREATE TABLE wearable_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wearable_session_id uuid NOT NULL REFERENCES wearable_sessions(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  hr_avg int NOT NULL,
  hr_max int NOT NULL,
  hr_min int NOT NULL,
  hr_zone_1_pct numeric(5,2) NOT NULL DEFAULT 0,
  hr_zone_2_pct numeric(5,2) NOT NULL DEFAULT 0,
  hr_zone_3_pct numeric(5,2) NOT NULL DEFAULT 0,
  hr_zone_4_pct numeric(5,2) NOT NULL DEFAULT 0,
  hr_zone_5_pct numeric(5,2) NOT NULL DEFAULT 0,
  hr_recovery_60s int,
  trimp_score numeric(8,2) NOT NULL DEFAULT 0,
  session_rpe int CHECK (session_rpe BETWEEN 1 AND 10),
  calories_estimated int,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, player_id)
);

CREATE INDEX idx_wearable_metrics_session ON wearable_metrics(session_id);
CREATE INDEX idx_wearable_metrics_player ON wearable_metrics(player_id);

COMMENT ON TABLE wearable_metrics IS 'Pre-computed HR metrics. Use for dashboard queries instead of parsing hr_stream.';
