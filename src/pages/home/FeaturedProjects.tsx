import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { StatsService } from '@/lib/database'
import { useRealtimeVotesContext } from '@/contexts/RealtimeVotesContext'
import { rankByTrending, FEATURED_PROJECTS_COUNT } from '@/lib/trending'
import { ArrowUpRight, Flame, ArrowRight } from 'lucide-react'

// Types for featured projects
export type FeaturedProject = {
  id: string
  name: string
  tagline: string
  image_url: string | null
  upvotes_count: number
  comments_count: number
  created_at: string | null
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
  const [rawProjects, setRawProjects] = useState<FeaturedProject[]>([])
  const [loading, setLoading] = useState(true)
  const { getVoteData } = useRealtimeVotesContext()

  useEffect(() => {
    const load = async () => {
      // Fetch a wider pool so the trending algo has good data
      const { data, error } = await StatsService.getTrendingProjects(FEATURED_PROJECTS_COUNT)
      if (data && !error) {
        setRawProjects(data as unknown as FeaturedProject[])
      }
      setLoading(false)
    }
    load()
  }, [])

  // Enrich with real-time votes, rank by trending, take top 3
  const trendingProjects = useMemo(() => {
    const enriched = rawProjects.map(project => {
      const realtimeVoteData = getVoteData(project.id)
      return {
        ...project,
        upvotes_count: realtimeVoteData?.count ?? project.upvotes_count
      }
    })
    return rankByTrending(enriched, 'week').slice(0, 3)
  }, [rawProjects, getVoteData])

  if (loading || trendingProjects.length === 0) {
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
          <div className="inline-flex items-center rounded-full border border-neon-orange/20 bg-neon-orange/5 px-4 py-1.5 text-sm text-neon-orange mb-6 shadow-[0_0_20px_rgba(255,107,53,0.1)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Flame className="mr-2 h-4 w-4" />
            <span className="font-semibold uppercase tracking-wider text-xs">Trending This Week</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
            Trending Projects
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
            The hottest projects right now — ranked by engagement velocity, not just total votes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trendingProjects.map((project, index) => (
            <div
              key={project.id}
              className="group relative glass-premium rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer hover:scale-[1.02] animate-in fade-in zoom-in-95"
              style={{ animationDelay: `${index * 80}ms` }}
              onClick={() => {
                window.location.href = `/project/${project.id}`
              }}
            >
              {/* Rank Badge */}
              <div className="absolute top-4 left-4 z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                    index === 0
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/30'
                      : index === 1
                        ? 'bg-gradient-to-br from-slate-300 to-slate-500 shadow-slate-400/30'
                        : 'bg-gradient-to-br from-amber-600 to-amber-800 shadow-amber-600/30'
                  }`}
                >
                  {index + 1}
                </div>
              </div>

              <div className="p-7 pt-14 h-full flex flex-col">
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
            </div>
          ))}
        </div>

        {/* See all trending link */}
        <div className="flex justify-center mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
          <Link
            to="/trending"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-premium text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 hover:border-neon-orange/30 transition-all duration-300 text-sm font-medium group"
          >
            <Flame className="w-4 h-4 text-neon-orange" />
            See all trending projects
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FeaturedProjects
