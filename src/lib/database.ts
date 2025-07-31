import { supabase } from './supabase'
import type { Database } from '@/types/database'

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
      .maybeSingle()

    return !error && !!data
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to delete comments')

    return supabase
      .from('comments')
      .update({ 
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', user.id) // Only allow users to delete their own comments
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

    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single()

    return !error && !!data
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

    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .maybeSingle()

    return !error && !!data
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
}