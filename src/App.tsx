import './App.css'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Toaster } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { LoginButton } from '@/components/auth/LoginButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AuthPromptProvider, useAuthPrompt } from '@/contexts/AuthPromptContext'
import { ErrorProvider } from '@/contexts/ErrorContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from '@/contexts/AuthContext'

// Lazy load all pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage').then(module => ({ default: module.HomePage })))
const SubmitProjectPage = lazy(() => import('@/pages/SubmitProjectPage').then(module => ({ default: module.SubmitProjectPage })))
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage').then(module => ({ default: module.ProjectDetailPage })))
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage').then(module => ({ default: module.UserProfilePage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const EditProfilePage = lazy(() => import('@/pages/EditProfilePage').then(module => ({ default: module.EditProfilePage })))
const EditProjectPage = lazy(() => import('@/pages/EditProjectPage').then(module => ({ default: module.EditProjectPage })))
const CollectionsPage = lazy(() => import('@/pages/CollectionsPage').then(module => ({ default: module.CollectionsPage })))
const CollectionViewPage = lazy(() => import('@/pages/CollectionViewPage').then(module => ({ default: module.CollectionViewPage })))

// Preload critical routes for better UX
const preloadRoute = (importFn: () => Promise<unknown>) => {
  const componentImport = importFn()
  return componentImport
}

// Preload most visited routes after initial load (only if user interacts)
if (typeof window !== 'undefined') {
  let preloaded = false
  const preloadOnInteraction = () => {
    if (!preloaded) {
      preloaded = true
      preloadRoute(() => import('@/pages/SubmitProjectPage'))
      preloadRoute(() => import('@/pages/ProjectDetailPage'))
    }
  }
  
  // Preload on first user interaction instead of timeout
  document.addEventListener('click', preloadOnInteraction, { once: true })
  document.addEventListener('scroll', preloadOnInteraction, { once: true })
}

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  const { showAuthPrompt } = useAuthPrompt()

  // Show auth prompt after render completes, not during render
  useEffect(() => {
    if (!loading && !user && location.pathname !== '/') {
      showAuthPrompt('access this page')
    }
  }, [user, loading, location.pathname, showAuthPrompt])

  // Always wait for authentication to complete, regardless of localStorage
  // This prevents race conditions during OAuth callbacks and session establishment
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to home if not authenticated after loading completes
  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <>{children}</>
}

function AppContent() {
  const { user, error } = useAuth()

  // Don't block rendering for auth loading
  // The page should render immediately with or without auth

  return (
    <div className="min-h-screen bg-background">
        <header className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b text-gray-900 p-4 shadow-sm">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex-shrink-0">
              <Link to="/" className="block">
                <h1 className="text-xl sm:text-2xl font-bold text-uiuc-blue hover:text-uiuc-orange transition-colors">
                  IlliniHunt
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Discover innovation at Illinois</p>
              </Link>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {user && (
                <Button 
                  asChild
                  variant="ghost" 
                  size="sm"
                  className="bg-transparent text-gray-700 hover:bg-gray-100 text-xs sm:text-sm hidden sm:inline-flex"
                >
                  <Link to="/dashboard">
                    Dashboard
                  </Link>
                </Button>
              )}
              <Button 
                asChild
                variant="outline" 
                size="sm"
                className="bg-transparent border-gray-300 text-gray-700 hover:bg-gray-100 text-xs sm:text-sm"
              >
                <Link to="/submit">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Submit Project</span>
                  <span className="sm:hidden">Submit</span>
                </Link>
              </Button>
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
          
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/project/:id" element={<ProjectDetailPage />} />
              <Route path="/user/:id" element={<UserProfilePage />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile/edit" 
                element={
                  <ProtectedRoute>
                    <EditProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/edit-project/:id" 
                element={
                  <ProtectedRoute>
                    <EditProjectPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/collections" 
                element={
                  <ProtectedRoute>
                    <CollectionsPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/collections/:id" element={<CollectionViewPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ErrorProvider>
          <AuthProvider>
            <AuthPromptProvider>
              <AppContent />
              <SpeedInsights />
              <Toaster
                position="top-right"
                richColors
                closeButton
                visibleToasts={4}
                toastOptions={{
                  duration: 4000,
                  classNames: {
                    toast: 'group toast group-[.toaster]:bg-white group-[.toaster]:border group-[.toaster]:shadow-lg',
                    description: 'group-[.toast]:text-gray-600',
                    actionButton: 'group-[.toast]:bg-uiuc-orange group-[.toast]:text-white',
                    cancelButton: 'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600',
                    closeButton: 'group-[.toast]:bg-gray-200 group-[.toast]:border-none',
                  }
                }}
              />
            </AuthPromptProvider>
          </AuthProvider>
        </ErrorProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
