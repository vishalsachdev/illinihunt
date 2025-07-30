import { formatDistance } from 'date-fns'
import { ExternalLink, Github, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { VoteButton } from './VoteButton'
import { BookmarkButton } from './BookmarkButton'
import { AddToCollectionButton } from './AddToCollectionButton'
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
}

export function ProjectCard({ project }: ProjectCardProps) {
  const user = project.users
  const category = project.categories

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-uiuc-orange/30 group">
      {/* Project Image Header */}
      <div className="relative h-48 bg-gray-100">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-4xl opacity-50">📱</span>
          </div>
        )}
        
        {/* Vote Button Overlay */}
        <div className="absolute top-3 right-3">
          <VoteButton 
            projectId={project.id}
            initialVoteCount={project.upvotes_count}
            className="bg-white/95 backdrop-blur-sm hover:bg-white shadow-md"
          />
        </div>
        
        {/* Category Badge */}
        {category && (
          <div className="absolute top-3 left-3">
            <span 
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </span>
          </div>
        )}
      </div>

      {/* Project Content */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-uiuc-blue transition-colors">
            {project.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-1">{project.tagline}</p>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-3 leading-relaxed">
          {project.description}
        </p>

        {/* Links */}
        <div className="flex items-center gap-2 mb-4">
          {project.website_url && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-7 px-2 text-xs flex-1"
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
              className="h-7 px-2 text-xs flex-1"
            >
              <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                <Github className="w-3 h-3 mr-1" />
                GitHub
              </a>
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            {user ? (
              <Link 
                to={`/user/${user.id}`} 
                className="flex items-center gap-2 hover:text-uiuc-blue transition-colors"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {user.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-600 truncate hover:text-uiuc-blue transition-colors">
                  {user.full_name || user.username || 'Anonymous'}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">U</AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-600 truncate">
                  Anonymous
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-gray-500">
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">{project.comments_count}</span>
            </div>
            <span className="text-xs">
              {formatDistance(new Date(project.created_at), new Date(), { addSuffix: true })}
            </span>
            <BookmarkButton 
              projectId={project.id}
              variant="ghost"
              size="sm"
            />
            <AddToCollectionButton 
              projectId={project.id}
              variant="ghost"
              size="sm"
            />
          </div>
        </div>

        {/* View Details Button */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mt-3 w-full h-8 text-xs text-uiuc-blue hover:text-white hover:bg-uiuc-blue transition-colors"
        >
          <Link to={`/project/${project.id}`}>
            View Details →
          </Link>
        </Button>
      </div>
    </div>
  )
}