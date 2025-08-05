import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthPrompt } from '@/contexts/AuthPromptContext'
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
      console.log(`Vote status for project ${projectId}:`, voted)
      setHasVoted(voted)
    } catch (error) {
      console.error('Error checking vote status:', error)
      // On error, assume user hasn't voted
      setHasVoted(false)
    }
  }, [projectId])

  useEffect(() => {
    if (user && projectId) {
      console.log('VoteButton: Checking vote status for user:', user.id, 'project:', projectId)
      checkVoteStatus()
    } else if (!user) {
      console.log('VoteButton: No user, resetting vote state')
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
    
    console.log('VoteButton: Starting vote action. Current state:', {
      hasVoted,
      voteCount,
      userId: user.id,
      projectId
    })
    
    try {
      if (hasVoted) {
        console.log('VoteButton: User has voted, removing vote...')
        // Optimistically update UI
        const newCount = voteCount - 1
        setVoteCount(newCount)
        setHasVoted(false)
        
        // Remove vote
        const { error } = await ProjectsService.unvoteProject(projectId)
        if (error) {
          console.error('VoteButton: Error removing vote:', error)
          throw error
        }
        
        console.log('VoteButton: Successfully removed vote')
        // Update parent component
        onVoteChange?.(newCount)
      } else {
        console.log('VoteButton: User has not voted, adding vote...')
        // Optimistically update UI
        const newCount = voteCount + 1
        setVoteCount(newCount)
        setHasVoted(true)
        
        // Add vote
        const { error } = await ProjectsService.voteProject(projectId)
        if (error) {
          console.error('VoteButton: Error adding vote:', error)
          throw error
        }
        
        console.log('VoteButton: Successfully added vote')
        // Update parent component  
        onVoteChange?.(newCount)
      }
    } catch (error) {
      // Rollback on error
      console.log('VoteButton: Rolling back due to error')
      setVoteCount(previousVoteCount)
      setHasVoted(previousHasVoted)
      console.error('Vote error:', error)
      alert('Failed to vote. Please try again.')
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
          ? 'bg-uiuc-orange text-white border-uiuc-orange hover:bg-uiuc-orange/90'
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