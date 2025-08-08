import { useEffect, useState } from 'react'
import { StatsService } from '@/lib/database'

export function Statistics() {
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
    <div className="space-y-8 sm:space-y-12">
      <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-5xl mx-auto px-4">
        <div className="text-center">
          <div className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2">
            {stats.loading ? (
              <div className="animate-pulse bg-white/20 rounded h-8 sm:h-12 lg:h-16 w-16 sm:w-24 lg:w-32 mx-auto"></div>
            ) : (
              `${stats.projectsCount}+`
            )}
          </div>
          <div className="text-gray-400 text-sm sm:text-base lg:text-lg">Community Projects</div>
        </div>
        <div className="text-center">
          <div className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2">
            {stats.loading ? (
              <div className="animate-pulse bg-white/20 rounded h-8 sm:h-12 lg:h-16 w-16 sm:w-24 lg:w-32 mx-auto"></div>
            ) : (
              `${stats.usersCount}+`
            )}
          </div>
          <div className="text-gray-400 text-sm sm:text-base lg:text-lg">Community Innovators</div>
        </div>
        <div className="text-center">
          <div className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2">
            {stats.loading ? (
              <div className="animate-pulse bg-white/20 rounded h-8 sm:h-12 lg:h-16 w-12 sm:w-16 lg:w-20 mx-auto"></div>
            ) : (
              stats.categoriesCount
            )}
          </div>
          <div className="text-gray-400 text-sm sm:text-base lg:text-lg">Categories</div>
        </div>
      </div>

      {/* Social Proof Indicators */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-uiuc-light-orange font-semibold text-sm mb-1">🏆 Award Winning</div>
            <div className="text-white text-xs">Student projects & faculty research recognition</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-uiuc-light-orange font-semibold text-sm mb-1">🚀 Campus Innovation</div>
            <div className="text-white text-xs">Startups, research breakthroughs & operational improvements</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
            <div className="text-uiuc-light-orange font-semibold text-sm mb-1">🤝 Cross-Disciplinary</div>
            <div className="text-white text-xs">Faculty-student partnerships & staff innovations</div>
          </div>
        </div>
      </div>

      {/* University Endorsement */}
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="text-white/90 text-sm italic mb-3">
            "IlliniHunt showcases the incredible innovation happening across our entire campus community, fostering collaboration between students, faculty, staff, and researchers in meaningful ways."
          </div>
          <div className="text-uiuc-light-orange text-xs font-semibold">
            — University of Illinois Campus Innovation Initiative
          </div>
        </div>
      </div>
    </div>
  )
}

export default Statistics
