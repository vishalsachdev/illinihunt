# Component Specifications - IlliniHunt V2

## Component Architecture Overview

### Design System
- **Base**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS with UIUC theme
- **Icons**: Lucide React
- **Typography**: Inter font family
- **Colors**: UIUC orange (#FF6B35) and navy (#13294B)

### Component Structure
```
src/components/
├── ui/                     # shadcn/ui base components
├── auth/                   # Authentication components
├── project/                # Project-related components
├── comment/                # Comment system components
├── user/                   # User profile components
├── layout/                 # Layout and navigation
├── common/                 # Shared utility components
└── forms/                  # Form components
```

## Authentication Components

### LoginButton.tsx
```typescript
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { LogIn } from "lucide-react"

interface LoginButtonProps {
  className?: string
  variant?: "default" | "outline" | "ghost"
}

export function LoginButton({ className, variant = "default" }: LoginButtonProps) {
  const { signInWithGoogle, loading } = useAuth()

  return (
    <Button
      onClick={signInWithGoogle}
      disabled={loading}
      variant={variant}
      className={className}
    >
      <LogIn className="mr-2 h-4 w-4" />
      {loading ? "Signing in..." : "Sign in with Illinois"}
    </Button>
  )
}
```

### UserMenu.tsx
```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"
import { User, Settings, LogOut, Plus } from "lucide-react"
import { Link } from "react-router-dom"

export function UserMenu() {
  const { user, profile, signOut } = useAuth()

  if (!user || !profile) return null

  const initials = profile.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || profile.email[0].toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 rounded-full p-1 hover:bg-gray-100 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-uiuc-orange text-white text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{profile.full_name || profile.username}</p>
          <p className="text-xs text-gray-500">{profile.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/submit" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Submit Project
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/profile/${profile.username}`} className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### AuthGuard.tsx
```typescript
import { useAuth } from "@/hooks/useAuth"
import { Navigate, useLocation } from "react-router-dom"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!requireAuth && user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
```

## Project Components

