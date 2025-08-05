import { useState } from 'react'
import { formatDistance } from 'date-fns'
import { ExternalLink, Github, MessageCircle } from 'lucide-react'
import { CategoryIcon } from '@/lib/categoryIcons'
import { Link } from 'react-router-dom'
import { VoteButton } from './VoteButton'
import { BookmarkButton } from './BookmarkButton'
import { AddToCollectionButton } from './AddToCollectionButton'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { sanitizeContent, sanitizeUrl } from '@/lib/sanitize'

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
  const [imageError, setImageError] = useState(false)
  const user = project.users
  const category = project.categories

  const handleVoteChange = (_newCount: number) => {
    // VoteButton manages its own state, this is just for potential future use
    // Could be used to update parent component or analytics
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-uiuc-orange/30 group text-gray-900">
      {/* Project Image Header */}
      <div className="relative h-48 bg-gray-100">
        {project.image_url && !imageError ? (
          <img
            src={project.image_url}
            alt={project.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
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
            onVoteChange={handleVoteChange}
            className="bg-white/95 backdrop-blur-sm hover:bg-white shadow-md"
          />
        </div>
        
        {/* Category Badge */}
        {category && (
          <div className="absolute top-3 left-3">
            <span 
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm"
              style={{ backgroundColor: category.color }}
            >
              <CategoryIcon 
                iconName={category.icon} 
                className="w-3 h-3" 
                fallback={category.name}
              />
              {category.name}
            </span>
          </div>
        )}
      </div>

      {/* Project Content */}
      <div className="p-5 text-gray-900">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-uiuc-blue transition-colors !text-gray-900">
            {sanitizeContent(project.name)}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-1 !text-gray-600">{sanitizeContent(project.tagline)}</p>
        </div>

        {/* Description */}
        <p className="text-gray-800 text-sm mb-4 line-clamp-3 leading-relaxed !text-gray-800">
          {sanitizeContent(project.description)}
        </p>

        {/* Links */}
        <div className="flex items-center gap-2 mb-4">
          {project.website_url && sanitizeUrl(project.website_url) && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-7 px-2 text-xs flex-1 text-gray-700 hover:text-gray-900 !text-gray-700"
            >
              <a href={sanitizeUrl(project.website_url)} target="_blank" rel="noopener noreferrer" className="!text-gray-700 hover:!text-gray-900">
                <ExternalLink className="w-3 h-3 mr-1" />
                Website
              </a>
            </Button>
          )}
          {project.github_url && sanitizeUrl(project.github_url) && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-7 px-2 text-xs flex-1 text-gray-700 hover:text-gray-900 !text-gray-700"
            >
              <a href={sanitizeUrl(project.github_url)} target="_blank" rel="noopener noreferrer" className="!text-gray-700 hover:!text-gray-900">
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
                className="flex items-center gap-2 text-gray-700 hover:text-uiuc-blue transition-colors !text-gray-700"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback className="text-xs text-gray-700 !text-gray-700">
                    {user.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-700 truncate hover:text-uiuc-blue transition-colors !text-gray-700">
                  {sanitizeContent(user.full_name || user.username || 'Anonymous')}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs text-gray-700 !text-gray-700">U</AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-700 truncate !text-gray-700">
                  Anonymous
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-gray-500">
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-gray-500 !text-gray-500" />
              <span className="text-xs text-gray-600 !text-gray-600">{project.comments_count}</span>
            </div>
            <span className="text-xs text-gray-500 !text-gray-500">
              {formatDistance(new Date(project.created_at), new Date(), { addSuffix: true })}
            </span>
            <BookmarkButton 
              projectId={project.id}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-uiuc-orange !text-gray-600"
            />
            <AddToCollectionButton 
              projectId={project.id}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-uiuc-orange !text-gray-600"
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