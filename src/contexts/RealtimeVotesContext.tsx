/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes'
import { useAuth } from '@/hooks/useAuth'

interface VoteData {
  count: number
  hasVoted: boolean
}

interface RealtimeVotesContextValue {
  getVoteData: (projectId: string) => VoteData | null
  updateVoteCount: (projectId: string, count: number) => void
  updateUserVote: (projectId: string, hasVoted: boolean) => void
  clearVoteData: (projectId: string) => void
  isRealtimeConnected: boolean
}

const DEFAULT_VOTE_DATA: VoteData = { count: 0, hasVoted: false }

/** Immutable helper: clone Map, merge partial update for projectId */
function updateVoteMap(
  prev: Map<string, VoteData>,
  projectId: string,
  patch: Partial<VoteData>
): Map<string, VoteData> {
  const next = new Map(prev)
  next.set(projectId, { ...(next.get(projectId) || DEFAULT_VOTE_DATA), ...patch })
  return next
}

const RealtimeVotesContext = createContext<RealtimeVotesContextValue | null>(null)

interface RealtimeVotesProviderProps {
  children: ReactNode
}

/**
 * Performance optimization: Context value is memoized to prevent unnecessary re-renders
 * of all components consuming this context
 */
export function RealtimeVotesProvider({ children }: RealtimeVotesProviderProps) {
  const { user } = useAuth()
  const [voteData, setVoteData] = useState<Map<string, VoteData>>(new Map())

  const handleVoteCountChange = useCallback((change: { projectId: string; newCount: number }) => {
    setVoteData(prev => updateVoteMap(prev, change.projectId, { count: change.newCount }))
  }, [])

  const handleUserVoteChange = useCallback((change: { projectId: string; userId: string; hasVoted: boolean }) => {
    // Only update if it's the current user's vote
    if (user && change.userId === user.id) {
      setVoteData(prev => updateVoteMap(prev, change.projectId, { hasVoted: change.hasVoted }))
    }
  }, [user])

  const handleProjectDeleted = useCallback((projectId: string) => {
    setVoteData(prev => {
      const newMap = new Map(prev)
      newMap.delete(projectId)
      return newMap
    })
  }, [])

  const { isConnected } = useRealtimeVotes({
    onVoteCountChange: handleVoteCountChange,
    onUserVoteChange: handleUserVoteChange,
    onProjectDeleted: handleProjectDeleted,
    userId: user?.id
  })

  const getVoteData = useCallback((projectId: string): VoteData | null => {
    return voteData.get(projectId) || null
  }, [voteData])

  const updateVoteCount = useCallback((projectId: string, count: number) => {
    setVoteData(prev => updateVoteMap(prev, projectId, { count }))
  }, [])

  const updateUserVote = useCallback((projectId: string, hasVoted: boolean) => {
    setVoteData(prev => updateVoteMap(prev, projectId, { hasVoted }))
  }, [])

  const clearVoteData = useCallback((projectId: string) => {
    setVoteData(prev => {
      const newMap = new Map(prev)
      newMap.delete(projectId)
      return newMap
    })
  }, [])

  // Memoize context value to prevent re-renders of all consumers
  // Only updates when callback functions or connection status changes
  const contextValue: RealtimeVotesContextValue = useMemo(() => ({
    getVoteData,
    updateVoteCount,
    updateUserVote,
    clearVoteData,
    isRealtimeConnected: isConnected
  }), [getVoteData, updateVoteCount, updateUserVote, clearVoteData, isConnected])

  return (
    <RealtimeVotesContext.Provider value={contextValue}>
      {children}
    </RealtimeVotesContext.Provider>
  )
}

export function useRealtimeVotesContext() {
  const context = useContext(RealtimeVotesContext)
  if (!context) {
    throw new Error('useRealtimeVotesContext must be used within a RealtimeVotesProvider')
  }
  return context
}