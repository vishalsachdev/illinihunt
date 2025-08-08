import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useError } from '@/contexts/ErrorContext'
import { ProjectsService } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { VoteButton } from '@/components/project/VoteButton'
import { ArrowLeft, ExternalLink, Github, User, RefreshCw, Edit } from 'lucide-react'
import { CommentList } from '@/components/comment/CommentList'
import { sanitizeContent, sanitizeUrl } from '@/lib/sanitize'

type ProjectDetail = {
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
  users: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
  categories: {
    id: string
    name: string
    color: string
    icon: string | null
  } | null
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { handleServiceError } = useError()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)
  const [currentVoteCount, setCurrentVoteCount] = useState(0)

  const loadProject = async () => {
    if (!id) return
    
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await ProjectsService.getProject(id)
      
      if (error) {
        setError('Failed to load project')
        handleServiceError(error, 'load project', loadProject)
        return
      }
      
      if (!data) {
        setError('Project not found')
        return
      }
      
      setProject(data)
      setCurrentVoteCount(data.upvotes_count)
      setError('')
    } catch (err) {
      setError('Failed to load project')
      handleServiceError(err, 'load project', loadProject)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProject()
  }, [id])

  if (!id) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    const isNetworkError = error.includes('load project')
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {isNetworkError ? 'Failed to Load Project' : 'Project Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'The requested project could not be found.'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {isNetworkError && (
              <Button onClick={loadProject} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            )}
            <Button asChild className="bg-uiuc-orange hover:bg-uiuc-orange/90">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </div>
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
            Back to Projects
          </Link>
        </Button>
      </div>

      {/* Project Header */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Project Image */}
            {project.image_url && !imageError && (
              <div className="mb-8">
                <img
                  src={project.image_url}
                  alt={project.name}
                  className="w-full h-64 md:h-80 object-cover rounded-lg border"
                  onError={() => setImageError(true)}
                />
              </div>
            )}

            {/* Project Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                      {sanitizeContent(project.name)}
                    </h1>
                    <p className="text-xl text-gray-700 leading-relaxed">
                      {sanitizeContent(project.tagline)}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <VoteButton 
                      projectId={project.id} 
                      initialVoteCount={project.upvotes_count}
                      onVoteChange={setCurrentVoteCount}
                    />
                  </div>
                </div>

                {/* Category Badge */}
                {project.categories && (
                  <Badge 
                    variant="secondary" 
                    className="mb-4"
                    style={{ 
                      backgroundColor: `${project.categories.color}20`,
                      color: project.categories.color,
                      borderColor: `${project.categories.color}40`
                    }}
                  >
                    {project.categories.icon && (
                      <span className="mr-1">{project.categories.icon}</span>
                    )}
                    {sanitizeContent(project.categories.name)}
                  </Badge>
                )}
              </div>

              {/* Description */}
              <div className="prose max-w-none">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">About this project</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {sanitizeContent(project.description)}
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-4">
                {project.website_url && sanitizeUrl(project.website_url) && (
                  <Button asChild variant="outline">
                    <a href={sanitizeUrl(project.website_url)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
                {project.github_url && sanitizeUrl(project.github_url) && (
                  <Button asChild variant="outline">
                    <a href={sanitizeUrl(project.github_url)} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      View Source
                    </a>
                  </Button>
                )}
              </div>

              {/* Comments Section */}
              <div className="border-t pt-8">
                <CommentList 
                  projectId={project.id} 
                  totalComments={project.comments_count}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Creator Info */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Creator</h3>
                {project.users ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={project.users.avatar_url || undefined} />
                        <AvatarFallback>
                          {project.users.full_name?.charAt(0) || 
                           project.users.username?.charAt(0) || 
                           '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {sanitizeContent(project.users.full_name || project.users.username || 'Anonymous')}
                        </p>
                        {project.users.username && project.users.full_name && (
                          <p className="text-sm text-gray-600">@{sanitizeContent(project.users.username)}</p>
                        )}
                      </div>
                    </div>
                    
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/user/${project.users.id}`}>
                        <User className="w-4 h-4 mr-2" />
                        View Profile
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-600">Anonymous creator</p>
                )}
              </div>

              {/* Project Stats */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Upvotes</span>
                    <span className="font-medium">{currentVoteCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Comments</span>
                    <span className="font-medium">{project.comments_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Button for Project Owner */}
              {user && project.users && user.id === project.users.id && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Project</h3>
                  <div className="space-y-2">
                    <Button asChild className="w-full bg-uiuc-orange hover:bg-uiuc-orange/90">
                      <Link to={`/project/${project.id}/edit`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Project
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/dashboard">
                        View Dashboard
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}