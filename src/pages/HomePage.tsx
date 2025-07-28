import { useAuth } from '@/hooks/useAuth'
import { useWindowSize } from '@/hooks/useWindowSize'
import { ProjectGrid } from '@/components/project/ProjectGrid'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap } from 'lucide-react'

export function HomePage() {
  const { user } = useAuth()
  const windowSize = useWindowSize()

  return (
    <div key={`${windowSize.width}-${windowSize.height}`}>
      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-br from-uiuc-blue via-slate-800 to-slate-900 overflow-hidden">
        {/* Background Pattern/Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 min-h-screen flex items-center">
          <div className="text-center w-full py-20">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-uiuc-orange/20 border border-uiuc-orange/30 rounded-full px-4 py-2 mb-6 sm:mb-8">
              <Zap className="w-4 h-4 text-uiuc-orange" />
              <span className="text-white font-medium text-sm sm:text-base">Calling all Illini Builders</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
              Showcase Your{' '}
              <span className="text-uiuc-orange">Innovation</span>
              <br />
              Built at UIUC
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-4 max-w-4xl mx-auto leading-relaxed px-4">
              Discover amazing projects, apps, and startups created by University of Illinois students.
            </p>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-12 max-w-3xl mx-auto px-4">
              Join the community of makers, builders, and innovators shaping the future.
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
            
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-5xl mx-auto px-4">
              <div className="text-center">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2">150+</div>
                <div className="text-gray-400 text-sm sm:text-base lg:text-lg">Student Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2">50+</div>
                <div className="text-gray-400 text-sm sm:text-base lg:text-lg">Active Builders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2">25</div>
                <div className="text-gray-400 text-sm sm:text-base lg:text-lg">Categories</div>
              </div>
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

      {/* Projects Section */}
      <div id="projects-section" className="container mx-auto p-4 py-16">
        {!user && (
          <div className="bg-uiuc-orange text-white p-6 rounded-lg mb-8 text-center">
            <p className="font-semibold text-lg mb-2">🔐 @illinois.edu Authentication Required</p>
            <p className="text-sm opacity-90">Sign in with your UIUC Google account to vote and submit projects</p>
          </div>
        )}
        
        <ProjectGrid />
      </div>
    </div>
  )
}