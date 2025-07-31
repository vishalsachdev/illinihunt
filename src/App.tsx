import './App.css'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, useState, useEffect } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { useAuth } from '@/hooks/useAuth'
import { LoginButton } from '@/components/auth/LoginButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AuthPromptProvider, useAuthPrompt } from '@/contexts/AuthPromptContext'

// Lazy load all pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage').then(module => ({ default: module.HomePage })))
const SubmitProjectPage = lazy(() => import('@/pages/SubmitProjectPage').then(module => ({ default: module.SubmitProjectPage })))
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage').then(module => ({ default: module.ProjectDetailPage })))
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage').then(module => ({ default: module.UserProfilePage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const EditProfilePage = lazy(() => import('@/pages/EditProfilePage').then(module => ({ default: module.EditProfilePage })))
const CollectionsPage = lazy(() => import('@/pages/CollectionsPage').then(module => ({ default: module.CollectionsPage })))
const CollectionViewPage = lazy(() => import('@/pages/CollectionViewPage').then(module => ({ default: module.CollectionViewPage })))

// Preload critical routes for better UX
const preloadRoute = (importFn: () => Promise<any>) => {
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
  const [initialLoad, setInitialLoad] = useState(true)

  // Track initial auth state load to prevent race conditions
  useEffect(() => {
    if (!loading) {
      setInitialLoad(false)
    }
  }, [loading])

  // Show loading only during initial auth check, not during navigation
  if (initialLoad && loading) {
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
                  variant="ghost" 
                  size="sm"
                  className="bg-transparent text-white hover:bg-white/10 text-xs sm:text-sm hidden sm:inline-flex"
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
                className="bg-transparent border-white text-white hover:bg-white hover:text-uiuc-blue text-xs sm:text-sm"
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
    <BrowserRouter>
      <AuthPromptProvider>
        <AppContent />
        <SpeedInsights />
      </AuthPromptProvider>
    </BrowserRouter>
  )
}

export default App