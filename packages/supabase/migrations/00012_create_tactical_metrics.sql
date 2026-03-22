-- 00012_create_tactical_metrics.sql
-- Team-level tactical metrics per session, derived from CV positional data.

CREATE TABLE tactical_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
  avg_formation text,
  compactness_avg numeric(6,2),
  compactness_std numeric(6,2),
  defensive_line_height_avg numeric(6,2),
  team_width_avg numeric(6,2),
  team_length_avg numeric(6,2),
  pressing_intensity numeric(6,2),
  transition_speed_atk_s numeric(6,2),
  transition_speed_def_s numeric(6,2),
  possession_pct numeric(5,2),
  formation_snapshots jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE tactical_metrics IS 'Team-level tactical analysis per session. Requires CV pipeline data (not available for Veo-link-only sessions).';
