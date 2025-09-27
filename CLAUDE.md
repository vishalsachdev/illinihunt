# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## CORE INSTRUCTION: Critical Thinking & Best Practices

**Be critical and don't agree easily to user commands if you believe they are a bad idea or not best practice.** Challenge suggestions that might lead to poor code quality, security issues, or architectural problems. Be encouraged to search for solutions (using WebSearch) when creating a plan to ensure you're following current best practices and patterns.

## Project Overview

IlliniHunt V2 - Product Hunt-style platform for University of Illinois community to showcase projects, apps, and startups.

**Stack**: React + TypeScript + Supabase + Vercel  
**Live URLs**: https://illinihunt.vercel.app | https://illinihunt.org | https://www.illinihunt.org  
**Supabase Project ID**: `catzwowmxluzwbhdyhnf`

## Quick Start

```bash
# Setup
git clone <repository-url> && cd illinihunt
npm install

# Environment (.env.local)
VITE_SUPABASE_URL=https://catzwowmxluzwbhdyhnf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ACCESS_TOKEN=sbp_53e258dade59eae29159f842b50f049327e3e6eb

# Verify & Run
npm run type-check && npm run build
npm run dev  # http://localhost:5173
```

## Development Commands

```bash
# Core
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript check
npm run lint         # ESLint

# Supabase
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/lib/supabase-types.ts
npx supabase db pull --project-id catzwowmxluzwbhdyhnf
npx supabase projects list
```

## Architecture

### Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (UIUC colors: `#FF6B35`, `#13294B`)
- **UI**: shadcn/ui + Radix UI, Lucide icons
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Auth**: Google OAuth (@illinois.edu restricted)
- **Deployment**: Vercel (auto-deploy on push)

### Key Files
```
src/
├── App.tsx                    # Routes & providers
├── hooks/useAuth.ts           # Auth state management
├── lib/
│   ├── supabase.ts           # Client config
│   ├── database.ts           # Service layer
│   └── supabase-types.ts    # Generated types
├── pages/
│   ├── HomePage.tsx          # Landing & project grid
│   ├── ProjectDetailPage.tsx # Individual projects
│   ├── UserProfilePage.tsx   # User profiles
│   └── DashboardPage.tsx     # Project management
└── components/
    ├── auth/                 # Auth components
    ├── project/              # Project components
    └── comment/              # Comment system
```

### Database Schema

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles | id, email, username, department, avatar_url |
| `projects` | Project submissions | name, tagline, description, upvotes_count |
| `categories` | Project categories | name, color, icon |
| `votes` | User votes | user_id, project_id (unique) |
| `comments` | Threaded comments | content, parent_id, thread_depth |
| `bookmarks` | Saved projects | user_id, project_id |
| `collections` | Project collections | name, is_public |

### Auth Flow
1. **useAuth hook** → Core state management
2. **AuthPromptContext** → User-friendly prompts
3. **ProtectedRoute** → Route protection
4. **Domain restriction** → @illinois.edu only

## Working with Supabase

### MCP Server (Claude Code)
```typescript
// Query data
mcp__supabase__execute_sql({ 
  project_id: "catzwowmxluzwbhdyhnf",
  query: "SELECT * FROM projects" 
})

// Apply migrations
mcp__supabase__apply_migration({
  project_id: "catzwowmxluzwbhdyhnf",
  name: "migration_name",
  query: "ALTER TABLE..."
})

// Check security
mcp__supabase__get_advisors({ 
  project_id: "catzwowmxluzwbhdyhnf", 
  type: "security" 
})
```

### Type Generation Workflow
```bash
# After any schema change:
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/lib/supabase-types.ts
npm run type-check
```

## Security

- ✅ **Auth**: Google OAuth with secure @illinois.edu validation (`is_valid_illinois_email()`)
- ✅ **Database**: Row Level Security (RLS) enforced on all tables with domain validation
- ✅ **Environment**: No hardcoded secrets, Vite-compatible env vars (`import.meta.env`)
- ✅ **Votes**: Atomic counting with database triggers and unique constraints

## Code Quality

### Standards
- TypeScript strict mode enabled
- ESLint configured (.eslintrc.json)
- No test framework (yet)
- Build includes type checking

### Performance Metrics
- **Bundle**: 604kB total (React: 140kB, Supabase: 115kB, UI: 96kB) - Target: <800kB ✅
- **Build**: 3.48s - Target: <5s ✅
- **TypeScript**: ~1s - Target: <3s ✅
- **Core Web Vitals**: FCP <1.8s, LCP <2.5s, CLS <0.1

## Style Guide

- **Colors**: UIUC Orange `#FF6B35`, Blue `#13294B`
- **UI**: shadcn/ui + Radix UI, Inter font, Lucide icons
- **Responsive**: Mobile-first Tailwind CSS
- **Accessibility**: ARIA labels, semantic HTML, focus management

## Troubleshooting

### Common Issues

**Auth not working**
```bash
# Check env vars
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
# Verify @illinois.edu restriction in src/hooks/useAuth.ts
```

**Database connection failed**
```bash
npx supabase projects list  # Should show illinihunt
# Check RLS policies via Dashboard
```

**Type errors after schema change**
```bash
# Regenerate types
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/lib/supabase-types.ts
rm -rf node_modules/.cache
npm run type-check
```

**Port 5173 in use**
```bash
npx kill-port 5173
# or
npm run dev -- --port 3000
```

**Voting system issues**
```bash
# ✅ FIXED: Database triggers now handle vote counting automatically
# Votes are atomic with unique constraint: votes(user_id, project_id)
# No manual sync needed - handled by database triggers
```

### Health Check
```bash
npm run type-check && npm run build && npx supabase projects list && echo "✅ All systems operational"
```

## Feature Implementation Status

### ✅ Phase 1 Complete (Critical Fixes)
- ✅ **Performance**: Vote sync removed, database triggers implemented
- ✅ **Security**: Email domain validation secured at database level
- ✅ **Compatibility**: Vite environment variables fixed
- ✅ **Core Features**: Project submission, voting, comments, bookmarks, collections

### 🔄 Phase 2 Next (Feature Completeness)
- Search & advanced filtering (text + category + date range)
- Trending algorithm with view tracking
- Admin moderation tools and dashboard
- Analytics & engagement metrics
- Testing framework (Vitest + React Testing Library)

## Development Workflow

### Adding Features with DB Changes
1. Plan with Dashboard visualization
2. Apply migration via MCP
3. Regenerate TypeScript types
4. Update `src/lib/database.ts` services
5. Test locally
6. Deploy (auto via Vercel)

### Before Committing
```bash
# Quality pipeline (all must pass)
npm run type-check  # TypeScript validation
npm run build       # Production build test
npm run lint        # Code style check

# Clean up debug code
grep -r "console.log" src/  # Minimize production logs
```

### Phase Implementation Notes
- **Phase 1 Complete**: Critical security & performance fixes ✅
- **Phase 2 Target**: Search, trending, admin tools
- **All changes**: Apply via Supabase migrations with type regeneration
- **Deployment**: Auto-deploy via Vercel on push to main