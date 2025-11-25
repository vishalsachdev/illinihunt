import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRealtimeVotesContext } from '@/contexts/RealtimeVotesContext'
import { ProjectsService, CategoriesService } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { ProjectCard } from './ProjectCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, Sparkles, Frown, Rocket } from 'lucide-react'
import { CategoryIcon } from '@/lib/categoryIcons'
import type { Database } from '@/types/database'
import { motion } from 'framer-motion'

type Project = Database['public']['Tables']['projects']['Row'] & {
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

type Category = Database['public']['Tables']['categories']['Row']

type ProjectGridProps = {
  selectedCategory?: string
}

/**
 * ProjectGrid component - Main grid displaying all projects with filtering and sorting
 * Performance optimizations:
 * - Memoized enriched projects to prevent unnecessary recalculations
 * - Debounced search input (300ms) to reduce API calls
 * - Cached category list to avoid re-fetching
 */
export function ProjectGrid({ selectedCategory: externalCategory }: ProjectGridProps) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(externalCategory || 'all')
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')

  // Real-time vote updates
  const { getVoteData } = useRealtimeVotesContext()

  useEffect(() => {
    loadCategories()
  }, [])

  // Memoize loadProjects to prevent unnecessary recreations
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await ProjectsService.getProjects({
        search: searchQuery || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        sortBy,
        limit: 20
      })

      if (error) throw error
      setProjects((data as unknown as Project[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, sortBy])

  useEffect(() => {
    // Debounce all filters including search
    const timer = setTimeout(() => {
      loadProjects()
    }, searchQuery ? 300 : 0) // Only debounce search, immediate for filters
    return () => clearTimeout(timer)
  }, [loadProjects, searchQuery])

  useEffect(() => {
    setSelectedCategory(externalCategory || 'all')
  }, [externalCategory])

  const loadCategories = async () => {
    try {
      const { data, error } = await CategoriesService.getCategories()
      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      // Categories will remain empty if loading fails
    }
  }

  // Enrich projects with real-time vote data
  // Memoized to prevent unnecessary recalculations on every render
  const enrichedProjects = useMemo(() => {
    return projects.map(project => {
      const realtimeVoteData = getVoteData(project.id)
      return {
        ...project,
        upvotes_count: realtimeVoteData?.count ?? project.upvotes_count
      }
    })
  }, [projects, getVoteData])


  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg inline-block">
          <p className="font-semibold">Error Loading Projects</p>
          <p className="text-sm">{error}</p>
          <Button 
            onClick={loadProjects}
            className="mt-2"
            size="sm"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }


  // Loading skeleton for project cards
  const ProjectCardSkeleton = () => (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="animate-pulse">
        <div className="h-48 bg-gray-100" />
        <div className="p-6">
          <div className="h-6 bg-gray-100 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
          <div className="flex items-center mt-4 space-x-2">
            <div className="h-8 w-8 rounded-full bg-gray-100" />
            <div className="h-4 bg-gray-100 rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-uiuc-blue to-uiuc-orange text-white rounded-xl p-8 md:p-12">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Discover Amazing Projects</h1>
          <p className="text-lg text-blue-50/90 mb-6">
            Explore innovative projects from the Illinois community. Vote for your favorites, discover new ideas, and connect with brilliant minds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="secondary" 
              className="bg-white text-uiuc-blue hover:bg-gray-100 font-medium"
              onClick={() => document.getElementById('search-projects')?.focus()}
            >
              <Search className="mr-2 h-4 w-4" />
              Browse Projects
            </Button>
            <Button 
              variant="outline" 
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
              onClick={async () => {
                try {
                  const { data: { session } } = await supabase.auth.getSession()
                  if (session) {
                    navigate('/submit')
                  } else {
                    // If not authenticated, redirect to home with a sign-in prompt
                    navigate('/', { 
                      state: { 
                        authRedirect: '/submit',
                        message: 'Please sign in to submit a project' 
                      } 
                    })
                  }
                } catch (error) {
                  console.error('Auth check failed:', error)
                  // Fallback to normal navigation
                  navigate('/submit')
                }
              }}
            >
              <Rocket className="mr-2 h-4 w-4" />
              Submit Your Project
            </Button>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search-projects"
                placeholder="Search by name, description, or technology..."
                className="pl-10 h-11 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:w-48">
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
              >
                <SelectTrigger className="h-11">
                  <Filter className="h-4 w-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: category.color }}
                        >
                          <CategoryIcon 
                            iconName={category.icon} 
                            className="w-2.5 h-2.5 text-white" 
                            fallback=""
                          />
                        </div>
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-36">
              <Select
                value={sortBy}
                onValueChange={(value: 'recent' | 'popular') => setSortBy(value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedCategory !== 'all') && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchQuery && (
              <div className="bg-blue-50 text-blue-700 text-sm px-3 py-1.5 rounded-full flex items-center">
                Search: {searchQuery}
                <button 
                  onClick={() => setSearchQuery('')}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </div>
            )}
            {selectedCategory !== 'all' && (
              <div className="bg-orange-50 text-orange-700 text-sm px-3 py-1.5 rounded-full flex items-center">
                {categories.find(c => c.id === selectedCategory)?.name || 'Category'}
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className="ml-2 text-orange-500 hover:text-orange-700"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {searchQuery ? `Search results for "${searchQuery}"` : 
             selectedCategory !== 'all' ? `${categories.find(c => c.id === selectedCategory)?.name || ''} Projects` :
             'All Projects'}
          </h3>
          {!loading && (
            <p className="text-sm text-gray-500 mt-1">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} found
            </p>
          )}
        </div>
        {(searchQuery || selectedCategory !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
            }}
            className="text-uiuc-blue hover:text-uiuc-orange hover:bg-uiuc-blue/5"
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        // Error State
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-100 rounded-xl p-6 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <Frown className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-1">Something went wrong</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={loadProjects}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            Try Again
          </Button>
        </motion.div>
      ) : projects.length === 0 ? (
        // Empty State
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500 mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'all' 
              ? 'No projects match your current filters. Try adjusting your search or filters.'
              : 'Be the first to share your project with the community!'}
          </p>
          <Button 
            className="bg-uiuc-blue hover:bg-uiuc-blue/90"
            onClick={async () => {
              try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                  navigate('/submit')
                } else {
                  navigate('/', { 
                    state: { 
                      authRedirect: '/submit',
                      message: 'Please sign in to submit a project' 
                    } 
                  })
                }
              } catch (error) {
                console.error('Auth check failed:', error)
                navigate('/submit')
              }
            }}
          >
            Submit Your Project
          </Button>
        </motion.div>
      ) : (
        // Projects Grid
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {enrichedProjects.map((project) => (
            <motion.div
              key={project.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { 
                  opacity: 1, 
                  y: 0,
                  transition: { 
                    type: 'spring', 
                    stiffness: 100,
                    damping: 15
                  }
                }
              }}
              whileHover={{ y: -4 }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}