import { supabase } from './supabase'

// Admin emails - must match useAdminAuth.ts
const ADMIN_EMAILS = [
  'vishal@illinois.edu',
] as const

export type ProjectStatus = 'active' | 'featured' | 'archived' | 'draft'

export interface AdminProject {
  id: string
  name: string
  tagline: string
  description: string
  image_url: string | null
  website_url: string | null
  github_url: string | null
  upvotes_count: number
  comments_count: number
  status: string
  created_at: string
  updated_at: string
  users: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
    email: string
  } | null
  categories: {
    id: string
    name: string
    color: string
    icon: string | null
  } | null
}

export interface PlatformStats {
  totalProjects: number
  activeProjects: number
  featuredProjects: number
  archivedProjects: number
  totalUsers: number
  totalUpvotes: number
  totalComments: number
}

export class AdminService {
  /**
   * Verify current user is admin before any admin operation
   */
  private static async verifyAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return false

    const userEmail = user.email.toLowerCase()
    return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === userEmail)
  }

  /**
   * Get all projects with any status (not just 'active')
   */
  static async getAllProjects(options?: {
    status?: ProjectStatus
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: AdminProject[] | null; error: { message: string } | null }> {
    if (!await this.verifyAdmin()) {
      return { data: null, error: { message: 'Unauthorized: Admin access required' } }
    }

    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        tagline,
        description,
        image_url,
        website_url,
        github_url,
        upvotes_count,
        comments_count,
        status,
        created_at,
        updated_at,
        users (
          id,
          username,
          full_name,
          avatar_url,
          email
        ),
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,tagline.ilike.%${options.search}%`)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error: { message: error.message } }
    }

    // Transform the data to match AdminProject interface
    // Supabase returns arrays for joined tables, we need single objects
    const transformedData = (data || []).map((project) => ({
      ...project,
      users: Array.isArray(project.users) ? project.users[0] || null : project.users,
      categories: Array.isArray(project.categories) ? project.categories[0] || null : project.categories,
    })) as AdminProject[]

    return { data: transformedData, error: null }
  }

  /**
   * Update project status (feature, archive, activate)
   */
  static async updateProjectStatus(
    projectId: string,
    status: ProjectStatus
  ): Promise<{ data: AdminProject | null; error: { message: string } | null }> {
    if (!await this.verifyAdmin()) {
      return { data: null, error: { message: 'Unauthorized: Admin access required' } }
    }

    const { data, error } = await supabase
      .from('projects')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select(`
        id,
        name,
        tagline,
        description,
        image_url,
        website_url,
        github_url,
        upvotes_count,
        comments_count,
        status,
        created_at,
        updated_at,
        users (
          id,
          username,
          full_name,
          avatar_url,
          email
        ),
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .single()

    if (error) {
      return { data: null, error: { message: error.message } }
    }

    // Transform the data to match AdminProject interface
    const transformedData = data ? {
      ...data,
      users: Array.isArray(data.users) ? data.users[0] || null : data.users,
      categories: Array.isArray(data.categories) ? data.categories[0] || null : data.categories,
    } as AdminProject : null

    return { data: transformedData, error: null }
  }

  /**
   * Get platform statistics
   */
  static async getStats(): Promise<{ data: PlatformStats | null; error: { message: string } | null }> {
    if (!await this.verifyAdmin()) {
      return { data: null, error: { message: 'Unauthorized: Admin access required' } }
    }

    try {
      const [
        projectsResult,
        activeResult,
        featuredResult,
        archivedResult,
        usersResult,
        upvotesResult,
        commentsResult
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'featured'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('votes').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_deleted', false)
      ])

      return {
        data: {
          totalProjects: projectsResult.count || 0,
          activeProjects: activeResult.count || 0,
          featuredProjects: featuredResult.count || 0,
          archivedProjects: archivedResult.count || 0,
          totalUsers: usersResult.count || 0,
          totalUpvotes: upvotesResult.count || 0,
          totalComments: commentsResult.count || 0
        },
        error: null
      }
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Failed to fetch stats' }
      }
    }
  }

  /**
   * Delete a project (admin override - bypasses ownership check)
   */
  static async deleteProject(projectId: string): Promise<{ error: { message: string } | null }> {
    if (!await this.verifyAdmin()) {
      return { error: { message: 'Unauthorized: Admin access required' } }
    }

    try {
      // Delete related records first (in order of dependencies)
      await supabase.from('votes').delete().eq('project_id', projectId)
      await supabase.from('comments').delete().eq('project_id', projectId)
      await supabase.from('bookmarks').delete().eq('project_id', projectId)
      await supabase.from('collection_projects').delete().eq('project_id', projectId)

      // Delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        return { error: { message: error.message } }
      }

      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to delete project' } }
    }
  }
}
