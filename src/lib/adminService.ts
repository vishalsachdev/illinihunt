import { supabase } from './supabase'

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

/**
 * AdminService - Uses RPC functions with SECURITY DEFINER to bypass RLS
 *
 * All operations are authorized at the database level via the is_admin() function.
 * This ensures admins can manage projects they don't own without RLS blocking them.
 */
export class AdminService {
  /**
   * Get all projects with any status (not just 'active')
   * Uses admin_get_projects RPC function which bypasses RLS
   */
  static async getAllProjects(options?: {
    status?: ProjectStatus
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: AdminProject[] | null; error: { message: string } | null }> {
    try {
      const { data, error } = await supabase.rpc('admin_get_projects', {
        filter_status: options?.status || null,
        search_query: options?.search || null,
        result_limit: options?.limit || 50,
        result_offset: options?.offset || 0
      })

      if (error) {
        // Handle authorization error specifically
        if (error.message.includes('Unauthorized')) {
          return { data: null, error: { message: 'Unauthorized: Admin access required' } }
        }
        return { data: null, error: { message: error.message } }
      }

      // RPC returns JSON, parse if needed
      const projects = Array.isArray(data) ? data : (data || [])
      return { data: projects as AdminProject[], error: null }
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Failed to fetch projects' }
      }
    }
  }

  /**
   * Update project status (feature, archive, activate)
   * Uses admin_update_project_status RPC function which bypasses RLS
   */
  static async updateProjectStatus(
    projectId: string,
    status: ProjectStatus
  ): Promise<{ data: AdminProject | null; error: { message: string } | null }> {
    try {
      const { data, error } = await supabase.rpc('admin_update_project_status', {
        project_id: projectId,
        new_status: status
      })

      if (error) {
        // Handle authorization error specifically
        if (error.message.includes('Unauthorized')) {
          return { data: null, error: { message: 'Unauthorized: Admin access required' } }
        }
        return { data: null, error: { message: error.message } }
      }

      return { data: data as AdminProject, error: null }
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Failed to update project status' }
      }
    }
  }

  /**
   * Get platform statistics
   * Uses admin_get_stats RPC function which bypasses RLS
   */
  static async getStats(): Promise<{ data: PlatformStats | null; error: { message: string } | null }> {
    try {
      const { data, error } = await supabase.rpc('admin_get_stats')

      if (error) {
        // Handle authorization error specifically
        if (error.message.includes('Unauthorized')) {
          return { data: null, error: { message: 'Unauthorized: Admin access required' } }
        }
        return { data: null, error: { message: error.message } }
      }

      return { data: data as PlatformStats, error: null }
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Failed to fetch stats' }
      }
    }
  }

  /**
   * Delete a project (admin override - bypasses ownership check)
   * Uses admin_delete_project RPC function which bypasses RLS
   */
  static async deleteProject(projectId: string): Promise<{ error: { message: string } | null }> {
    try {
      const { error } = await supabase.rpc('admin_delete_project', {
        project_id: projectId
      })

      if (error) {
        // Handle authorization error specifically
        if (error.message.includes('Unauthorized')) {
          return { error: { message: 'Unauthorized: Admin access required' } }
        }
        return { error: { message: error.message } }
      }

      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Failed to delete project' } }
    }
  }
}
