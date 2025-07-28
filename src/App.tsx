import './App.css'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginButton } from '@/components/auth/LoginButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { HomePage } from '@/pages/HomePage'
import { SubmitProjectPage } from '@/pages/SubmitProjectPage'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AuthPromptProvider, useAuthPrompt } from '@/contexts/AuthPromptContext'

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  const { showAuthPrompt } = useAuthPrompt()

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
    // Store the intended location to redirect after login
    if (location.pathname !== '/') {
      showAuthPrompt('access this page')
    }
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <>{children}</>
}

function AppContent() {
  const { user, loading, error } = useAuth()

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

  return (
    <div className="min-h-screen bg-background">
        <header className="absolute top-0 left-0 right-0 z-50 bg-transparent text-white p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex-shrink-0">
              <Link to="/" className="block">
                <h1 className="text-xl sm:text-2xl font-bold hover:text-uiuc-light-orange transition-colors">
                  IlliniHunt
                </h1>
                <p className="text-gray-300 text-xs sm:text-sm hidden sm:block">Discover UIUC Innovation</p>
              </Link>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {user && (
                <Button 
                  asChild
                  variant="outline" 
                  size="sm"
                  className="bg-transparent border-white text-white hover:bg-white hover:text-uiuc-blue text-xs sm:text-sm"
                >
                  <Link to="/submit">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Submit Project</span>
                    <span className="sm:hidden">Submit</span>
                  </Link>
                </Button>
              )}
              {user ? <UserMenu /> : <LoginButton />}
            </div>
          </div>
        </header>
        
        <main>
          {error && (
            <div className="container mx-auto px-4 pt-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-semibold">Authentication Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/submit" 
              element={
                <ProtectedRoute>
                  <SubmitProjectPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthPromptProvider>
        <AppContent />
      </AuthPromptProvider>
    </BrowserRouter>
  )
}

export default App