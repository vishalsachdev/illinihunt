import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { CollectionService, ProjectsService } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getErrorMessage, showToast } from '@/components/ui/toast'
import { ArrowLeft, Check, Plus, Search } from 'lucide-react'
import type { Database } from '@/types/database'

type CollectionProject = {
  id: string
  added_at: string
  projects: {
    id: string
    name: string
    tagline: string
  } | null
}

type CollectionWithProjects = Database['public']['Tables']['collections']['Row'] & {
  projects: CollectionProject[]
}

type ProjectListItem = {
  id: string
  name: string
  tagline: string
  created_at: string | null
  upvotes_count: number | null
  comments_count: number | null
  users: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
  categories: {
    id: string
    name: string
    color: string | null
    icon: string | null
  } | null
}

export function AddProjectsToCollectionPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [collection, setCollection] = useState<CollectionWithProjects | null>(null)
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [inCollectionIds, setInCollectionIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPageData = async () => {
      if (!id || !user) return

      setLoading(true)
      setError(null)

      try {
        const [collectionResult, projectsResult] = await Promise.all([
          CollectionService.getCollection(id, true),
          ProjectsService.getProjects({ sortBy: 'recent', limit: 120 })
        ])

        if (collectionResult.error) {
          throw collectionResult.error
        }
        if (projectsResult.error) {
          throw projectsResult.error
        }

        const collectionData = collectionResult.data as CollectionWithProjects | null
        if (!collectionData) {
          setError('Collection not found')
          return
        }

        if (collectionData.user_id !== user.id) {
          setError('You can only modify your own collections')
          return
        }

        const projectRows = ((projectsResult.data || []) as unknown as ProjectListItem[])
        const collectionIds = new Set(
          (collectionData.projects || [])
            .map((item) => item.projects?.id)
            .filter((projectId): projectId is string => Boolean(projectId))
        )

        setCollection(collectionData)
        setProjects(projectRows)
        setInCollectionIds(collectionIds)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadPageData()
  }, [id, user])

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects
    }
    const query = searchQuery.toLowerCase()
    return projects.filter((project) => {
      const name = project.name.toLowerCase()
      const tagline = project.tagline?.toLowerCase() || ''
      const author = project.users?.full_name?.toLowerCase() || project.users?.username?.toLowerCase() || ''
      return name.includes(query) || tagline.includes(query) || author.includes(query)
    })
  }, [projects, searchQuery])

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!id) {
    return <Navigate to="/collections" replace />
  }

  const handleToggleProject = async (projectId: string) => {
    if (!collection) return

    setUpdatingProjectId(projectId)
    try {
      const alreadyInCollection = inCollectionIds.has(projectId)

      if (alreadyInCollection) {
        const { error: removeError } = await CollectionService.removeProjectFromCollection(collection.id, projectId)
        if (removeError) {
          throw removeError
        }

        setInCollectionIds((previous) => {
          const next = new Set(previous)
          next.delete(projectId)
          return next
        })
        setCollection((previous) => (
          previous
            ? { ...previous, projects_count: Math.max(0, (previous.projects_count ?? 0) - 1) }
            : previous
        ))
        showToast.success('Project removed from collection')
      } else {
        const { error: addError } = await CollectionService.addProjectToCollection(collection.id, projectId)
        if (addError) {
          throw addError
        }

        setInCollectionIds((previous) => new Set(previous).add(projectId))
        setCollection((previous) => (
          previous
            ? { ...previous, projects_count: (previous.projects_count ?? 0) + 1 }
            : previous
        ))
        showToast.success('Project added to collection')
      }
    } catch (err) {
      showToast.error('Failed to update collection', { description: getErrorMessage(err) })
    } finally {
      setUpdatingProjectId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight text-foreground dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading collection projects...</p>
        </div>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-midnight text-foreground dark flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">Unable to Load Page</h1>
          <p className="text-muted-foreground mb-6">{error || 'Collection not found'}</p>
          <Button asChild>
            <Link to="/collections">Back to Collections</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight text-foreground dark">
      <div className="container mx-auto px-4 pt-24 pb-8">
        <Button asChild variant="ghost" className="mb-6 pl-0">
          <Link to={`/collections/${collection.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Collection
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Add Projects</h1>
          <p className="text-muted-foreground">
            Managing <span className="font-semibold text-foreground">{collection.name}</span> ({collection.projects_count} projects).
          </p>
        </div>

        <div className="glass-card border border-white/10 rounded-xl p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
              placeholder="Search projects by name, tagline, or author"
            />
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-10 bg-muted/10 rounded-lg border-2 border-dashed border-border/50">
            <p className="text-muted-foreground">No projects match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProjects.map((project) => {
              const isInCollection = inCollectionIds.has(project.id)
              const isUpdating = updatingProjectId === project.id

              return (
                <div key={project.id} className="glass-card border border-white/10 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
                    {project.categories && (
                      <span
                        className="rounded-full px-2 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: project.categories.color || '#6B7280' }}
                      >
                        {project.categories.name}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {project.tagline || 'No tagline provided.'}
                  </p>

                  <p className="text-xs text-muted-foreground mb-4">
                    {project.users?.full_name || project.users?.username || 'Unknown author'}
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1"
                      variant={isInCollection ? 'outline' : 'default'}
                      disabled={isUpdating}
                      onClick={() => handleToggleProject(project.id)}
                    >
                      {isInCollection ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          {isUpdating ? 'Updating...' : 'In Collection'}
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          {isUpdating ? 'Adding...' : 'Add'}
                        </>
                      )}
                    </Button>

                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/project/${project.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AddProjectsToCollectionPage