### ProjectCard.tsx
```typescript
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VoteButton } from "./VoteButton"
import { formatDistanceToNow } from "date-fns"
import { MessageCircle, ExternalLink, Github } from "lucide-react"
import { Link } from "react-router-dom"
import type { Project } from "@/types/database"

interface ProjectCardProps {
  project: Project & {
    users: {
      username: string
      full_name: string
      avatar_url: string
    }
    categories: {
      name: string
      color: string
      icon: string
    }
  }
  showVoteButton?: boolean
}

export function ProjectCard({ project, showVoteButton = true }: ProjectCardProps) {
  const userInitials = project.users.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || project.users.username[0].toUpperCase()

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-uiuc-orange/30">
      <CardContent className="p-6">
        {/* Project Image */}
        {project.image_url && (
          <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
            <img
              src={project.image_url}
              alt={project.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}

        {/* Category Badge */}
        {project.categories && (
          <Badge 
            variant="secondary" 
            className="mb-3"
            style={{ backgroundColor: `${project.categories.color}20`, color: project.categories.color }}
          >
            {project.categories.name}
          </Badge>
        )}

        {/* Project Info */}
        <div className="space-y-2">
          <Link to={`/project/${project.id}`} className="block">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-uiuc-orange transition-colors">
              {project.name}
            </h3>
          </Link>
          <p className="text-gray-600 line-clamp-2">{project.tagline}</p>
        </div>

        {/* Links */}
        <div className="flex items-center space-x-3 mt-4">
          {project.website_url && (
            <a
              href={project.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-uiuc-orange transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-uiuc-orange transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        {/* User Info */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={project.users.avatar_url} />
            <AvatarFallback className="bg-uiuc-blue text-white text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link 
              to={`/profile/${project.users.username}`}
              className="text-sm font-medium text-gray-900 hover:text-uiuc-orange transition-colors"
            >
              {project.users.full_name || project.users.username}
            </Link>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(project.created_at))} ago
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Comments */}
          <Link 
            to={`/project/${project.id}#comments`}
            className="flex items-center space-x-1 text-gray-500 hover:text-uiuc-orange transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{project.comments_count}</span>
          </Link>

          {/* Vote Button */}
          {showVoteButton && (
            <VoteButton 
              projectId={project.id} 
              initialCount={project.upvotes_count}
            />
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
```

### VoteButton.tsx
```typescript
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUp } from "lucide-react"
import { useVoteProject } from "@/hooks/useProjects"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface VoteButtonProps {
  projectId: string
  initialCount: number
  initialVoted?: boolean
  size?: "sm" | "default" | "lg"
}

export function VoteButton({ 
  projectId, 
  initialCount, 
  initialVoted = false,
  size = "default" 
}: VoteButtonProps) {
  const [hasVoted, setHasVoted] = useState(initialVoted)
  const [voteCount, setVoteCount] = useState(initialCount)
  const { user } = useAuth()
  const { mutate: voteProject, isLoading } = useVoteProject()

  const handleVote = () => {
    if (!user) {
      toast.error("Please sign in to vote")
      return
    }

    const newVotedState = !hasVoted
    const newCount = newVotedState ? voteCount + 1 : voteCount - 1

    // Optimistic update
    setHasVoted(newVotedState)
    setVoteCount(newCount)

    voteProject(
      { projectId, isVoting: newVotedState },
      {
        onError: () => {
          // Revert on error
          setHasVoted(!newVotedState)
          setVoteCount(voteCount)
          toast.error("Failed to vote. Please try again.")
        }
      }
    )
  }

  const buttonSizes = {
    sm: "h-8 px-2 text-xs",
    default: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base"
  }

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5"
  }

  return (
    <Button
      variant={hasVoted ? "default" : "outline"}
      size="sm"
      onClick={handleVote}
      disabled={isLoading}
      className={cn(
        buttonSizes[size],
        "flex flex-col items-center space-y-1 min-w-[60px] transition-all duration-200",
        hasVoted 
          ? "bg-uiuc-orange hover:bg-uiuc-orange/90 text-white" 
          : "hover:bg-uiuc-orange/10 hover:border-uiuc-orange hover:text-uiuc-orange"
      )}
    >
      <ChevronUp className={cn(iconSizes[size], "transition-transform", hasVoted && "scale-110")} />
      <span className="font-semibold">{voteCount}</span>
    </Button>
  )
}
```

### ProjectForm.tsx
```typescript
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/common/ImageUpload"
import { useCreateProject } from "@/hooks/useProjects"
import { useCategories } from "@/hooks/useCategories"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

const projectSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  tagline: z.string().min(10, "Tagline must be at least 10 characters").max(200),
  description: z.string().min(50, "Description must be at least 50 characters").max(2000),
  website_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  github_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category_id: z.string().uuid("Please select a category"),
  image_url: z.string().optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

export function ProjectForm() {
  const [imageUrl, setImageUrl] = useState<string>()
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const { mutate: createProject, isLoading } = useCreateProject()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  })

  const onSubmit = (data: ProjectFormData) => {
    const projectData = {
      ...data,
      image_url: imageUrl,
      website_url: data.website_url || null,
      github_url: data.github_url || null,
    }

    createProject(projectData, {
      onSuccess: (result) => {
        toast.success("Project submitted successfully!")
        navigate(`/project/${result.data.id}`)
      },
      onError: (error) => {
        toast.error("Failed to submit project. Please try again.")
        console.error(error)
      },
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Submit Your Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Image */}
            <div className="space-y-2">
              <Label>Project Image</Label>
              <ImageUpload
                onUpload={setImageUrl}
                bucket="project-images"
                className="aspect-video"
              />
            </div>

            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter your project name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline *</Label>
              <Input
                id="tagline"
                {...register("tagline")}
                placeholder="A brief description of what your project does"
                className={errors.tagline ? "border-red-500" : ""}
              />
              {errors.tagline && (
                <p className="text-sm text-red-500">{errors.tagline.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select onValueChange={(value) => setValue("category_id", value)}>
                <SelectTrigger className={errors.category_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-sm text-red-500">{errors.category_id.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your project in detail..."
                rows={6}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  {...register("website_url")}
                  placeholder="https://your-project.com"
                  className={errors.website_url ? "border-red-500" : ""}
                />
                {errors.website_url && (
                  <p className="text-sm text-red-500">{errors.website_url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="github_url">GitHub URL</Label>
                <Input
                  id="github_url"
                  {...register("github_url")}
                  placeholder="https://github.com/username/repo"
                  className={errors.github_url ? "border-red-500" : ""}
                />
                {errors.github_url && (
                  <p className="text-sm text-red-500">{errors.github_url.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit Project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Comment System Components

### CommentSection.tsx
```typescript
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CommentForm } from "./CommentForm"
import { CommentThread } from "./CommentThread"
import { useComments } from "@/hooks/useComments"
import { useAuth } from "@/hooks/useAuth"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { MessageCircle } from "lucide-react"

interface CommentSectionProps {
  projectId: string
}

export function CommentSection({ projectId }: CommentSectionProps) {
  const { user } = useAuth()
  const { data: comments, isLoading } = useComments(projectId)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  const rootComments = comments?.filter(comment => !comment.parent_id) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Comments ({comments?.length || 0})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {user && (
          <CommentForm projectId={projectId} />
        )}

        {/* Comments */}
        <div className="space-y-4">
          {rootComments.length > 0 ? (
            rootComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                allComments={comments || []}
                projectId={projectId}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### CommentItem.tsx
```typescript
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { Heart, Reply, MoreHorizontal } from "lucide-react"
import { CommentForm } from "./CommentForm"
import { useAuth } from "@/hooks/useAuth"
import { useLikeComment } from "@/hooks/useComments"
import { cn } from "@/lib/utils"
import type { Comment } from "@/types/database"

interface CommentItemProps {
  comment: Comment & {
    users: {
      username: string
      full_name: string
      avatar_url: string
    }
  }
  projectId: string
  onReply?: () => void
  showReplyButton?: boolean
}

export function CommentItem({ 
  comment, 
  projectId, 
  onReply, 
  showReplyButton = true 
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [hasLiked, setHasLiked] = useState(false) // TODO: Get from user's likes
  const [likeCount, setLikeCount] = useState(comment.likes_count)
  const { user } = useAuth()
  const { mutate: likeComment } = useLikeComment()

  const userInitials = comment.users.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || comment.users.username[0].toUpperCase()

  const handleLike = () => {
    if (!user) return

    const newLikedState = !hasLiked
    const newCount = newLikedState ? likeCount + 1 : likeCount - 1

    // Optimistic update
    setHasLiked(newLikedState)
    setLikeCount(newCount)

    likeComment(
      { commentId: comment.id, isLiking: newLikedState },
      {
        onError: () => {
          // Revert on error
          setHasLiked(!newLikedState)
          setLikeCount(likeCount)
        }
      }
    )
  }

  const handleReply = () => {
    setShowReplyForm(!showReplyForm)
    onReply?.()
  }

  return (
    <div className="space-y-3">
      <div className="flex space-x-3">
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.users.avatar_url} />
          <AvatarFallback className="bg-uiuc-blue text-white text-sm">
            {userInitials}
          </AvatarFallback>
        </Avatar>

        {/* Comment Content */}
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">
              {comment.users.full_name || comment.users.username}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.created_at))} ago
            </span>
          </div>

          {/* Content */}
          <div className="text-sm text-gray-700 leading-relaxed">
            {comment.content}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Like Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "h-8 px-2 text-xs",
                hasLiked 
                  ? "text-red-500 hover:text-red-600" 
                  : "text-gray-500 hover:text-red-500"
              )}
            >
              <Heart 
                className={cn(
                  "h-3 w-3 mr-1",
                  hasLiked && "fill-current"
                )} 
              />
              {likeCount}
            </Button>

            {/* Reply Button */}
            {showReplyButton && user && comment.thread_depth < 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReply}
                className="h-8 px-2 text-xs text-gray-500 hover:text-uiuc-orange"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="ml-11">
          <CommentForm
            projectId={projectId}
            parentId={comment.id}
            onSubmit={() => setShowReplyForm(false)}
            onCancel={() => setShowReplyForm(false)}
            placeholder={`Reply to ${comment.users.full_name || comment.users.username}...`}
          />
        </div>
      )}
    </div>
  )
}
```

## Layout Components

### Header.tsx
```typescript
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoginButton } from "@/components/auth/LoginButton"
import { UserMenu } from "@/components/auth/UserMenu"
import { useAuth } from "@/hooks/useAuth"
import { Search, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-uiuc-orange flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="font-bold text-xl text-uiuc-blue">IlliniHunt</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </form>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button asChild variant="default" size="sm">
                  <Link to="/submit" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Submit
                  </Link>
                </Button>
                <UserMenu />
              </>
            ) : (
              <LoginButton variant="default" />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
```

### Sidebar.tsx
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCategories } from "@/hooks/useCategories"
import { useSearchParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import { TrendingUp, Clock, Star, Grid } from "lucide-react"

export function Sidebar() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: categories } = useCategories()
  
  const currentCategory = searchParams.get("category")
  const currentSort = searchParams.get("sort") || "recent"

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    setSearchParams(newParams)
  }

  const sortOptions = [
    { value: "recent", label: "Recent", icon: Clock },
    { value: "popular", label: "Popular", icon: TrendingUp },
    { value: "featured", label: "Featured", icon: Star },
  ]

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            Sort By
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortOptions.map((option) => {
            const Icon = option.icon
            return (
              <Button
                key={option.value}
                variant={currentSort === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() => updateFilter("sort", option.value)}
                className={cn(
                  "w-full justify-start",
                  currentSort === option.value && "bg-uiuc-orange hover:bg-uiuc-orange/90"
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {option.label}
              </Button>
            )
          })}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant={!currentCategory ? "default" : "ghost"}
            size="sm"
            onClick={() => updateFilter("category", null)}
            className={cn(
              "w-full justify-start",
              !currentCategory && "bg-uiuc-orange hover:bg-uiuc-orange/90"
            )}
          >
            <Grid className="h-4 w-4 mr-2" />
            All Categories
          </Button>
          
          {categories?.map((category) => (
            <Button
              key={category.id}
              variant={currentCategory === category.id ? "default" : "ghost"}
              size="sm"
              onClick={() => updateFilter("category", category.id)}
              className={cn(
                "w-full justify-between",
                currentCategory === category.id && "bg-uiuc-orange hover:bg-uiuc-orange/90"
              )}
            >
              <span className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </span>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            Community Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Projects</span>
            <Badge variant="secondary">150+</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Builders</span>
            <Badge variant="secondary">45+</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Votes Cast</span>
            <Badge variant="secondary">2.1k+</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Common Utility Components

### LoadingSpinner.tsx
```typescript
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "default", className }: LoadingSpinnerProps) {
  const sizes = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8"
  }

  return (
    <div className={cn("animate-spin", sizes[size], className)}>
      <svg
        className="w-full h-full text-uiuc-orange"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}
```

### ImageUpload.tsx
```typescript
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ImageUploadProps {
  onUpload: (url: string) => void
  bucket: string
  className?: string
  maxSize?: number // in MB
}

export function ImageUpload({ 
  onUpload, 
  bucket, 
  className,
  maxSize = 5 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const uploadImage = async (file: File) => {
    if (!user) {
      toast.error("Please sign in to upload images")
      return
    }

    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`)
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      onUpload(data.publicUrl)
      setPreview(data.publicUrl)
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
  }

  const clearImage = () => {
    setPreview(undefined)
    onUpload("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("border-2 border-dashed border-gray-300 rounded-lg", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Upload preview"
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={clearImage}
              className="bg-red-500 hover:bg-red-600"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-full flex flex-col items-center justify-center py-8 px-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin h-8 w-8 border-2 border-uiuc-orange border-t-transparent rounded-full mb-2" />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <>
              <ImageIcon className="h-12 w-12 mb-4" />
              <span className="text-sm font-medium">Click to upload image</span>
              <span className="text-xs text-gray-400 mt-1">
                PNG, JPG up to {maxSize}MB
              </span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
```

This component specification provides all the major UI components needed for IlliniHunt V2, following modern React patterns with TypeScript, shadcn/ui, and UIUC branding.