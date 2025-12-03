import { Suspense, lazy } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'

// Lazy load ProjectForm to reduce initial bundle size
const ProjectForm = lazy(() =>
  import('@/components/project/ProjectForm').then(module => ({ default: module.ProjectForm }))
)

export function SubmitProjectPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // Pre-load categories while auth is checking
  useCategories()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
            <p className="text-gray-600">Loading form...</p>
          </div>
        </div>
      }
    >
      <ProjectForm
        onSuccess={() => {
          navigate('/')
        }}
        onCancel={() => {
          navigate('/')
        }}
      />
    </Suspense>
  )
}