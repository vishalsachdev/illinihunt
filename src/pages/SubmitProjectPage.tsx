import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ProjectForm } from '@/components/project/ProjectForm'

export function SubmitProjectPage() {
  const { user, loading } = useAuth()

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
    <ProjectForm 
      onSuccess={() => {
        // Navigate to home page after successful submission
        window.location.href = '/'
      }}
    />
  )
}