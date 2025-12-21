# Admin Interface Design Document

## Executive Summary

This document specifies the design for IlliniHunt's admin interface, reverse-engineered from first principles based on the platform's needs as a Product Hunt-style application for the University of Illinois community.

**Current Status:** No admin interface exists. The IMPROVEMENT_ROADMAP.md contains high-level code snippets (Section 6) but lacks detailed specifications.

---

## 1. Core Requirements Analysis

### What Problem Does Admin Solve?

For a user-generated content platform like IlliniHunt, admins need to:

1. **Quality Control** - Ensure projects meet community standards
2. **Content Curation** - Feature high-quality projects on the homepage
3. **Moderation** - Handle reported/flagged content
4. **Platform Oversight** - Monitor platform health and usage

### Minimum Viable Admin Features

| Priority | Feature | Justification |
|----------|---------|---------------|
| P0 | Admin authentication | Gate access to admin functionality |
| P0 | Project status management | Feature/unfeature, archive, activate projects |
| P1 | Project moderation queue | Review flagged/reported content |
| P1 | Basic platform statistics | Understand platform usage |
| P2 | User management | Handle problematic users |
| P2 | Audit logging | Track admin actions |

---

## 2. Architecture Design

### 2.1 Admin Authentication

Following the application-level security pattern established in `CommentsService.deleteComment()`, admin verification will be handled at the application layer rather than relying solely on RLS policies.

```typescript
// src/hooks/useAdminAuth.ts
import { useAuth } from '@/hooks/useAuth'

// Configuration: Admin emails (could later move to database)
const ADMIN_EMAILS = [
  'vishal@illinois.edu',
  // Add additional admins here
] as const

export function useAdminAuth() {
  const { user, loading } = useAuth()

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])

  // All @illinois.edu users can flag content (moderator-lite)
  const canFlag = user?.email?.endsWith('@illinois.edu') ?? false

  return {
    isAdmin: Boolean(isAdmin),
    canFlag,
    loading,
    user,
  }
}
```

**Design Decisions:**
- **Hardcoded admin list**: Simple, secure, appropriate for small team. Can migrate to database later.
- **Email-based identification**: Leverages existing Google OAuth with @illinois.edu restriction.
- **Separation of admin vs. moderator**: Regular users can flag content; only admins can take action.

### 2.2 Admin Protected Route

```typescript
// src/components/auth/AdminProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <>{children}</>
}
```

### 2.3 Admin Service Layer

```typescript
// src/lib/adminService.ts
import { supabase } from './supabase'

export class AdminService {
  /**
   * Verify current user is admin before any admin operation
   */
  private static async verifyAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return false

    const ADMIN_EMAILS = ['vishal@illinois.edu']
    return ADMIN_EMAILS.includes(user.email)
  }

  /**
   * Get all projects with any status (not just 'active')
   */
  static async getAllProjects(options?: {
    status?: 'active' | 'featured' | 'archived' | 'draft' | 'flagged'
    limit?: number
    offset?: number
  }) {
    if (!await this.verifyAdmin()) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    let query = supabase
      .from('projects')
      .select(`
        *,
        users (id, username, full_name, avatar_url, email),
        categories (id, name, color, icon)
      `)
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    return query
  }

  /**
   * Update project status (feature, archive, activate)
   */
  static async updateProjectStatus(
    projectId: string,
    status: 'active' | 'featured' | 'archived'
  ) {
    if (!await this.verifyAdmin()) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    const { data: { user } } = await supabase.auth.getUser()

    return supabase
      .from('projects')
      .update({
        status,
        updated_at: new Date().toISOString()
        // Future: moderated_by: user?.id, moderated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()
  }

  /**
   * Get platform statistics
   */
  static async getStats() {
    if (!await this.verifyAdmin()) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    const [
      { count: totalProjects },
      { count: activeProjects },
      { count: featuredProjects },
      { count: totalUsers },
      { count: totalUpvotes },
      { count: totalComments }
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'featured'),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_deleted', false)
    ])

    return {
      data: {
        totalProjects: totalProjects || 0,
        activeProjects: activeProjects || 0,
        featuredProjects: featuredProjects || 0,
        totalUsers: totalUsers || 0,
        totalUpvotes: totalUpvotes || 0,
        totalComments: totalComments || 0
      },
      error: null
    }
  }

  /**
   * Delete a project (admin override - bypasses ownership check)
   */
  static async deleteProject(projectId: string) {
    if (!await this.verifyAdmin()) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // First delete related records
    await supabase.from('votes').delete().eq('project_id', projectId)
    await supabase.from('comments').delete().eq('project_id', projectId)
    await supabase.from('bookmarks').delete().eq('project_id', projectId)
    await supabase.from('collection_projects').delete().eq('project_id', projectId)

    return supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
  }
}
```

