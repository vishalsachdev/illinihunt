import { supabase } from '../supabase'
import type { Database } from '@/types/database'
import { requireAuth } from './auth-helpers'

type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert']

export class BookmarkService {
  static async addBookmark(projectId: string) {
    const user = await requireAuth('bookmark projects')

    const bookmark: BookmarkInsert = {
      user_id: user.id,
      project_id: projectId
    }

    return supabase
      .from('bookmarks')
      .insert(bookmark)
      .select()
      .single()
  }

  static async removeBookmark(projectId: string) {
    const user = await requireAuth('remove bookmarks')

    return supabase
      .from('bookmarks')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id)
  }

  static async isBookmarked(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && (error.code === 'PGRST202' || error.code === '406' || error.message.includes('406'))) {
        return false
      }

      return !error && !!data
    } catch {
      return false
    }
  }

  static async getUserBookmarks(userId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User ID required')

    return supabase
      .from('user_bookmarks_with_projects')
      .select('*')
      .eq('user_id', targetUserId)
      .order('bookmarked_at', { ascending: false })
  }

  static async getUserBookmarksCount(userId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User ID required')

    return supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
  }
}
