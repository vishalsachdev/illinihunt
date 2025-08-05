import { useState, useEffect, useCallback } from 'react'
import { formatDistance } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { CommentsService } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CommentForm } from './CommentForm'
import { Link } from 'react-router-dom'
import { sanitizeContent } from '@/lib/sanitize'
import { 
  MessageCircle, 
  Heart, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  AlertCircle 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CommentData {
  id: string
  content: string
  created_at: string
  updated_at: string
  likes_count: number
  thread_depth: number
  is_deleted: boolean
  users: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface CommentItemProps {
  comment: CommentData
  projectId: string
  onReply?: (commentId: string) => void
  onUpdate?: (commentId: string, newContent: string) => void
  onDelete?: (commentId: string) => void
  className?: string
}

export function CommentItem({ 
  comment, 
  projectId, 
  onReply, 
  onUpdate, 
  onDelete,
  className = ""
}: CommentItemProps) {
  const { user } = useAuth()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.likes_count)
  
  // Update like count if comment.likes_count changes
  useEffect(() => {
    setLikeCount(comment.likes_count)
  }, [comment.likes_count])
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')

  const isOwner = user && comment.users && user.id === comment.users.id
  
  // Debug ownership check
  useEffect(() => {
    console.log('CommentItem ownership check:', {
      commentId: comment.id,
      hasUser: !!user,
      userId: user?.id,
      hasCommentUser: !!comment.users,
      commentUserId: comment.users?.id,
      isOwner
    })
  }, [user, comment, isOwner])
  const canReply = comment.thread_depth < 3 // Max 3 levels deep
  
  const checkLikeStatus = useCallback(async () => {
    if (!comment.id) return
    
    try {
      const liked = await CommentsService.hasUserLikedComment(comment.id)
      console.log(`Like status for comment ${comment.id}:`, liked)
      setIsLiked(liked)
    } catch (error) {
      console.error('Error checking like status:', error)
      // On error, assume user hasn't liked
      setIsLiked(false)
    }
  }, [comment.id])

  useEffect(() => {
    if (user && comment.id) {
      console.log('CommentItem: Checking like status for user:', user.id, 'comment:', comment.id)
      checkLikeStatus()
    } else if (!user) {
      console.log('CommentItem: No user, resetting like state')
      setIsLiked(false)
    }
  }, [user, comment.id, checkLikeStatus])

  const handleLike = async () => {
    if (!user) return

    try {
      if (isLiked) {
        console.log('User has liked comment, removing like...')
        await CommentsService.unlikeComment(comment.id)
        setLikeCount(prev => prev - 1)
        setIsLiked(false)
      } else {
        console.log('User has not liked comment, adding like...')
        await CommentsService.likeComment(comment.id)
        setLikeCount(prev => prev + 1)
        setIsLiked(true)
      }
    } catch (error) {
      console.error('Like error:', error)
      // Silently handle error - like state will revert
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim()) {
      setError('Comment cannot be empty')
      return
    }

    setIsUpdating(true)
    setError('')

    try {
      const { error } = await CommentsService.updateComment(comment.id, editContent.trim())
      
      if (error) {
        setError('Failed to update comment')
        return
      }

      onUpdate?.(comment.id, editContent.trim())
      setIsEditing(false)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }

    console.log('CommentItem: Starting delete for comment:', comment.id)
    console.log('CommentItem: Current user:', user?.id)
    console.log('CommentItem: Comment owner:', comment.users?.id)

    try {
      const result = await CommentsService.deleteComment(comment.id)
      console.log('CommentItem: Delete result:', result)
      
      if (result.error) {
        console.error('CommentItem: Delete error:', result.error)
        setError('Failed to delete comment: ' + result.error.message)
        return
      }

      console.log('CommentItem: Successfully deleted comment, calling onDelete')
      onDelete?.(comment.id)
    } catch (err) {
      console.error('CommentItem: Delete exception:', err)
      setError('An unexpected error occurred: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleReplySubmit = () => {
    setShowReplyForm(false)
    onReply?.(comment.id)
  }

  if (comment.is_deleted) {
    return (
      <div className={`text-gray-500 italic py-2 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>This comment has been deleted</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.users ? (
            <Link to={`/user/${comment.users.id}`}>
              <Avatar className="w-8 h-8 hover:ring-2 hover:ring-uiuc-orange/50 transition-all">
                <AvatarImage src={comment.users.avatar_url || undefined} />
                <AvatarFallback>
                  {comment.users.full_name?.charAt(0) || 
                   comment.users.username?.charAt(0) || 
                   '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Avatar className="w-8 h-8">
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {comment.users ? (
                <Link 
                  to={`/user/${comment.users.id}`}
                  className="font-medium text-gray-900 hover:text-uiuc-blue transition-colors"
                >
                  {sanitizeContent(comment.users.full_name || comment.users.username || 'Anonymous')}
                </Link>
              ) : (
                <span className="font-medium text-gray-900">Anonymous</span>
              )}
              
              <span className="text-gray-500 text-sm">
                {formatDistance(new Date(comment.created_at), new Date(), { addSuffix: true })}
              </span>
              
              {comment.updated_at !== comment.created_at && (
                <span className="text-gray-400 text-xs">(edited)</span>
              )}
            </div>

            {/* Actions Menu */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded resize-none"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={isUpdating || !editContent.trim()}
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(comment.content)
                    setError('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {sanitizeContent(comment.content)}
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`h-auto p-1 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">{likeCount}</span>
              </Button>

              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="h-auto p-1 text-gray-500"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span className="text-xs">Reply</span>
                </Button>
              )}
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-4 pl-2 border-l-2 border-gray-200">
              <CommentForm
                projectId={projectId}
                parentId={comment.id}
                onCommentAdded={handleReplySubmit}
                onCancel={() => setShowReplyForm(false)}
                placeholder="Write a reply..."
                showAvatar={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}