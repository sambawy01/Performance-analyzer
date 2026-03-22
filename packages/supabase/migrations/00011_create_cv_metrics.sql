-- 00011_create_cv_metrics.sql
-- CV-derived physical metrics per player per session.

CREATE TABLE cv_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  total_distance_m numeric(8,2),
  distance_per_min numeric(6,2),
  max_speed_kmh numeric(5,2),
  avg_speed_kmh numeric(5,2),
  sprint_count int DEFAULT 0,
  sprint_distance_m numeric(8,2) DEFAULT 0,
  high_speed_run_count int DEFAULT 0,
  high_speed_run_distance_m numeric(8,2) DEFAULT 0,
  accel_events int DEFAULT 0,
  decel_events int DEFAULT 0,
  heatmap_data jsonb,
  avg_position_x numeric(6,2),
  avg_position_y numeric(6,2),
  time_in_zones jsonb,
  off_ball_movement_score numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, player_id, video_id)
);

CREATE INDEX idx_cv_metrics_session ON cv_metrics(session_id);
CREATE INDEX idx_cv_metrics_player ON cv_metrics(player_id);

COMMENT ON TABLE cv_metrics IS 'Physical metrics derived from CV pipeline positional data. Distance, speed, and sprint data comes from video, not wearable.';
