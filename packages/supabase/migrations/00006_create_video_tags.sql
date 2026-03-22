-- 00006_create_video_tags.sql
-- Manual video tags added by coaches. Primary input for Veo-linked sessions.

CREATE TABLE video_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  timestamp_start numeric(10,2) NOT NULL,
  timestamp_end numeric(10,2) NOT NULL,
  tag_type text NOT NULL CHECK (tag_type IN ('goal', 'sprint', 'press', 'dribble', 'pass', 'tackle', 'custom')),
  label text,
  tagged_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_timestamp_range CHECK (timestamp_end > timestamp_start)
);

CREATE INDEX idx_video_tags_video ON video_tags(video_id);
CREATE INDEX idx_video_tags_player ON video_tags(player_id);

COMMENT ON TABLE video_tags IS 'Coach-created tags on video moments. Bridge for Veo-linked sessions without CV processing.';
