-- 00015_create_ai_reports.sql
-- All AI-generated reports. Stores prompt for debugging and cost tracking.

CREATE TABLE ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  report_type text NOT NULL
    CHECK (report_type IN ('session_card', 'fatigue_alert', 'comparison', 'tactical', 'highlight_reel', 'nl_query_response', 'development')),
  prompt_used text NOT NULL,
  response jsonb NOT NULL,
  model_used text NOT NULL,
  tokens_used int NOT NULL DEFAULT 0,
  cost_usd numeric(8,4) NOT NULL DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_reports_session ON ai_reports(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_ai_reports_player ON ai_reports(player_id) WHERE player_id IS NOT NULL;
CREATE INDEX idx_ai_reports_type ON ai_reports(report_type);

COMMENT ON TABLE ai_reports IS 'All Claude API generated reports. prompt_used stored for debugging and prompt improvement.';
