import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap } from 'lucide-react'

export function Hero() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-uiuc-blue via-slate-800 to-slate-900 overflow-hidden">
      {/* Background Pattern/Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}
        ></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 min-h-screen flex items-center">
        <div className="text-center w-full py-20">
          {/* Integrated Tagline */}
          <div className="mb-4 sm:mb-6 pt-8 sm:pt-12">
            <div className="inline-flex items-center gap-2 text-uiuc-orange mb-3 sm:mb-4">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-wide">
                Where Illini Ideas Come to Life
              </span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
            Connect with <span className="text-uiuc-orange">Groundbreaking</span>
            <br />
            Campus Innovation
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-4 max-w-4xl mx-auto leading-relaxed px-4">
            Discover cutting-edge research projects, innovative apps, and transformative solutions from students, faculty, and staff across the University of Illinois.
          </p>
          <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-12 max-w-3xl mx-auto px-4">
            Connect with our vibrant campus community, find collaborators across disciplines, and gain visibility for your work.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16 px-4">
            <Button
              asChild
              size="lg"
              className="bg-uiuc-orange hover:bg-uiuc-light-orange text-white border-0 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold w-full sm:w-auto"
            >
              <Link to="/submit" className="inline-flex items-center justify-center gap-2">
                Submit Your Project
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-uiuc-blue px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold w-full sm:w-auto"
              onClick={() => {
                document.getElementById('projects-section')?.scrollIntoView({
                  behavior: 'smooth'
                })
              }}
            >
              Explore Projects
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export default Hero
