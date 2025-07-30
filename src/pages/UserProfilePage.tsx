import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ProjectsService } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ProjectCard } from '@/components/project/ProjectCard'
import { ArrowLeft, ExternalLink, Github, Linkedin, MapPin, Calendar, Settings, Award } from 'lucide-react'

type UserProfile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  github_url: string | null
  linkedin_url: string | null
  website_url: string | null
  year_of_study: string | null
  department: string | null
  is_verified: boolean
  created_at: string
}

type UserProject = {
  id: string
  name: string
  tagline: string
  description: string
  image_url: string | null
  website_url: string | null
  github_url: string | null
  upvotes_count: number
  comments_count: number
  created_at: string
  categories: {
    id: string
    name: string
    color: string
    icon: string | null
  } | null
}

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<UserProject[]>([])
  const [loading, setLoading] = useState(true)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwnProfile = currentUser?.id === id

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!id) return
      
      setLoading(true)
      const { data, error } = await ProjectsService.getUserProfile(id)
      
      if (error) {
        setError('Failed to load user profile')
        setLoading(false)
        return
      }
      
      if (!data) {
        setError('User not found')
        setLoading(false)
        return
      }
      
      setProfile(data)
      setLoading(false)
    }

    const loadUserProjects = async () => {
      if (!id) return
      
      setProjectsLoading(true)
      const { data, error } = await ProjectsService.getUserProjects(id)
      
      if (!error && data) {
        setProjects(data)
      }
      
      setProjectsLoading(false)
    }

    loadUserProfile()
    loadUserProjects()
  }, [id])

  if (!id) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested user could not be found.'}</p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="container mx-auto px-4 pt-24 pb-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Content */}
          <div className="lg:col-span-2">
            {/* Profile Header */}
            <div className="bg-white border rounded-lg p-8 mb-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="w-24 h-24 md:w-32 md:h-32">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">
                      {profile.full_name?.charAt(0) || 
                       profile.username?.charAt(0) || 
                       '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        {profile.full_name || profile.username || 'Anonymous User'}
                      </h1>
                      {profile.username && profile.full_name && (
                        <p className="text-lg text-gray-600 mb-2">@{profile.username}</p>
                      )}
                      {profile.is_verified && (
                        <Badge variant="secondary" className="mb-3">
                          <Award className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    {isOwnProfile && (
                      <Button asChild variant="outline">
                        <Link to="/profile/edit">
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Link>
                      </Button>
                    )}
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Profile Details */}
                  <div className="space-y-2 mb-4">
                    {profile.department && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.department}</span>
                        {profile.year_of_study && (
                          <span> • {profile.year_of_study}</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex flex-wrap gap-3">
                    {profile.website_url && (
                      <Button asChild variant="outline" size="sm">
                        <a href={profile.website_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                    {profile.github_url && (
                      <Button asChild variant="outline" size="sm">
                        <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {profile.linkedin_url && (
                      <Button asChild variant="outline" size="sm">
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* User Projects */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Projects ({projects.length})
                </h2>
              </div>

              {projectsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading projects...</p>
                </div>
              ) : projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map((project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={{
                        ...project,
                        users: profile
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {isOwnProfile ? "You haven't submitted any projects yet" : "No projects yet"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {isOwnProfile 
                        ? "Share your work with the Illinois community by submitting your first project."
                        : "This user hasn't submitted any projects to IlliniHunt yet."
                      }
                    </p>
                    {isOwnProfile && (
                      <Button asChild>
                        <Link to="/submit">
                          Submit Your First Project
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* User Stats */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Projects</span>
                    <span className="font-medium">{projects.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Upvotes</span>
                    <span className="font-medium">
                      {projects.reduce((sum, p) => sum + p.upvotes_count, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Comments</span>
                    <span className="font-medium">
                      {projects.reduce((sum, p) => sum + p.comments_count, 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                {projects.length > 0 ? (
                  <div className="space-y-3">
                    {projects
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 3)
                      .map((project) => (
                        <div key={project.id} className="text-sm">
                          <p className="text-gray-900 font-medium truncate">
                            {project.name}
                          </p>
                          <p className="text-gray-600">
                            {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}