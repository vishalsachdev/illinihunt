# Admin Moderation Tools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add content flagging/reporting, comment moderation, and user management to the existing admin dashboard.

**Architecture:** Extend the existing tabbed admin dashboard with 3 new tabs (Reports, Comments, Users). Add a `reports` table and `suspended_at` column on `users`. User-facing flag buttons on ProjectCard and CommentItem. Suspended users are blocked at login in AuthContext.

**Tech Stack:** React 18, TypeScript, Supabase RPC (SECURITY DEFINER), Tailwind CSS, shadcn/ui, lucide-react icons

**Design doc:** `docs/plans/2026-03-01-admin-moderation-design.md`

---

### Task 1: Database migration — reports table + suspended_at column

**Files:**
- Create: `supabase/migrations/20260301000001_add_moderation_tables.sql`

**Step 1: Write the migration**

```sql
-- Migration: Add moderation tables for content reporting and user suspension
-- Design doc: docs/plans/2026-03-01-admin-moderation-design.md

-- 1. Add suspended_at to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('project', 'comment')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'broken_link', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reporter_id, target_type, target_id)
);

-- 3. Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_users_suspended ON users(suspended_at) WHERE suspended_at IS NOT NULL;

-- 4. RLS policies for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can see their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- Admins can see all reports (via RPC, but also direct access)
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT TO authenticated
  USING (is_admin());

-- Admins can update reports (resolve/dismiss)
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE TO authenticated
  USING (is_admin());
```

**Step 2: Apply the migration**

Run: `npx supabase db push` or apply via Supabase MCP `mcp__supabase__apply_migration`

**Step 3: Commit**

```bash
git add supabase/migrations/20260301000001_add_moderation_tables.sql
git commit -m "feat: add reports table and suspended_at column for moderation"
```

---

### Task 2: Database migration — moderation RPC functions

**Files:**
- Create: `supabase/migrations/20260301000002_moderation_rpc_functions.sql`

**Step 1: Write the RPC migration**

Follow the exact pattern from `20251221000001_admin_rpc_functions.sql` — each function checks `is_admin()` first, uses SECURITY DEFINER, returns JSON.

