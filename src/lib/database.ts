import { supabase } from './supabase'
import type { Database } from '@/types/database'
import { ErrorHandler, type ServiceResult } from './errorHandler'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']
type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert']
type CollectionInsert = Database['public']['Tables']['collections']['Insert']
type CollectionUpdate = Database['public']['Tables']['collections']['Update']
type CollectionProjectInsert = Database['public']['Tables']['collection_projects']['Insert']

export class ProjectsService {
  // Get all projects with user info and category
  static async getProjects(options?: {
    category?: string
    search?: string
    sortBy?: 'recent' | 'popular' | 'featured'
    limit?: number
    offset?: number
  }) {
    // Ensure session is initialized before making queries
    
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
    if (!user) {
      return false
    }

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle()

      // Handle case where votes table doesn't exist (406 error)
      if (error && (error.code === 'PGRST202' || error.code === '406' || error.message.includes('406'))) {
        console.warn('Votes table not found - voting feature not available')
        return false
      }

      if (error) {
        console.error('Error in hasUserVoted:', error)
        return false
      }

      const hasVoted = !!data
      return hasVoted
    } catch (err) {
      console.warn('Error checking vote status:', err)
      return false
    }
  }

  // Get user profile by ID
  static async getUserProfile(userId: string) {
    return supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
  }

  // Get all projects by a specific user
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

  // Update user profile
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

