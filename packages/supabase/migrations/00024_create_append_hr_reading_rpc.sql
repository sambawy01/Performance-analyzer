-- 00024_create_append_hr_reading_rpc.sql
-- RPC function to efficiently append a single HR reading to a wearable_session's hr_stream.
-- Used by the mock-hr-stream Edge Function and the real ESP32 ingest endpoint.
--
-- Called via supabase.rpc('append_hr_reading', { p_session_id, p_player_id, p_reading })

CREATE OR REPLACE FUNCTION append_hr_reading(
  p_session_id uuid,
  p_player_id uuid,
  p_reading jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wearable_sessions
  SET hr_stream = COALESCE(hr_stream, '[]'::jsonb) || jsonb_build_array(p_reading)
  WHERE session_id = p_session_id
    AND player_id = p_player_id;
END;
$$;

COMMENT ON FUNCTION append_hr_reading IS
  'Appends a single {timestamp_ms, hr} reading to wearable_sessions.hr_stream. '
  'Used by the ESP32 ingest endpoint and the mock-hr-stream Edge Function.';
