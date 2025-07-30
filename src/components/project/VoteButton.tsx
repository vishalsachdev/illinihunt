import { useState, useEffect } from 'react'
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
}

export function VoteButton({ projectId, initialVoteCount, className }: VoteButtonProps) {
  const { user } = useAuth()
  const { showAuthPrompt } = useAuthPrompt()
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [hasVoted, setHasVoted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      checkVoteStatus()
    }
  }, [user, projectId])

  const checkVoteStatus = async () => {
    try {
      const voted = await ProjectsService.hasUserVoted(projectId)
      setHasVoted(voted)
    } catch (error) {
      // Silently handle error - vote status will remain unchecked
    }
  }

  const handleVote = async () => {
    if (!user) {
      showAuthPrompt('vote on projects')
      return
    }

    setIsLoading(true)
    try {
      if (hasVoted) {
        // Remove vote
        await ProjectsService.unvoteProject(projectId)
        setVoteCount(prev => prev - 1)
        setHasVoted(false)
      } else {
        // Add vote
        await ProjectsService.voteProject(projectId)
        setVoteCount(prev => prev + 1)
        setHasVoted(true)
      }
    } catch (error) {
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
        hasVoted && 'bg-uiuc-orange text-white border-uiuc-orange hover:bg-uiuc-orange/90',
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