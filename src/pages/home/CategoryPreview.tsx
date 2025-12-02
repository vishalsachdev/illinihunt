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
    <section className="py-24 bg-midnight-900/60 backdrop-blur-sm relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-midnight via-midnight-900/80 to-midnight"></div>

      <div className="container relative z-10 px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Explore by Category</h2>
          <p className="text-slate-300 text-lg">Find projects that match your interests</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                onSelect(category.id)
                document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="group flex items-center gap-4 p-5 rounded-2xl glass-premium hover:bg-white/10 transition-all duration-300 text-left shadow-lg hover:shadow-xl"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: category.color }}
              >
                <CategoryIcon iconName={category.icon} className="w-6 h-6" fallback={category.name} />
              </div>
              <span className="text-slate-200 font-semibold group-hover:text-white transition-colors text-sm">
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
