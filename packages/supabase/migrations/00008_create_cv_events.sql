-- 00008_create_cv_events.sql
-- Events detected by CV pipeline — sprints, goals, pressing triggers, etc.

CREATE TABLE cv_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id),
  event_type text NOT NULL
    CHECK (event_type IN ('sprint', 'deceleration', 'pressing_trigger', 'shot', 'goal', 'formation_shift')),
  start_frame int NOT NULL,
  end_frame int NOT NULL,
  start_time numeric(10,2) NOT NULL,
  end_time numeric(10,2) NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  clip_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_frame_range CHECK (end_frame >= start_frame),
  CONSTRAINT valid_time_range CHECK (end_time >= start_time)
);

CREATE INDEX idx_cv_events_video ON cv_events(video_id);
CREATE INDEX idx_cv_events_player ON cv_events(player_id) WHERE player_id IS NOT NULL;
CREATE INDEX idx_cv_events_type ON cv_events(event_type);

COMMENT ON TABLE cv_events IS 'CV-detected events with timestamps and extracted video clips.';
