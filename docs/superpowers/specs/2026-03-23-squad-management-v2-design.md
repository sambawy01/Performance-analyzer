# Coach M8 v2.0 — Squad Management Design Spec

**Product:** Squad Builder + Weekly Planner with AI Intelligence
**Scope:** Two new sections added to existing Coach M8 web app
**Goal:** Transform Coach M8 from post-session analytics into a daily coaching tool

---

## 1. Squad Builder

### Purpose
AI-powered starting XI recommender with interactive pitch diagram. Coaches build match squads based on data, not gut feel.

### UI Components

**Match Setup Bar:**
- Select opponent (free text)
- Select date
- Select formation (4-3-3, 4-2-3-1, 4-4-2, 3-5-2, 3-4-3)
- "AI Recommend" button

**Pitch Diagram:**
- Football pitch visual (dark theme, neon lines)
- Player dots positioned by formation
- Each dot shows: jersey number, name, ACWR badge (green/amber/red)
- Click a dot → shows player card (HR stats, readiness, recent form)
- Drag to swap players between positions

**Squad Panel (right side):**
- Starting XI list with position, name, ACWR, readiness score
- Bench (7 players) with recommended sub timing
- Excluded players with reason (injured, red ACWR, rested)
- Available pool — all players not selected

**AI Recommendations:**
- "AI Recommend Starting XI" button generates optimal squad based on:
  - Current ACWR status (exclude red, caution amber)
  - Recent form (TRIMP trend, HR efficiency)
  - Position coverage
  - Formation fit
- AI explains each selection: "Mario at CAM: ACWR 1.05 (optimal), top TRIMP contributor last 3 sessions, best off-ball movement score"
- Sub timing recommendations: "#19 Khashaba at 60' for #7 Kouman (load management)"

**Formation Comparison:**
- Show team stats per formation from historical data
- "4-3-3: PPDA 7.8, 58% possession, 2.1 goals/match"
- "4-4-2: PPDA 11.2, 46% possession, 0.8 goals/match"

### Data Model
New tables:
- `match_squads` — id, session_id, opponent, formation, starting_xi (JSONB), bench (JSONB), notes, created_by, created_at
- No new migrations needed for the demo — store squad data as JSONB

### Route
`/squad-builder` — new page in dashboard

---

## 2. Weekly Planner

### Purpose
AI-generated training week with load-aware scheduling. Replaces WhatsApp/paper planning.

### UI Components

**Week View (calendar):**
- 7-day horizontal layout (Mon-Sun)
- Each day shows:
  - Session card (if planned): type, time, duration, intensity level, location
  - Rest day indicator (if no session)
  - Team readiness score for that day (predicted)
  - Number of players available vs unavailable

**Session Card (expanded):**
- Session type (training/match/recovery/rest)
- Intensity level: High (red), Medium (orange), Low (green), Recovery (blue)
- Duration
- Location
- Tactical focus (free text or AI-suggested)
- Players to rest (listed with reason)
- Players returning from rest

**AI Planning:**
- "Generate Week Plan" button
- AI analyzes:
  - Next match date and opponent
  - Current team ACWR distribution
  - Previous week's load
  - Players needing rest vs players needing load
  - Tactical areas to work on (from recent session analysis)
- Outputs a full 7-day plan with:
  - Session type and intensity per day
  - Rest recommendations per player
  - Tactical focus per session
  - Load prediction (what ACWR will look like by end of week)

**Daily Briefing Card (dashboard):**
- Shows on the main dashboard
- "Today's Session: Tactical Training, 75 min"
- "3 players should rest: #8 Mokhtar (ACWR 1.52), ..."
- "Focus: Pressing triggers — PPDA dropped last match"
- "Team readiness: 78/100"

### Data Model
New table:
- `weekly_plans` — id, academy_id, week_start (date), plan_data (JSONB containing 7 days of sessions), ai_generated (boolean), created_by, notes, created_at

### Route
`/planner` — new page in dashboard

---

## 3. AI Intelligence Layer

### Squad Builder AI
Endpoint: `POST /api/ai/recommend-squad`
- Input: formation, match date, opponent
- Fetches: all active players, their ACWR, recent metrics, baselines
- Claude generates: starting XI, bench order, exclusions, sub timing, reasoning

### Weekly Planner AI
Endpoint: `POST /api/ai/plan-week`
- Input: week start date, match schedule
- Fetches: team ACWR, recent load history, tactical metrics, session history
- Claude generates: 7-day plan with intensity, rest recommendations, tactical focus

### Daily Briefing AI
Endpoint: `POST /api/ai/daily-briefing`
- Auto-generates each morning (or on dashboard load)
- Summarizes: today's plan, player availability, key focus areas, readiness score

---

## 4. Navigation Update

Sidebar adds two new items:
- Squad Builder (icon: Users with shield)
- Planner (icon: Calendar with clock)

---

## 5. Tech Stack
- Same as existing: Next.js 16, Supabase, Claude API
- Pitch diagram: Custom SVG component (no external library needed)
- Calendar: Custom component with CSS grid
- All AI calls through existing chat endpoint with context
