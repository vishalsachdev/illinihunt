import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ModerationService, type AdminComment } from '@/lib/services/moderation'
import { showToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Search, Trash2, MessageCircle } from 'lucide-react'

export function CommentsTab() {
  const [comments, setComments] = useState<AdminComment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadComments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await ModerationService.getComments(
      debouncedQuery || undefined
    )

    if (error) {
      showToast.error('Failed to load comments', { description: error.message })
    }

    setComments(data ?? [])
    setLoading(false)
  }, [debouncedQuery])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId)

    const { error } = await ModerationService.deleteComment(commentId)

    if (error) {
      showToast.error('Failed to delete comment', { description: error.message })
    } else {
      // Mark as deleted in local state
      setComments(prev =>
        prev.map(c =>
          c.id === commentId ? { ...c, is_deleted: true } : c
        )
      )
      showToast.success('Comment deleted')
    }

    setDeletingId(null)
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <LoadingSpinner message="Loading comments..." />
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isDeleted = !!comment.is_deleted

            return (
              <Card
                key={comment.id}
                className={`hover:shadow-md transition-shadow ${isDeleted ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Content */}
                          <p
                            className={`text-sm text-foreground mb-2 line-clamp-2 ${
                              isDeleted ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {comment.content}
                          </p>

                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {comment.users && (
                              <span>
                                by {comment.users.full_name || comment.users.username || 'Unknown'}
                                <span className="text-muted-foreground/60 ml-1">
                                  ({comment.users.email})
                                </span>
                              </span>
                            )}
                            {comment.project && (
                              <span>
                                on{' '}
                                <Link
                                  to={`/project/${comment.project.id}`}
                                  className="text-uiuc-orange hover:underline"
                                >
                                  {comment.project.name}
                                </Link>
                              </span>
                            )}
                            <span>
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Status + Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isDeleted && (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              Deleted
                            </Badge>
                          )}

                          {!isDeleted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(comment.id)}
                              disabled={deletingId === comment.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/10 rounded-lg border-2 border-dashed border-border/50">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No comments found
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'No comments to display'}
          </p>
        </div>
      )}
    </div>
  )
}
