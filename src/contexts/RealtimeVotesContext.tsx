import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
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
  isRealtimeConnected: boolean
}

const RealtimeVotesContext = createContext<RealtimeVotesContextValue | null>(null)

interface RealtimeVotesProviderProps {
  children: ReactNode
}

export function RealtimeVotesProvider({ children }: RealtimeVotesProviderProps) {
  const { user } = useAuth()
  const [voteData, setVoteData] = useState<Map<string, VoteData>>(new Map())

  const handleVoteCountChange = useCallback((change: { projectId: string; newCount: number }) => {
    setVoteData(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(change.projectId) || { count: 0, hasVoted: false }
      newMap.set(change.projectId, {
        ...existing,
        count: change.newCount
      })
      return newMap
    })
  }, [])

  const handleUserVoteChange = useCallback((change: { projectId: string; userId: string; hasVoted: boolean }) => {
    // Only update if it's the current user's vote
    if (user && change.userId === user.id) {
      setVoteData(prev => {
        const newMap = new Map(prev)
        const existing = newMap.get(change.projectId) || { count: 0, hasVoted: false }
        newMap.set(change.projectId, {
          ...existing,
          hasVoted: change.hasVoted
        })
        return newMap
      })
    }
  }, [user])

  const { isConnected } = useRealtimeVotes({
    onVoteCountChange: handleVoteCountChange,
    onUserVoteChange: handleUserVoteChange,
    userId: user?.id
  })

  const getVoteData = useCallback((projectId: string): VoteData | null => {
    return voteData.get(projectId) || null
  }, [voteData])

  const updateVoteCount = useCallback((projectId: string, count: number) => {
    setVoteData(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(projectId) || { count: 0, hasVoted: false }
      newMap.set(projectId, {
        ...existing,
        count
      })
      return newMap
    })
  }, [])

  const updateUserVote = useCallback((projectId: string, hasVoted: boolean) => {
    setVoteData(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(projectId) || { count: 0, hasVoted: false }
      newMap.set(projectId, {
        ...existing,
        hasVoted
      })
      return newMap
    })
  }, [])

  const contextValue: RealtimeVotesContextValue = {
    getVoteData,
    updateVoteCount,
    updateUserVote,
    isRealtimeConnected: isConnected
  }

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