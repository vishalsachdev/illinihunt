# CLAUDE.md - Quick Reference

**Be critical and challenge suggestions that might lead to poor code quality, security issues, or architectural problems.**

## Project Essentials

**IlliniHunt V2** - Product Hunt for University of Illinois
**Live**: https://illinihunt.vercel.app | https://illinihunt.org
**Supabase Project**: `catzwowmxluzwbhdyhnf`
**Stack**: React 18 + TypeScript + Supabase + Vercel

## Quick Setup

```bash
# Clone & Install
git clone <repo> && cd illinihunt && npm install

# Environment (.env.local)
VITE_SUPABASE_URL=https://catzwowmxluzwbhdyhnf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ACCESS_TOKEN=sbp_53e258dade59eae29159f842b50f049327e3e6eb

# Verify & Run
npm run type-check && npm run build && npm run dev
```

## Essential Commands

```bash
# Development
npm run dev          # Start server (localhost:5173)
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # Code quality check

# Supabase
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/lib/supabase-types.ts
mcp__supabase__execute_sql({ project_id: "catzwowmxluzwbhdyhnf", query: "..." })
mcp__supabase__apply_migration({ project_id: "catzwowmxluzwbhdyhnf", name: "...", query: "..." })
```

## Architecture Overview

**For complete details, see: [`docs/MENTAL_MODEL.md`](docs/MENTAL_MODEL.md)**

- **Auth**: Google OAuth with @illinois.edu restriction + secure RLS policies
- **Database**: PostgreSQL with Row Level Security, database triggers for vote counting
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Deployment**: Auto-deploy to Vercel on push to main

## Current Status

### ✅ Phase 1 Complete (Critical Fixes)
- Performance: Vote sync removed, database triggers active
- Security: Email validation secured (`is_valid_illinois_email()`)
- Compatibility: Vite environment variables fixed
- Quality: TypeScript 0 errors, 604kB bundle, 3.19s build

### 🔄 Phase 2 Next
- Search & filtering system
- Trending algorithm with analytics
- Admin moderation tools
- Testing framework

## Quick Troubleshooting

```bash
# Type errors after schema changes
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/lib/supabase-types.ts && npm run type-check

# Port conflicts
npx kill-port 5173

# Health check
npm run type-check && npm run build && echo "✅ Ready"
```

## Documentation Structure

- **[CLAUDE.md](CLAUDE.md)** - This quick reference
- **[docs/MENTAL_MODEL.md](docs/MENTAL_MODEL.md)** - Complete architecture guide
- **[IMPROVEMENT_ROADMAP.md](docs/IMPROVEMENT_ROADMAP.md)** - Implementation phases
- **[src/docs/DESIGN_SYSTEM.md](src/docs/DESIGN_SYSTEM.md)** - Frontend design specifications
- **[README.md](README.md)** - Project overview and setup

## Before Committing

```bash
npm run type-check && npm run build && npm run lint
grep -r "console.log" src/  # Minimize debug logs
```

**All changes**: Apply via Supabase migrations → Regenerate types → Test → Deploy