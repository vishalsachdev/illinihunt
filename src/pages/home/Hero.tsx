import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function Hero() {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1 text-sm text-slate-300 backdrop-blur-xl"
          >
            <span className="flex h-2 w-2 rounded-full bg-uiuc-orange mr-2 animate-pulse"></span>
            <span className="text-xs font-medium uppercase tracking-wider">The Hub for Illini Innovation</span>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-4xl"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 text-balance">
              Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-uiuc-orange to-orange-400">Illini Ideas</span>
              <br />
              Come to Life
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed text-balance">
              Discover cutting-edge research, innovative apps, and transformative solutions from the University of Illinois community.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Button
              asChild
              size="lg"
              className="bg-uiuc-orange hover:bg-uiuc-orange/90 text-white px-8 h-12 text-base rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
            >
              <Link to="/submit" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Submit Project
              </Link>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-8 h-12 text-base rounded-full backdrop-blur-sm transition-all hover:scale-105"
              onClick={() => {
                document.getElementById('projects-section')?.scrollIntoView({
                  behavior: 'smooth'
                })
              }}
            >
              <span className="flex items-center gap-2">
                Explore Projects
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </motion.div>

          {/* Stats Preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="pt-12 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 text-center border-t border-slate-800/50 mt-12"
          >
            {[
              { label: 'Active Projects', value: '50+' },
              { label: 'Contributors', value: '120+' },
              { label: 'Departments', value: '15+' },
            ].map((stat, index) => (
              <div key={index} className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Hero
