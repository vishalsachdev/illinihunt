import { useAuth } from '@/hooks/useAuth'
import { CategoriesService } from '@/lib/database'
import { useEffect, useState } from 'react'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

export function DebugSubmitPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('Starting to load categories...')
        setLoading(true)
        setError(null)
        
        const { data, error } = await CategoriesService.getCategories()
        
        if (error) {
          console.error('Categories error:', error)
          setError(error.message)
        } else {
          console.log('Categories loaded successfully:', data)
          setCategories(data || [])
        }
      } catch (err) {
        console.error('Exception loading categories:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  if (!user) {
    return <div className="p-8">Please sign in to access this page.</div>
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Submit Page</h1>
      
      <div className="space-y-4">
        <div>
          <strong>User:</strong> {user.email}
        </div>
        
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div>
          <strong>Categories ({categories.length}):</strong>
          <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
            {JSON.stringify(categories, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}