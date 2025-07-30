import { supabase } from './supabase'
import type { Database } from '@/types/database'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export class ProjectsService {
  // Get all projects with user info and category
  static async getProjects(options?: {
    category?: string
    search?: string
    sortBy?: 'recent' | 'popular' | 'featured'
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('projects')
      .select(`
        *,
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

    // Apply filters
    if (options?.category) {
      query = query.eq('category_id', options.category)
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,tagline.ilike.%${options.search}%`)
    }

    // Apply sorting
    switch (options?.sortBy) {
      case 'popular':
        query = query.order('upvotes_count', { ascending: false })
        break
      case 'featured':
        query = query.eq('status', 'featured').order('created_at', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    return query
  }

  // Get single project with full details
  static async getProject(id: string) {
    return supabase
      .from('projects')
      .select(`
        *,
        users (
          id,
          username,
          full_name,
          avatar_url,
          bio,
          github_url,
          linkedin_url
        ),
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('id', id)
      .single()
  }

  // Create new project
  static async createProject(project: ProjectInsert) {
    return supabase
      .from('projects')
      .insert(project)
      .select(`
        *,
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
      .single()
  }

  // Update project
  static async updateProject(id: string, updates: ProjectUpdate) {
    return supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  // Delete project
  static async deleteProject(id: string) {
    return supabase
      .from('projects')
      .delete()
      .eq('id', id)
  }

  // Vote on project
  static async voteProject(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to vote')

    return supabase
      .from('votes')
      .insert({ project_id: projectId, user_id: user.id })
  }

  // Remove vote
  static async unvoteProject(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to vote')

    return supabase
      .from('votes')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id)
  }

  // Check if user voted on project
  static async hasUserVoted(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('votes')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    return !error && !!data
  }
}

export class CategoriesService {
  // Get all active categories
  static async getCategories() {
    return supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
  }

  // Get single category
  static async getCategory(id: string) {
    return supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
  }
}

export class StatsService {
  // Get platform statistics
  static async getPlatformStats() {
    try {
      // Get total projects count
      const { count: projectsCount, error: projectsError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (projectsError) throw projectsError

      // Get unique users count (project creators)
      const { data: uniqueUsers, error: usersError } = await supabase
        .from('projects')
        .select('user_id')
        .eq('status', 'active')

      if (usersError) throw usersError

      const uniqueUsersCount = new Set(uniqueUsers?.map(p => p.user_id)).size

      // Get categories count
      const { count: categoriesCount, error: categoriesError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (categoriesError) throw categoriesError

      return {
        data: {
          projectsCount: projectsCount || 0,
          usersCount: uniqueUsersCount || 0,
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

  // Get featured projects for hero section
  static async getFeaturedProjects(limit = 3) {
    return supabase
      .from('projects')
      .select(`
        *,
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
      .order('upvotes_count', { ascending: false })
      .limit(limit)
  }

  // Get recent activity for community feed
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