```sql
-- Migration: Add RPC functions for moderation tools
-- All admin functions check is_admin() before executing

-- 1. report_content — any authenticated user can report
CREATE OR REPLACE FUNCTION report_content(
  p_target_type TEXT,
  p_target_id UUID,
  p_reason TEXT,
  p_details TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Validate target_type
  IF p_target_type NOT IN ('project', 'comment') THEN
    RAISE EXCEPTION 'Invalid target_type: must be project or comment';
  END IF;

  -- Validate reason
  IF p_reason NOT IN ('spam', 'inappropriate', 'broken_link', 'other') THEN
    RAISE EXCEPTION 'Invalid reason: must be spam, inappropriate, broken_link, or other';
  END IF;

  -- Check the target actually exists
  IF p_target_type = 'project' THEN
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_target_id) THEN
      RAISE EXCEPTION 'Project not found';
    END IF;
  ELSIF p_target_type = 'comment' THEN
    IF NOT EXISTS (SELECT 1 FROM comments WHERE id = p_target_id AND is_deleted = false) THEN
      RAISE EXCEPTION 'Comment not found';
    END IF;
  END IF;

  INSERT INTO reports (reporter_id, target_type, target_id, reason, details)
  VALUES (auth.uid(), p_target_type, p_target_id, p_reason, p_details)
  ON CONFLICT (reporter_id, target_type, target_id) DO NOTHING
  RETURNING json_build_object(
    'id', id,
    'target_type', target_type,
    'target_id', target_id,
    'reason', reason,
    'status', status,
    'created_at', created_at
  ) INTO result;

  IF result IS NULL THEN
    RAISE EXCEPTION 'You have already reported this content';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION report_content(TEXT, UUID, TEXT, TEXT) TO authenticated;

-- 2. admin_get_reports — admin only
CREATE OR REPLACE FUNCTION admin_get_reports(
  filter_status TEXT DEFAULT NULL,
  result_limit INT DEFAULT 50,
  result_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_agg(r) INTO result FROM (
    SELECT
      rep.id,
      rep.target_type,
      rep.target_id,
      rep.reason,
      rep.details,
      rep.status,
      rep.created_at,
      rep.resolved_at,
      json_build_object(
        'id', reporter.id,
        'username', reporter.username,
        'full_name', reporter.full_name,
        'email', reporter.email
      ) AS reporter,
      json_build_object(
        'id', resolver.id,
        'username', resolver.username,
        'full_name', resolver.full_name
      ) AS resolved_by_user,
      CASE
        WHEN rep.target_type = 'project' THEN (
          SELECT json_build_object('id', p.id, 'name', p.name, 'tagline', p.tagline, 'status', p.status)
          FROM projects p WHERE p.id = rep.target_id
        )
        WHEN rep.target_type = 'comment' THEN (
          SELECT json_build_object('id', c.id, 'content', c.content, 'project_id', c.project_id, 'is_deleted', c.is_deleted)
          FROM comments c WHERE c.id = rep.target_id
        )
      END AS target
    FROM reports rep
    JOIN users reporter ON reporter.id = rep.reporter_id
    LEFT JOIN users resolver ON resolver.id = rep.resolved_by
    WHERE (filter_status IS NULL OR rep.status = filter_status)
    ORDER BY
      CASE rep.status WHEN 'pending' THEN 0 ELSE 1 END,
      rep.created_at DESC
    LIMIT result_limit OFFSET result_offset
  ) r;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_reports(TEXT, INT, INT) TO authenticated;

-- 3. admin_resolve_report — admin only
CREATE OR REPLACE FUNCTION admin_resolve_report(
  p_report_id UUID,
  p_resolution TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  IF p_resolution NOT IN ('resolved', 'dismissed') THEN
    RAISE EXCEPTION 'Invalid resolution: must be resolved or dismissed';
  END IF;

  UPDATE reports
  SET status = p_resolution, resolved_by = auth.uid(), resolved_at = NOW()
  WHERE id = p_report_id AND status = 'pending'
  RETURNING json_build_object(
    'id', id,
    'status', status,
    'resolved_at', resolved_at
  ) INTO result;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Report not found or already resolved';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_resolve_report(UUID, TEXT) TO authenticated;

-- 4. admin_get_comments — admin only, all comments with user + project info
CREATE OR REPLACE FUNCTION admin_get_comments(
  search_query TEXT DEFAULT NULL,
  result_limit INT DEFAULT 50,
  result_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_agg(r) INTO result FROM (
    SELECT
      c.id,
      c.content,
      c.is_deleted,
      c.created_at,
      c.project_id,
      json_build_object('id', u.id, 'username', u.username, 'full_name', u.full_name, 'email', u.email) AS users,
      json_build_object('id', p.id, 'name', p.name) AS project
    FROM comments c
    JOIN users u ON u.id = c.user_id
    JOIN projects p ON p.id = c.project_id
    WHERE (search_query IS NULL OR c.content ILIKE '%' || search_query || '%')
    ORDER BY c.created_at DESC
    LIMIT result_limit OFFSET result_offset
  ) r;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_comments(TEXT, INT, INT) TO authenticated;

-- 5. admin_delete_comment — admin only, soft delete
CREATE OR REPLACE FUNCTION admin_delete_comment(
  p_comment_id UUID
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  UPDATE comments
  SET is_deleted = true, updated_at = NOW()
  WHERE id = p_comment_id AND (is_deleted = false OR is_deleted IS NULL)
  RETURNING json_build_object('id', id, 'is_deleted', is_deleted) INTO result;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Comment not found or already deleted';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_delete_comment(UUID) TO authenticated;

-- 6. admin_get_users — admin only
CREATE OR REPLACE FUNCTION admin_get_users(
  search_query TEXT DEFAULT NULL,
  result_limit INT DEFAULT 50,
  result_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_agg(r) INTO result FROM (
    SELECT
      u.id,
      u.email,
      u.username,
      u.full_name,
      u.avatar_url,
      u.created_at,
      u.suspended_at,
      (SELECT COUNT(*) FROM projects WHERE user_id = u.id)::INT AS project_count,
      (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND (is_deleted = false OR is_deleted IS NULL))::INT AS comment_count
    FROM users u
    WHERE (search_query IS NULL OR u.email ILIKE '%' || search_query || '%' OR u.full_name ILIKE '%' || search_query || '%' OR u.username ILIKE '%' || search_query || '%')
    ORDER BY u.created_at DESC
    LIMIT result_limit OFFSET result_offset
  ) r;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_users(TEXT, INT, INT) TO authenticated;

-- 7. admin_suspend_user — admin only
CREATE OR REPLACE FUNCTION admin_suspend_user(
  p_user_id UUID
)
RETURNS JSON AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Prevent self-suspension
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot suspend yourself';
  END IF;

  UPDATE users SET suspended_at = NOW() WHERE id = p_user_id AND suspended_at IS NULL;

  RETURN json_build_object('id', p_user_id, 'suspended', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_suspend_user(UUID) TO authenticated;

-- 8. admin_unsuspend_user — admin only
CREATE OR REPLACE FUNCTION admin_unsuspend_user(
  p_user_id UUID
)
RETURNS JSON AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  UPDATE users SET suspended_at = NULL WHERE id = p_user_id AND suspended_at IS NOT NULL;

  RETURN json_build_object('id', p_user_id, 'suspended', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_unsuspend_user(UUID) TO authenticated;
```