---

## 3. UI Design

### 3.1 Admin Dashboard Page Structure

```
/admin
├── Header (Stats Overview)
│   ├── Total Projects
│   ├── Active Projects
│   ├── Featured Projects
│   ├── Total Users
│   ├── Total Upvotes
│   └── Total Comments
│
├── Tabs
│   ├── All Projects (default)
│   ├── Featured
│   ├── Archived
│   └── Flagged (future)
│
└── Project Management Table
    ├── Project Name + Image
    ├── Creator (email, username)
    ├── Category
    ├── Status Badge
    ├── Stats (upvotes, comments)
    ├── Created Date
    └── Actions
        ├── Feature/Unfeature
        ├── Archive/Activate
        ├── View
        └── Delete
```

### 3.2 Component Hierarchy

```
AdminDashboardPage
├── AdminStats (6 stat cards)
├── AdminTabs (All | Featured | Archived | Flagged)
└── AdminProjectTable
    ├── AdminProjectRow
    │   ├── ProjectInfo (image, name, tagline)
    │   ├── CreatorInfo (avatar, name, email)
    │   ├── StatusBadge
    │   ├── ProjectStats
    │   └── AdminActions (dropdown menu)
    └── Pagination
```

### 3.3 Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Admin Dashboard                                          [User Menu]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────┐
│  │ Projects │ │  Active  │ │ Featured │ │  Users   │ │ Upvotes  │ │Comm.│
│  │    42    │ │    38    │ │     5    │ │   156    │ │   892    │ │ 234 │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────┘
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ [All Projects] [Featured] [Archived] [Flagged]        🔍 Search... │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ┌────┐                                                              │ │
│  │ │ 📱 │  Project Alpha                    ● Active                   │ │
│  │ │    │  A cool project tagline           🔼 45  💬 12              │ │
│  │ └────┘  by @johndoe (john@illinois.edu)  📅 Dec 15                 │ │
│  │                                    [⭐ Feature] [📁 Archive] [🗑️]  │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ ┌────┐                                                              │ │
│  │ │ 🚀 │  Project Beta                     ⭐ Featured                │ │
│  │ │    │  Another awesome project          🔼 128 💬 34              │ │
│  │ └────┘  by @janedoe (jane@illinois.edu)  📅 Dec 10                 │ │
│  │                                    [✓ Unfeature] [📁 Archive] [🗑️] │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ← Previous  Page 1 of 5  Next →                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Route Configuration

```typescript
// In App.tsx, add:
const AdminDashboardPage = lazy(() =>
  import('@/pages/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage }))
)

// Add route:
<Route
  path="/admin"
  element={
    <AdminProtectedRoute>
      <AdminDashboardPage />
    </AdminProtectedRoute>
  }
/>
```

### Navigation Integration

```typescript
// In AppContent header, add admin link for admins:
{isAdmin && (
  <Button asChild variant="ghost" size="sm">
    <Link to="/admin">
      <Shield className="w-4 h-4 mr-2" />
      Admin
    </Link>
  </Button>
)}
```

---

## 5. Database Considerations

### Current Schema Support

The existing `projects` table already has a `status` field supporting:
- `'active'` - Normal, visible projects
- `'featured'` - Highlighted on homepage
- `'archived'` - Hidden from public view
- `'draft'` - Not submitted yet

**No database migrations required** for basic admin functionality.

### Future Enhancements (Require Migrations)

