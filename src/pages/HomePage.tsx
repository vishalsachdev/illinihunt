import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

import { Hero } from './home/Hero'
import { FeaturedProjects } from './home/FeaturedProjects'
import { CategoryPreview } from './home/CategoryPreview'
import { Statistics } from './home/Statistics'
import { ProjectGridSection } from './home/ProjectGridSection'

export function HomePage() {
  const windowSize = useWindowSize()
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

  // Update URL when category changes
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    if (category === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ category })
    }
  }

  return (
    <div key={`${windowSize.width}-${windowSize.height}`}>
      <Hero />
      <section className="relative bg-gradient-to-br from-uiuc-blue via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <FeaturedProjects />
          <CategoryPreview onSelect={handleCategorySelect} />
          <Statistics />
        </div>
      </section>
      <ProjectGridSection selectedCategory={selectedCategory} />
    </div>
  )
}

export default HomePage
