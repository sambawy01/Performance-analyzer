-- 00017_create_highlight_reels.sql
-- AI-curated or coach-built highlight reels with ordered clip references.

CREATE TABLE highlight_reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  clips jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'shared')),
  generated_by text NOT NULL CHECK (generated_by IN ('ai', 'coach')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_highlights_session ON highlight_reels(session_id);

COMMENT ON TABLE highlight_reels IS 'Ordered clip collections. clips: array of {cv_event_id, start_time, end_time, label, significance_score}.';
