import { useWindowSize } from '@/hooks/useWindowSize'
import { ProjectGrid } from '@/components/project/ProjectGrid'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap } from 'lucide-react'
import { CategoryIcon } from '@/lib/categoryIcons'
import { StatsService, CategoriesService } from '@/lib/database'
import { useState, useEffect } from 'react'
import { RecentActivityFeed } from '@/components/RecentActivityFeed'

type FeaturedProject = {
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

type Category = {
  id: string
  name: string
  color: string
  icon: string | null
}

export function HomePage() {
  const windowSize = useWindowSize()
  const [stats, setStats] = useState({
    projectsCount: 0,
    usersCount: 0,
    categoriesCount: 0,
    loading: true
  })
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([])
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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
        // Fallback to default values if error
        setStats({
          projectsCount: 0,
          usersCount: 0,
          categoriesCount: 0,
          loading: false
        })
      }
    }
    
    const loadFeaturedProjects = async () => {
      const { data, error } = await StatsService.getFeaturedProjects(3)
      if (data && !error) {
        setFeaturedProjects(data)
      }
      setFeaturedLoading(false)
    }
    
    const loadCategories = async () => {
      const { data, error } = await CategoriesService.getCategories()
      if (data && !error) {
        setCategories(data.slice(0, 6)) // Show first 6 categories
      }
      setCategoriesLoading(false)
    }
    
    loadStats()
    loadFeaturedProjects()
    loadCategories()
  }, [])

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
            
            {/* Integrated Tagline */}
            <div className="mb-4 sm:mb-6 pt-8 sm:pt-12">
              <div className="inline-flex items-center gap-2 text-uiuc-orange mb-3 sm:mb-4">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-wide">Where Illini Ideas Come to Life</span>
              </div>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
              Connect with{' '}
              <span className="text-uiuc-orange">Groundbreaking</span>
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
            
            {/* Featured Projects Showcase */}
            {!featuredLoading && featuredProjects.length > 0 && (
              <div className="mb-16 sm:mb-20">
                <div className="text-center mb-8">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                    🔥 Trending Projects
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
                    Discover innovation at Illinois
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
                  {featuredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
                      onClick={() => {
                        window.location.href = `/project/${project.id}`
                      }}
                    >
                      <div className="space-y-4">
                        {/* Project Image/Icon */}
                        <div className="flex items-center justify-between">
                          {project.image_url ? (
                            <img
                              src={project.image_url}
                              alt={project.name}
                              className="w-16 h-16 rounded-xl object-cover border border-white/20 shadow-sm"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-uiuc-orange to-uiuc-blue rounded-xl flex items-center justify-center border border-white/20 shadow-sm">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                            </div>
                          )}
                          {/* Upvote Badge */}
                          <div className="flex items-center gap-1.5 bg-uiuc-orange/20 border border-uiuc-orange/30 rounded-full px-3 py-1.5">
                            <svg className="w-4 h-4 text-uiuc-orange" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-semibold text-uiuc-orange">{project.upvotes_count}</span>
                          </div>
                        </div>
                        
                        {/* Project Info */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-white text-lg group-hover:text-uiuc-light-orange transition-colors line-clamp-1">
                            {project.name}
                          </h4>
                          <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                            {project.tagline || 'An innovative project from the Illinois community.'}
                          </p>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                          <span className="text-gray-400 text-sm font-medium">
                            by {project.users?.full_name || 'Anonymous'}
                          </span>
                          {project.categories && (
                            <span 
                              className="text-xs px-3 py-1.5 rounded-full text-white font-medium shadow-sm"
                              style={{ backgroundColor: project.categories.color }}
                            >
                              {project.categories.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Category Preview Section */}
            {!categoriesLoading && categories.length > 0 && (
              <div className="mb-12 sm:mb-16">
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-6 text-center">
                  Explore by Category
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 max-w-4xl mx-auto px-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id)
                        document
                          .getElementById('projects-section')
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 sm:p-4 hover:bg-white/20 transition-all duration-300 text-center"
                    >
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-semibold text-sm sm:text-base"
                        style={{ backgroundColor: category.color }}
                      >
                        <CategoryIcon 
                          iconName={category.icon} 
                          className="w-4 h-4 sm:w-5 sm:h-5" 
                          fallback={category.name}
                        />
                      </div>
                      <span className="text-white text-xs sm:text-sm font-medium group-hover:text-uiuc-light-orange transition-colors">
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Statistics with Social Proof */}
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
                    <div className="text-uiuc-light-orange font-semibold text-sm mb-1">
                      🏆 Award Winning
                    </div>
                    <div className="text-white text-xs">
                      Student projects & faculty research recognition
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                    <div className="text-uiuc-light-orange font-semibold text-sm mb-1">
                      🚀 Campus Innovation
                    </div>
                    <div className="text-white text-xs">
                      Startups, research breakthroughs & operational improvements
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                    <div className="text-uiuc-light-orange font-semibold text-sm mb-1">
                      🤝 Cross-Disciplinary
                    </div>
                    <div className="text-white text-xs">
                      Faculty-student partnerships & staff innovations
                    </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Projects Grid */}
          <div className="lg:col-span-3">
            <ProjectGrid selectedCategory={selectedCategory} />
          </div>
          
          {/* Community Activity Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-green-500">●</span>
                Recent Activity
              </h3>
              <RecentActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}