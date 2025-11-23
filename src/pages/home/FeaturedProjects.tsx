import { useEffect, useState } from 'react'
import { StatsService } from '@/lib/database'
import { useRealtimeVotesContext } from '@/contexts/RealtimeVotesContext'
import { motion } from 'framer-motion'
import { ArrowUpRight, Trophy } from 'lucide-react'

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
  const { getVoteData } = useRealtimeVotesContext()

  useEffect(() => {
    const loadFeaturedProjects = async () => {
      const { data, error } = await StatsService.getFeaturedProjects(3)
      if (data && !error) {
        setFeaturedProjects((data as unknown as FeaturedProject[]))
      }
      setLoading(false)
    }
    loadFeaturedProjects()
  }, [])

  // Enrich featured projects with real-time vote data
  const enrichedFeaturedProjects = featuredProjects.map(project => {
    const realtimeVoteData = getVoteData(project.id)
    return {
      ...project,
      upvotes_count: realtimeVoteData?.count ?? project.upvotes_count
    }
  })

  if (loading || featuredProjects.length === 0) {
    return null
  }

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-sm text-orange-500 mb-4">
            <Trophy className="mr-2 h-4 w-4" />
            <span className="font-medium">Trending Now</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Featured Projects</h2>
          <p className="text-slate-400 max-w-2xl">
            Discover the most popular and innovative projects making waves across campus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrichedFeaturedProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10"
              onClick={() => {
                window.location.href = `/project/${project.id}`
              }}
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    {project.image_url ? (
                      <img
                        src={project.image_url}
                        alt={project.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-sm group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-uiuc-orange to-orange-600 rounded-xl flex items-center justify-center border border-white/10 shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <span className="text-2xl font-bold text-white">
                          {project.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
                    <ArrowUpRight className="w-3 h-3 text-uiuc-orange" />
                    <span className="text-sm font-semibold text-white">{project.upvotes_count}</span>
                  </div>
                </div>

                <div className="mb-4 flex-grow">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-uiuc-orange transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
                    {project.tagline || 'An innovative project from the Illinois community.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 border border-slate-700">
                      {project.users?.full_name?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm text-slate-400 font-medium truncate max-w-[100px]">
                      {project.users?.full_name || 'Anonymous'}
                    </span>
                  </div>
                  {project.categories && (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {project.categories.name}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedProjects
