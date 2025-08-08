import { useState, useEffect } from 'react'
import { ProjectsService, CategoriesService } from '@/lib/database'
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
import { Search } from 'lucide-react'
import { CategoryIcon } from '@/lib/categoryIcons'
import type { Database } from '@/types/database'

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

export function ProjectGrid({ selectedCategory: externalCategory }: ProjectGridProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(externalCategory || 'all')
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    // Debounce all filters including search
    const timer = setTimeout(() => {
      loadProjects()
    }, searchQuery ? 300 : 0) // Only debounce search, immediate for filters
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, sortBy])

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

  const loadProjects = async () => {
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
      setProjects(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }


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


  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-uiuc-blue mb-3">
          Discover Amazing Projects
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore innovative projects from the Illinois community. Vote for your favorites, discover new ideas, and connect with brilliant minds.
        </p>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Find Your Perfect Project</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Projects
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, description, or technology..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:w-56">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Problem Area
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
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

          {/* Sort */}
          <div className="sm:w-40">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <Select value={sortBy} onValueChange={(value: 'recent' | 'popular') => setSortBy(value)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {searchQuery ? `Search results for "${searchQuery}"` : 
             selectedCategory !== 'all' ? `${categories.find(c => c.id === selectedCategory)?.name || ''} Projects` :
             'All Projects'}
          </h3>
          {!loading && (
            <p className="text-sm text-gray-600 mt-1">
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
            className="text-uiuc-blue hover:text-uiuc-orange"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <p className="text-gray-600 text-lg mb-2">No projects found</p>
            <p className="text-gray-500 text-sm">
              {searchQuery || selectedCategory
                ? 'Try adjusting your search or filters'
                : 'Be the first to submit a project!'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}