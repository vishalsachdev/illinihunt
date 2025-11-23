import { useEffect, useState } from 'react'
import { CategoriesService } from '@/lib/database'
import { CategoryIcon } from '@/lib/categoryIcons'
import { motion } from 'framer-motion'

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
        setCategories(data)
      }
      setLoading(false)
    }
    loadCategories()
  }, [])

  if (loading || categories.length === 0) {
    return null
  }

  return (
    <section className="py-20 bg-slate-900/50">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Explore by Category</h2>
          <p className="text-slate-400">Find projects that match your interests</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => {
                onSelect(category.id)
                document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="group flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-uiuc-orange/50 transition-all duration-300 text-left"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: category.color }}
              >
                <CategoryIcon iconName={category.icon} className="w-5 h-5" fallback={category.name} />
              </div>
              <span className="text-slate-200 font-medium group-hover:text-white transition-colors">
                {category.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CategoryPreview
