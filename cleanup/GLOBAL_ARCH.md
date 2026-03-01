# Global Architecture Map

## Dependency Graph

```
main.tsx
  └─ App.tsx
       ├─ ErrorBoundary
       ├─ ErrorProvider (ErrorContext)
       ├─ AuthProvider (AuthContext)
       │    ├─ supabase (lib/supabase.ts)
       │    ├─ supabaseInit (lib/supabaseInit.ts)
       │    └─ validations (profile cache schema)
       ├─ AuthPromptProvider (AuthPromptContext)
       ├─ RealtimeVotesProvider (RealtimeVotesContext)
       │    └─ useRealtimeVotes (hooks/useRealtimeVotes.ts)
       │         └─ supabase (realtime channels)
       └─ Routes
            ├─ Pages (22 page components)
            │    ├─ lib/database.ts (ProjectsService, CommentsService, etc.)
            │    ├─ lib/adminService.ts (AdminService)
            │    ├─ lib/trending.ts (rankByTrending)
            │    └─ hooks/useCategories.ts
            └─ Components
                 ├─ project/* (ProjectGrid, ProjectCard, VoteButton, etc.)
                 ├─ comment/* (CommentList, CommentItem, CommentForm)
                 ├─ auth/* (LoginButton, UserMenu, AuthPrompt)
                 ├─ media/* (YouTubeEmbed)
                 └─ ui/* (shadcn/ui components)
```

## Data Flow

```
User Action → Component → Service (lib/) → Supabase Client → PostgreSQL (RLS)
                                                ↕
                                        Realtime Channels
                                                ↕
                                   RealtimeVotesContext → Consumers
```

## Shared Types (Current State: Fragmented)

| Concept | Current Locations | Target |
|---------|-------------------|--------|
| Project (list item) | `ProjectGrid.Project`, `ProjectCard.ProjectData`, `DashboardPage.DashboardProject`, `TrendingPage.TrendingProject`, `FeaturedProjects.FeaturedProject`, `AddProjectsToCollectionPage.ProjectListItem` | `src/types/project.ts` |
| Project (detail) | `ProjectDetailPage` inline | `src/types/project.ts` |
| Comment | `CommentItem.CommentData`, `CommentList.CommentData` (duplicated verbatim) | `src/types/comment.ts` |
| Admin Project | `adminService.AdminProject` | Keep in `adminService.ts` (admin-specific) |
| Collection | `CollectionViewPage` inline, `CollectionsPage` inline | `src/types/collection.ts` |
| Vote Data | `RealtimeVotesContext` inline | Keep inline (context-specific) |

## Shared Constants (Current State: Scattered)

| Constant | Current Locations | Target |
|----------|-------------------|--------|
| `'illinois.edu'` | `AuthContext.tsx:310`, `ErrorContext.tsx:103`, `useAdminAuth.ts:51` | `src/lib/constants.ts: ILLINOIS_DOMAIN` |
| `'#6B7280'` | `ProjectCard:93`, `BookmarksPage:137`, `CategoryPreview:51`, `AddProjectsToCollectionPage:246` | `src/lib/constants.ts: DEFAULT_CATEGORY_COLOR` |
| `{ count: 0, hasVoted: false }` | `RealtimeVotesContext` (5 times) | Local constant in context file |
| Max thread depth `3` | `database.ts:559`, `CommentItem:76` | `src/lib/constants.ts: MAX_THREAD_DEPTH` |
| Project select columns | `database.ts` (7 times) | `src/lib/services/query-constants.ts` |
| Error codes `PGRST202`/`406` | `database.ts` (3 times) | `src/lib/services/auth-helpers.ts: isTableMissing()` |

## Service Layer (Current State: Monolithic)

```
Current:                          Target:
src/lib/database.ts (1251L)  →   src/lib/services/
  ProjectsService                   ├─ projects.ts
  CategoriesService                 ├─ categories.ts
  StatsService                      ├─ stats.ts
  CommentsService                   ├─ comments.ts
  BookmarkService                   ├─ bookmarks.ts
  CollectionService                 ├─ collections.ts
  SafeCommentsService (DEAD)        ├─ auth-helpers.ts
                                    └─ query-constants.ts
                                 src/lib/database.ts (barrel re-exports)
```

## Context Provider Stack

```
<ErrorBoundary>
  <BrowserRouter>
    <ErrorProvider>          ← Not memoized (perf issue)
      <AuthProvider>         ← 405 lines, needs useReducer
        <AuthPromptProvider> ← Clean, 45 lines
          <RealtimeVotesProvider>  ← getVoteData defeats useMemo (perf issue)
            <AppContent />
          </RealtimeVotesProvider>
        </AuthPromptProvider>
      </AuthProvider>
    </ErrorProvider>
  </BrowserRouter>
</ErrorBoundary>
```

## Import Dependency Direction

```
types/database.ts (auto-generated, leaf)
     ↑
lib/supabase.ts (client init, leaf)
     ↑
lib/services/* (business logic)
     ↑
hooks/* + contexts/* (state management)
     ↑
components/* (UI)
     ↑
pages/* (route handlers)
     ↑
App.tsx (router + providers)
     ↑
main.tsx (entry point)
```

**Violations found**: `CommentItem.tsx` directly imports `supabase` client (should go through service layer).
