-- 00005_create_videos.sql
-- Video records. Supports both Veo links and uploaded MP4s.

CREATE TABLE videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('veo_link', 'uploaded_mp4', 'other_link')),
  source_url text,
  file_url text,
  duration_seconds int,
  resolution text,
  fps int,
  processing_status text NOT NULL DEFAULT 'linked'
    CHECK (processing_status IN ('linked', 'uploaded', 'queued', 'processing', 'complete', 'failed')),
  homography_matrix jsonb,
  processed_at timestamptz,
  thumbnail_url text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_videos_session ON videos(session_id);
CREATE INDEX idx_videos_status ON videos(processing_status) WHERE processing_status IN ('uploaded', 'queued', 'processing');

COMMENT ON TABLE videos IS 'Video records. source_type determines whether this is a Veo link embed or an uploaded MP4 for CV processing.';
