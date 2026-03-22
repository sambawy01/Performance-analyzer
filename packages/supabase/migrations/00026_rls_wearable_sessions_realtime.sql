-- 00026_rls_wearable_sessions_realtime.sql
-- Ensure the live dashboard can receive Realtime updates on wearable_sessions.
-- Supabase Realtime respects RLS: authenticated users only receive rows they
-- can SELECT. The wearable_sessions_read policy (migration 00020) already
-- covers SELECT access via session academy + age_group checks.
--
-- This migration adds the SELECT policy only if it wasn't created by 00020,
-- preventing a duplicate-policy error when re-running migrations from scratch.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'wearable_sessions'
      AND policyname = 'wearable_sessions_read'
  ) THEN
    CREATE POLICY wearable_sessions_read
      ON wearable_sessions
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM sessions s
          WHERE s.id = wearable_sessions.session_id
            AND s.academy_id = (auth_user()).academy_id
            AND (
              (auth_user()).role IN ('director', 'analyst')
              OR s.age_group = ANY((auth_user()).age_groups_visible)
            )
        )
      );
  END IF;
END $$;

-- Grant service_role full access so the Edge Function can INSERT/UPDATE
-- wearable_sessions rows (service role bypasses RLS, but being explicit
-- helps if the role is ever downgraded).
GRANT SELECT, INSERT, UPDATE, DELETE ON wearable_sessions TO service_role;