**Step 2: Apply the migration**

Run via Supabase MCP or `npx supabase db push`

**Step 3: Regenerate TypeScript types**

Run: `npx supabase gen types typescript --project-id catzwowmxluzwbhdyhnf > src/types/database.ts`

**Step 4: Commit**

```bash
git add supabase/migrations/20260301000002_moderation_rpc_functions.sql src/types/database.ts
git commit -m "feat: add moderation RPC functions (reports, comments, users)"
```

---

### Task 3: Moderation service layer

**Files:**
- Create: `src/lib/services/moderation.ts`

**Step 1: Write the service**

Follow the exact pattern from `src/lib/adminService.ts` — static class methods wrapping `supabase.rpc()` calls with error handling.

```typescript
import { supabase } from '../supabase'

export type ReportReason = 'spam' | 'inappropriate' | 'broken_link' | 'other'
export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

export interface Report {
  id: string
  target_type: 'project' | 'comment'
  target_id: string
  reason: ReportReason
  details: string | null
  status: ReportStatus
  created_at: string
  resolved_at: string | null
  reporter: {
    id: string
    username: string | null
    full_name: string | null
    email: string
  }
  resolved_by_user: {
    id: string
    username: string | null
    full_name: string | null
  } | null
  target: {
    id: string
    name?: string
    tagline?: string
    status?: string
    content?: string
    project_id?: string
    is_deleted?: boolean
  } | null
}

export interface AdminComment {
  id: string
  content: string
  is_deleted: boolean | null
  created_at: string
  project_id: string
  users: {
    id: string
    username: string | null
    full_name: string | null
    email: string
  }
  project: {
    id: string
    name: string
  }
}

export interface AdminUser {
  id: string
  email: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  suspended_at: string | null
  project_count: number
  comment_count: number
}

type ServiceResult<T> = { data: T | null; error: { message: string } | null }

export class ModerationService {
  /** Submit a content report (any authenticated user) */
  static async reportContent(
    targetType: 'project' | 'comment',
    targetId: string,
    reason: ReportReason,
    details?: string
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      const { data, error } = await supabase.rpc('report_content', {
        p_target_type: targetType,
        p_target_id: targetId,
        p_reason: reason,
        p_details: details || null
      })
      if (error) return { data: null, error: { message: error.message } }
      return { data: data as { id: string }, error: null }
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to submit report' } }
    }
  }

  /** Get all reports (admin only) */
  static async getReports(filterStatus?: ReportStatus): Promise<ServiceResult<Report[]>> {
    try {
      const { data, error } = await supabase.rpc('admin_get_reports', {
        filter_status: filterStatus || null
      })
      if (error) {
        if (error.message.includes('Unauthorized')) return { data: null, error: { message: 'Unauthorized: Admin access required' } }
        return { data: null, error: { message: error.message } }
      }
      return { data: (Array.isArray(data) ? data : []) as Report[], error: null }
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to fetch reports' } }
    }
  }

  /** Resolve or dismiss a report (admin only) */
  static async resolveReport(reportId: string, resolution: 'resolved' | 'dismissed'): Promise<ServiceResult<{ id: string }>> {
    try {
      const { data, error } = await supabase.rpc('admin_resolve_report', {
        p_report_id: reportId,
        p_resolution: resolution
      })
      if (error) return { data: null, error: { message: error.message } }
      return { data: data as { id: string }, error: null }
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to resolve report' } }
    }
  }

  /** Get all comments (admin only) */
  static async getComments(searchQuery?: string): Promise<ServiceResult<AdminComment[]>> {
    try {
      const { data, error } = await supabase.rpc('admin_get_comments', {
        search_query: searchQuery || null
      })
      if (error) return { data: null, error: { message: error.message } }
      return { data: (Array.isArray(data) ? data : []) as AdminComment[], error: null }
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to fetch comments' } }
    }
  }

  /** Delete a comment (admin only, soft delete) */
  static async deleteComment(commentId: string): Promise<ServiceResult<{ id: string }>> {
    try {
      const { data, error } = await supabase.rpc('admin_delete_comment', {
        p_comment_id: commentId
      })
      if (error) return { data: null, error: { message: error.message } }
      return { data: data as { id: string }, error: null }
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to delete comment' } }
    }
  }

  /** Get all users (admin only) */
  static async getUsers(searchQuery?: string): Promise<ServiceResult<AdminUser[]>> {
    try {
      const { data, error } = await supabase.rpc('admin_get_users', {
        search_query: searchQuery || null
      })
      if (error) return { data: null, error: { message: error.message } }
      return { data: (Array.isArray(data) ? data : []) as AdminUser[], error: null }
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to fetch users' } }
    }
  }

  /** Suspend a user (admin only) */
  static async suspendUser(userId: string): Promise<ServiceResult<{ id: string }>> {
    try {
      const { data, error } = await supabase.rpc('admin_suspend_user', { p_user_id: userId })
      if (error) return { data: null, error: { message: error.message } }
      return { data: data as { id: string }, error: null }
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to suspend user' } }
    }
  }

  /** Unsuspend a user (admin only) */
  static async unsuspendUser(userId: string): Promise<ServiceResult<{ id: string }>> {
    try {
      const { data, error } = await supabase.rpc('admin_unsuspend_user', { p_user_id: userId })
      if (error) return { data: null, error: { message: error.message } }
      return { data: data as { id: string }, error: null }
    } catch (err) {
      return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to unsuspend user' } }
    }
  }
}
```

