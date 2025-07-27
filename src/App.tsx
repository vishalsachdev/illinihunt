import './App.css'
import { useAuth } from '@/hooks/useAuth'
import { LoginButton } from '@/components/auth/LoginButton'
import { UserMenu } from '@/components/auth/UserMenu'

function App() {
  const { user, profile, loading, error } = useAuth()

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
      <header className="bg-uiuc-blue text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">IlliniHunt</h1>
            <p className="text-uiuc-light-blue">Discover UIUC Innovation</p>
          </div>
          <div>
            {user ? <UserMenu /> : <LoginButton />}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Authentication Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="text-center py-12">
          <h2 className="text-4xl font-bold text-uiuc-blue mb-4">
            Welcome to IlliniHunt V2
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Product Hunt for the University of Illinois at Urbana-Champaign community
          </p>
          
          {user && profile ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg inline-block">
              <p className="font-semibold">✅ Authentication Working!</p>
              <p className="text-sm">Welcome, {profile.full_name || profile.username}!</p>
              <p className="text-xs text-green-600 mt-2">{profile.email}</p>
            </div>
          ) : (
            <div className="bg-uiuc-orange text-white p-6 rounded-lg inline-block">
              <p className="font-semibold">🔐 @illinois.edu Authentication Required</p>
              <p className="text-sm">Sign in with your UIUC Google account to continue</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App