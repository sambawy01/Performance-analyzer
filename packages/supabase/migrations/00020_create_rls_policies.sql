-- 00020_create_rls_policies.sql
-- RLS policies for role-based access.
-- Pattern: lookup user's academy_id and role from users table via auth.uid().

-- Helper function: get current user's record.
-- NOTE: RETURNS users is bound to the table definition at creation time.
-- If the users table schema changes, this function must be recreated via:
--   CREATE OR REPLACE FUNCTION auth_user() RETURNS users ...
CREATE OR REPLACE FUNCTION auth_user()
RETURNS users AS $$
  SELECT * FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- === ACADEMIES ===
CREATE POLICY "users can read own academy"
  ON academies FOR SELECT USING (
    id = (auth_user()).academy_id
  );

-- === USERS ===
CREATE POLICY "users can read users in same academy"
  ON users FOR SELECT USING (
    academy_id = (auth_user()).academy_id
  );

CREATE POLICY "directors can insert users"
  ON users FOR INSERT WITH CHECK (
    academy_id = (auth_user()).academy_id
    AND (auth_user()).role = 'director'
  );

CREATE POLICY "directors can update users"
  ON users FOR UPDATE USING (
    academy_id = (auth_user()).academy_id
    AND (auth_user()).role = 'director'
  );

-- === PLAYERS ===
CREATE POLICY "players_read"
  ON players FOR SELECT USING (
    academy_id = (auth_user()).academy_id
    AND (
      (auth_user()).role IN ('director', 'analyst')
      OR age_group = ANY((auth_user()).age_groups_visible)
    )
  );

CREATE POLICY "staff can insert players"
  ON players FOR INSERT WITH CHECK (
    academy_id = (auth_user()).academy_id
    AND (auth_user()).role IN ('director', 'analyst')
  );

CREATE POLICY "staff can update players"
  ON players FOR UPDATE USING (
    academy_id = (auth_user()).academy_id
    AND (auth_user()).role IN ('director', 'analyst')
  );

-- === SESSIONS ===
CREATE POLICY "sessions_read"
  ON sessions FOR SELECT USING (
    academy_id = (auth_user()).academy_id
    AND (
      (auth_user()).role IN ('director', 'analyst')
      OR age_group = ANY((auth_user()).age_groups_visible)
    )
  );

CREATE POLICY "staff can insert sessions"
  ON sessions FOR INSERT WITH CHECK (
    academy_id = (auth_user()).academy_id
  );

CREATE POLICY "staff can update sessions"
  ON sessions FOR UPDATE USING (
    academy_id = (auth_user()).academy_id
  );

-- === Helper: check session access (academy + age group for coaches) ===
-- Used by all child-table policies that join through sessions.

-- === VIDEOS ===
-- Access follows session access (via session_id FK) with age_group filtering
CREATE POLICY "videos_read"
  ON videos FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = videos.session_id
      AND s.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR s.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );

CREATE POLICY "staff can insert videos"
  ON videos FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = videos.session_id
      AND s.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR s.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );

-- === VIDEO TAGS ===
CREATE POLICY "video_tags_read"
  ON video_tags FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM videos v
      JOIN sessions s ON s.id = v.session_id
      WHERE v.id = video_tags.video_id
      AND s.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR s.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );

CREATE POLICY "staff can insert video_tags"
  ON video_tags FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM videos v
      JOIN sessions s ON s.id = v.session_id
      WHERE v.id = video_tags.video_id
      AND s.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR s.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );

-- === CV TRACKS, CV EVENTS, CV METRICS ===
-- Written by service role (Mac Mini), read by staff via session access with age_group filtering

CREATE POLICY "cv_tracks_read"
  ON cv_tracks FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM videos v
      JOIN sessions s ON s.id = v.session_id
      WHERE v.id = cv_tracks.video_id
      AND s.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR s.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );

CREATE POLICY "cv_events_read"
  ON cv_events FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM videos v
      JOIN sessions s ON s.id = v.session_id
      WHERE v.id = cv_events.video_id
      AND s.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR s.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );

CREATE POLICY "cv_metrics_read"
  ON cv_metrics FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = cv_metrics.session_id
      AND s.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR s.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );

-- === WEARABLE SESSIONS & METRICS ===
CREATE POLICY "wearable_sessions_read"
  ON wearable_sessions FOR SELECT USING (
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

CREATE POLICY "wearable_metrics_read"
  ON wearable_metrics FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = wearable_metrics.session_id
      AND s.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR s.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );

-- === TACTICAL METRICS ===
CREATE POLICY "tactical_metrics_read"
  ON tactical_metrics FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = tactical_metrics.session_id
      AND s.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR s.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );

-- === PLAYER BASELINES ===
CREATE POLICY "baselines_read"
  ON player_baselines FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_baselines.player_id
      AND p.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR p.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );

-- === LOAD RECORDS ===
CREATE POLICY "load_records_read"
  ON load_records FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = load_records.player_id
      AND p.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR p.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );

-- === AI REPORTS ===
CREATE POLICY "ai_reports_read"
  ON ai_reports FOR SELECT USING (
    -- Session-bound reports: follow session access with age_group
    (session_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = ai_reports.session_id
      AND s.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR s.age_group = ANY((auth_user()).age_groups_visible)
      )
    ))
    OR
    -- Player-bound reports (no session): follow player access with age_group
    (session_id IS NULL AND player_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = ai_reports.player_id
      AND p.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR p.age_group = ANY((auth_user()).age_groups_visible)
      )
    ))
  );

-- AI reports are inserted by Edge Functions via service role key, not by end users directly.
-- No INSERT policy needed — service role bypasses RLS.

-- === AI QUERIES ===
CREATE POLICY "users can read own queries"
  ON ai_queries FOR SELECT USING (
    user_id = (auth_user()).id
    OR (auth_user()).role IN ('director', 'analyst')
  );

CREATE POLICY "users can insert queries"
  ON ai_queries FOR INSERT WITH CHECK (
    user_id = (auth_user()).id
  );

-- === HIGHLIGHT REELS ===
CREATE POLICY "highlight_reels_read"
  ON highlight_reels FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = highlight_reels.session_id
      AND s.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR s.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );

CREATE POLICY "staff can insert highlight_reels"
  ON highlight_reels FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = highlight_reels.session_id
      AND s.academy_id = (auth_user()).academy_id
    )
  );

-- === DEVELOPMENT SNAPSHOTS ===
CREATE POLICY "dev_snapshots_read"
  ON development_snapshots FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = development_snapshots.player_id
      AND p.academy_id = (auth_user()).academy_id
      AND (
        (auth_user()).role IN ('director', 'analyst')
        OR p.age_group = ANY((auth_user()).age_groups_visible)
      )
    )
  );