```sql
-- Add moderation tracking fields
ALTER TABLE projects ADD COLUMN moderated_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN moderated_by UUID REFERENCES users(id);
ALTER TABLE projects ADD COLUMN reports_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN moderation_notes TEXT;

-- Create admin roles table (for dynamic admin management)
CREATE TABLE admin_roles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator')),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create moderation log for audit trail
CREATE TABLE moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'project', 'comment', 'user'
  target_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Implementation Plan

### Phase 1: Core Admin (MVP)
**Scope:** Basic admin access and project status management

| Task | Complexity | Files |
|------|------------|-------|
| Create `useAdminAuth` hook | Low | `src/hooks/useAdminAuth.ts` |
| Create `AdminProtectedRoute` | Low | `src/components/auth/AdminProtectedRoute.ts` |
| Create `AdminService` | Medium | `src/lib/adminService.ts` |
| Create `AdminDashboardPage` | Medium | `src/pages/AdminDashboardPage.tsx` |
| Add admin route | Low | `src/App.tsx` |
| Add admin nav link | Low | `src/App.tsx` |

### Phase 2: Enhanced Admin
**Scope:** Statistics, search, and improved UX

| Task | Complexity |
|------|------------|
| Add platform statistics | Low |
| Add project search/filter | Medium |
| Add pagination | Medium |
| Add confirmation modals | Low |

### Phase 3: Full Moderation
**Scope:** Flagging, audit logs, user management

| Task | Complexity |
|------|------------|
| Database migration for moderation fields | Medium |
| Implement flag/report system | High |
| Add moderation audit log | Medium |
| Add user management | Medium |

---

## 7. Security Considerations

### Access Control Layers

1. **Route Level**: `AdminProtectedRoute` prevents non-admins from accessing `/admin`
2. **Service Level**: `AdminService.verifyAdmin()` double-checks before every operation
3. **UI Level**: Admin navigation only shown to verified admins

### Why Not RLS for Admin?

Based on lessons from `COMMENT_DELETION_ISSUE.md`:
- RLS policies can be unreliable with JavaScript client auth context
- Application-level checks provide more explicit, debuggable security
- Admin operations are infrequent; the extra verification is negligible

### Admin Email Security

- Admin emails are hardcoded in source (compile-time security)
- Only @illinois.edu emails can authenticate (OAuth restriction)
- Future: Move to database with proper RLS for admin table

---

## 8. User Experience Guidelines

### Design Principles

1. **Consistency**: Match existing DashboardPage styling (dark theme, Card components)
2. **Clarity**: Clear status badges and action buttons
3. **Safety**: Confirmation dialogs for destructive actions
4. **Efficiency**: Bulk actions for common operations

### Status Badge Colors

| Status | Color | Style |
|--------|-------|-------|
| Active | Green | `bg-green-100 text-green-800` |
| Featured | Orange (UIUC) | `bg-orange-100 text-orange-800` |
| Archived | Gray | `bg-gray-100 text-gray-800` |
| Flagged | Red | `bg-red-100 text-red-800` |

### Action Feedback

- Use `sonner` toast notifications (existing pattern)
- Show loading states during async operations
- Optimistic UI updates where appropriate

---

## 9. Testing Considerations

```typescript
// Key test scenarios
describe('AdminDashboardPage', () => {
  it('redirects non-admins to home')
  it('shows admin dashboard for verified admins')
  it('displays correct platform statistics')
  it('allows featuring a project')
  it('allows archiving a project')
  it('confirms before deleting a project')
  it('shows toast notifications on actions')
})

describe('AdminService', () => {
  it('rejects operations from non-admin users')
  it('updates project status correctly')
  it('retrieves all projects regardless of status')
  it('cascades delete to related records')
})
```

---

## 10. Summary

### What Was Planned (IMPROVEMENT_ROADMAP.md)
- Basic `useAdminAuth` hook with hardcoded emails
- Admin dashboard concept with flagged content
- Project moderation (approve/reject)

### What This Design Adds
- Complete component architecture and hierarchy
- Detailed service layer with security patterns
- UI wireframes and styling guidelines
- Database migration roadmap
- Phased implementation plan
- Testing considerations
- Security analysis

### Key Design Decisions
1. **Application-level auth checks** over RLS for admin operations
2. **Hardcoded admin emails** for simplicity (can evolve later)
3. **No database migrations required** for MVP (uses existing status field)
4. **Consistent styling** with existing DashboardPage
5. **Three-phase rollout** from MVP to full moderation

---

*Document created: December 2024*
*Based on: IlliniHunt codebase analysis and first-principles design*
