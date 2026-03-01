# Titan Paradigm: Codebase Cleanup Roadmap

**Project**: IlliniHunt V2
**Date**: 2026-03-01
**Baseline**: type-check PASS | build PASS | lint PASS (1 warning)
**Codebase**: 78 files, 13,497 lines, 0% test coverage

---

## Executive Summary

Full audit of 78 source files across 6 domains identified:
- **5 bugs** (2 P0, 2 P1, 1 P2)
- **3 security issues** (1 HIGH, 2 MEDIUM)
- **15 empty catch blocks** (silent failures)
- **6 dead code exports** (entire classes/functions never called)
- **1 god file** (database.ts at 1,251 lines with 7 classes)
- **8 functions exceeding 50 lines** (max: 167 lines)
- **12+ duplicated patterns** (loading spinners, auth guards, empty states, types)
- **14 production console.log/error calls** (not dev-gated)

---

## Batch Execution Plan

### Batch 1: Bugs & Security (P0)

**Scope**: 5 files | **Risk**: LOW (targeted fixes, no structural changes)
**Must pass**: type-check, build, lint after each fix

| # | File | Fix | Gauntlet Pillars |
|---|------|-----|-----------------|
| 1 | `src/pages/TrendingPage.tsx:60` | Remove `if (loading) return` guard (loading inits to `true`, prevents `loadProjects` from ever executing) | #14 Error Integrity |
| 2 | `src/pages/home/FeaturedProjects.tsx:93` | Replace `window.location.href` with `useNavigate()` or `<Link>` (full page reload destroys SPA state) | #9 Dependency Direction |
| 3 | `src/lib/database.ts:64` | Sanitize `options.search` before interpolation into PostgREST `.or()` filter (filter injection risk) | #7 Boundary Validation |
| 4 | `src/hooks/useRealtimeVotes.ts:207` | Return `useState` for `isConnected` instead of `ref.current` (never triggers re-renders) | #10 Side-Effect Transparency |
| 5 | `src/contexts/RealtimeVotesContext.tsx:77` | Use a ref for `voteData` inside `getVoteData` callback to avoid stale deps defeating `useMemo` | #19 Resource Hygiene |

**Commit message**: `fix: resolve trending page load bug, SPA navigation, filter injection, and realtime state issues`

---

### Batch 2: Database God File Decomposition (P0)

**Scope**: 1 file -> 8 new files | **Risk**: MEDIUM (many consumers to update)
**Must pass**: type-check, build, lint; verify all imports resolve

Split `src/lib/database.ts` (1,251 lines, 7 classes) into focused service modules:

| New File | Source Class | Lines |
|----------|-------------|-------|
| `src/lib/services/projects.ts` | `ProjectsService` | ~320 |
| `src/lib/services/comments.ts` | `CommentsService` | ~290 |
| `src/lib/services/bookmarks.ts` | `BookmarkService` | ~120 |
| `src/lib/services/collections.ts` | `CollectionService` | ~240 |
| `src/lib/services/categories.ts` | `CategoriesService` | ~20 |
| `src/lib/services/stats.ts` | `StatsService` | ~175 |
| `src/lib/services/auth-helpers.ts` | Shared `requireAuth()` helper | ~15 |
| `src/lib/services/query-constants.ts` | `PROJECT_SELECT_COLUMNS` and shared select strings | ~30 |

**Additional work in this batch**:
- Extract `requireAuth()` helper to eliminate 13 repeated `getUser()` boilerplate calls
- Extract `PROJECT_SELECT_COLUMNS` constant to eliminate 7 duplicated select strings
- Extract `isTableMissing(error)` helper for the 3 repeated PGRST202/406 checks
- Delete dead code: `SafeCommentsService`, `CollectionService.*Safe` methods
- Refactor `deleteComment` (167 lines) into `validateSession`, `verifyOwnership`, `performDelete`, `mapDeleteError`
- Re-export all services from `src/lib/database.ts` for backward compatibility (barrel file)

**Commit message**: `refactor: decompose database.ts god file into focused service modules`

---

### Batch 3: Shared Abstractions (P1)

**Scope**: ~10 new files | **Risk**: LOW (additive, no behavior changes)

Extract duplicated patterns into reusable building blocks:

| New File | Replaces | Occurrences |
|----------|----------|-------------|
| `src/components/shared/LoadingSpinner.tsx` | Inline spinning circles + text | 16+ |
| `src/components/shared/EmptyState.tsx` | Dashed-border empty state blocks | 8+ |
| `src/components/shared/PageError.tsx` | Error/not-found screens | 10+ |
| `src/components/shared/RequireAuth.tsx` | `if (!user) return <Navigate>` guards | 8+ |
| `src/components/shared/StatCard.tsx` | Card+Icon+Number+Subtitle stats | 15 cards |
| `src/components/shared/CollectionForm.tsx` | New/Edit collection forms | 2 |
| `src/components/shared/RankBadge.tsx` | Gold/silver/bronze gradient badges | 2 |
| `src/types/project.ts` | 5+ overlapping inline project types | 5+ |
| `src/types/comment.ts` | Duplicated `CommentData` interface | 2 |
| `src/lib/constants.ts` | `ILLINOIS_DOMAIN`, `DEFAULT_CATEGORY_COLOR`, magic values | 10+ |

**Commit message**: `refactor: extract shared components, types, and constants from duplicated patterns`

---

### Batch 4: Context & Hook Refactor (P1)

**Scope**: 5 files | **Risk**: MEDIUM (state management changes affect entire app)

