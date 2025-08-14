/**
 * Vote Synchronization Utilities
 * Provides client-side validation and sync checking for vote counts
 */

import { supabase } from '@/lib/supabase'

interface SyncResult {
  projectId: string
  projectName: string
  storedCount: number
  actualCount: number
  synced: boolean
}

/**
 * Check if a project's vote count is synced with actual votes
 */
export async function checkProjectVoteSync(projectId: string): Promise<SyncResult | null> {
  try {
    // Get project info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, upvotes_count')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.warn(`Project ${projectId} not found for sync check`)
      return null
    }

    // Get actual vote count
    const { count: actualVotes, error: votesError } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    if (votesError) {
      console.error('Error checking votes:', votesError)
      return null
    }

    const actualCount = actualVotes || 0
    const storedCount = project.upvotes_count

    return {
      projectId,
      projectName: project.name,
      storedCount,
      actualCount,
      synced: storedCount === actualCount
    }
  } catch (error) {
    console.error('Error in checkProjectVoteSync:', error)
    return null
  }
}

/**
 * Fix a project's vote count if it's out of sync
 */
export async function fixProjectVoteSync(projectId: string): Promise<boolean> {
  try {
    const syncResult = await checkProjectVoteSync(projectId)
    if (!syncResult || syncResult.synced) {
      return true // Already synced or no project found
    }

    // Update the project with correct count
    const { error } = await supabase
      .from('projects')
      .update({ upvotes_count: syncResult.actualCount })
      .eq('id', projectId)

    if (error) {
      console.error('Error fixing vote sync:', error)
      return false
    }

    console.log(`Fixed vote sync for ${syncResult.projectName}: ${syncResult.storedCount} → ${syncResult.actualCount}`)
    return true
  } catch (error) {
    console.error('Error in fixProjectVoteSync:', error)
    return false
  }
}

/**
 * Validate vote count before displaying to user
 * Returns the corrected count and fixes sync issues silently
 */
export async function getValidatedVoteCount(projectId: string, initialCount: number): Promise<number> {
  try {
    const syncResult = await checkProjectVoteSync(projectId)
    
    if (!syncResult) {
      return initialCount // Fallback to initial if check fails
    }

    if (!syncResult.synced) {
      // Silently fix the sync issue
      await fixProjectVoteSync(projectId)
      return syncResult.actualCount
    }

    return syncResult.storedCount
  } catch (error) {
    console.error('Error in getValidatedVoteCount:', error)
    return initialCount
  }
}

/**
 * Periodic sync check for all projects (can be called on app startup)
 */
export async function performGlobalSyncCheck(): Promise<SyncResult[]> {
  try {
    const { data: results, error } = await supabase
      .rpc('sync_vote_counts')

    if (error) {
      console.error('Error in global sync check:', error)
      return []
    }

    return results || []
  } catch (error) {
    console.error('Error in performGlobalSyncCheck:', error)
    return []
  }
}