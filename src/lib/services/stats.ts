import { supabase } from '../supabase'
import { TRENDING_POOL_MULTIPLIER, MIN_TRENDING_POOL_SIZE } from '../trending'
import { PROJECT_LIST_SELECT } from './query-constants'

export class StatsService {
  static async getPlatformStats() {
    try {
      const { count: projectsCount, error: projectsError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (projectsError) throw projectsError

      const { data: uniqueUsersCount, error: usersError } = await supabase
        .rpc('get_unique_project_creators_count')

      let usersCount: number

      if (usersError) {
        if (import.meta.env.DEV) {
          console.warn('Database function get_unique_project_creators_count not found. Using fallback method.')
        }
        const { data: uniqueUsers, error: fallbackError } = await supabase
          .from('projects')
          .select('user_id')
          .eq('status', 'active')

        if (fallbackError) throw fallbackError
        usersCount = new Set(uniqueUsers?.map(p => p.user_id)).size
      } else {
        usersCount = uniqueUsersCount || 0
      }

      const { count: categoriesCount, error: categoriesError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (categoriesError) throw categoriesError

      return {
        data: {
          projectsCount: projectsCount || 0,
          usersCount,
          categoriesCount: categoriesCount || 0
        },
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to load statistics'
      }
    }
  }

  static async getTrendingProjects(limit = 10) {
    return supabase
      .from('projects')
      .select(PROJECT_LIST_SELECT)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(Math.max(limit * TRENDING_POOL_MULTIPLIER, MIN_TRENDING_POOL_SIZE))
  }

  static async getFeaturedProjects(limit = 3) {
    return supabase
      .from('projects')
      .select(PROJECT_LIST_SELECT)
      .eq('status', 'active')
      .order('upvotes_count', { ascending: false })
      .limit(limit)
  }

  static async getRecentActivity(limit = 5) {
    return supabase
      .from('projects')
      .select(`
        id,
        name,
        tagline,
        created_at,
        users (
          id,
          username,
          full_name,
          avatar_url
        ),
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)
  }
}
