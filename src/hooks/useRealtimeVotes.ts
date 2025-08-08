import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

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
  userId?: string
}

export function useRealtimeVotes({ 
  onVoteCountChange, 
  onUserVoteChange, 
  userId 
}: UseRealtimeVotesProps) {
  const channelsRef = useRef<RealtimeChannel[]>([])
  const isConnectedRef = useRef(false)

  useEffect(() => {
    // Clean up existing channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel)
    })
    channelsRef.current = []

    const setupRealtimeSubscriptions = async () => {
      try {
        // Channel 1: Listen to project upvotes_count changes
        const projectsChannel = supabase
          .channel('realtime-projects-votes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'projects',
              filter: 'upvotes_count=neq.0'
            },
            (payload: RealtimePostgresChangesPayload<any>) => {
              if (payload.new && payload.old) {
                const newCount = payload.new.upvotes_count
                const oldCount = payload.old.upvotes_count
                
                if (newCount !== oldCount) {
                  onVoteCountChange?({
                    projectId: payload.new.id,
                    newCount: newCount
                  })
                }
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
            (payload: RealtimePostgresChangesPayload<any>) => {
              if (payload.new) {
                onUserVoteChange?({
                  projectId: payload.new.project_id,
                  userId: payload.new.user_id,
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
            (payload: RealtimePostgresChangesPayload<any>) => {
              if (payload.old) {
                onUserVoteChange?({
                  projectId: payload.old.project_id,
                  userId: payload.old.user_id,
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
                console.log(`✅ Subscribed to ${channelName}`)
                resolve()
              } else if (status === 'CHANNEL_ERROR') {
                console.error(`❌ Error subscribing to ${channelName}`)
                reject(new Error(`Failed to subscribe to ${channelName}`))
              } else if (status === 'TIMED_OUT') {
                console.error(`⏰ Timeout subscribing to ${channelName}`)
                reject(new Error(`Timeout subscribing to ${channelName}`))
              } else if (status === 'CLOSED') {
                console.log(`🔌 Channel ${channelName} closed`)
              }
            })
          })
        })

        await Promise.allSettled(subscribePromises)
        isConnectedRef.current = true

      } catch (error) {
        console.error('Failed to setup realtime subscriptions:', error)
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
          console.error('Error removing channel:', error)
        }
      })
      channelsRef.current = []
      isConnectedRef.current = false
    }
  }, [onVoteCountChange, onUserVoteChange, userId])

  return {
    isConnected: isConnectedRef.current,
    channels: channelsRef.current
  }
}