-- 00014_create_load_records.sql
-- Daily load tracking for ACWR calculation and injury risk flagging.

CREATE TABLE load_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  date date NOT NULL,
  daily_load numeric(8,2) NOT NULL,
  acute_load_7d numeric(8,2) NOT NULL,
  chronic_load_28d numeric(8,2) NOT NULL,
  acwr_ratio numeric(4,2) NOT NULL,
  risk_flag text NOT NULL DEFAULT 'green'
    CHECK (risk_flag IN ('blue', 'green', 'amber', 'red')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, session_id)
);

CREATE INDEX idx_load_records_player_date ON load_records(player_id, date DESC);
CREATE INDEX idx_load_records_risk ON load_records(risk_flag) WHERE risk_flag IN ('amber', 'red');

COMMENT ON TABLE load_records IS 'ACWR tracking. risk_flag: blue (<0.8), green (0.8-1.3), amber (1.3-1.5), red (>1.5).';
