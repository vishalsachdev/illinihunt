import { useState, useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ProjectsService } from '@/lib/database'
import { ProjectForm } from '@/components/project/ProjectForm'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

export function EditProjectPage() {
  const { user, loading: authLoading } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProject = async () => {
      if (!id || !user) return

      setLoading(true)
      try {
        const { data, error } = await ProjectsService.getProject(id)
        if (error) throw error
        
        if (!data) {
          setError('Project not found')
          return
        }

        // Check if user owns this project
        if (data.user_id !== user.id) {
          setError('You can only edit your own projects')
          return
        }

        setProject(data)
      } catch (err) {
        console.error('Error loading project:', err)
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [id, user])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!id) {
    return <Navigate to="/dashboard" replace />
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Project not found'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error === 'You can only edit your own projects' 
              ? 'You do not have permission to edit this project.'
              : 'The project you are looking for could not be found.'
            }
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-uiuc-orange hover:bg-uiuc-orange/90 text-white px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <ProjectForm
      mode="edit"
      projectId={id}
      initialData={project}
      onSuccess={() => {
        navigate('/dashboard')
      }}
      onCancel={() => {
        navigate('/dashboard')
      }}
    />
  )
}