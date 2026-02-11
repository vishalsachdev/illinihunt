import { FormEvent, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { CollectionService } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { getErrorMessage, showToast } from '@/components/ui/toast'
import type { Database } from '@/types/database'

type CollectionWithOwner = Database['public']['Tables']['collections']['Row'] & {
  users?: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
}

export function EditCollectionPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [collection, setCollection] = useState<CollectionWithOwner | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCollection = async () => {
      if (!id || !user) return

      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await CollectionService.getCollection(id, false)
        if (fetchError) {
          throw fetchError
        }

        const result = data as CollectionWithOwner | null
        if (!result) {
          setError('Collection not found')
          return
        }

        if (result.user_id !== user.id) {
          setError('You can only edit your own collections')
          return
        }

        setCollection(result)
        setName(result.name)
        setDescription(result.description || '')
        setIsPublic(!!result.is_public)
      } catch (err) {
        const message = getErrorMessage(err)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadCollection()
  }, [id, user])

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!id) {
    return <Navigate to="/collections" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!collection) return

    setError(null)
    if (!name.trim()) {
      setError('Collection name is required')
      return
    }

    setSaving(true)
    try {
      const { error: updateError } = await CollectionService.updateCollection(collection.id, {
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic
      })

      if (updateError) {
        throw updateError
      }

      showToast.success('Collection updated')
      navigate(`/collections/${collection.id}`)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast.error('Failed to update collection', { description: message })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!collection) return
    if (!confirm('Delete this collection permanently? This cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const { error: deleteError } = await CollectionService.deleteCollection(collection.id)
      if (deleteError) {
        throw deleteError
      }

      showToast.success('Collection deleted')
      navigate('/collections')
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast.error('Failed to delete collection', { description: message })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight text-foreground dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading collection...</p>
        </div>
      </div>
    )
  }

  if (error && !collection) {
    return (
      <div className="min-h-screen bg-midnight text-foreground dark flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">Unable to Edit Collection</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link to="/collections">Back to Collections</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-midnight text-foreground dark">
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-3xl">
        <Button asChild variant="ghost" className="mb-6 pl-0">
          <Link to={collection ? `/collections/${collection.id}` : '/collections'}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>

        <div className="glass-card border border-white/10 rounded-xl p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Collection</h1>
          <p className="text-muted-foreground mb-8">
            Update details and visibility settings for your collection.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="collection-name" className="block text-sm font-medium mb-2 text-foreground">
                Name
              </label>
              <Input
                id="collection-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                required
              />
            </div>

            <div>
              <label htmlFor="collection-description" className="block text-sm font-medium mb-2 text-foreground">
                Description
              </label>
              <textarea
                id="collection-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                maxLength={300}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-card/40 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
                className="h-4 w-4"
              />
              <div>
                <p className="font-medium text-foreground">Public collection</p>
                <p className="text-sm text-muted-foreground">
                  Allow other users to discover and view this collection.
                </p>
              </div>
            </label>

            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={saving || deleting || !name.trim()}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(collection ? `/collections/${collection.id}` : '/collections')}
                disabled={saving || deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-red-500 border-red-500/40 hover:bg-red-500/10"
                onClick={handleDelete}
                disabled={saving || deleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete Collection'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditCollectionPage
