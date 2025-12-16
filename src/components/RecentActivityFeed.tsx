import { useState, useEffect, memo } from 'react'
import { formatDistance } from 'date-fns'
import { Link } from 'react-router-dom'
import { StatsService } from '@/lib/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type RecentActivity = {
  id: string
  name: string
  tagline: string
  created_at: string
  users: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
  categories: {
    id: string
    name: string
    color: string
    icon: string | null
  } | null
}

/**
 * RecentActivityFeed component - Displays recent project submissions
 * Memoized to prevent unnecessary re-renders when parent components update
 */
const RecentActivityFeedComponent = () => {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        const { data, error } = await StatsService.getRecentActivity(5)
        if (data && !error) {
          setActivities(data as unknown as RecentActivity[])
        }
      } catch (error) {
        // Silently fail, activities will remain empty
      } finally {
        setLoading(false)
      }
    }

    loadRecentActivity()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-start gap-3 glass-premium rounded-xl p-4">
            <div className="w-10 h-10 bg-white/5 rounded-full"></div>
            <div className="flex-1">
              <div className="h-3 bg-white/5 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-white/5 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 glass-premium rounded-xl">
        <p className="text-slate-400 text-sm">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="glass-premium rounded-xl p-4 hover:bg-white/10 transition-all duration-300 group">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-white/10 shadow-lg">
              <AvatarImage src={activity.users?.avatar_url || ''} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-neon-orange to-neon-blue text-white font-bold">
                {activity.users?.full_name ? activity.users.full_name.slice(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Link
                  to={`/user/${activity.users?.id}`}
                  className="text-xs text-slate-300 truncate hover:text-neon-orange transition-colors font-medium"
                >
                  {activity.users?.full_name || 'Someone'}
                </Link>
                <span className="text-xs text-slate-500">submitted</span>
              </div>

              <div className="mb-3">
                <Link
                  to={`/project/${activity.id}`}
                  className="block group/link"
                >
                  <h4 className="text-sm font-bold text-white truncate group-hover/link:text-neon-orange transition-colors">
                    {activity.name}
                  </h4>
                </Link>
                <p className="text-xs text-slate-200/90 line-clamp-2 leading-relaxed mt-1">
                  {activity.tagline}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                {activity.categories && (
                  <Link
                    to={`/?category=${activity.categories.id}`}
                    className="text-xs px-2.5 py-1 rounded-full text-white hover:opacity-80 transition-opacity font-semibold shadow-sm"
                    style={{ backgroundColor: activity.categories.color }}
                  >
                    {activity.categories.name}
                  </Link>
                )}
                <span className="text-xs text-slate-500 font-medium">
                  {formatDistance(new Date(activity.created_at), new Date(), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="pt-4">
        <button
          onClick={() => {
            // Scroll to projects
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="text-sm text-neon-blue hover:text-neon-orange transition-colors w-full text-center font-semibold py-2 glass-premium rounded-lg hover:bg-white/10"
        >
          View All Projects →
        </button>
      </div>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export const RecentActivityFeed = memo(RecentActivityFeedComponent)