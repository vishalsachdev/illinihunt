import { useEffect, useState } from 'react'
import { StatsService } from '@/lib/database'
import { motion } from 'framer-motion'
import { Award, Rocket, Users } from 'lucide-react'

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
    <section className="py-20 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
      
      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm"
          >
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">
              {stats.loading ? (
                <div className="h-12 w-24 bg-slate-800 animate-pulse rounded mx-auto" />
              ) : (
                `${stats.projectsCount}+`
              )}
            </div>
            <div className="text-slate-400 font-medium">Community Projects</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm"
          >
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">
              {stats.loading ? (
                <div className="h-12 w-24 bg-slate-800 animate-pulse rounded mx-auto" />
              ) : (
                `${stats.usersCount}+`
              )}
            </div>
            <div className="text-slate-400 font-medium">Community Innovators</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm"
          >
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">
              {stats.loading ? (
                <div className="h-12 w-24 bg-slate-800 animate-pulse rounded mx-auto" />
              ) : (
                stats.categoriesCount
              )}
            </div>
            <div className="text-slate-400 font-medium">Categories</div>
          </motion.div>
        </div>

        {/* Social Proof Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
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
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-slate-900/30 border border-slate-800/50"
            >
              <div className="w-12 h-12 rounded-full bg-uiuc-orange/10 flex items-center justify-center text-uiuc-orange mb-4">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* University Endorsement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-uiuc-orange to-orange-500"></div>
            <blockquote className="text-lg md:text-xl text-slate-300 italic mb-4 relative z-10">
              "IlliniHunt showcases the incredible innovation happening across our entire campus community, fostering collaboration between students, faculty, staff, and researchers in meaningful ways."
            </blockquote>
            <cite className="text-sm font-semibold text-uiuc-orange not-italic">
              — University of Illinois Campus Innovation Initiative
            </cite>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Statistics
