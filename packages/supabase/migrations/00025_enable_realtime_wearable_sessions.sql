-- 00025_enable_realtime_wearable_sessions.sql
-- Enable Supabase Realtime on wearable_sessions so the live HR dashboard
-- receives postgres_changes events when hr_stream is updated by the
-- mock-hr-stream Edge Function or the real ESP32 ingest endpoint.

ALTER PUBLICATION supabase_realtime ADD TABLE wearable_sessions;
