import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner message="Verifying admin access..." className="min-h-screen" />
  }

  if (!isAdmin) {
    // Redirect non-admins to home page
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <>{children}</>
}
