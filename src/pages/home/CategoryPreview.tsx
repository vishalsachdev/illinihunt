import { useEffect, useState } from 'react'
import { CategoriesService } from '@/lib/database'
import { CategoryIcon } from '@/lib/categoryIcons'

export type Category = {
  id: string
  name: string
  color: string
  icon: string | null
}

interface CategoryPreviewProps {
  onSelect: (id: string) => void
}

export function CategoryPreview({ onSelect }: CategoryPreviewProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await CategoriesService.getCategories()
      if (data && !error) {
        setCategories(data.slice(0, 6))
      }
      setLoading(false)
    }
    loadCategories()
  }, [])

  if (loading || categories.length === 0) {
    return null
  }

  return (
    <div className="mb-12 sm:mb-16">
      <h3 className="text-xl sm:text-2xl font-semibold text-white mb-6 text-center">Explore by Category</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 max-w-4xl mx-auto px-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              onSelect(category.id)
              document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 sm:p-4 hover:bg-white/20 transition-all duration-300 text-center"
          >
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-semibold text-sm sm:text-base"
              style={{ backgroundColor: category.color }}
            >
              <CategoryIcon iconName={category.icon} className="w-4 h-4 sm:w-5 sm:h-5" fallback={category.name} />
            </div>
            <span className="text-white text-xs sm:text-sm font-medium group-hover:text-uiuc-light-orange transition-colors">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryPreview
