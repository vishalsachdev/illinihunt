import { useAuth } from '@/hooks/useAuth'
import { ProjectGrid } from '@/components/project/ProjectGrid'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="container mx-auto p-4">
      {/* Hero Section */}
      <div className="text-center py-8 mb-8">
        <h1 className="text-4xl font-bold text-uiuc-blue mb-4">
          IlliniHunt
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Discover amazing projects from the University of Illinois at Urbana-Champaign community
        </p>
        
        {!user && (
          <div className="bg-uiuc-orange text-white p-4 rounded-lg inline-block">
            <p className="font-semibold">🔐 @illinois.edu Authentication Required</p>
            <p className="text-sm">Sign in with your UIUC Google account to vote and submit projects</p>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      <ProjectGrid />
    </div>
  )
}