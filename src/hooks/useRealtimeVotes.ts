import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface VoteUpdate {
  project_id: string
  upvotes_count: number
}

interface UseRealtimeVotesReturn {
  subscribe: (projectId: string) => void
  unsubscribe: (projectId: string) => void
  getVoteCount: (projectId: string) => number | undefined
  isConnected: boolean
}

export function useRealtimeVotes(): UseRealtimeVotesReturn {
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [channels, setChannels] = useState<Record<string, RealtimeChannel>>({})
  const [isConnected, setIsConnected] = useState(false)

  // Handle vote count updates
  const handleVoteUpdate = useCallback((payload: any) => {
    if (payload.eventType === 'UPDATE' && payload.new?.id) {
      const projectId = payload.new.id
      const newCount = payload.new.upvotes_count || 0
      
      setVoteCounts(prev => ({
        ...prev,
        [projectId]: newCount
      }))
    }
  }, [])

  // Handle vote insertions/deletions
  const handleVoteChange = useCallback(async (payload: any) => {
    let projectId: string | undefined

    if (payload.eventType === 'INSERT') {
      projectId = payload.new?.project_id
    } else if (payload.eventType === 'DELETE') {
      projectId = payload.old?.project_id
    }

    if (!projectId) return

    // Fetch the updated vote count for this project
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('upvotes_count')
        .eq('id', projectId)
        .single()

      if (!error && data) {
        setVoteCounts(prev => ({
          ...prev,
          [projectId]: data.upvotes_count || 0
        }))
      }
    } catch (err) {
      console.warn('Error fetching updated vote count:', err)
    }
  }, [])

  const subscribe = useCallback((projectId: string) => {
    // Don't create duplicate subscriptions
    if (channels[projectId]) {
      return
    }

    // Subscribe to project updates (upvotes_count changes)
    const projectChannel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        handleVoteUpdate
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false)
        }
      })

    // Subscribe to vote changes for this project
    const voteChannel = supabase
      .channel(`votes-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `project_id=eq.${projectId}`
        },
        handleVoteChange
      )
      .subscribe()

    setChannels(prev => ({
      ...prev,
      [projectId]: projectChannel,
      [`votes-${projectId}`]: voteChannel
    }))
  }, [channels, handleVoteUpdate, handleVoteChange])

  const unsubscribe = useCallback((projectId: string) => {
    const projectChannel = channels[projectId]
    const voteChannel = channels[`votes-${projectId}`]

    if (projectChannel) {
      projectChannel.unsubscribe()
    }
    if (voteChannel) {
      voteChannel.unsubscribe()
    }

    setChannels(prev => {
      const newChannels = { ...prev }
      delete newChannels[projectId]
      delete newChannels[`votes-${projectId}`]
      return newChannels
    })

    setVoteCounts(prev => {
      const newCounts = { ...prev }
      delete newCounts[projectId]
      return newCounts
    })
  }, [channels])

  const getVoteCount = useCallback((projectId: string) => {
    return voteCounts[projectId]
  }, [voteCounts])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(channels).forEach(channel => {
        if (channel) {
          channel.unsubscribe()
        }
      })
    }
  }, [channels])

  return {
    subscribe,
    unsubscribe,
    getVoteCount,
    isConnected
  }
}