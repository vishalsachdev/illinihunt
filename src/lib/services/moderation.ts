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

/**
 * ModerationService - Uses RPC functions with SECURITY DEFINER for moderation tools
 *
 * report_content is available to any authenticated user.
 * All admin_* operations are authorized at the database level via the is_admin() function.
 */
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
