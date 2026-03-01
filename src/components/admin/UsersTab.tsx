import { useState, useEffect, useCallback } from 'react'
import { ModerationService, type AdminUser } from '@/lib/services/moderation'
import { showToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Search, Users, Ban, ShieldCheck } from 'lucide-react'

function getInitials(fullName: string | null, email: string): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  return email[0].toUpperCase()
}

export function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await ModerationService.getUsers(searchQuery || undefined)
    if (error) {
      showToast.error('Failed to load users', { description: error.message })
    }
    setUsers(data ?? [])
    setLoading(false)
  }, [searchQuery])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSuspend = async (user: AdminUser) => {
    const displayName = user.full_name || user.username || user.email
    const confirmed = window.confirm(
      `Are you sure you want to suspend "${displayName}"? They will not be able to log in or interact with the platform.`
    )
    if (!confirmed) return

    setActionLoading(user.id)
    const { error } = await ModerationService.suspendUser(user.id)

    if (error) {
      showToast.error('Failed to suspend user', { description: error.message })
    } else {
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, suspended_at: new Date().toISOString() } : u
        )
      )
      showToast.success(`${displayName} has been suspended`)
    }
    setActionLoading(null)
  }

  const handleUnsuspend = async (user: AdminUser) => {
    setActionLoading(user.id)
    const { error } = await ModerationService.unsuspendUser(user.id)

    if (error) {
      showToast.error('Failed to unsuspend user', { description: error.message })
    } else {
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, suspended_at: null } : u
        )
      )
      const displayName = user.full_name || user.username || user.email
      showToast.success(`${displayName} has been unsuspended`)
    }
    setActionLoading(null)
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <LoadingSpinner message="Loading users..." />
      ) : users.length > 0 ? (
        <div className="space-y-4">
          {users.map((user) => {
            const isSuspended = user.suspended_at !== null
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || user.email}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-uiuc-orange/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-uiuc-orange">
                          {getInitials(user.full_name, user.email)}
                        </span>
                      </div>
                    )}

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">
                          {user.full_name || 'No name'}
                        </span>
                        {user.username && (
                          <span className="text-sm text-muted-foreground truncate">
                            @{user.username}
                          </span>
                        )}
                        {isSuspended && (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            Suspended
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                      <span title="Join date">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </span>
                      <span title="Projects">
                        {user.project_count} project{user.project_count !== 1 ? 's' : ''}
                      </span>
                      <span title="Comments">
                        {user.comment_count} comment{user.comment_count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Suspend / Unsuspend */}
                    {isSuspended ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === user.id}
                        onClick={() => handleUnsuspend(user)}
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        Unsuspend
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={actionLoading === user.id}
                        onClick={() => handleSuspend(user)}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Suspend
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/10 rounded-lg border-2 border-dashed border-border/50">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No users found
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'No users to display'}
          </p>
        </div>
      )}
    </div>
  )
}
