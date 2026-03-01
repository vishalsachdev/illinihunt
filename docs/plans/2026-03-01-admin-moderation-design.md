# Admin Moderation Tools — Design

**Date:** 2026-03-01
**Status:** Approved
**Approach:** Tabbed single-page admin dashboard (Approach A)

## Scope

Add content flagging/reporting, comment moderation, and user management to the existing admin dashboard. No audit log (YAGNI at current scale).

## Database Schema

### New table: `reports`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| reporter_id | uuid FK users | who flagged |
| target_type | text | `'project'` or `'comment'` |
| target_id | uuid | project or comment ID |
| reason | text | `'spam'`, `'inappropriate'`, `'broken_link'`, `'other'` |
| details | text nullable | optional free-text |
| status | text | `'pending'`, `'resolved'`, `'dismissed'` |
| resolved_by | uuid FK users nullable | admin who handled it |
| resolved_at | timestamptz nullable | |
| created_at | timestamptz | default now() |

**Constraints:**
- Unique on (reporter_id, target_type, target_id) — one report per user per target
- RLS: users can insert own reports, admins can read/update all

### Users table change

Add column: `suspended_at timestamptz nullable` (null = active, set = suspended)

## Admin Dashboard Tabs

Extend existing `/admin` page with top-level tabs:

| Tab | Content |
|-----|---------|
| **Projects** | Existing functionality unchanged |
| **Reports** | Pending reports queue with target preview, dismiss/resolve actions |
| **Comments** | All comments with delete, linked to parent project |
| **Users** | User list with email, join date, project count, suspend/unsuspend |

## User-Facing: Report Button

- Flag icon on ProjectCard and CommentItem for logged-in @illinois.edu users
- Modal with reason picker (spam/inappropriate/broken link/other) + optional details
- Submits via `report_content` RPC
- One active report per user per target (DB constraint)

## RPC Functions (SECURITY DEFINER)

Following existing `admin_*` pattern:

- `report_content(target_type, target_id, reason, details)` — any authenticated user
- `admin_get_reports(filter_status)` — admin only
- `admin_resolve_report(report_id, resolution)` — admin only
- `admin_get_comments(search_query, result_limit)` — admin only
- `admin_delete_comment(comment_id)` — admin only
- `admin_get_users(search_query, result_limit)` — admin only
- `admin_suspend_user(user_id)` — admin only
- `admin_unsuspend_user(user_id)` — admin only

## Suspended User Behavior

Simplified: block at login. When a suspended user authenticates, show "Your account has been suspended" message and sign them out. No granular write-action checks needed.

## Out of Scope

- Audit log (add later if needed)
- Auto-flagging / content filters
- Email notifications to admins on new reports
- Bulk actions
