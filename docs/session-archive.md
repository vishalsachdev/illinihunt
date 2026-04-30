# Session Archive

Older session log entries. Current session log lives at the top of `CLAUDE.md`.

### 2026-04-29
- Completed: Resolved issue #76 (Chalkwise DNS via Cloudflare API — DKIM/SPF/MX records added; closed). Updated `chiconnect.illinihunt.org` redirect target in `illinihunt-reverse-proxy` Worker (line 52 of `SUBDOMAIN_MAP`) to `https://lgluck28.github.io/connect-my-tribe-landing/`. Patched the Worker's URL-resolution logic so full-URL targets preserve their pathname (was stripping to origin) — uses `new URL((url.pathname + url.search).replace(/^\//, ""), targetBase).href`. Committed AGENTS.md additions (Claude memory lookup + external-action approval policy).
- Also completed (cross-cutting infra work in `~/admin/agent-infra`): audited and renamed all 7 Cloudflare API tokens; created `cf-backup-readonly` token; set up monthly Cloudflare config snapshot via private repo `vishalsachdev/agent-infra` GH Actions workflow → `cloudflare-snapshots/YYYY-MM-DD/` (first snapshot captured 81 DNS records, 5 worker scripts, 8 Pages projects).

### 2026-03-01 (session 2)
- Completed: Admin moderation tools (PR #72) — content reporting, comment moderation, user suspension
  - DB: `reports` table, `suspended_at` column, 8 RPC functions, `is_not_suspended()` RLS helper
  - Frontend: ReportModal, flag buttons on ProjectCard/CommentItem, admin tabs (Reports/Comments/Users)
  - Codex review caught P1 (RLS write policies missing suspension check) and P2 (cached profile bypass) — both fixed
  - Fixed vote RLS policy name mismatch that left old permissive policies active
- Closed stale PR #73 (duplicate of merged #71)
- Updated DressCode project with YouTube video URL
- Next: Testing framework, accessibility

### 2026-03-01
- Merged large refactor PR #71: decomposed `database.ts` god file into 7 service modules, extracted 5 shared components, fixed trending page bugs, removed dead code
- Fixed P1 bug found by Codex review: realtime vote context was reading from a ref with stable identity, preventing consumer re-renders on vote updates
- Changed default homepage sort from "trending" to "most recent" (trending shows empty results with low posting frequency)
- Next: Admin moderation tools, testing framework

### 2026-02-11
- Reduced project-list N+1 calls by batching vote/bookmark status fetches
- Added real collection pages/routes: new, edit, discover, bookmarks, add-projects
- Removed `framer-motion` and replaced with lightweight CSS animation classes
- Reduced built JS payload below budget (now under 800 kB target)

### 2025-12-27
- Standardized roadmap sections (migrated from "Current Status" format)
- Recently completed: Cloudflare CDN, SPA routing, vote sync removal, email validation, TypeScript 0 errors
