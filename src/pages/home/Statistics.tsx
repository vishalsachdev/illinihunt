import { useEffect, useState, memo } from 'react'
import { StatsService } from '@/lib/database'
import { Award, Rocket, Users } from 'lucide-react'

/**
 * Statistics component - Displays platform statistics
 * Memoized to prevent unnecessary re-renders
 */
const StatisticsComponent = () => {
  const [stats, setStats] = useState({
    projectsCount: 0,
    usersCount: 0,
    categoriesCount: 0,
    loading: true
  })

  useEffect(() => {
    const loadStats = async () => {
      const { data, error } = await StatsService.getPlatformStats()
      if (data && !error) {
        setStats({
          projectsCount: data.projectsCount,
          usersCount: data.usersCount,
          categoriesCount: data.categoriesCount,
          loading: false
        })
      } else {
        setStats({ projectsCount: 0, usersCount: 0, categoriesCount: 0, loading: false })
      }
    }
    loadStats()
  }, [])

  return (
    <section className="py-24 bg-midnight relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-neon-purple/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-10 rounded-2xl glass-premium hover:bg-white/5 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-5xl md:text-6xl font-bold text-neon-orange mb-3 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
              {stats.loading ? (
                <div className="h-14 w-32 bg-white/5 animate-pulse rounded-xl mx-auto" />
              ) : (
                `${stats.projectsCount}+`
              )}
            </div>
            <div className="text-slate-300 font-semibold text-lg uppercase tracking-wider">Community Projects</div>
          </div>

          <div className="text-center p-10 rounded-2xl glass-premium hover:bg-white/5 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
            <div className="text-5xl md:text-6xl font-bold text-neon-blue mb-3 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
              {stats.loading ? (
                <div className="h-14 w-32 bg-white/5 animate-pulse rounded-xl mx-auto" />
              ) : (
                `${stats.usersCount}+`
              )}
            </div>
            <div className="text-slate-300 font-semibold text-lg uppercase tracking-wider">Community Innovators</div>
          </div>

          <div className="text-center p-10 rounded-2xl glass-premium hover:bg-white/5 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
            <div className="text-5xl md:text-6xl font-bold text-neon-purple mb-3 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
              {stats.loading ? (
                <div className="h-14 w-32 bg-white/5 animate-pulse rounded-xl mx-auto" />
              ) : (
                `${stats.categoriesCount}+`
              )}
            </div>
            <div className="text-slate-300 font-semibold text-lg uppercase tracking-wider">Categories</div>
          </div>
        </div>

        {/* Social Proof Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: Award,
              title: "Award Winning",
              description: "Student projects & faculty research recognition"
            },
            {
              icon: Rocket,
              title: "Campus Innovation",
              description: "Startups, research breakthroughs & operational improvements"
            },
            {
              icon: Users,
              title: "Cross-Disciplinary",
              description: "Faculty-student partnerships & staff innovations"
            }
          ].map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-8 rounded-2xl glass-premium hover:bg-white/5 transition-all duration-300 group animate-in fade-in slide-in-from-bottom-3"
              style={{ animationDelay: `${(300 + (index * 80))}ms` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-orange/20 to-neon-orange/5 flex items-center justify-center text-neon-orange mb-5 shadow-lg shadow-neon-orange/10 group-hover:scale-110 transition-transform duration-300">
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

// Memoize component to prevent unnecessary re-renders
export const Statistics = memo(StatisticsComponent)

export default Statistics
