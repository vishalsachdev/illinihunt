import { Suspense, lazy } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

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
    return <LoadingSpinner className="min-h-screen" />
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Loading form..." className="min-h-screen" />}>
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