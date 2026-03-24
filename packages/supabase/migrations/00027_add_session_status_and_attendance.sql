-- 00027_add_session_status_and_attendance.sql
-- Add session lifecycle status + session attendance tracking + recovery type.

-- 1. Add status column to sessions
ALTER TABLE sessions
  ADD COLUMN status text NOT NULL DEFAULT 'planned'
  CHECK (status IN ('planned', 'active', 'completed', 'reviewed'));

-- 2. Add 'recovery' to the session type check constraint
ALTER TABLE sessions DROP CONSTRAINT sessions_type_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_type_check
  CHECK (type IN ('training', 'match', 'friendly', 'recovery'));

-- 3. Create session_attendance table
CREATE TABLE session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  attended boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, player_id)
);

CREATE INDEX idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_player ON session_attendance(player_id);
CREATE INDEX idx_sessions_status ON sessions(status);

COMMENT ON TABLE session_attendance IS 'Tracks which players attended each session.';
COMMENT ON COLUMN sessions.status IS 'Session lifecycle: planned → active → completed → reviewed.';
