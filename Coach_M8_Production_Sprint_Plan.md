# Coach M8 — Production Build Sprint Plan

**Goal:** Take Coach M8 from demo to fully functioning production tool
**Timeline:** 2 weeks (10 working days)
**Start:** March 25, 2026

---

## Current State (What's Broken)

| Issue | Impact | Severity |
|-------|--------|----------|
| Supabase is local (127.0.0.1) | Vercel site has NO data | CRITICAL |
| No data entry UI | Coaches can't add players or sessions | CRITICAL |
| Single hardcoded login | Can't onboard real users | HIGH |
| API routes inconsistent | Some routes fail on cloud | HIGH |
| No manual metric input | Useless without wearables | HIGH |
| No multi-academy support | Can't scale to 2nd client | MEDIUM |
| No data validation | Bad data breaks AI features | MEDIUM |
| No error boundaries | Crashes show blank pages | MEDIUM |
| No loading states on some pages | Looks broken during load | LOW |
| No onboarding flow | New user sees empty dashboard | LOW |

---

## Sprint Structure

```
Week 1: Infrastructure + Data Foundation
├── Sprint 1 (Day 1-2): Cloud Migration
├── Sprint 2 (Day 3-4): Auth System
└── Sprint 3 (Day 5):   API Hardening

Week 2: User-Facing Features + Polish
├── Sprint 4 (Day 6-7): Data Entry UI
├── Sprint 5 (Day 8-9): Manual Metrics + Session Logging
└── Sprint 6 (Day 10):  Polish + Deploy + Test
```

---

## SPRINT 1: Cloud Migration (Day 1-2)

**Goal:** Coach M8 on Vercel works with real data from Supabase Cloud.

### Day 1: Database Setup

- [ ] **Create new Supabase Cloud project** (region: eu-central for Egypt latency)
  - Name: `coach-m8-production`
  - Note the URL + anon key + service role key

- [ ] **Push all migrations to cloud**
  ```bash
  npx supabase db push --project-ref <ref>
  ```
  - Verify all tables created: academies, users, players, sessions, wearable_metrics, cv_metrics, load_records, tactical_metrics, videos, video_tags

- [ ] **Configure RLS policies on cloud**
  - academies: users can read their own academy
  - players: users can CRUD within their academy
  - sessions: users can CRUD within their academy
  - wearable_metrics: users can read within their academy's sessions
  - cv_metrics: same
  - load_records: same
  - Admin override: service role key bypasses all RLS

- [ ] **Seed production data**
  - Create The Maker academy record
  - Create director user (director@themaker.eg)
  - Import 80 players from current seed
  - Import 30 sessions with demo metrics
  - Verify all FK relationships work