**Step 2: Verify types compile**

Run: `npm run type-check`

**Step 3: Commit**

```bash
git add src/lib/services/moderation.ts
git commit -m "feat: add ModerationService with report, comment, and user management"
```

---

### Task 4: Report modal component (user-facing)

**Files:**
- Create: `src/components/moderation/ReportModal.tsx`

**Step 1: Write the component**

Follow the `DeleteProjectModal` pattern (fixed overlay, form, async submit). Modal with reason radio buttons + optional details textarea.

```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ModerationService, type ReportReason } from '@/lib/services/moderation'
import { showToast } from '@/components/ui/toast'
import { AlertTriangle, X } from 'lucide-react'

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'broken_link', label: 'Broken link or non-functional' },
  { value: 'other', label: 'Other' },
]

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: 'project' | 'comment'
  targetId: string
  targetName: string
}

export function ReportModal({ isOpen, onClose, targetType, targetId, targetName }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!reason) return

    setSubmitting(true)
    const { error } = await ModerationService.reportContent(targetType, targetId, reason, details || undefined)
    setSubmitting(false)

    if (error) {
      if (error.message.includes('already reported')) {
        showToast.error('Already reported', { description: 'You have already reported this content.' })
      } else {
        showToast.error('Failed to submit report', { description: error.message })
      }
    } else {
      showToast.success('Report submitted', { description: 'Thank you. An admin will review this.' })
      onClose()
      setReason(null)
      setDetails('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Report {targetType}</h3>
            <p className="text-sm text-muted-foreground truncate max-w-[300px]">{targetName}</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <p className="text-sm font-medium">Why are you reporting this?</p>
          {REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-uiuc-orange"
              />
              <span className="text-sm">{r.label}</span>
            </label>
          ))}
        </div>

        <Textarea
          placeholder="Additional details (optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="mb-4"
          rows={3}
        />

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify types compile**

Run: `npm run type-check`

**Step 3: Commit**

```bash
git add src/components/moderation/ReportModal.tsx
git commit -m "feat: add ReportModal component for flagging projects and comments"
```

---

### Task 5: Add flag button to ProjectCard

**Files:**
- Modify: `src/components/project/ProjectCard.tsx`

**Step 1: Add flag button to footer actions**

In the footer action buttons area (after BookmarkButton / AddToCollectionButton), add a Flag button that opens the ReportModal. Only show for logged-in users. Import `Flag` from lucide-react, import `ReportModal`, add state for modal open/close.

Key changes:
- Add imports: `Flag` from lucide-react, `ReportModal`, `useAuth`
- Add state: `const [reportOpen, setReportOpen] = useState(false)`
- Add the flag button in the footer actions div (next to existing bookmark/collection buttons)
- Add `<ReportModal>` at end of component, passing `targetType="project"` and `targetId={project.id}`
- The flag icon button should be a small ghost button matching the style of BookmarkButton

**Step 2: Verify types compile and build passes**

Run: `npm run type-check && npm run build`

**Step 3: Commit**

```bash
git add src/components/project/ProjectCard.tsx
git commit -m "feat: add report/flag button to ProjectCard"
```

---

### Task 6: Add flag button to CommentItem

**Files:**
- Modify: `src/components/comment/CommentItem.tsx`

**Step 1: Add flag button to comment actions**

Add a Flag button visible to all logged-in users (not just comment owner). Place it after the Reply button in the comment action area. Same pattern as Task 5 — state for modal, Flag icon button, ReportModal at end.

Key changes:
- Add imports: `Flag` from lucide-react, `ReportModal`
- Add state: `const [reportOpen, setReportOpen] = useState(false)`
- Add flag button after the Reply button (around line 336), only for authenticated users and non-deleted comments
- Add `<ReportModal>` at end, with `targetType="comment"`, `targetId={comment.id}`, `targetName` as truncated comment content

**Step 2: Verify types compile and build passes**

Run: `npm run type-check && npm run build`

**Step 3: Commit**

```bash
git add src/components/comment/CommentItem.tsx
git commit -m "feat: add report/flag button to CommentItem"
```

---

### Task 7: Admin dashboard — add top-level tab navigation

**Files:**
- Modify: `src/pages/AdminDashboardPage.tsx`

**Step 1: Add top-level tab state and navigation**

Currently the page has sub-tabs for project status (all/active/featured/archived). Add a top-level tab system above everything:

- Add type: `type AdminTab = 'projects' | 'reports' | 'comments' | 'users'`
- Add state: `const [adminTab, setAdminTab] = useState<AdminTab>('projects')`
- Render top-level tabs at the top of the page (below the header, above stats)
- Style: larger buttons with icons (BarChart3 for Projects, AlertTriangle for Reports, MessageCircle for Comments, Users for Users)
- Show pending report count as a badge on the Reports tab
- Conditionally render content based on `adminTab`:
  - `'projects'`: existing content (stats + project list) unchanged
  - `'reports'`: new ReportsTab component (Task 8)
  - `'comments'`: new CommentsTab component (Task 9)
  - `'users'`: new UsersTab component (Task 10)

**Step 2: Verify types compile**

Run: `npm run type-check`

**Step 3: Commit**

```bash
git add src/pages/AdminDashboardPage.tsx
git commit -m "feat: add top-level tab navigation to admin dashboard"
```

---

### Task 8: Admin dashboard — Reports tab

**Files:**
- Create: `src/components/admin/ReportsTab.tsx`

**Step 1: Write the ReportsTab component**

Shows a list of reports with:
- Sub-filter tabs: All / Pending / Resolved / Dismissed
- Each report card shows: reporter info, target preview (project name or comment snippet), reason, date
- Action buttons: "Resolve" (marks as resolved), "Dismiss" (marks as dismissed)
- Link to the target (project page or comment)
- Uses `ModerationService.getReports()` and `ModerationService.resolveReport()`

Follow the same pattern as the existing project list in AdminDashboardPage — Card components, loading state, empty state.

**Step 2: Wire into AdminDashboardPage**

Import and render when `adminTab === 'reports'`.

**Step 3: Verify types compile and build passes**

Run: `npm run type-check && npm run build`

**Step 4: Commit**

```bash
git add src/components/admin/ReportsTab.tsx src/pages/AdminDashboardPage.tsx
git commit -m "feat: add Reports tab to admin dashboard"
```

---

### Task 9: Admin dashboard — Comments tab

**Files:**
- Create: `src/components/admin/CommentsTab.tsx`

**Step 1: Write the CommentsTab component**

Shows all comments with:
- Search by content
- Each row: comment content (truncated), author email, linked project name, date, deleted status
- Action: "Delete" button (soft delete via `ModerationService.deleteComment()`)
- Already-deleted comments shown with strikethrough/dimmed styling
- Uses `ModerationService.getComments()` and `ModerationService.deleteComment()`

**Step 2: Wire into AdminDashboardPage**

Import and render when `adminTab === 'comments'`.

**Step 3: Verify types compile and build passes**

Run: `npm run type-check && npm run build`

**Step 4: Commit**

```bash
git add src/components/admin/CommentsTab.tsx src/pages/AdminDashboardPage.tsx
git commit -m "feat: add Comments tab to admin dashboard"
```

---

### Task 10: Admin dashboard — Users tab

**Files:**
- Create: `src/components/admin/UsersTab.tsx`

**Step 1: Write the UsersTab component**

Shows all users with:
- Search by email/name/username
- Each row: avatar, name, email, username, join date, project count, comment count, suspended status
- Actions: "Suspend" / "Unsuspend" toggle button
- Suspended users shown with red badge
- Confirmation dialog before suspending (use the same modal pattern)
- Uses `ModerationService.getUsers()`, `ModerationService.suspendUser()`, `ModerationService.unsuspendUser()`

**Step 2: Wire into AdminDashboardPage**

Import and render when `adminTab === 'users'`.

**Step 3: Verify types compile and build passes**

Run: `npm run type-check && npm run build`

**Step 4: Commit**

```bash
git add src/components/admin/UsersTab.tsx src/pages/AdminDashboardPage.tsx
git commit -m "feat: add Users tab to admin dashboard"
```

---

### Task 11: Block suspended users at login

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

**Step 1: Add suspend check in loadUserProfile**

After the profile is fetched successfully (around line 185 in AuthContext.tsx, the `else if (data)` branch), check if `data.suspended_at` is set. If so:
1. Sign out: `await supabase.auth.signOut()`
2. Set error: `setState({ user: null, profile: null, session: null, loading: false, error: 'Your account has been suspended. Contact an administrator.' })`
3. Return early

Also add the same check after profile creation (line 171 area) — though new profiles won't be suspended, this is defensive.

Also check the cached profile path (line 106-110) — if a cached profile has `suspended_at`, clear cache and re-fetch.

**Step 2: Verify types compile and build passes**

Run: `npm run type-check && npm run build`

**Step 3: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: block suspended users at login"
```

---

### Task 12: Final verification and cleanup

**Step 1: Full build check**

Run: `npm run type-check && npm run build && npm run lint`

**Step 2: Manual smoke test checklist**

- [ ] Homepage loads, projects display
- [ ] Flag button appears on ProjectCard for logged-in users
- [ ] Flag button appears on CommentItem for logged-in users
- [ ] Clicking flag opens ReportModal, submit works
- [ ] Admin dashboard loads at /admin
- [ ] All 4 tabs work (Projects, Reports, Comments, Users)
- [ ] Reports tab shows submitted reports, resolve/dismiss works
- [ ] Comments tab shows comments, delete works
- [ ] Users tab shows users, suspend/unsuspend works
- [ ] Suspended user gets blocked on next login

**Step 3: Commit any final fixes and push**

```bash
git push origin main
```
