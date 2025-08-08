import { useEffect, useState } from 'react'
import { StatsService } from '@/lib/database'

// Types for featured projects
export type FeaturedProject = {
  id: string
  name: string
  tagline: string
  image_url: string | null
  upvotes_count: number
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

export function FeaturedProjects() {
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFeaturedProjects = async () => {
      const { data, error } = await StatsService.getFeaturedProjects(3)
      if (data && !error) {
        setFeaturedProjects(data)
      }
      setLoading(false)
    }
    loadFeaturedProjects()
  }, [])

  if (loading || featuredProjects.length === 0) {
    return null
  }

  return (
    <div className="mb-16 sm:mb-20">
      <div className="text-center mb-8">
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">🔥 Trending Projects</h3>
        <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">Discover innovation at Illinois</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
        {featuredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
            onClick={() => {
              window.location.href = `/project/${project.id}`
            }}
          >
            <div className="space-y-4">
              {/* Project Image/Icon */}
              <div className="flex items-center justify-between">
                {project.image_url ? (
                  <img
                    src={project.image_url}
                    alt={project.name}
                    className="w-16 h-16 rounded-xl object-cover border border-white/20 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-uiuc-orange to-uiuc-blue rounded-xl flex items-center justify-center border border-white/20 shadow-sm">
                    <span role="img" aria-label="Project placeholder icon">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </span>
                  </div>
                )}
                {/* Upvote Badge */}
                <div className="flex items-center gap-1.5 bg-uiuc-orange/20 border border-uiuc-orange/30 rounded-full px-3 py-1.5">
                  <svg className="w-4 h-4 text-uiuc-orange" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-uiuc-orange">{project.upvotes_count}</span>
                </div>
              </div>

              {/* Project Info */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-lg group-hover:text-uiuc-light-orange transition-colors line-clamp-1">
                  {project.name}
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                  {project.tagline || 'An innovative project from the Illinois community.'}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-gray-400 text-sm font-medium">by {project.users?.full_name || 'Anonymous'}</span>
                {project.categories && (
                  <span
                    className="text-xs px-3 py-1.5 rounded-full text-white font-medium shadow-sm"
                    style={{ backgroundColor: project.categories.color }}
                  >
                    {project.categories.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeaturedProjects
