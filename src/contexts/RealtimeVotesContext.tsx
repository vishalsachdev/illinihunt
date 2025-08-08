import { createContext, useContext, ReactNode } from 'react'
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes'

interface RealtimeVotesContextType {
  subscribe: (projectId: string) => void
  unsubscribe: (projectId: string) => void
  getVoteCount: (projectId: string) => number | undefined
  isConnected: boolean
}

const RealtimeVotesContext = createContext<RealtimeVotesContextType | null>(null)

interface RealtimeVotesProviderProps {
  children: ReactNode
}

export function RealtimeVotesProvider({ children }: RealtimeVotesProviderProps) {
  const realtimeVotes = useRealtimeVotes()

  return (
    <RealtimeVotesContext.Provider value={realtimeVotes}>
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