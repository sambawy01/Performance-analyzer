# Coach M8 — Vercel Deployment Guide

## Quick Setup (5 minutes)

### Step 1: Vercel Project Settings

Go to: **https://vercel.com/sambawy-4389s-projects/opsnerve-performance-analyzer/settings**

Click **"Build and Deployment"** in the left sidebar.

Set these values:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | _(leave empty — use repo root)_ |
| **Build Command** | `cd apps/web && pnpm build` |
| **Output Directory** | `apps/web/.next` |
| **Install Command** | `pnpm install` |

> **Important:** Root Directory MUST be empty (repo root). The app is a monorepo — `apps/web` imports from `packages/types`. If you set Root Directory to `apps/web`, it can't access the types package and the build will fail.

Click **Save**.

---

### Step 2: Environment Variables

Go to: **https://vercel.com/sambawy-4389s-projects/opsnerve-performance-analyzer/settings/environment-variables**

These should already be set. If not, add them:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dmcofkbcuyrbnoqspumv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY29ma2JjdXlyYm5vcXNwdW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxOTg1NzEsImV4cCI6MjA4OTc3NDU3MX0.gj0x7UibWxAjFYA3EnVztZHRaUTceROiBgvYc-K2Z-4` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY29ma2JjdXlyYm5vcXNwdW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE5ODU3MSwiZXhwIjoyMDg5Nzc0NTcxfQ.TPmkxYRQtPgMyTcklmCb3PbLWLcLbqinOjbfQBBlokk` |
| `ANTHROPIC_API_KEY` | _(ask the team lead for this key)_ |

Set all variables to apply to **Production**, **Preview**, and **Development** environments.

---

### Step 3: Deploy

Option A — **Redeploy from dashboard:**
1. Go to Deployments tab
2. Click the `...` menu on the latest deployment
3. Click **Redeploy**

Option B — **Push to trigger:**
Any push to `main` branch will auto-deploy.

---

### Step 4: Seed the Cloud Database

After the app is deployed, the database is empty. Run the seed data:

```bash
# From the repo root
cd packages/supabase

# Login to Supabase CLI (if not already)
supabase login

# Link to the cloud project
supabase link --project-ref dmcofkbcuyrbnoqspumv

# Push all migrations (already done, skip if tables exist)
supabase db push --include-all

# Seed the demo data — connect via psql
# Get the connection string from Supabase dashboard:
# https://supabase.com/dashboard/project/dmcofkbcuyrbnoqspumv/settings/database
# Copy the "Connection string" (URI format)

psql "postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f seed-full-demo.sql
```

If you don't have `psql`, use the **SQL Editor** in the Supabase dashboard:
1. Go to https://supabase.com/dashboard/project/dmcofkbcuyrbnoqspumv/sql
2. Paste the contents of `packages/supabase/seed-full-demo.sql`
3. Click **Run**

### Step 5: Create Login Users

In the Supabase dashboard:

1. Go to **Authentication** → **Users** → **Add User**
2. Create: `director@themaker.eg` / `test1234` (confirm email)
3. Copy the user's UUID
4. Go to **SQL Editor** and run:

```sql
-- Remove age_group constraint first
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_age_group_check;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_age_group_check;

-- Insert the user record
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

---

## Architecture Overview

```
GitHub Repo: sambawy01/Performance-analyzer
├── apps/web/           ← Next.js 16 app (deployed to Vercel)
├── packages/supabase/  ← 26 SQL migrations + Edge Functions
├── packages/types/     ← Shared TypeScript types
└── vercel.json         ← Build config (DO NOT move or delete)
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| "No Next.js version detected" | Root Directory must be empty (repo root), not `apps/web` |
| "Output directory not found" | Remove any `vercel.json` inside `apps/web/`. Only keep the one at repo root |
| "Module not found: @opsnerve/types" | Root Directory is set to `apps/web` — change to repo root |
| "pnpm install failed" | Check Node.js version is 18+ in Vercel settings |
| Empty dashboard after deploy | Database needs seeding — run Step 4 above |
| Login doesn't work | Auth users need to be created in Supabase — run Step 5 above |

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **AI:** Claude API (Anthropic) — player reports, session analysis, coaching chat
- **Fonts:** Outfit (UI) + JetBrains Mono (data)
