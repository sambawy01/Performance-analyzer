# Coach M8 — Deployment Guide

## Current Status
- **GitHub Repo:** https://github.com/sambawy01/Performance-analyzer
- **Supabase Project:** https://supabase.com/dashboard/project/dmcofkbcuyrbnoqspumv
- **Vercel Project:** https://vercel.com/sambawy-4389s-projects/opsnerve-performance-analyzer
- **Migrations:** All 26 pushed to Supabase Cloud ✅
- **Env Variables:** All 4 set in Vercel ✅

---

## Step 1: Fix Vercel Build (do this in browser)

Go to: **https://vercel.com/sambawy-4389s-projects/opsnerve-performance-analyzer/settings**

Click **"Build and Deployment"** in left sidebar.

### Framework Settings
| Setting | Value | Override |
|---------|-------|----------|
| **Framework Preset** | Next.js | — |
| **Build Command** | _(leave empty)_ | Override **OFF** |
| **Output Directory** | _(leave empty)_ | Override **OFF** |
| **Install Command** | `npm install` | Override **ON** |

> **IMPORTANT:** Install Command MUST be overridden to `npm install`. If left on auto, Vercel detects pnpm from other files in the repo and tries to use it, which fails.

### Root Directory
| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/web` |
| **Include files outside Root Directory** | **Enabled** (toggled ON) |

Click **Save** on both sections.

### Verify Environment Variables

Go to: **https://vercel.com/sambawy-4389s-projects/opsnerve-performance-analyzer/settings/environment-variables**

These 4 must exist (they should already be set):

| Name | Starts with... |
|------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dmcofkb...` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` |
| `ANTHROPIC_API_KEY` | `sk-ant-api03...` |

If any are missing, add them. Values are in the project's `.env.local` file or ask the team lead.

---

## Step 2: Trigger Deploy

Go to: **https://vercel.com/sambawy-4389s-projects/opsnerve-performance-analyzer/deployments**

1. Find the latest failed deployment
2. Click the **`...`** menu → **Redeploy**
3. Wait for build (~2-3 minutes)
4. It should succeed and give you a `.vercel.app` URL

If it fails with `"turbo run build"` error:
- Go back to Build and Deployment settings
- Make sure **Build Command** override is **OFF** (not set to turbo)
- If there's a `turbo.json` file detected, the build command override should be set to `next build`

---

## Step 3: Seed the Cloud Database

The Vercel app will deploy but show an empty dashboard because the cloud database has no data. You need to seed it.

### Option A: Via Supabase SQL Editor (easiest)

1. Go to: **https://supabase.com/dashboard/project/dmcofkbcuyrbnoqspumv/sql/new**
2. First run this to remove constraints:
```sql
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_age_group_check;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_age_group_check;
```
3. Click **Run**
4. Then open the file `packages/supabase/seed-full-demo.sql` from the repo
5. Copy the ENTIRE contents and paste into the SQL editor
6. Click **Run**
7. You should see INSERT confirmations

### Option B: Via CLI
```bash
# Get the database password from Supabase dashboard → Settings → Database
# Then run:
psql "postgresql://postgres.dmcofkbcuyrbnoqspumv:[YOUR-DB-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f packages/supabase/seed-full-demo.sql
```

---

## Step 4: Create Login Users

1. Go to: **https://supabase.com/dashboard/project/dmcofkbcuyrbnoqspumv/auth/users**
2. Click **"Add User"** → **"Create New User"**
3. Email: `director@themaker.eg`, Password: `test1234`, Check "Auto Confirm User"
4. Click Create
5. Copy the new user's **UUID** (shown in the users list)
6. Go to SQL Editor: **https://supabase.com/dashboard/project/dmcofkbcuyrbnoqspumv/sql/new**
7. Run this (replace `PASTE-UUID-HERE` with the actual UUID):

```sql
-- Insert academy first (if not already there from seed)
INSERT INTO academies (id, name, country)
VALUES ('a0000000-0000-0000-0000-000000000001', 'The Maker Football Incubator', 'EG')
ON CONFLICT (id) DO NOTHING;

-- Insert user record
INSERT INTO users (academy_id, name, email, role, age_groups_visible, auth_user_id)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Tamer Hossam',
  'director@themaker.eg',
  'director',
  '{2010,2011,2012,2013,2014,2015,2016}',
  'PASTE-UUID-HERE'
);
```

8. Also create a coach user if desired:
   - Add user: `coach@themaker.eg` / `test1234` (Auto Confirm)
   - Copy UUID, then run:
```sql
INSERT INTO users (academy_id, name, email, role, age_groups_visible, auth_user_id)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Mohamed Fawzy',
  'coach@themaker.eg',
  'coach',
  '{2010}',
  'PASTE-COACH-UUID-HERE'
);
```

---

## Step 5: Test the Live App

1. Open the Vercel URL (e.g., `https://opsnerve-performance-analyzer-xxx.vercel.app`)
2. Login with `director@themaker.eg` / `test1234`
3. You should see:
   - Dashboard with stat cards, candlestick chart, risk distribution
   - 21 sessions (Feb 22 – Mar 21)
   - 80 players across 7 age groups
   - Session detail with HR metrics, CV metrics, tactical analysis
   - AI reports (click "Generate Analysis" on any session or player)
   - Video tab with Veo links and tagged moments

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `"No Next.js version detected"` | Root Directory must be `apps/web` |
| `"turbo run build" exited with 1` | Build Command override OFF, or set to `next build` |
| `"pnpm install" exited with 1` | Install Command override ON → `npm install` |
| `"Command npm install exited with 1"` | Check Node.js version is 18+ in Settings → General |
| Empty dashboard | Database not seeded — run Step 3 |
| Login "Invalid credentials" | Auth user not created — run Step 4 |
| Login works but "null" profile | Users table not populated — run Step 4 SQL |
| AI reports fail | Check `ANTHROPIC_API_KEY` env var is set |

---

## Architecture

```
GitHub: sambawy01/Performance-analyzer
├── apps/web/              ← Next.js 16 app (Vercel)
│   ├── src/app/           ← Pages (dashboard, sessions, players, live)
│   ├── src/components/    ← UI components
│   ├── src/lib/           ← Supabase clients, AI, queries
│   └── src/types/         ← TypeScript types (inlined from packages/types)
├── packages/supabase/     ← Database migrations + Edge Functions
│   ├── migrations/        ← 26 SQL migrations
│   ├── seed-full-demo.sql ← Demo data (1 month, 80 players)
│   └── functions/         ← Health check, mock HR stream
└── packages/types/        ← Original shared types (not used by Vercel)
```

## Credentials

| Service | URL | Credentials |
|---------|-----|-------------|
| App (demo) | _Vercel URL_ | `director@themaker.eg` / `test1234` |
| Supabase | https://supabase.com/dashboard/project/dmcofkbcuyrbnoqspumv | _Your Supabase account_ |
| Vercel | https://vercel.com/sambawy-4389s-projects/opsnerve-performance-analyzer | _Your Vercel account_ |
| GitHub | https://github.com/sambawy01/Performance-analyzer | _Your GitHub account_ |
