import { useState } from 'react'
import { useWindowSize } from '@/hooks/useWindowSize'

import { Hero } from './home/Hero'
import { FeaturedProjects } from './home/FeaturedProjects'
import { CategoryPreview } from './home/CategoryPreview'
import { Statistics } from './home/Statistics'
import { ProjectGridSection } from './home/ProjectGridSection'

export function HomePage() {
  const windowSize = useWindowSize()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  return (
    <div key={`${windowSize.width}-${windowSize.height}`}>
      <Hero />
      <section className="relative bg-gradient-to-br from-uiuc-blue via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <FeaturedProjects />
          <CategoryPreview onSelect={setSelectedCategory} />
          <Statistics />
        </div>
      </section>
      <ProjectGridSection selectedCategory={selectedCategory} />
    </div>
  )
}

export default HomePage
