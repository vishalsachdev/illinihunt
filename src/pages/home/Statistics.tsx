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
    <section className="py-24 bg-midnight relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-neon-purple/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center p-10 rounded-2xl glass-premium hover:bg-white/5 transition-all duration-300 group"
          >
            <div className="text-5xl md:text-6xl font-bold text-neon-orange mb-3 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
              {stats.loading ? (
                <div className="h-14 w-32 bg-white/5 animate-pulse rounded-xl mx-auto" />
              ) : (
                `${stats.projectsCount}+`
              )}
            </div>
            <div className="text-slate-300 font-semibold text-lg uppercase tracking-wider">Community Projects</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center p-10 rounded-2xl glass-premium hover:bg-white/5 transition-all duration-300 group"
          >
            <div className="text-5xl md:text-6xl font-bold text-neon-blue mb-3 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
              {stats.loading ? (
                <div className="h-14 w-32 bg-white/5 animate-pulse rounded-xl mx-auto" />
              ) : (
                `${stats.usersCount}+`
              )}
            </div>
            <div className="text-slate-300 font-semibold text-lg uppercase tracking-wider">Community Innovators</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-center p-10 rounded-2xl glass-premium hover:bg-white/5 transition-all duration-300 group"
          >
            <div className="text-5xl md:text-6xl font-bold text-neon-purple mb-3 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
              {stats.loading ? (
                <div className="h-14 w-32 bg-white/5 animate-pulse rounded-xl mx-auto" />
              ) : (
                stats.categoriesCount
              )}
            </div>
            <div className="text-slate-300 font-semibold text-lg uppercase tracking-wider">Categories</div>
          </motion.div>
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
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center p-8 rounded-2xl glass-premium hover:bg-white/5 transition-all duration-300 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-orange/20 to-neon-orange/5 flex items-center justify-center text-neon-orange mb-5 shadow-lg shadow-neon-orange/10 group-hover:scale-110 transition-transform duration-300">
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>

        {/* University Endorsement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="glass-premium rounded-3xl p-10 relative overflow-hidden hover:bg-white/5 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-orange via-neon-blue to-neon-purple"></div>
            <blockquote className="text-xl md:text-2xl text-slate-200 italic mb-6 relative z-10 leading-relaxed font-light">
              "IlliniHunt showcases the incredible innovation happening across our entire campus community, fostering collaboration between students, faculty, staff, and researchers in meaningful ways."
            </blockquote>
            <cite className="text-sm font-semibold text-neon-orange not-italic uppercase tracking-wider">
              — University of Illinois Campus Innovation Initiative
            </cite>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Statistics
