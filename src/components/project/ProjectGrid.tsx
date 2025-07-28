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

export function ProjectGrid() {
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')

  useEffect(() => {
    loadCategories()
    loadProjects()
  }, [selectedCategory, sortBy])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      loadProjects()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadCategories = async () => {
    try {
      const { data, error } = await CategoriesService.getCategories()
      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
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
      console.error('Error loading projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (projectId: string) => {
    // TODO: Navigate to project detail page
    console.log('View details for project:', projectId)
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
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="sm:w-36">
            <Select value={sortBy} onValueChange={(value: 'recent' | 'popular') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {searchQuery ? `Search results for "${searchQuery}"` : 'Latest Projects'}
          {!loading && ` (${projects.length})`}
        </h2>
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
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewDetails={handleViewDetails}
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