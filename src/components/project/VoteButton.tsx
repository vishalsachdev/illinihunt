import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthPrompt } from '@/contexts/AuthPromptContext'
import { useError } from '@/contexts/ErrorContext'
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
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  
  // Update vote count if initialVoteCount changes
  useEffect(() => {
    setVoteCount(initialVoteCount)
  }, [initialVoteCount])
  const [hasVoted, setHasVoted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkVoteStatus = useCallback(async () => {
    if (!projectId) return
    
    try {
      const voted = await ProjectsService.hasUserVoted(projectId)
      setHasVoted(voted)
    } catch (error) {
      handleServiceError(error, 'check vote status')
      // On error, assume user hasn't voted
      setHasVoted(false)
    }
  }, [projectId, handleServiceError])

  useEffect(() => {
    if (user && projectId) {
      checkVoteStatus()
    } else if (!user) {
      setHasVoted(false)
    }
  }, [user, projectId, checkVoteStatus])

  const handleVote = async () => {
    if (!user) {
      showAuthPrompt('vote on projects')
      return
    }

    setIsLoading(true)
    
    // Store current state for rollback
    const previousVoteCount = voteCount
    const previousHasVoted = hasVoted
    const isRemoving = hasVoted
    const retry = () => handleVote()
    
    try {
      if (hasVoted) {
        // Optimistically update UI - prevent negative votes
        const newCount = Math.max(0, voteCount - 1)
        setVoteCount(newCount)
        setHasVoted(false)
        
        // Remove vote
        const { error } = await ProjectsService.unvoteProject(projectId)
        if (error) {
          throw error
        }
        
        showSuccess('Vote removed')
        // Update parent component
        onVoteChange?.(newCount)
      } else {
        // Optimistically update UI
        const newCount = voteCount + 1
        setVoteCount(newCount)
        setHasVoted(true)
        
        // Add vote
        const { error } = await ProjectsService.voteProject(projectId)
        if (error) {
          throw error
        }
        
        showSuccess('Vote added!')
        // Update parent component  
        onVoteChange?.(newCount)
      }
    } catch (error) {
      // Rollback on error
      setVoteCount(previousVoteCount)
      setHasVoted(previousHasVoted)
      
      const operation = isRemoving ? 'remove vote' : 'add vote'
      handleServiceError(error, operation, retry)
    } finally {
      setIsLoading(false)
    }
  }

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