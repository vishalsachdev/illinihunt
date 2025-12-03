import { useState, useEffect } from 'react'
import { CategoriesService } from '@/lib/database'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

// In-memory cache for categories (they rarely change)
let categoriesCache: Category[] | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Hook to fetch and cache categories
 * Categories are cached in memory to avoid repeated database calls
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(categoriesCache || [])
  const [loading, setLoading] = useState(!categoriesCache)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadCategories = async () => {
      // Return cached data if fresh
      const now = Date.now()
      if (categoriesCache && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
        setCategories(categoriesCache)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data, error } = await CategoriesService.getCategories()
        if (error) throw error

        const categories = data || []
        categoriesCache = categories
        cacheTimestamp = Date.now()
        setCategories(categories)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load categories'))
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  return { categories, loading, error }
}

/**
 * Clear the categories cache (call after category CRUD operations)
 */
export function clearCategoriesCache() {
  categoriesCache = null
  cacheTimestamp = null
}
