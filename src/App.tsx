import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginButton } from '@/components/auth/LoginButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { HomePage } from '@/pages/HomePage'
import { SubmitProjectPage } from '@/pages/SubmitProjectPage'
import { DebugSubmitPage } from '@/pages/DebugSubmitPage'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

function App() {
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
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <header className="bg-uiuc-blue text-white p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <Link to="/" className="block">
                <h1 className="text-2xl font-bold hover:text-uiuc-light-orange transition-colors">
                  IlliniHunt
                </h1>
                <p className="text-uiuc-light-blue">Discover UIUC Innovation</p>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <Button 
                  asChild
                  variant="outline" 
                  className="bg-transparent border-white text-white hover:bg-white hover:text-uiuc-blue"
                >
                  <Link to="/submit">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Project
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
            <Route path="/submit" element={<SubmitProjectPage />} />
            <Route path="/debug" element={<DebugSubmitPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App