import { useAuth } from '@/hooks/useAuth'

export function HomePage() {
  const { user, profile } = useAuth()

  return (
    <div className="container mx-auto p-4">
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
    </div>
  )
}