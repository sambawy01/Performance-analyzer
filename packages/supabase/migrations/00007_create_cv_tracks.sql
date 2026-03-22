-- 00007_create_cv_tracks.sql
-- Raw CV output — player positions per frame. JSONB array for efficient storage.

CREATE TABLE cv_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id),
  track_data jsonb NOT NULL,
  jersey_number_detected int,
  identified_by text CHECK (identified_by IN ('manual', 'ocr')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cv_tracks_video ON cv_tracks(video_id);
CREATE INDEX idx_cv_tracks_player ON cv_tracks(player_id) WHERE player_id IS NOT NULL;

COMMENT ON TABLE cv_tracks IS 'Raw CV pipeline output. track_data is array of {frame, x, y, confidence}. player_id null until identification step.';
