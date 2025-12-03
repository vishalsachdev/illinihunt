import { useState, memo } from 'react'
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

/**
 * ProjectCard component - Displays project information in a card format
 * Memoized to prevent unnecessary re-renders when parent component updates
 * Only re-renders when project data changes
 */
const ProjectCardComponent = ({ project }: ProjectCardProps) => {
  const [imageError, setImageError] = useState(false)
  const user = project.users
  const category = project.categories

  const handleVoteChange = (_newCount: number) => {
    // VoteButton manages its own state, this is just for potential future use
    // Could be used to update parent component or analytics
  }

  return (
    <div className="glass-card rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-uiuc-orange/30 group text-foreground">
      {/* Project Image Header */}
      <Link to={`/project/${project.id}`} className="block relative h-48 bg-midnight-800 cursor-pointer">
        {project.image_url && !imageError ? (
          <img
            src={project.image_url}
            alt={project.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-midnight-800 to-midnight-900 flex items-center justify-center">
            <span className="text-4xl opacity-50">📱</span>
          </div>
        )}

        {/* Vote Button Overlay */}
        <div className="absolute top-3 right-3" onClick={(e) => e.preventDefault()}>
          <VoteButton
            projectId={project.id}
            initialVoteCount={project.upvotes_count}
            onVoteChange={handleVoteChange}
            className="bg-midnight/90 backdrop-blur-sm hover:bg-midnight shadow-md border border-white/10"
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
      </Link>

      {/* Project Content */}
      <div className="p-5 text-foreground">
        {/* Header */}
        <div className="mb-3">
          {/* TODO(human) - Implement project name linking */}
          <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-uiuc-orange transition-colors">
            {sanitizeContent(project.name)}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-1">{sanitizeContent(project.tagline)}</p>
        </div>

        {/* Description */}
        <p className="text-foreground/90 text-sm mb-4 line-clamp-3 leading-relaxed">
          {sanitizeContent(project.description)}
        </p>

        {/* Links */}
        <div className="flex items-center gap-2 mb-4">
          {project.website_url && sanitizeUrl(project.website_url) && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-7 px-2 text-xs flex-1 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <a href={sanitizeUrl(project.website_url)} target="_blank" rel="noopener noreferrer">
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
              className="h-7 px-2 text-xs flex-1 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <a href={sanitizeUrl(project.github_url)} target="_blank" rel="noopener noreferrer">
                <Github className="w-3 h-3 mr-1" />
                GitHub
              </a>
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm border-t border-white/10 pt-3">
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                to={`/user/${user.id}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-uiuc-orange transition-colors"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user.avatar_url || ''} />
                  <AvatarFallback className="text-xs text-foreground bg-midnight-800">
                    {user.full_name ? user.full_name.slice(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate">
                  {sanitizeContent(user.full_name || user.username || 'Anonymous')}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs text-foreground bg-midnight-800">U</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  Anonymous
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
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
              className="text-muted-foreground hover:text-uiuc-orange"
            />
            <AddToCollectionButton
              projectId={project.id}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-uiuc-orange"
            />
          </div>
        </div>

        {/* View Details Button */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mt-3 w-full h-8 text-xs text-uiuc-orange hover:text-white hover:bg-uiuc-orange/20 transition-colors"
        >
          <Link to={`/project/${project.id}`}>
            View Details →
          </Link>
        </Button>
      </div>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
// Custom comparison: returns true if props are equal (skip re-render), false if different (re-render)
// Only re-renders when project ID, vote count, or comment count changes
export const ProjectCard = memo(ProjectCardComponent, (prevProps, nextProps) => {
  // Return true (skip re-render) if all values are the same
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.upvotes_count === nextProps.project.upvotes_count &&
    prevProps.project.comments_count === nextProps.project.comments_count
  )
})