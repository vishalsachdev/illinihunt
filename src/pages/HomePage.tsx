import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

import { Hero } from './home/Hero'
import { FeaturedProjects } from './home/FeaturedProjects'
import { CategoryPreview } from './home/CategoryPreview'
import { Statistics } from './home/Statistics'
import { ProjectGridSection } from './home/ProjectGridSection'

/**
 * HomePage component - Main landing page for IlliniHunt
 * Optimized to prevent unnecessary re-renders by using useCallback for event handlers
 */
export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Handle auth redirects
  useEffect(() => {
    const state = location.state as { authRedirect?: string; message?: string } | null
    if (user && state?.authRedirect) {
      navigate(state.authRedirect, { replace: true })
    } else if (state?.message) {
      toast.info(state.message)
      // Clear the state to prevent showing the message again
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [user, location.state, navigate, location.pathname])

  // Handle category from URL query parameter
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl)
    }
  }, [searchParams])

  // Memoize category select handler to prevent CategoryPreview re-renders
  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category)
    if (category === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ category })
    }
  }, [setSearchParams])

  return (
    <div className="bg-midnight min-h-screen">
      <Hero />
      <FeaturedProjects />
      <CategoryPreview onSelect={handleCategorySelect} />
      <Statistics />
      <ProjectGridSection selectedCategory={selectedCategory} />
    </div>
  )
}

export default HomePage
