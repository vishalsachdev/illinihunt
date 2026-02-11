import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { memo } from 'react'

/**
 * Hero component - Main hero section of the homepage
 * Memoized since it has no props and doesn't need to re-render
 */
const HeroComponent = () => {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-midnight text-white">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* Deep Midnight Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-midnight-900 via-midnight to-midnight-800 opacity-80"></div>

        {/* Neon Glow Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-neon-blue/20 rounded-full blur-[120px] mix-blend-screen animate-[pulse_4s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-neon-orange/10 rounded-full blur-[120px] mix-blend-screen animate-[pulse_5s_ease-in-out_infinite]"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"></div>
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          >
            <Sparkles className="w-4 h-4 mr-2 text-neon-orange" />
            <span className="text-xs font-semibold uppercase tracking-widest bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              The Hub for Illini Innovation
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-5xl relative"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-tight">
              Where <span className="text-neon-orange text-glow">Illini Ideas</span>
              <br />
              Come to <span className="text-neon-blue text-glow-blue">Life</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed text-balance font-light">
              Discover cutting-edge research, innovative apps, and transformative solutions from the University of Illinois community.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto pt-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-neon-orange hover:bg-neon-orange/90 text-white px-10 h-14 text-lg rounded-full shadow-[0_0_30px_-5px_rgba(255,107,53,0.6)] hover:shadow-[0_0_40px_-5px_rgba(255,107,53,0.8)] transition-all hover:scale-105 border border-white/10"
            >
              <Link to="/submit" className="flex items-center gap-2 font-semibold">
                <Zap className="w-5 h-5 fill-current" />
                Submit Project
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="glass-premium text-white hover:bg-white/10 px-10 h-14 text-lg rounded-full transition-all hover:scale-105 border-white/10 hover:border-white/20"
              onClick={() => {
                document.getElementById('projects-section')?.scrollIntoView({
                  behavior: 'smooth'
                })
              }}
            >
              <span className="flex items-center gap-2 font-medium">
                Explore Projects
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </motion.div>

          {/* Stats Preview - Glass Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pt-16 grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-12 w-full max-w-4xl"
          >
            {[
              { label: 'Active Projects', value: '50+', color: 'text-neon-orange' },
              { label: 'Contributors', value: '120+', color: 'text-neon-blue' },
              { label: 'Departments', value: '15+', color: 'text-neon-purple' },
            ].map((stat, index) => (
              <div key={index} className="glass-premium rounded-2xl p-6 flex flex-col items-center justify-center space-y-2 hover:bg-white/5 transition-colors group">
                <div className={`text-4xl md:text-5xl font-bold ${stat.color} drop-shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400 font-medium uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Memoize component since it has no props and is static
export const Hero = memo(HeroComponent)

export default Hero
