import { useState, useEffect } from 'react'
import { formatDistance } from 'date-fns'
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

export function RecentActivityFeed() {
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
          <div key={i} className="animate-pulse flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={activity.users?.avatar_url || ''} />
            <AvatarFallback className="text-xs">
              {activity.users?.full_name ? activity.users.full_name.slice(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-600 truncate">
                {activity.users?.full_name || 'Someone'}
              </span>
              <span className="text-xs text-gray-400">submitted</span>
            </div>
            
            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {activity.name}
              </h4>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {activity.tagline}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              {activity.categories && (
                <span 
                  className="text-xs px-2 py-1 rounded-full text-white"
                  style={{ backgroundColor: activity.categories.color }}
                >
                  {activity.categories.name}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {formatDistance(new Date(activity.created_at), new Date(), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      ))}
      
      <div className="pt-2 border-t border-gray-100">
        <button 
          onClick={() => {
            // Scroll to projects
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="text-xs text-uiuc-blue hover:text-uiuc-orange transition-colors w-full text-center"
        >
          View All Projects →
        </button>
      </div>
    </div>
  )
}