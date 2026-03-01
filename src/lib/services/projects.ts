import { supabase } from '../supabase'
import type { Database } from '@/types/database'
import { requireAuth } from './auth-helpers'
import { PROJECT_LIST_SELECT, PROJECT_DETAIL_SELECT } from './query-constants'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export class ProjectsService {
  static async getProjects(options?: {
    category?: string
    search?: string
    sortBy?: 'recent' | 'popular' | 'featured' | 'trending'
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('projects')
      .select(PROJECT_LIST_SELECT)
      .eq('status', 'active')

    if (options?.category) {
      query = query.eq('category_id', options.category)
    }

    if (options?.search) {
      // Sanitize search input: escape PostgREST special characters to prevent filter injection
      const sanitized = options.search.replace(/[%_\\,()]/g, (c) => `\\${c}`)
      query = query.or(`name.ilike.%${sanitized}%,tagline.ilike.%${sanitized}%`)
    }

    switch (options?.sortBy) {
      case 'popular':
        query = query.order('upvotes_count', { ascending: false })
        break
      case 'featured':
        query = query.eq('status', 'featured').order('created_at', { ascending: false })
        break
      case 'trending':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    return query
  }

  static async getProject(id: string) {
    return supabase
      .from('projects')
      .select(PROJECT_DETAIL_SELECT)
      .eq('id', id)
      .single()
  }

  static async createProject(project: ProjectInsert) {
    return supabase
      .from('projects')
      .insert(project)
      .select(PROJECT_LIST_SELECT)
      .single()
  }

  static async updateProject(id: string, updates: ProjectUpdate) {
    return supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  static async deleteProject(id: string) {
    const user = await requireAuth('delete projects')

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', id)
      .single()

    if (fetchError) {
      return { data: null, error: { message: 'Project not found', code: 'NOT_FOUND' } }
    }

    if (project.user_id !== user.id) {
      return { data: null, error: { message: 'You can only delete your own projects', code: 'UNAUTHORIZED' } }
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { data: null, error }
    }

    return { data: project, error: null }
  }

  static async voteProject(projectId: string) {
    const user = await requireAuth('vote')
    return supabase
      .from('votes')
      .insert({ project_id: projectId, user_id: user.id })
  }

  static async unvoteProject(projectId: string) {
    const user = await requireAuth('vote')
    return supabase
      .from('votes')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id)
  }

  static async hasUserVoted(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && (error.code === 'PGRST202' || error.code === '406' || error.message.includes('406'))) {
        return false
      }

      if (error) return false
      return !!data
    } catch {
      return false
    }
  }

  static async getUserProfile(userId: string) {
    return supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
  }

  static async getUserProjects(userId: string) {
    return supabase
      .from('projects')
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
  }

  static async updateUserProfile(userId: string, updates: {
    username?: string | null
    full_name?: string | null
    bio?: string | null
    github_url?: string | null
    linkedin_url?: string | null
    website_url?: string | null
    year_of_study?: string | null
    department?: string | null
  }) {
    return supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
  }
}
