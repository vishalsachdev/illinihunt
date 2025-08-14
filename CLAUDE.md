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

### Authentication
- ✅ Google OAuth with @illinois.edu restriction
- ✅ Session management via Supabase
- ✅ Protected routes for authenticated features

### Database
- ✅ Row Level Security (RLS) on all tables
- ✅ Users can only modify own data
- ✅ Public read, authenticated write pattern

### Environment
- ✅ No hardcoded secrets
- ✅ Vercel manages production env vars
- ✅ Supabase anon key is RLS-protected

## Code Quality

### Standards
- TypeScript strict mode enabled
- ESLint configured (.eslintrc.json)
- No test framework (yet)
- Build includes type checking

### Bundle Size
- Current: 604 kB total
- React: 140 kB, Supabase: 115 kB, UI: 96 kB, Forms: 77 kB
- Target: < 800 kB total

### Performance Targets
- Build time: < 10s (current: 2.67s ✅)
- TypeScript: < 5s (current: ~1s ✅)
- FCP: < 1.8s, LCP: < 2.5s, CLS: < 0.1

## Style Guide

Reference: `STYLE_GUIDE.md`

- **Colors**: UIUC Orange `#FF6B35`, Blue `#13294B`
- **Font**: Inter family
- **Components**: shadcn/ui patterns
- **Responsive**: Mobile-first with Tailwind
- **Accessibility**: ARIA labels, semantic HTML

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

**Voting system showing -1 votes**
```bash
# Root cause: Database sync issue (upvotes_count ≠ actual votes)
# Check for sync issues:
mcp__supabase__execute_sql project_id:catzwowmxluzwbhdyhnf query:"SELECT p.name, p.upvotes_count, COUNT(v.id) as actual_votes FROM projects p LEFT JOIN votes v ON p.id = v.project_id GROUP BY p.id HAVING p.upvotes_count != COUNT(v.id)"

# Fix database sync:
mcp__supabase__execute_sql project_id:catzwowmxluzwbhdyhnf query:"UPDATE projects SET upvotes_count = (SELECT COUNT(*) FROM votes WHERE project_id = projects.id)"

# Code fix: VoteButton.tsx should have Math.max(0, voteCount - 1) protection
```

### Health Check
```bash
npm run type-check && npm run build && npx supabase projects list && echo "✅ All systems operational"
```

## Feature Implementation Status

### ✅ Completed (Priority 1)
- Project detail pages with voting
- Threaded comment system
- User profiles with portfolios
- Creator dashboard
- Project submission & editing
- Google OAuth (@illinois.edu)
- Real-time voting
- Category filtering
- Bookmark system

### 🔄 Next Phase (Priority 2)
- Search & advanced filtering
- Trending algorithm
- Analytics & view counts
- Admin moderation tools
- Email notifications
- Testing framework

## Development Workflow

### Adding Features with DB Changes
1. Plan with Dashboard visualization
2. Apply migration via MCP
3. Regenerate TypeScript types
4. Update `src/lib/database.ts` services
5. Test locally
6. Deploy (auto via Vercel)

### Before Committing
1. `npm run type-check` - Must pass
2. `npm run build` - Must succeed
3. `npm run lint` - Review warnings
4. Remove debug code/console.logs
5. Update CLAUDE.md if architecture changes

### Session Wrap-up Pattern
```bash
# Assessment
git status && git diff --stat

# Quality checks
npm run lint && npm run type-check && npm run build

# Verify production ready
grep -r "console.log" src/  # Should be minimal
```