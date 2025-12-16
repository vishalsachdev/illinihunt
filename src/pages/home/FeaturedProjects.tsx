import { useEffect, useState, useMemo } from 'react'
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
  // Memoized to prevent recalculation on every render
  const enrichedFeaturedProjects = useMemo(() => {
    return featuredProjects.map(project => {
      const realtimeVoteData = getVoteData(project.id)
      return {
        ...project,
        upvotes_count: realtimeVoteData?.count ?? project.upvotes_count
      }
    })
  }, [featuredProjects, getVoteData])

  if (loading || featuredProjects.length === 0) {
    return null
  }

  return (
    <section className="py-24 relative overflow-hidden bg-midnight">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-neon-orange/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-neon-blue/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="inline-flex items-center rounded-full border border-neon-orange/20 bg-neon-orange/5 px-4 py-1.5 text-sm text-neon-orange mb-6 shadow-[0_0_20px_rgba(255,107,53,0.1)]"
          >
            <Trophy className="mr-2 h-4 w-4" />
            <span className="font-semibold uppercase tracking-wider text-xs">Trending Now</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Featured Projects
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-slate-300 text-lg max-w-2xl"
          >
            Discover the most popular and innovative projects making waves across campus.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enrichedFeaturedProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative glass-premium rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              onClick={() => {
                window.location.href = `/project/${project.id}`
              }}
            >
              <div className="p-7 h-full flex flex-col">
                <div className="flex items-start justify-between mb-5">
                  <div className="relative">
                    {project.image_url ? (
                      <img
                        src={project.image_url}
                        alt={project.name}
                        className="w-20 h-20 rounded-xl object-cover border border-white/10 shadow-lg group-hover:scale-105 group-hover:shadow-neon-orange/20 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-neon-orange to-orange-600 rounded-xl flex items-center justify-center border border-white/10 shadow-lg shadow-neon-orange/20 group-hover:scale-105 transition-transform duration-300">
                        <span className="text-3xl font-bold text-white drop-shadow-lg">
                          {project.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 glass-premium rounded-full px-4 py-2 shadow-lg">
                    <ArrowUpRight className="w-4 h-4 text-neon-orange" />
                    <span className="text-sm font-bold text-white">{project.upvotes_count}</span>
                  </div>
                </div>

                <div className="mb-5 flex-grow">
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-neon-orange transition-colors leading-tight">
                    {project.name}
                  </h3>
                  <p className="text-slate-300 text-sm line-clamp-2 leading-relaxed">
                    {project.tagline || 'An innovative project from the Illinois community.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-slate-300 border border-white/10 font-semibold">
                      {project.users?.full_name?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm text-slate-300 font-medium truncate max-w-[120px]">
                      {project.users?.full_name || 'Anonymous'}
                    </span>
                  </div>
                  {project.categories && (
                    <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-white/5 text-slate-200 border border-white/10">
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
