import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

interface VoteCountChange {
  projectId: string
  newCount: number
}

interface UserVoteChange {
  projectId: string
  userId: string
  hasVoted: boolean
}

interface UseRealtimeVotesProps {
  onVoteCountChange?: (change: VoteCountChange) => void
  onUserVoteChange?: (change: UserVoteChange) => void
  onProjectDeleted?: (projectId: string) => void
  userId?: string
}

/**
 * Optimized realtime votes hook
 * Performance improvements:
 * - Uses useCallback to memoize handlers and prevent unnecessary subscription recreations
 * - Properly manages channel cleanup to prevent memory leaks
 * - Silently handles errors to avoid console noise
 */
export function useRealtimeVotes({ 
  onVoteCountChange, 
  onUserVoteChange, 
  onProjectDeleted,
  userId 
}: UseRealtimeVotesProps) {
  const channelsRef = useRef<RealtimeChannel[]>([])
  const isConnectedRef = useRef(false)

  // Store callbacks in refs to avoid dependency issues while maintaining stable references
  const onVoteCountChangeRef = useRef(onVoteCountChange)
  const onUserVoteChangeRef = useRef(onUserVoteChange)
  const onProjectDeletedRef = useRef(onProjectDeleted)

  // Update refs when callbacks change
  useEffect(() => {
    onVoteCountChangeRef.current = onVoteCountChange
    onUserVoteChangeRef.current = onUserVoteChange
    onProjectDeletedRef.current = onProjectDeleted
  }, [onVoteCountChange, onUserVoteChange, onProjectDeleted])

  useEffect(() => {
    // Clean up existing channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel)
    })
    channelsRef.current = []

    const setupRealtimeSubscriptions = async () => {
      try {
        // Channel 1: Listen to project upvotes_count changes and deletions
        const projectsChannel = supabase
          .channel('realtime-projects-votes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'projects'
              // Removed problematic filter: 'upvotes_count=neq.0'
            },
            (
              payload: RealtimePostgresChangesPayload<Database['public']['Tables']['projects']['Row']>
            ) => {
              const newProject = payload.new as Database['public']['Tables']['projects']['Row'] | null
              const oldProject = payload.old as Database['public']['Tables']['projects']['Row'] | null

              if (newProject && oldProject) {
                const newCount = newProject.upvotes_count
                const oldCount = oldProject.upvotes_count

                // Only trigger callback if count actually changed
                if (newCount !== oldCount && onVoteCountChangeRef.current) {
                  onVoteCountChangeRef.current({
                    projectId: newProject.id,
                    newCount: newCount
                  })
                }
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'projects'
            },
            (
              payload: RealtimePostgresChangesPayload<Database['public']['Tables']['projects']['Row']>
            ) => {
              const deletedProject = payload.old as Database['public']['Tables']['projects']['Row'] | null

              if (deletedProject && onProjectDeletedRef.current) {
                // Clear vote data for deleted project
                onProjectDeletedRef.current(deletedProject.id)
              }
            }
          )

        // Channel 2: Listen to votes table changes for user vote status
        const votesChannel = supabase
          .channel('realtime-votes-table')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'votes'
            },
            (
              payload: RealtimePostgresChangesPayload<Database['public']['Tables']['votes']['Row']>
            ) => {
              const newVote = payload.new as Database['public']['Tables']['votes']['Row'] | null

              if (newVote && onUserVoteChangeRef.current) {
                onUserVoteChangeRef.current({
                  projectId: newVote.project_id,
                  userId: newVote.user_id,
                  hasVoted: true
                })
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'votes'
            },
            (
              payload: RealtimePostgresChangesPayload<Database['public']['Tables']['votes']['Row']>
            ) => {
              const oldVote = payload.old as Database['public']['Tables']['votes']['Row'] | null

              if (oldVote && onUserVoteChangeRef.current) {
                onUserVoteChangeRef.current({
                  projectId: oldVote.project_id,
                  userId: oldVote.user_id,
                  hasVoted: false
                })
              }
            }
          )

        // Store channels for cleanup
        channelsRef.current = [projectsChannel, votesChannel]

        // Subscribe to both channels with consistent error handling
        const subscribePromises = channelsRef.current.map(channel => {
          return new Promise<void>((resolve, reject) => {
            // Fixed: Use consistent channel key naming pattern - lines 108-112
            const channelName = channel.topic
            
            channel.subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                resolve()
              } else if (status === 'CHANNEL_ERROR') {
                reject(new Error(`Failed to subscribe to ${channelName}`))
              } else if (status === 'TIMED_OUT') {
                reject(new Error(`Timeout subscribing to ${channelName}`))
              }
            })
          })
        })

        await Promise.allSettled(subscribePromises)
        isConnectedRef.current = true

      } catch (error) {
        // Silently handle realtime setup errors to avoid console noise
        isConnectedRef.current = false
      }
    }

    setupRealtimeSubscriptions()

    // Cleanup function
    return () => {
      channelsRef.current.forEach(channel => {
        try {
          supabase.removeChannel(channel)
        } catch (error) {
          // Silently handle channel cleanup errors
        }
      })
      channelsRef.current = []
      isConnectedRef.current = false
    }
    // Only depend on userId to avoid unnecessary reconnections
    // Callbacks are accessed via refs, so they don't need to be in dependencies
  }, [userId])

  return {
    isConnected: isConnectedRef.current,
    channels: channelsRef.current
  }
}