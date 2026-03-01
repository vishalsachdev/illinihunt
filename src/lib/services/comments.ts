import { supabase } from '../supabase'
import { requireAuth } from './auth-helpers'
import { COMMENT_WITH_USER_SELECT } from './query-constants'
import { MAX_THREAD_DEPTH } from '@/lib/constants'

export class CommentsService {
  static async getProjectComments(projectId: string) {
    return supabase
      .from('comments')
      .select(COMMENT_WITH_USER_SELECT)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
  }

  static async createComment(data: {
    content: string
    project_id: string
    parent_id?: string | null
  }) {
    const user = await requireAuth('comment')

    let thread_depth = 0
    if (data.parent_id) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('thread_depth')
        .eq('id', data.parent_id)
        .single()

      if (parentComment) {
        thread_depth = Math.min(parentComment.thread_depth + 1, MAX_THREAD_DEPTH)
      }
    }

    return supabase
      .from('comments')
      .insert({
        content: data.content,
        project_id: data.project_id,
        parent_id: data.parent_id,
        user_id: user.id,
        thread_depth
      })
      .select(COMMENT_WITH_USER_SELECT)
      .single()
  }

  static async updateComment(commentId: string, content: string) {
    const user = await requireAuth('edit comments')

    return supabase
      .from('comments')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', user.id)
      .select(COMMENT_WITH_USER_SELECT)
      .single()
  }

  static async deleteComment(commentId: string) {
    try {
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError && import.meta.env.DEV) {
        console.warn('Session refresh failed during delete:', refreshError)
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { data: null, error: { message: 'Must be authenticated to delete comments', code: 'AUTHENTICATION_REQUIRED' } }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !session.access_token) {
        await supabase.auth.refreshSession()
      }

      const { data: commentToDelete, error: fetchError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single()

      if (fetchError || !commentToDelete) {
        return { data: null, error: { message: 'Comment not found', code: 'NOT_FOUND' } }
      }

      if (commentToDelete.user_id !== user.id) {
        return { data: null, error: { message: 'You can only delete your own comments', code: 'UNAUTHORIZED' } }
      }

      const result = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId)
        .select('id, user_id, is_deleted, updated_at')
        .single()

      if (result.error) {
        return mapDeleteError(result.error, result)
      }

      return result
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Unexpected error during comment deletion:', error)
      }
      return {
        data: null,
        error: {
          message: 'An unexpected error occurred while deleting the comment',
          code: 'UNEXPECTED_ERROR'
        }
      }
    }
  }

  static async likeComment(commentId: string) {
    const user = await requireAuth('like comments')
    return supabase
      .from('comment_likes')
      .insert({ comment_id: commentId, user_id: user.id })
  }

  static async unlikeComment(commentId: string) {
    const user = await requireAuth('unlike comments')
    return supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
  }

  static async hasUserLikedComment(commentId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && (error.code === 'PGRST202' || error.code === '406')) {
        return false
      }

      return !error && !!data
    } catch {
      return false
    }
  }
}

/** Map Supabase/PostgREST error codes to user-friendly messages for comment deletion */
function mapDeleteError(
  error: { code?: string; message: string },
  result: { data: unknown; status: number; statusText: string }
) {
  if (error.code === 'PGRST116') {
    return { data: null, error: { message: 'Comment not found or you do not have permission to delete it.', code: 'NOT_FOUND_OR_UNAUTHORIZED' } }
  }

  if (error.code === 'PGRST301' || error.message.includes('403')) {
    return { data: null, error: { message: 'Access denied. Please refresh the page and try again.', code: 'FORBIDDEN_ERROR' } }
  }

  if (error.message.includes('row-level security') || error.message.includes('policy')) {
    return { data: null, error: { message: 'Permission denied. Please refresh the page and try again.', code: 'RLS_POLICY_VIOLATION' } }
  }

  if (error.message.includes('JWT') || error.message.includes('token') || error.message.includes('auth')) {
    return { data: null, error: { message: 'Authentication expired. Please refresh the page and try again.', code: 'TOKEN_EXPIRED' } }
  }

  return { data: result.data, error }
}
