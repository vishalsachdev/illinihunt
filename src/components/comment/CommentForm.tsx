import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthPrompt } from '@/contexts/AuthPromptContext'
import { useError } from '@/contexts/ErrorContext'
import { CommentsService } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, X } from 'lucide-react'
import type { Database } from '@/types/database'

type Comment = Database['public']['Tables']['comments']['Row']

interface CommentFormProps {
  projectId: string
  parentId?: string | null
  onCommentAdded?: (comment: Comment) => void
  onCancel?: () => void
  placeholder?: string
  showAvatar?: boolean
}

export function CommentForm({ 
  projectId, 
  parentId = null, 
  onCommentAdded, 
  onCancel,
  placeholder = "Share your thoughts...",
  showAvatar = true
}: CommentFormProps) {
  const { user, profile } = useAuth()
  const { showAuthPrompt } = useAuthPrompt()
  const { handleServiceError, showSuccess } = useError()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      showAuthPrompt('comment on projects')
      return
    }

    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const { data, error } = await CommentsService.createComment({
        content: content.trim(),
        project_id: projectId,
        parent_id: parentId
      })

      if (error) {
        throw error
      }

      if (data) {
        setContent('')
        setError('')
        showSuccess('Comment posted!', 'Your comment has been added to the discussion.')
        onCommentAdded?.(data)
      }
    } catch (err) {
      handleServiceError(err, 'post comment', () => handleSubmit(e))
      setError('Failed to post comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
        <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-3">Join the conversation</p>
        <Button onClick={() => showAuthPrompt('comment on projects')}>
          Log in to Comment
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          {showAvatar && (
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                {profile?.full_name?.charAt(0) || 
                 profile?.username?.charAt(0) || 
                 user.email?.charAt(0) || 
                 '?'}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className="flex-1">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              rows={parentId ? 2 : 3}
              className="resize-none"
              disabled={isSubmitting}
            />
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-gray-500">
                {parentId ? 'Replying to comment' : 'Add a comment'}
              </div>
              
              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                )}
                
                <Button
                  type="submit"
                  size="sm"
                  disabled={!content.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {parentId ? 'Reply' : 'Comment'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}