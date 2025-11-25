import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthPrompt } from '@/contexts/AuthPromptContext'
import { useError } from '@/contexts/ErrorContext'
import { useRealtimeVotesContext } from '@/contexts/RealtimeVotesContext'
import { ProjectsService } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoteButtonProps {
  projectId: string
  initialVoteCount: number
  className?: string
  onVoteChange?: (newCount: number) => void
}

export function VoteButton({ projectId, initialVoteCount, className, onVoteChange }: VoteButtonProps) {
  const { user } = useAuth()
  const { showAuthPrompt } = useAuthPrompt()
  const { handleServiceError, showSuccess } = useError()
  const { getVoteData, updateVoteCount, updateUserVote, clearVoteData, isRealtimeConnected } = useRealtimeVotesContext()
  
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [hasVoted, setHasVoted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isVotingRef = useRef(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  // Update from real-time data if available
  useEffect(() => {
    const realtimeData = getVoteData(projectId)
    if (realtimeData && isRealtimeConnected) {
      setVoteCount(realtimeData.count)
      setHasVoted(realtimeData.hasVoted)
    } else {
      // Fallback to initial values
      setVoteCount(initialVoteCount)
    }
  }, [getVoteData, projectId, initialVoteCount, isRealtimeConnected])
  
  // Initialize real-time data
  useEffect(() => {
    updateVoteCount(projectId, initialVoteCount)
  }, [projectId, initialVoteCount, updateVoteCount])

  const checkVoteStatus = useCallback(async () => {
    if (!projectId) return
    
    try {
      // First verify project exists
      const { data: project, error: projectError } = await ProjectsService.getProject(projectId)
      if (projectError || !project) {
        // Project doesn't exist - clear vote data
        clearVoteData(projectId)
        setHasVoted(false)
        setVoteCount(0)
        return
      }

      const voted = await ProjectsService.hasUserVoted(projectId)
      setHasVoted(voted)
      updateUserVote(projectId, voted)
    } catch (error) {
      handleServiceError(error, 'check vote status')
      // On error, assume user hasn't voted
      setHasVoted(false)
      updateUserVote(projectId, false)
    }
  }, [projectId, handleServiceError, updateUserVote, clearVoteData])

  useEffect(() => {
    if (user && projectId) {
      checkVoteStatus()
    } else if (!user) {
      setHasVoted(false)
      updateUserVote(projectId, false)
    }
  }, [user, projectId, checkVoteStatus, updateUserVote])

  const executeVote = async () => {
    if (isVotingRef.current) return
    isVotingRef.current = true
    setIsLoading(true)
    
    // Store current state for rollback
    const previousVoteCount = voteCount
    const previousHasVoted = hasVoted
    const isRemoving = hasVoted
    
    try {
      // First check if project still exists
      const { data: project, error: projectError } = await ProjectsService.getProject(projectId)
      if (projectError || !project) {
        // Project doesn't exist - clear from local state
        clearVoteData(projectId)
        setVoteCount(0)
        setHasVoted(false)
        handleServiceError(new Error('This project no longer exists'), 'vote on project')
        return
      }

      if (hasVoted) {
        // Optimistically update UI - prevent negative votes
        const newCount = Math.max(0, voteCount - 1)
        setVoteCount(newCount)
        setHasVoted(false)
        updateVoteCount(projectId, newCount)
        updateUserVote(projectId, false)
        
        // Remove vote
        const { error } = await ProjectsService.unvoteProject(projectId)
        if (error) {
          throw error
        }
        showSuccess('Vote removed')
        onVoteChange?.(newCount)
      } else {
        // Optimistically update UI and real-time state
        const newCount = voteCount + 1
        setVoteCount(newCount)
        setHasVoted(true)
        updateVoteCount(projectId, newCount)
        updateUserVote(projectId, true)
        
        // Add vote
        const { error } = await ProjectsService.voteProject(projectId)
        if (error) {
          throw error
        }
        showSuccess('Vote added!')
        onVoteChange?.(newCount)
      }
    } catch (error) {
      // Rollback on error
      setVoteCount(previousVoteCount)
      setHasVoted(previousHasVoted)
      updateVoteCount(projectId, previousVoteCount)
      updateUserVote(projectId, previousHasVoted)
      
      const operation = isRemoving ? 'remove vote' : 'add vote'
      handleServiceError(error, operation, () => handleVote())
    } finally {
      setIsLoading(false)
      isVotingRef.current = false
    }
  }

  const handleVote = () => {
    if (!user) {
      showAuthPrompt('vote on projects')
      return
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = undefined
    }

    // Optimized debounce to prevent rapid clicking
    // Reduced from 300ms to 200ms for better perceived performance
    // Still prevents accidental double-clicks
    debounceTimeoutRef.current = setTimeout(() => {
      executeVote()
    }, 200)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = undefined
      }
    }
  }, [])

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleVote}
      disabled={isLoading}
      className={cn(
        'flex flex-col items-center gap-1 h-auto p-2 min-w-[60px]',
        hasVoted 
          ? '!bg-uiuc-blue !text-white !border-uiuc-blue hover:!bg-uiuc-blue/90'
          : 'text-black hover:text-gray-700',
        className
      )}
    >
      <ChevronUp className={cn(
        'w-4 h-4',
        hasVoted && 'text-white'
      )} />
      <span className="text-xs font-medium">{voteCount}</span>
    </Button>
  )
}