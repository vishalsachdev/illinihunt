import { useState, useEffect, useCallback } from 'react'
import { CommentsService } from '@/lib/database'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'
import { Button } from '@/components/ui/button'
import { MessageCircle, RefreshCw } from 'lucide-react'
import type { Database } from '@/types/database'

type Comment = Database['public']['Tables']['comments']['Row']

interface CommentData {
  id: string
  content: string
  created_at: string
  updated_at: string
  likes_count: number
  thread_depth: number
  parent_id: string | null
  is_deleted: boolean
  users: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface ThreadedComment extends CommentData {
  replies: ThreadedComment[]
}

interface CommentListProps {
  projectId: string
  totalComments: number
}

export function CommentList({ projectId, totalComments }: CommentListProps) {
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const loadComments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    setError('')

    try {
      const { data, error } = await CommentsService.getProjectComments(projectId)
      
      if (error) {
        setError('Failed to load comments')
        return
      }

      if (data) {
        setComments(data)
      }
    } catch (err) {
      setError('An unexpected error occurred while loading comments')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [projectId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleCommentAdded = (newComment: Comment) => {
    // Transform the new comment to match our CommentData interface
    const commentData: CommentData = {
      ...newComment,
      users: null // This will be populated when we refresh comments
    }
    setComments(prev => [...prev, commentData])
  }

  const handleCommentUpdated = (commentId: string, newContent: string) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: newContent, updated_at: new Date().toISOString() }
          : comment
      )
    )
  }

  const handleCommentDeleted = (commentId: string) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, is_deleted: true }
          : comment
      )
    )
  }

  const handleReply = () => {
    // Refresh comments to show new replies
    loadComments(true)
  }

  // Organize comments into a threaded structure
  const organizeComments = (comments: CommentData[]): ThreadedComment[] => {
    const commentMap = new Map<string, ThreadedComment>()
    const rootComments: ThreadedComment[] = []

    // First pass: create map with empty replies arrays
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: organize into threads
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!
      
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        // This is a reply, add it to parent's replies
        const parent = commentMap.get(comment.parent_id)!
        parent.replies.push(commentWithReplies)
      } else {
        // This is a root comment
        rootComments.push(commentWithReplies)
      }
    })

    // Sort root comments by creation date (newest first)
    rootComments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Sort replies within each thread (oldest first for better conversation flow)
    const sortReplies = (comment: ThreadedComment) => {
      comment.replies.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      comment.replies.forEach(sortReplies)
    }

    rootComments.forEach(sortReplies)

    return rootComments
  }

  const renderCommentThread = (comment: ThreadedComment, depth = 0) => (
    <div key={comment.id} className="space-y-4">
      <CommentItem
        comment={comment}
        projectId={projectId}
        onReply={handleReply}
        onUpdate={handleCommentUpdated}
        onDelete={handleCommentDeleted}
        className={depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-100' : ''}
      />
      
      {comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map(reply => renderCommentThread(reply, depth + 1))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comments ({totalComments})
          </h2>
        </div>
        
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comments ({totalComments})
          </h2>
        </div>
        
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg inline-block">
            <p className="mb-3">{error}</p>
            <Button onClick={() => loadComments()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const organizedComments = organizeComments(comments)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments ({totalComments})
        </h2>
        
        {comments.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadComments(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      {/* Comment Form */}
      <CommentForm
        projectId={projectId}
        onCommentAdded={handleCommentAdded}
      />

      {/* Comments */}
      {comments.length > 0 ? (
        <div className="space-y-6">
          {organizedComments.map(comment => renderCommentThread(comment))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
          <p className="text-gray-600">
            Be the first to share your thoughts about this project!
          </p>
        </div>
      )}
    </div>
  )
}