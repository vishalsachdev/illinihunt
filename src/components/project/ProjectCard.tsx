import { formatDistance } from 'date-fns'
import { ExternalLink, Github, MessageCircle } from 'lucide-react'
import { VoteButton } from './VoteButton'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ProjectData {
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

interface ProjectCardProps {
  project: ProjectData
  onViewDetails?: (projectId: string) => void
}

export function ProjectCard({ project, onViewDetails }: ProjectCardProps) {
  const user = project.users
  const category = project.categories

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Vote Button */}
        <div className="flex-shrink-0">
          <VoteButton 
            projectId={project.id}
            initialVoteCount={project.upvotes_count}
          />
        </div>

        {/* Project Image */}
        <div className="flex-shrink-0">
          {project.image_url ? (
            <img
              src={project.image_url}
              alt={project.name}
              className="w-16 h-16 rounded-lg object-cover border"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
        </div>

        {/* Project Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {project.name}
              </h3>
              <p className="text-gray-600 text-sm mb-2">{project.tagline}</p>
            </div>
            
            {/* Category Badge */}
            {category && (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ml-2"
                style={{ backgroundColor: category.color }}
              >
                {category.name}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>

          {/* Links */}
          <div className="flex items-center gap-2 mb-4">
            {project.website_url && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-7 px-2 text-xs"
              >
                <a href={project.website_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Website
                </a>
              </Button>
            )}
            {project.github_url && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-7 px-2 text-xs"
              >
                <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                  <Github className="w-3 h-3 mr-1" />
                  GitHub
                </a>
              </Button>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {/* Author */}
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={user?.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">
                  {user?.full_name || user?.username || 'Anonymous'}
                </span>
              </div>

              {/* Comments Count */}
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span className="text-xs">{project.comments_count}</span>
              </div>
            </div>

            {/* Time */}
            <span className="text-xs">
              {formatDistance(new Date(project.created_at), new Date(), { addSuffix: true })}
            </span>
          </div>

          {/* View Details Button */}
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(project.id)}
              className="mt-2 h-7 px-2 text-xs text-uiuc-blue hover:text-uiuc-blue hover:bg-uiuc-blue/5"
            >
              View Details →
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}