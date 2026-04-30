# CLAUDE.md - Quick Reference

**Be critical and challenge suggestions that might lead to poor code quality, security issues, or architectural problems.**

## Project Essentials

**IlliniHunt V2** - Product Hunt for University of Illinois
**Live**: https://illinihunt.org (Cloudflare CDN) | https://illinihunt.vercel.app
**Supabase Project**: `catzwowmxluzwbhdyhnf`
**Stack**: React 18 + TypeScript + Supabase + Vercel + Cloudflare CDN

## Quick Setup

```bash
# Clone & Install
git clone <repo> && cd illinihunt && npm install

# Environment (.env.local)
VITE_SUPABASE_URL=https://catzwowmxluzwbhdyhnf.supabase.co
VITE_SUPABASE_ANON_KEY=<get_from_supabase_dashboard>
SUPABASE_ACCESS_TOKEN=<get_from_supabase_settings>

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
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/types/database.ts
mcp__supabase__execute_sql({ project_id: "catzwowmxluzwbhdyhnf", query: "..." })
mcp__supabase__apply_migration({ project_id: "catzwowmxluzwbhdyhnf", name: "...", query: "..." })
```

## Architecture Overview

**For complete details, see: [`docs/MENTAL_MODEL.md`](docs/MENTAL_MODEL.md)**

- **Auth**: Google OAuth with @illinois.edu restriction + secure RLS policies
- **Database**: PostgreSQL with Row Level Security, database triggers for vote counting
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Deployment**: Vercel (auto-deploy on push) → Cloudflare CDN (caching, DDoS protection)
  - Custom domain: illinihunt.org (Cloudflare proxy enabled)
  - After deployments, purge Cloudflare cache to clear stale assets
  - See: [Cloudflare + Vercel Issues](#cloudflare--vercel-issues) below

## Current Focus
- [ ] Testing framework
- [ ] Accessibility + regression test coverage for new collection flows

## Roadmap
- [x] Search & filtering system
- [x] Trending algorithm with analytics
- [x] Admin moderation tools
- [ ] Testing framework
- [ ] See: [Improvement Roadmap](docs/IMPROVEMENT_ROADMAP.md) for full details

## Session Log
### 2026-04-29
- Completed: Resolved issue #76 (Chalkwise DNS via Cloudflare API — DKIM/SPF/MX records added; closed). Updated `chiconnect.illinihunt.org` redirect target in `illinihunt-reverse-proxy` Worker (line 52 of `SUBDOMAIN_MAP`) to `https://lgluck28.github.io/connect-my-tribe-landing/`. Patched the Worker's URL-resolution logic so full-URL targets preserve their pathname (was stripping to origin) — uses `new URL((url.pathname + url.search).replace(/^\//, ""), targetBase).href`. Committed AGENTS.md additions (Claude memory lookup + external-action approval policy).
- Also completed (cross-cutting infra work in `~/admin/agent-infra`): audited and renamed all 7 Cloudflare API tokens (e.g. `worker-dns` → `cf-workers-and-dns`; flagged orphan `ZZ-orphan-never-used-DELETE`); created `cf-backup-readonly` token; set up monthly Cloudflare config snapshot via private repo `vishalsachdev/agent-infra` GH Actions workflow → `cloudflare-snapshots/YYYY-MM-DD/` (first snapshot captured 81 DNS records, 5 worker scripts, 8 Pages projects). Full registry + protocol in `~/admin/agent-infra/{cloudflare-tokens.md, cloudflare-backup.md}`.
- Next: Testing framework, accessibility coverage. Move `illinihunt-reverse-proxy` worker source into a tracked repo (currently only edited via Cloudflare dashboard). **CF token cleanup carry-over:** `cf-illinihunt-zone-and-pages` (= `CF_API_TOKEN`) has a phantom IP filter the dashboard can't clear — agentlab `wrangler pages deploy` from CI/cloud will fail until the token is rolled or recreated. See `~/admin/agent-infra/cloudflare-tokens.md` "Outstanding" for remediation options. Also delete the orphan `ZZ-orphan-never-used-DELETE` token.

*Older entries archived to `docs/session-archive.md`.*

## Quick Troubleshooting

```bash
# Type errors after schema changes
npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/types/database.ts && npm run type-check

# Port conflicts
npx kill-port 5173

# Health check
npm run type-check && npm run build && echo "✅ Ready"
```

### Cloudflare + Vercel Issues

**Symptom**: Site works on Firefox but Chrome/Safari show "Expected JavaScript but got text/html" errors

**Cause**: Cloudflare CDN caches responses for up to 1 year (`max-age=31536000`). If you deploy a fix for routing issues, Cloudflare still serves old broken responses.

**Solution**: Purge Cloudflare cache after Vercel deployments
1. Login to Cloudflare dashboard
2. Select `illinihunt.org` domain
3. Go to: Caching → Configuration → Purge Everything
4. Wait 30 seconds, then hard refresh browser

**Prevention**: The `vercel.json` rewrite pattern `/:path((?!.*\\.).*)` excludes files with dots from SPA routing. Don't change this pattern without testing - Vercel has limited regex support and Cloudflare proxying breaks auto-detection.

## Documentation Structure

**Quick Access:**
- **[CLAUDE.md](CLAUDE.md)** - This quick reference (start here!)
- **[docs/INDEX.md](docs/INDEX.md)** - Complete documentation index
- **[README.md](README.md)** - Project overview

**Key Guides:**
- **[docs/MENTAL_MODEL.md](docs/MENTAL_MODEL.md)** - Architecture deep dive
- **[docs/IMPROVEMENT_ROADMAP.md](docs/IMPROVEMENT_ROADMAP.md)** - Planned enhancements
- **[docs/setup/CUSTOM_DOMAIN_SETUP.md](docs/setup/CUSTOM_DOMAIN_SETUP.md)** - Cloudflare domain config
- **[docs/setup/OAUTH_REDIRECT_FIX.md](docs/setup/OAUTH_REDIRECT_FIX.md)** - OAuth configuration

## Performance Best Practices

### Data Fetching Patterns

**❌ Anti-pattern: Waterfall Loading**
```typescript
// BAD: Sequential fetches create slow loading
useEffect(() => {
  loadAuth() // Wait 500ms
}, [])

useEffect(() => {
  if (auth) loadProject() // Wait 300ms
}, [auth])

useEffect(() => {
  if (project) loadCategories() // Wait 200ms
}, [project])
// Total: ~1000ms
```

**✅ Pattern: Cached + Parallel Loading**
```typescript
// GOOD: Use cached hooks and load in parallel
const { categories } = useCategories() // Cached, instant after first load
const { user } = useAuth() // Load in parallel

useEffect(() => {
  if (user) loadProject() // Only wait for auth
}, [user])
// Total: ~500-700ms
```

### When to Cache Data

**Always cache:**
- Categories (rarely change)
- Static configuration data
- User preferences

**Use `useCategories` hook:**
```typescript
import { useCategories } from '@/hooks/useCategories'

function MyComponent() {
  const { categories, loading } = useCategories() // Auto-cached
}
```

**Location**: `src/hooks/useCategories.ts` (5-min in-memory cache)

## Before Committing

```bash
npm run type-check && npm run build && npm run lint
grep -r "console.log" src/  # Minimize debug logs
```

**All changes**: Apply via Supabase migrations → Regenerate types → Test → Deploy
