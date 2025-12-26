import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { AdminService, type AdminProject, type PlatformStats, type ProjectStatus } from '@/lib/adminService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { showToast } from '@/components/ui/toast'
import { DeleteProjectModal } from '@/components/project/DeleteProjectModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BarChart3,
  MessageCircle,
  ArrowUp,
  Eye,
  Calendar,
  RefreshCw,
  Trash2,
  Star,
  StarOff,
  Archive,
  CheckCircle,
  MoreVertical,
  Users,
  Search,
  Shield
} from 'lucide-react'

type TabFilter = 'all' | 'active' | 'featured' | 'archived'

export function AdminDashboardPage() {
  const { loading: authLoading } = useAdminAuth()
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    project: AdminProject | null
  }>({
    isOpen: false,
    project: null
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)

    // Load stats and projects in parallel
    const [statsResult, projectsResult] = await Promise.all([
      AdminService.getStats(),
      AdminService.getAllProjects({
        status: activeTab === 'all' ? undefined : activeTab as ProjectStatus,
        search: searchQuery || undefined,
        limit: 50
      })
    ])

    if (statsResult.data) {
      setStats(statsResult.data)
    }

    if (projectsResult.data) {
      setProjects(projectsResult.data)
    } else if (projectsResult.error) {
      showToast.error('Failed to load projects', { description: projectsResult.error.message })
    }

    setLoading(false)
  }, [activeTab, searchQuery])

  useEffect(() => {
    if (!authLoading) {
      loadData()
    }
  }, [loadData, authLoading])

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    setActionLoading(projectId)

    const { data, error } = await AdminService.updateProjectStatus(projectId, newStatus)

    if (error) {
      showToast.error('Failed to update status', { description: error.message })
    } else if (data) {
      // Update local state
      setProjects(prev => prev.map(p => p.id === projectId ? data : p))
      showToast.success(`Project ${newStatus === 'featured' ? 'featured' : newStatus === 'archived' ? 'archived' : 'activated'}`)

      // Refresh stats
      const statsResult = await AdminService.getStats()
      if (statsResult.data) {
        setStats(statsResult.data)
      }
    }

    setActionLoading(null)
  }

  const handleDelete = async () => {
    if (!deleteDialog.project) return

    const projectName = deleteDialog.project.name
    const projectId = deleteDialog.project.id

    setActionLoading(projectId)

    const { error } = await AdminService.deleteProject(projectId)

    if (error) {
      showToast.error('Failed to delete project', { description: error.message })
      setActionLoading(null)
    } else {
      setProjects(prev => prev.filter(p => p.id !== projectId))
      showToast.success('Project deleted', `"${projectName}" has been permanently deleted.`)

      // Refresh stats
      const statsResult = await AdminService.getStats()
      if (statsResult.data) {
        setStats(statsResult.data)
      }
      setActionLoading(null)
      setDeleteDialog({ isOpen: false, project: null })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'featured':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Featured</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Archived</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Draft</Badge>
      default:
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight text-foreground dark">
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="w-6 h-6 text-uiuc-orange" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Manage projects and monitor platform activity
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => loadData()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProjects}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.activeProjects}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Featured</CardTitle>
                  <Star className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.featuredProjects}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Archived</CardTitle>
                  <Archive className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{stats.archivedProjects}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upvotes</CardTitle>
                  <ArrowUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUpvotes}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comments</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalComments}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Tabs */}
            <div className="flex gap-2">
              {(['all', 'active', 'featured', 'archived'] as TabFilter[]).map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  className={activeTab === tab ? 'bg-uiuc-orange hover:bg-uiuc-orange/90' : ''}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4" />
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-4">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Project Image */}
                      {project.image_url ? (
                        <img
                          src={project.image_url}
                          alt={project.name}
                          className="w-16 h-16 rounded-lg object-cover border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-400 text-xl">📱</span>
                        </div>
                      )}

                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                to={`/project/${project.id}`}
                                className="text-lg font-semibold text-foreground hover:text-uiuc-orange transition-colors"
                              >
                                {project.name}
                              </Link>
                              {getStatusBadge(project.status)}
                            </div>

                            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                              {project.tagline}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {project.users && (
                                <span>
                                  by {project.users.full_name || project.users.username || 'Unknown'}
                                  <span className="text-muted-foreground/60 ml-1">
                                    ({project.users.email})
                                  </span>
                                </span>
                              )}
                              {project.categories && (
                                <Badge variant="outline" className="text-xs">
                                  {project.categories.name}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <ArrowUp className="w-4 h-4" />
                              <span>{project.upvotes_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{project.comments_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(project.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionLoading === project.id}
                              >
                                {actionLoading === project.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="w-4 h-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/project/${project.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Project
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {project.status !== 'featured' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(project.id, 'featured')}
                                >
                                  <Star className="w-4 h-4 mr-2 text-orange-500" />
                                  Feature Project
                                </DropdownMenuItem>
                              )}

                              {project.status === 'featured' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(project.id, 'active')}
                                >
                                  <StarOff className="w-4 h-4 mr-2" />
                                  Remove Feature
                                </DropdownMenuItem>
                              )}

                              {project.status !== 'active' && project.status !== 'featured' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(project.id, 'active')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                  Activate
                                </DropdownMenuItem>
                              )}

                              {project.status !== 'archived' && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(project.id, 'archived')}
                                >
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setDeleteDialog({ isOpen: true, project })}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Project
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/10 rounded-lg border-2 border-dashed border-border/50">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No projects found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : `No ${activeTab === 'all' ? '' : activeTab} projects to display`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteProjectModal
        projectName={deleteDialog.project?.name || ''}
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, project: null })}
        onConfirm={handleDelete}
        loading={actionLoading === deleteDialog.project?.id}
      />
    </div>
  )
}