- [ ] **Update Vercel environment variables**
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
  SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
  ANTHROPIC_API_KEY=<existing>
  ```

### Day 2: Verify + Fix

- [ ] **Deploy to Vercel and test every page**
  - Dashboard loads with data
  - Sessions list populated
  - Players list populated
  - All AI features work (chat, debrief, scout report)
  - PDF export works
  - Login/logout works

- [ ] **Fix any FK join failures on cloud**
  - PostgREST schema cache issue — reload schema cache after migration
  - Or verify all queries use the no-FK-join pattern

- [ ] **Fix cookie auth on Vercel domain**
  - Test auth flow: login → navigate → refresh → still logged in
  - Verify `createClient()` (cookie) works for auth
  - Verify `createAdminClient()` works for data

- [ ] **Set up auto-deploy**
  - Verify `git push` → Vercel auto-builds
  - Remove manual alias step — configure production domain properly in Vercel project settings

**Exit criteria:** https://coach-m8.vercel.app shows real data, all pages work, login persists.

---

## SPRINT 2: Auth System (Day 3-4)

**Goal:** Real authentication with roles, invites, and security.

### Day 3: Auth Foundation

- [ ] **Registration flow**
  - `/register` page with: name, email, password, academy code
  - Academy code = invite code that links to an academy
  - On registration: create auth user → create users record with academy_id + role
  - Default role: "coach" (director must promote)

- [ ] **Invite code system**
  - New table: `invite_codes` (code, academy_id, role, created_by, used_by, expires_at)
  - Director generates codes from Users/Admin page
  - Codes are single-use or multi-use (configurable)
  - Role embedded in code: "coach", "analyst", "parent"

- [ ] **Password reset flow**
  - Supabase built-in: `auth.resetPasswordForEmail()`
  - `/reset-password` page
  - Email template customization (Coach M8 branding)

- [ ] **Session management**
  - Proper cookie-based sessions via Supabase SSR
  - Auto-refresh tokens
  - Redirect to login on expired session
  - "Remember me" option

### Day 4: Role-Based Access

- [ ] **Role enforcement on every page**
  - Director: full access to everything
  - Coach: all coaching features, no admin/user management
  - Analyst: read-only on all data, can generate reports
  - Parent: read-only, only sees their child's data (future)

- [ ] **Middleware/proxy protection**
  - `proxy.ts` checks auth on every route
  - Unauthorized → redirect to `/login`
  - Role check on admin routes

- [ ] **User management page enhancement**
  - `/admin/users`: list all users in academy
  - Change roles, deactivate users
  - Generate invite codes
  - See login history

- [ ] **Multi-academy data isolation**
  - Every query filters by `academy_id`
  - RLS enforces at database level
  - Service role key only used in API routes, never exposed to client

**Exit criteria:** Can register new users with invite code, roles enforced, password reset works, multi-user login tested.

---

## SPRINT 3: API Hardening (Day 5)

**Goal:** Every API route is consistent, secure, and handles errors gracefully.

### Tasks:

- [ ] **Audit all API routes** — convert any remaining cookie-based data queries to admin client
  ```
  /api/ai/chat — check
  /api/ai/scout-report — check
  /api/ai/recommend-squad — check
  /api/ai/plan-week — check
  /api/ai/design-session — check
  /api/ai/match-debrief — check
  /api/ai/injury-risk — check
  /api/ai/injury-prevention — check
  /api/ai/tactic-analysis — check
  /api/ai/player-summary — check
  /api/ai/session-summary — check
  /api/ai/monthly-report — check
  /api/ai/parent-report — check
  /api/sessions/create — check
  ```

- [ ] **Add auth check to every API route**
  ```typescript
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ```

- [ ] **Add academy_id filtering to all data queries**
  - Get user's academy_id from profile
  - Filter all player/session/metric queries by academy_id

- [ ] **Add rate limiting on AI routes**
  - Simple in-memory rate limit: max 10 AI calls per minute per user
  - Prevent API cost runaway

- [ ] **Error boundaries on all pages**
  - `error.tsx` in each route group
  - Catches crashes, shows friendly error with "Try again" button
  - Log errors to console (add Sentry later)

- [ ] **Loading states**
  - `loading.tsx` in each route group
  - Skeleton loaders matching the page layout
  - Prevents flash of empty content

- [ ] **Input validation on all API routes**
  - Validate request body shape
  - Sanitize strings (prevent XSS in notes/names)
  - Reject oversized payloads

**Exit criteria:** All APIs use admin client, all have auth checks, all filter by academy, error boundaries on every page.

---

## SPRINT 4: Data Entry UI (Day 6-7)

**Goal:** Coaches can add and manage all data manually — no wearables required.

### Day 6: Player & Session Management

- [ ] **Add Player form** (`/players/new` or modal on `/players`)
  - Fields: name, jersey number, position, age group, dominant foot, height, weight
  - Validation: unique jersey number within academy, required fields
  - Auto-assigns academy_id from user profile

- [ ] **Edit Player**
  - Edit button on player profile
  - Same form, pre-filled
  - Can change position, age group, status (active/injured/inactive)

- [ ] **Delete/Archive Player**
  - Soft delete: set status to "inactive"
  - Confirmation modal
  - Inactive players hidden from lists but data preserved

- [ ] **Create Session form** (`/sessions/new` or modal)
  - Fields: date, type (training/match/friendly/recovery), duration, location, age group, notes
  - Auto-assigns academy_id
  - After creation: redirect to session detail page

- [ ] **Edit Session**
  - Edit button on session detail
  - Can modify all fields

- [ ] **Session Attendance**
  - On session detail page: checkboxes for which players attended
  - Quick "Select All" / "Select by Age Group"
  - Saves to a `session_attendance` table or flags on wearable_metrics

### Day 7: Metrics Input

- [ ] **Manual Wearable Metrics Entry**
  - On session detail → Players tab: "Add Metrics" button per player
  - Form: HR avg, HR max, TRIMP (auto-calculate from HR if possible), HR zones
  - Or quick mode: just HR avg + HR max, system estimates the rest
  - Bulk entry: paste from spreadsheet (CSV paste)

- [ ] **Manual CV Metrics Entry**
  - Per player per session: distance, max speed, sprint count, HSR count
  - Optional: accel/decel events, off-ball movement score
  - Quick mode: just distance + sprints

- [ ] **Load Record Auto-Calculation**
  - After metrics are entered, auto-calculate ACWR
  - Compare acute load (this week) vs chronic load (4-week average)
  - Auto-set risk_flag: green/amber/red based on ACWR thresholds
  - Update load_records table

- [ ] **Bulk Import**
  - CSV upload for players (name, jersey, position, age_group)
  - CSV upload for metrics (player_name or jersey, HR_avg, HR_max, distance, etc.)
  - Preview + confirm before import

**Exit criteria:** Coach can add players, create sessions, mark attendance, enter metrics manually, ACWR auto-calculates.

---

## SPRINT 5: Session Logging + Data Pipeline (Day 8-9)

**Goal:** Complete the data input workflow so every session produces usable analytics.

### Day 8: Session Workflow

- [ ] **Session lifecycle states**
  - Planned → Active → Completed → Reviewed
  - Planned: created via Planner or Session Design
  - Active: session is happening now (Live HR connects here)
  - Completed: metrics entered, auto-calculations run
  - Reviewed: AI report generated, coach has seen it

- [ ] **Post-session auto-report**
  - When metrics are entered and session marked "Completed":
    - Auto-calculate ACWR for all participants
    - Auto-generate AI session summary
    - Flag any players whose ACWR moved to amber/red
    - Update injury prediction scores
    - Push notification (future): "Session complete. 3 players need attention."

- [ ] **Quick Session Logger**
  - Simplified mobile-friendly page: `/log`
  - Coach selects date, type, players present
  - Enters minimal metrics (HR avg per player or skips)
  - One-tap "Complete Session"
  - Designed for sideline use on a phone

### Day 9: Data Integrity

- [ ] **Data validation rules**
  - HR avg must be 60-220
  - HR max must be > HR avg
  - TRIMP must be > 0
  - Distance must be > 0
  - Sprint count must be >= 0
  - ACWR must be 0.1-3.0
  - Reject obviously bad data with helpful error messages

- [ ] **Duplicate detection**
  - Can't enter metrics twice for same player + session
  - Warning if session date is in the future
  - Warning if player wasn't marked as attended

- [ ] **Audit trail**
  - New table: `audit_log` (user_id, action, table_name, record_id, timestamp, old_value, new_value)
  - Track: player created/edited, session created, metrics entered, AI report generated
  - Viewable by director on admin page

- [ ] **Data backup strategy**
  - Supabase automatic backups (daily on Pro plan)
  - Document manual backup procedure
  - Test restore process

**Exit criteria:** Full session workflow works end-to-end: plan → log → complete → auto-report. Data validation catches bad inputs. Audit trail records all changes.

---

## SPRINT 6: Polish + Deploy + Test (Day 10)

**Goal:** Production-ready, tested, deployed, documented.

### Morning: End-to-End Testing

- [ ] **Full user journey test**
  1. Register new coach with invite code
  2. See empty dashboard (onboarding prompt)
  3. Add 5 players manually
  4. Create a training session
  5. Mark attendance
  6. Enter metrics for each player
  7. View auto-generated session report
  8. Check ACWR updated on player profiles
  9. View injury prevention dashboard
  10. Generate opponent scout report
  11. Use TacticBoard to plan formation
  12. Export PDF report

- [ ] **Mobile responsive test**
  - All pages work on iPhone/Android viewport
  - Sidebar hamburger menu works
  - Forms are usable on mobile
  - Charts render correctly

- [ ] **Error scenario testing**
  - What happens when AI API fails? (Anthropic down)
  - What happens when Supabase is slow?
  - What happens with no data? (new academy, no sessions)
  - What happens with bad cookies? (expired session)

### Afternoon: Final Deploy

- [ ] **Environment check**
  - All env vars set on Vercel
  - Supabase Cloud project healthy
  - Anthropic API key has sufficient credits
  - Domain configured properly

- [ ] **Production deploy**
  ```bash
  git push origin main
  # Verify Vercel build succeeds
  # Test coach-m8.vercel.app end-to-end
  ```

- [ ] **Create demo account for The Maker meeting**
  - director@themaker.eg — full access, pre-populated with demo data
  - coach@themaker.eg — coach role, same academy
  - Generate login credentials document

- [ ] **Documentation**
  - Update CLAUDE.md with production setup
  - Write quick-start guide for coaches (1 page)
  - Document API rate limits and costs

**Exit criteria:** coach-m8.vercel.app works end-to-end with real data, multiple users can log in, coaches can enter data manually, all AI features work, mobile-friendly, error-handled.

---

## Database Changes Required

### New Tables

```sql
-- Invite codes for user registration
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  academy_id UUID REFERENCES academies(id) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'coach',
  created_by UUID REFERENCES users(id),
  used_by UUID REFERENCES users(id),
  max_uses INT DEFAULT 1,
  use_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session attendance tracking
