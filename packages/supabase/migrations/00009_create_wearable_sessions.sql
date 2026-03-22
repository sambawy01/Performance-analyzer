-- 00009_create_wearable_sessions.sql
-- Per-player wearable session records. hr_stream stores raw 4Hz HR data as JSONB array.

CREATE TABLE wearable_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  device_type text NOT NULL CHECK (device_type IN ('magene_h303', 'polar_verity_sense')),
  device_id text NOT NULL,
  started_at timestamptz,
  ended_at timestamptz,
  hr_stream jsonb,
  UNIQUE(session_id, player_id)
);

CREATE INDEX idx_wearable_sessions_session ON wearable_sessions(session_id);
CREATE INDEX idx_wearable_sessions_player ON wearable_sessions(player_id);

COMMENT ON TABLE wearable_sessions IS 'ANT+ chest strap session records. hr_stream: array of {timestamp_ms, hr} at 4Hz. ~150KB per player per 90-min session.';
COMMENT ON COLUMN wearable_sessions.hr_stream IS 'Array of {timestamp_ms: number, hr: number}. ~21,600 entries for 90min at 4Hz.';
