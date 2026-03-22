-- 00018_create_development_snapshots.sql
-- Monthly player development tracking — the youth development differentiator.

CREATE TABLE development_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  month date NOT NULL,
  physical_score numeric(5,2),
  tactical_score numeric(5,2),
  workload_score numeric(5,2),
  metrics_summary jsonb NOT NULL DEFAULT '{}',
  ai_development_narrative text,
  trend text NOT NULL DEFAULT 'stable' CHECK (trend IN ('improving', 'stable', 'declining')),
  benchmarks_vs_age_group jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, month)
);

CREATE INDEX idx_dev_snapshots_player ON development_snapshots(player_id);

COMMENT ON TABLE development_snapshots IS 'Monthly longitudinal player development. The competitive differentiator for youth academies.';
