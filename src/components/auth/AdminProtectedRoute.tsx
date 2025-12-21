import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    // Redirect non-admins to home page
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <>{children}</>
}
