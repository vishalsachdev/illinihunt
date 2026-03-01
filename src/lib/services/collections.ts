import { supabase } from '../supabase'
import type { Database } from '@/types/database'
import { requireAuth } from './auth-helpers'
import { COLLECTION_WITH_USER_SELECT, PROJECT_WITH_JOINS_SELECT } from './query-constants'

type CollectionInsert = Database['public']['Tables']['collections']['Insert']
type CollectionUpdate = Database['public']['Tables']['collections']['Update']
type CollectionProjectInsert = Database['public']['Tables']['collection_projects']['Insert']

export class CollectionService {
  static async createCollection(collection: Omit<CollectionInsert, 'user_id'>) {
    const user = await requireAuth('create collections')

    const newCollection: CollectionInsert = {
      ...collection,
      user_id: user.id
    }

    return supabase
      .from('collections')
      .insert(newCollection)
      .select(COLLECTION_WITH_USER_SELECT)
      .single()
  }

  static async getUserCollections(userId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error('User ID required')

    return supabase
      .from('collections')
      .select(COLLECTION_WITH_USER_SELECT)
      .eq('user_id', targetUserId)
      .order('updated_at', { ascending: false })
  }

  static async getPublicCollections(limit = 20, offset = 0) {
    return supabase
      .from('public_collections_with_stats')
      .select('*')
      .range(offset, offset + limit - 1)
  }

  static async getCollection(collectionId: string, includeProjects = true) {
    const baseQuery = supabase
      .from('collections')
      .select(COLLECTION_WITH_USER_SELECT)
      .eq('id', collectionId)
      .single()

    if (!includeProjects) {
      return baseQuery
    }

    const collectionResult = await baseQuery
    if (collectionResult.error) return collectionResult

    const projectsResult = await supabase
      .from('collection_projects')
      .select(`
        id,
        added_at,
        projects (
          ${PROJECT_WITH_JOINS_SELECT}
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

  static async updateCollection(collectionId: string, updates: CollectionUpdate) {
    const user = await requireAuth('update collections')

    return supabase
      .from('collections')
      .update(updates)
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .select()
      .single()
  }

  static async deleteCollection(collectionId: string) {
    const user = await requireAuth('delete collections')

    return supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.id)
  }

  static async addProjectToCollection(collectionId: string, projectId: string) {
    const user = await requireAuth('modify collections')

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
          ${PROJECT_WITH_JOINS_SELECT}
        )
      `)
      .single()
  }

  static async removeProjectFromCollection(collectionId: string, projectId: string) {
    const user = await requireAuth('modify collections')

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

  static async isProjectInCollection(collectionId: string, projectId: string) {
    const { data, error } = await supabase
      .from('collection_projects')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('project_id', projectId)
      .single()

    return !error && !!data
  }

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
