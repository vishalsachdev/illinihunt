import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { CollectionService } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus } from 'lucide-react'
import { getErrorMessage, showToast } from '@/components/ui/toast'

export function NewCollectionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Collection name is required')
      return
    }

    setSaving(true)
    try {
      const { data, error: createError } = await CollectionService.createCollection({
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic
      })

      if (createError) {
        throw createError
      }
      if (!data) {
        throw new Error('Collection could not be created')
      }

      showToast.success('Collection created', 'You can now add projects to it.')
      navigate(`/collections/${data.id}`)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      showToast.error('Failed to create collection', { description: message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-midnight text-foreground dark">
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-3xl">
        <Button asChild variant="ghost" className="mb-6 pl-0">
          <Link to="/collections">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Collections
          </Link>
        </Button>

        <div className="glass-card border border-white/10 rounded-xl p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Collection</h1>
          <p className="text-muted-foreground mb-8">
            Build a curated list of projects for yourself or the community.
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
                placeholder="e.g. Favorite AI Projects"
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
                placeholder="Describe what belongs in this collection."
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
                <p className="font-medium text-foreground">Make this collection public</p>
                <p className="text-sm text-muted-foreground">
                  Public collections can be discovered by other users.
                </p>
              </div>
            </label>

            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving || !name.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                {saving ? 'Creating...' : 'Create Collection'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/collections')} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NewCollectionPage
