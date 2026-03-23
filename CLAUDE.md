# Coach M8 — AI Performance Analysis & Squad Management

## What This Is

Coach M8 is an AI-powered football academy coaching platform. First client: **The Maker Football Incubator** (Cairo, Egypt), co-founded with Mido (Ahmed Hossam). The platform collects wearable HR data + computer vision position data, then uses Claude AI to generate coaching intelligence.

**Live:** https://coach-m8.vercel.app
**Login:** director@themaker.eg / test1234

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** Supabase (PostgreSQL, Auth, RLS, Realtime)
- **AI:** Claude API (Anthropic SDK) — claude-sonnet-4
- **UI:** Tailwind CSS, shadcn/ui, Recharts, Lucide icons
- **Fonts:** Outfit (headings/body), JetBrains Mono (numbers/data)
- **Theme:** Dark (#0a0e1a), neon accents (#00d4ff, #00ff88, #ff6b35, #ff3355, #a855f7)
- **Monorepo:** pnpm + Turborepo (`apps/web` is the main app)
- **Deploy:** Vercel (alias: coach-m8.vercel.app)

## Critical Patterns

### Supabase — NO FK JOINS
Supabase Cloud's PostgREST doesn't resolve FK relationships. **NEVER** write:
```ts
supabase.from("sessions").select("*, players(name)")  // BREAKS
```
Instead, fetch related tables separately and merge via Map:
```ts
const { data: metrics } = await supabase.from("wearable_metrics").select("*").eq("session_id", id);
const playerIds = [...new Set(metrics.map(m => m.player_id))];
const { data: players } = await supabase.from("players").select("*").in("id", playerIds);
const playerMap = new Map(players.map(p => [p.id, p]));
```

### Server Data — Always use createAdminClient()
```ts
import { createAdminClient } from "@/lib/supabase/server";
const supabase = createAdminClient(); // Service role key, bypasses RLS
```
Cookie-based client is ONLY for `auth.getUser()`. All data queries use admin client.

### Recharts — Dynamic import required
```ts
const MyChart = dynamic(() => import("./my-chart").then(m => m.MyChart), { ssr: false });
```

### Next.js 16 specifics
- `proxy.ts` instead of `middleware.ts`
- `params` is a Promise: `const { id } = await params;`
- `useSearchParams()` requires `<Suspense>` wrapper

## Database Schema

| Table | Key Columns |
|-------|------------|
| `academies` | id, name, location |
| `users` | id, auth_user_id, academy_id, name, role |
| `players` | id, name, jersey_number, position, age_group, status, academy_id |
| `sessions` | id, date, type, duration_minutes, location, age_group, notes, academy_id |
| `wearable_metrics` | id, session_id, player_id, hr_avg, hr_max, trimp_score, hr_zone_4_pct, hr_zone_5_pct, hr_recovery_60s |
| `cv_metrics` | id, session_id, player_id, video_id, total_distance_m, max_speed_kmh, avg_speed_kmh, sprint_count, high_speed_run_count, accel_events, decel_events, off_ball_movement_score |
| `load_records` | player_id, session_id, acwr_ratio, risk_flag, week_start |
| `tactical_metrics` | session_id, avg_formation, possession_pct, pressing_intensity |
| `videos` | id, session_id, url |
| `video_tags` | id, video_id, player_id, tag_type, timestamp_start, label |

## App Structure

### Pages (`apps/web/src/app/(dashboard)/`)
| Route | Description |
|-------|-------------|
| `/` | Dashboard — Daily Briefing, 8 stat cards, candlestick chart, risk donut, load heatmap |
| `/sessions` | Session list (30 sessions with HR+CV data) |
| `/sessions/[id]` | Session detail — Overview, Players, Tactical, Heatmap, Video, AI Report tabs |
| `/players` | Player roster (80 real players from The Maker PDF) |
| `/players/[id]` | Player profile — talent score, progress timeline, injury prediction, CV stats |
| `/planner` | Weekly Planner — 7-day grid, AI plan, clickable session cards with modal |
| `/squad-builder` | Pitch diagram, AI starting XI, player detail + swap |
| `/match-readiness` | Pre-match readiness scores, donut chart, AI recommended XI |
| `/scout` | Talent Spotlight + Opponent Scout Report (deep web research) |
| `/session-design` | AI session designer with date/time/age group, auto-save to schedule |
| `/compare` | Dual radar charts (Physical + Camera), 12-metric comparison, AI analysis |
| `/debrief` | AI post-match analysis with player ratings |
| `/reports` | Report hub — Monthly, Weekly, Medical, Parent reports |
| `/live` | Real-time HR dashboard with video |

### AI API Routes (`apps/web/src/app/api/ai/`)
| Route | What it does |
|-------|-------------|
| `/api/ai/chat` | Persistent AI chat sidebar — full academy context |
| `/api/ai/scout-report` | Deep web research (25 searches) + opponent dossier |
| `/api/ai/recommend-squad` | AI starting XI based on fitness/form/tactics |
| `/api/ai/plan-week` | AI weekly training plan |
| `/api/ai/design-session` | AI training session design |
| `/api/ai/match-debrief` | Post-match analysis with player ratings |
| `/api/ai/injury-risk` | Injury prediction from ACWR/recovery/load |
| `/api/ai/player-summary` | AI player development narrative |
| `/api/ai/session-summary` | AI session report |
| `/api/ai/monthly-report` | Monthly team performance report |
| `/api/ai/parent-report` | Parent-friendly player update |

### Key Components (`apps/web/src/components/`)
- `layout/sidebar.tsx` — Responsive sidebar with navigation
- `layout/query-bar.tsx` — AI Chat slide-out panel (persistent)
- `ui/export-share-bar.tsx` — PDF/WhatsApp/Email/Copy export (used everywhere)
- `ui/metric-info.tsx` — Tooltip info modals for metrics
- `scout/talent-spotlight.tsx` — Ranked player cards with composite score
- `planner/weekly-planner.tsx` — 7-day grid with risk strip
- `planner/session-modal.tsx` — Clickable session detail popup
- `compare/player-comparison.tsx` — Dual radar + AI compare
- `match-readiness/readiness-client.tsx` — Readiness scores + donut + AI brief

## Data

- **80 real players** from The Maker's PDF roster (age groups 2010-2016)
- **30 sessions** with 1-month improvement trajectory
- **All players** have both wearable metrics AND CV/position data
- **Demo data** shows realistic improvement trends for the meeting

## Running Locally

```bash
cd apps/web
pnpm build && pnpm start  # Production mode — DO NOT use pnpm dev (Turbopack caches aggressively)
# Open http://localhost:3000
```

Requires local Supabase running: `npx supabase start` from project root.

## Deploying

```bash
git push origin main  # Auto-triggers Vercel build
# After build completes:
npx vercel alias set $(npx vercel ls | head -1) coach-m8.vercel.app
```

## Known Issues

- Turbopack dev server caches aggressively — always use production mode
- Some API routes still use cookie-based client (should be admin client)
- Vercel env uses local Supabase URL — needs cloud Supabase for real production
- Scout web search depends on Anthropic API supporting web_search_20250305 tool

## Future (Parked)

- **Coach M8 Scout Network** — standalone multi-academy scouting marketplace with social media content engine. Too large for a feature — separate product. See memory file for brainstorm notes.