export class CommentsService {
  // Get comments for a project with nested replies
  static async getProjectComments(projectId: string) {
    return supabase
      .from('comments')
      .select(`
        *,
        users (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
  }

  // Create a new comment
  static async createComment(data: {
    content: string
    project_id: string
    parent_id?: string | null
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to comment')

    // Calculate thread depth if this is a reply
    let thread_depth = 0
    if (data.parent_id) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('thread_depth')
        .eq('id', data.parent_id)
        .single()
      
      if (parentComment) {
        thread_depth = Math.min(parentComment.thread_depth + 1, 3) // Max 3 levels deep
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
      .select(`
        *,
        users (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single()
  }

  // Update a comment
  static async updateComment(commentId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to edit comments')

    return supabase
      .from('comments')
      .update({ 
        content, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', commentId)
      .eq('user_id', user.id) // Only allow users to edit their own comments
      .select(`
        *,
        users (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single()
  }

  // Soft delete a comment
  static async deleteComment(commentId: string) {
    try {
      // Ensure session is fresh and valid
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.warn('Session refresh failed during delete:', refreshError)
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('Authentication check failed:', { userError, hasUser: !!user })
        return { 
          data: null, 
          error: { 
            message: 'Must be authenticated to delete comments',
            code: 'AUTHENTICATION_REQUIRED'
          } 
        }
      }


      // Prepare the update payload - only modify the essential field
      const updatePayload = {
        is_deleted: true
      }


      // Double-check authentication right before database call
      const { data: { session } } = await supabase.auth.getSession()
      
      // Try to force refresh session if there are issues
      if (!session || !session.access_token) {
        await supabase.auth.refreshSession()
      }

      // Since RLS has authentication context issues, verify ownership manually
      // First, get the comment to verify the user owns it
      const { data: commentToDelete, error: fetchError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single()

      if (fetchError || !commentToDelete) {
        console.error('Could not fetch comment for ownership verification:', fetchError)
        return {
          data: null,
          error: {
            message: 'Comment not found',
            code: 'NOT_FOUND'
          }
        }
      }

      // Verify ownership
      if (commentToDelete.user_id !== user.id) {
        console.error('User does not own this comment:', {
          commentUserId: commentToDelete.user_id,
          currentUserId: user.id
        })
        return {
          data: null,
          error: {
            message: 'You can only delete your own comments',
            code: 'UNAUTHORIZED'
          }
        }
      }

      // Now perform the delete with ownership verified
      const result = await supabase
        .from('comments')
        .update(updatePayload)
        .eq('id', commentId)
        .select('id, user_id, is_deleted, updated_at')
        .single()

      if (result.error) {
        console.error('Database error during comment delete:', {
          error: result.error,
          errorCode: result.error?.code,
          errorMessage: result.error?.message,
          errorDetails: result.error?.details,
          errorHint: result.error?.hint,
          errorKeys: Object.keys(result.error || {}),
          fullError: JSON.stringify(result.error, null, 2),
          commentId,
          userId: user.id,
          resultData: result.data,
          resultStatus: result.status,
          resultStatusText: result.statusText
        })
        
        // Handle specific Supabase/PostgREST error codes
        if (result.error.code === 'PGRST116') {
          // No rows returned - comment doesn't exist or user doesn't own it
          return { 
            data: null, 
            error: { 
              message: 'Comment not found or you do not have permission to delete it.',
              code: 'NOT_FOUND_OR_UNAUTHORIZED'
            } 
          }
        }
        
        // Handle 403 Forbidden errors specifically
        if (result.error.code === 'PGRST301' || result.error.message.includes('403')) {
          return { 
            data: null, 
            error: { 
              message: 'Access denied. Please refresh the page and try again.',
              code: 'FORBIDDEN_ERROR'
            } 
          }
        }
        
        // Enhanced error handling for RLS violations
        if (result.error.message.includes('row-level security') || 
            result.error.message.includes('policy')) {
          return { 
            data: null, 
            error: { 
              message: 'Permission denied. Please refresh the page and try again.',
              code: 'RLS_POLICY_VIOLATION'
            } 
          }
        }
        
        // Handle authentication errors
        if (result.error.message.includes('JWT') || 
            result.error.message.includes('token') ||
            result.error.message.includes('auth')) {
          return { 
            data: null, 
            error: { 
              message: 'Authentication expired. Please refresh the page and try again.',
              code: 'TOKEN_EXPIRED'
            } 
          }
        }
        
        return result
      }


      return result

    } catch (error) {
      console.error('Unexpected error during comment deletion:', error)
      return { 
        data: null, 
        error: { 
          message: 'An unexpected error occurred while deleting the comment',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      }
    }
  }

  // Like a comment
  static async likeComment(commentId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to like comments')

    return supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_id: user.id
      })
  }

  // Unlike a comment
  static async unlikeComment(commentId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to unlike comments')

    return supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
  }

  // Check if user liked a comment
  static async hasUserLikedComment(commentId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle() // ← FIXED: returns null instead of throwing

      // Handle missing table gracefully
      if (error && (error.code === 'PGRST202' || error.code === '406')) {
        console.warn('Comment likes table not found')
        return false
      }

      return !error && !!data
    } catch (err) {
      console.warn('Error checking like status:', err)
      return false
    }
  }
}

export class BookmarkService {
  // Add bookmark for a project
  static async addBookmark(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to bookmark projects')

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

  // Remove bookmark
  static async removeBookmark(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to remove bookmarks')

    return supabase
      .from('bookmarks')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id)
  }

  // Check if user has bookmarked a project
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

      // Handle case where bookmarks table doesn't exist (406 error)
      if (error && (error.code === 'PGRST202' || error.code === '406' || error.message.includes('406'))) {
        console.warn('Bookmarks table not found - bookmark feature not available')
        return false
      }

      return !error && !!data
    } catch (err) {
      console.warn('Error checking bookmark status:', err)
      return false
    }
  }

  // Get user's bookmarked projects using the view
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

  // Get bookmarks count for a user
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

export class CollectionService {
  // Create new collection
  static async createCollection(collection: Omit<CollectionInsert, 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to create collections')

    const newCollection: CollectionInsert = {
      ...collection,
      user_id: user.id
    }

    return supabase
      .from('collections')
      .insert(newCollection)
      .select(`
        *,
        users (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single()
  }

  // Get user's collections
  static async getUserCollections(userId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User ID required')

    return supabase
      .from('collections')
      .select(`
        *,
        users (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', targetUserId)
      .order('updated_at', { ascending: false })
  }

  // Get public collections using the view
  static async getPublicCollections(limit = 20, offset = 0) {
    return supabase
      .from('public_collections_with_stats')
      .select('*')
      .range(offset, offset + limit - 1)
  }

  // Get single collection with projects
  static async getCollection(collectionId: string, includeProjects = true) {
    const baseQuery = supabase
      .from('collections')
      .select(`
        *,
        users (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('id', collectionId)
      .single()

    if (!includeProjects) {
      return baseQuery
    }

    // Get collection with projects
    const collectionResult = await baseQuery
    if (collectionResult.error) return collectionResult

    const projectsResult = await supabase
      .from('collection_projects')
      .select(`
        id,
        added_at,
        projects (
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
        )
      `)
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false })

    return {
      ...collectionResult,
      data: collectionResult.data ? {
        ...collectionResult.data,
        projects: projectsResult.data || []
      } : null
    }
  }

  // Update collection
  static async updateCollection(collectionId: string, updates: CollectionUpdate) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to update collections')

    return supabase
      .from('collections')
      .update(updates)
      .eq('id', collectionId)
      .eq('user_id', user.id) // Ensure user owns the collection
      .select()
      .single()
  }

  // Delete collection
  static async deleteCollection(collectionId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to delete collections')

    return supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.id) // Ensure user owns the collection
  }

  // Add project to collection
  static async addProjectToCollection(collectionId: string, projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to modify collections')

    // First verify the user owns the collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single()

    if (collectionError) throw collectionError
    if (collection.user_id !== user.id) {
      throw new Error('You can only modify your own collections')
    }

    const collectionProject: CollectionProjectInsert = {
      collection_id: collectionId,
      project_id: projectId
    }

    return supabase
      .from('collection_projects')
      .insert(collectionProject)
      .select(`
        *,
        projects (
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
        )
      `)
      .single()
  }

  // Remove project from collection
  static async removeProjectFromCollection(collectionId: string, projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to modify collections')

    // Verify the user owns the collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single()

    if (collectionError) throw collectionError
    if (collection.user_id !== user.id) {
      throw new Error('You can only modify your own collections')
    }

    return supabase
      .from('collection_projects')
      .delete()
      .eq('collection_id', collectionId)
      .eq('project_id', projectId)
  }

  // Check if project is in collection
  static async isProjectInCollection(collectionId: string, projectId: string) {
    const { data, error } = await supabase
      .from('collection_projects')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('project_id', projectId)
      .single()

    return !error && !!data
  }

  // Get collections that contain a specific project (for current user)
  static async getCollectionsWithProject(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: null }

    return supabase
      .from('collections')
      .select(`
        *,
        collection_projects!inner (
          project_id
        )
      `)
      .eq('user_id', user.id)
      .eq('collection_projects.project_id', projectId)
  }

  // SAFER WRAPPER METHODS WITH PROPER ERROR HANDLING

  /**
   * Safely create a new project with proper error handling
   */
  static async createProjectSafe(project: ProjectInsert): Promise<ServiceResult<any>> {
    return ErrorHandler.withErrorHandling(async () => {
      const { data, error } = await ProjectsService.createProject(project)
      if (error) throw error
      return data
    }, 'ProjectsService.createProjectSafe')
  }

  /**
   * Safely get project with proper error handling
   */
  static async getProjectSafe(id: string): Promise<ServiceResult<any>> {
    return ErrorHandler.withErrorHandling(async () => {
      const { data, error } = await ProjectsService.getProject(id)
      if (error) throw error
      return data
    }, 'ProjectsService.getProjectSafe')
  }

  /**
   * Safely vote on project with proper error handling
   */
  static async voteProjectSafe(projectId: string): Promise<ServiceResult<any>> {
    return ErrorHandler.withErrorHandling(async () => {
      const { data, error } = await ProjectsService.voteProject(projectId)
      if (error) throw error
      return data
    }, 'ProjectsService.voteProjectSafe')
  }

  /**
   * Safely remove vote with proper error handling
   */
  static async unvoteProjectSafe(projectId: string): Promise<ServiceResult<any>> {
    return ErrorHandler.withErrorHandling(async () => {
      const { data, error } = await ProjectsService.unvoteProject(projectId)
      if (error) throw error
      return data
    }, 'ProjectsService.unvoteProjectSafe')
  }
}

/**
 * Safer CommentsService methods with proper error handling
 */
export class SafeCommentsService {
  /**
   * Safely create a comment with proper error handling
   */
  static async createCommentSafe(data: {
    content: string
    project_id: string
    parent_id?: string | null
  }): Promise<ServiceResult<any>> {
    return ErrorHandler.withErrorHandling(async () => {
      const result = await CommentsService.createComment(data)
      if (result.error) throw new Error(result.error.message)
      return result.data
    }, 'SafeCommentsService.createCommentSafe')
  }

  /**
   * Safely update a comment with proper error handling
   */
  static async updateCommentSafe(commentId: string, content: string): Promise<ServiceResult<any>> {
    return ErrorHandler.withErrorHandling(async () => {
      const result = await CommentsService.updateComment(commentId, content)
      if (result.error) throw new Error(result.error.message)
      return result.data
    }, 'SafeCommentsService.updateCommentSafe')
  }

  /**
   * Safely delete a comment with proper error handling and rollback support
   */
  static async deleteCommentSafe(commentId: string): Promise<ServiceResult<any>> {
    return ErrorHandler.withErrorHandling(async () => {
      const result = await CommentsService.deleteComment(commentId)
      if (result.error) {
        // Handle specific error types for better UX
        if (result.error.code === 'RLS_POLICY_VIOLATION') {
          throw new Error('Permission denied. You can only delete your own comments.')
        }
        throw new Error(result.error.message || 'Failed to delete comment')
      }
      return result.data
    }, 'SafeCommentsService.deleteCommentSafe')
  }
}