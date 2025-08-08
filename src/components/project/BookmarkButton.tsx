import { useState, useEffect, useCallback } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookmarkService } from '@/lib/database'
import { useAuth } from '@/hooks/useAuth'
import { useAuthPrompt } from '@/contexts/AuthPromptContext'
import { cn } from '@/lib/utils'

interface BookmarkButtonProps {
  projectId: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  showLabel?: boolean
}

export function BookmarkButton({ 
  projectId, 
  className,
  size = 'sm',
  variant = 'ghost',
  showLabel = false
}: BookmarkButtonProps) {
  const { user } = useAuth()
  const { showAuthPrompt } = useAuthPrompt()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkBookmarkStatus = useCallback(async () => {
    try {
      const bookmarked = await BookmarkService.isBookmarked(projectId)
      setIsBookmarked(bookmarked)
    } catch (error) {
      // Silently fail, bookmark status will remain false
    }
  }, [projectId])

  // Check if project is bookmarked on mount
  useEffect(() => {
    if (user) {
      checkBookmarkStatus()
    }
  }, [user, checkBookmarkStatus])

  const handleBookmarkToggle = async () => {
    if (!user) {
      showAuthPrompt('bookmark projects')
      return
    }

    setIsLoading(true)
    try {
      if (isBookmarked) {
        await BookmarkService.removeBookmark(projectId)
        setIsBookmarked(false)
      } else {
        await BookmarkService.addBookmark(projectId)
        setIsBookmarked(true)
      }
    } catch (error) {
      // Silently fail, could add toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  const Icon = isBookmarked ? BookmarkCheck : Bookmark

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBookmarkToggle}
      disabled={isLoading}
      className={cn(
        'transition-all duration-200',
        isBookmarked 
          ? 'text-uiuc-orange hover:text-uiuc-orange/80' 
          : 'text-gray-600 hover:text-uiuc-orange',
        className
      )}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark project'}
    >
      <Icon 
        className={cn(
          size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
          showLabel && 'mr-2',
          isBookmarked && 'fill-current'
        )} 
      />
      {showLabel && (
        <span className="text-xs">
          {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
    </Button>
  )
}