CREATE TABLE session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) NOT NULL,
  player_id UUID REFERENCES players(id) NOT NULL,
  attended BOOLEAN DEFAULT true,
  minutes_played INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, player_id)
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies

```sql
-- Players: users can CRUD within their academy
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their academy's players" ON players
  FOR SELECT USING (
    academy_id IN (SELECT academy_id FROM users WHERE auth_user_id = auth.uid())
  );
CREATE POLICY "Users can insert players in their academy" ON players
  FOR INSERT WITH CHECK (
    academy_id IN (SELECT academy_id FROM users WHERE auth_user_id = auth.uid())
  );

-- Similar for sessions, metrics, etc.
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Supabase Cloud FK join failure | High | High | Already using no-FK-join pattern everywhere |
| Cookie auth broken on Vercel | Medium | High | Test thoroughly on Day 2, fallback to admin client |
| AI API costs spike | Medium | Medium | Rate limiting in Sprint 3 |
| Data migration fails | Low | High | Test migration on staging first |
| Mobile layout breaks | Medium | Low | Test on real devices Day 10 |

---

## Success Metrics

After this sprint, Coach M8 should be able to:

- [ ] Onboard a new academy in < 10 minutes (create account, invite coaches, add players)
- [ ] A coach can log a full training session in < 5 minutes on mobile
- [ ] All AI features work on the live URL without any local dependencies
- [ ] 3 different users can be logged in simultaneously with correct data isolation
- [ ] A parent (future) could be given read-only access to their child's data
- [ ] The system handles 100 concurrent users without degradation

---

## Daily Schedule

| Day | Sprint | Focus | Deliverable |
|-----|--------|-------|-------------|
| Mon 25 | Sprint 1 | Cloud Supabase setup + migration | DB live on cloud |
| Tue 26 | Sprint 1 | Verify + fix all pages on Vercel | coach-m8.vercel.app works |
| Wed 27 | Sprint 2 | Auth: registration, invites, password reset | Users can register |
| Thu 28 | Sprint 2 | Auth: roles, middleware, user management | Access control enforced |
| Fri 29 | Sprint 3 | API hardening, error boundaries, loading states | All APIs secure + consistent |
| Mon 31 | Sprint 4 | Player + session management UI | Add/edit players + sessions |
| Tue 1 | Sprint 4 | Manual metrics entry + bulk import | Enter data without wearables |
| Wed 2 | Sprint 5 | Session workflow + post-session auto-report | Full session lifecycle |
| Thu 3 | Sprint 5 | Data validation + audit trail | Data integrity guaranteed |
| Fri 4 | Sprint 6 | E2E testing + deploy + documentation | PRODUCTION READY |

---

*Start command: "Let's start Sprint 1"*

*SportSci.ai — Intelligence for Every Athlete*