| # | File | Refactor | Gauntlet Pillars |
|---|------|----------|-----------------|
| 1 | `AuthContext.tsx` | Decompose `loadUserProfile` (111 lines) into `fetchCachedProfile`, `fetchRemoteProfile`, `createNewProfile`; extract `retryAuth` duplication; replace 13 `setState` calls with `useReducer` | #1 Complexity, #2 Nesting, #11 DRY |
| 2 | `ErrorContext.tsx` | Wrap context value in `useMemo`; extract shared error handler helper; gate 4 `console.error` calls behind DEV | #19 Resource Hygiene, #22 Structured Logging |
| 3 | `RealtimeVotesContext.tsx` | Extract `DEFAULT_VOTE_DATA` constant; extract `updateVoteMap` helper for 5 duplicated Map patterns | #6 Magic Values, #11 DRY |
| 4 | `useRealtimeVotes.ts` | Break `setupRealtimeSubscriptions` (126 lines) into `createProjectChannel`, `createVotesChannel`, `subscribeWithTimeout`; add subscription timeout; add DEV logging to catch blocks | #1 Complexity, #14 Error Integrity |
| 5 | `useAuth.ts` | Remove duplicate -- either delete this file and use `useAuthContext` from AuthContext, or vice versa | #25 Dead Code |

**Commit message**: `refactor: improve context performance and decompose oversized hooks`

---

### Batch 5: Component Decomposition (P1)

**Scope**: 6 files | **Risk**: MEDIUM (UI structure changes)

| # | File | Lines | Refactor |
|---|------|-------|----------|
| 1 | `ProjectGrid.tsx` | 489 | Extract `ProjectGridHero`, `ProjectFilterBar`, `ProjectGridResults`, and `useProjectLoader` hook; remove duplicated auth-check-then-navigate; move constants outside component; eliminate unsafe double cast |
| 2 | `CommentItem.tsx` | 409 | Extract `handleDelete` into `useCommentDelete` hook; remove direct supabase import; use shared `CommentData` type |
| 3 | `AddToCollectionModal.tsx` | 333 | Add error feedback to 3 silent catch blocks; add Escape key handler; extract `useBodyScrollLock` hook |
| 4 | `App.tsx` | 411 | Extract `AppHeader`/`AppNavigation` from `AppContent` (266 lines); extract `ProtectedRoute` to shared module |
| 5 | `ErrorBoundary.tsx` | 174 | Gate `componentDidCatch` logging behind DEV; extract `resetState()` method |
| 6 | `AdminDashboardPage.tsx` | 479 | Use shared `StatCard`; extract stats refresh helper; reduce JSX nesting |

**Commit message**: `refactor: decompose oversized components and improve error handling`

---

### Batch 6: Dead Code & Silent Failures (P2)

**Scope**: 8 files | **Risk**: LOW (removals and error handling additions)

**Dead code removal**:
- `src/lib/errorHandler.ts`: Remove `logError`, `getUserMessage`, `isSuccess`, `handleFormError`
- `src/lib/imageUpload.ts`: Remove `deleteProjectImage`; fix ObjectURL leak in `compressImage`
- `src/lib/sanitize.ts`: Remove `sanitizeFormattedContent`
- `src/lib/trending.ts`: Unexport `ScoredProject`, `trendingScore`, `periodCutoff` (internal-only)

**Silent failure fixes**:
- `src/pages/CollectionsPage.tsx`: Add toast notifications to 2 empty catch blocks
- `src/pages/UserProfilePage.tsx`: Fix `projects.sort()` mutation; wrap in `useMemo`
- `src/pages/EditProfilePage.tsx`: Add cleanup for setTimeout

**Production logging**:
- Gate all `console.error` calls behind `import.meta.env.DEV` in `errorHandler.ts`, `supabaseInit.ts`, `ErrorContext.tsx`, `ErrorBoundary.tsx`

**Commit message**: `cleanup: remove dead code, fix silent failures, gate production logging`

---

### Batch 7: Page Consistency (P2)

**Scope**: 12 files | **Risk**: LOW (applying shared abstractions)

Apply the shared components from Batch 3 to all page files:
- Replace inline loading spinners with `<LoadingSpinner>`
- Replace inline empty states with `<EmptyState>`
- Replace inline error screens with `<PageError>`
- Replace `confirm()` with `DeleteProjectModal` (3 files)
- Replace inline stats cards with `<StatCard>` (3 files)
- Replace inline collection forms with `<CollectionForm>` (2 files)
- Replace inline project types with shared types from `src/types/project.ts`
- Replace `'#6B7280'` with `DEFAULT_CATEGORY_COLOR` constant
- Fix `Hero.tsx` hardcoded stats (use live data or remove)

**Commit message**: `refactor: apply shared abstractions across all pages for consistency`

---

## Execution Rules

1. **Build gate**: Every batch must pass `npm run type-check && npm run build && npm run lint` before commit
2. **Auto-rollback**: If a change breaks the build, revert immediately and log the failure in CLEANUP_STATE.json
3. **Logical commits**: One commit per batch with descriptive message
4. **No behavior changes**: Unless fixing a bug (Batch 1), refactors must be behavior-preserving
5. **Backward compatibility**: Batch 2 must re-export from the original `database.ts` path
6. **shadcn/ui untouched**: `src/components/ui/` files (except `ImageUpload.tsx`) are generated -- do not modify
7. **CLAUDE.md alignment**: Respect all project rules (no over-engineering, no unnecessary comments, library-first)

---

## Recovery Plan

If any batch fails the build gate:
1. `git stash` or `git revert` the failing changes
2. Log the failure reason in `CLEANUP_STATE.json` under `failures[]`
3. Isolate the failing file from the batch
4. Continue with remaining files in the batch
5. Retry the failing file as a standalone fix

---

## Status: AWAITING APPROVAL

All 7 batches are proposed. Execution begins upon approval.
Estimated scope: ~50 files modified, ~10 new files created, ~500 lines removed (dead code).
