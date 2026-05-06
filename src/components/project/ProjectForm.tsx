import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { useError } from '@/contexts/ErrorContext'
import { ProjectsService } from '@/lib/database'
import { compressImage, uploadProjectImage } from '@/lib/imageUpload'
import { projectSchema, type ProjectFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUpload, type ImagePickerValue } from '@/components/ui/ImageUpload'
import { CategoryIcon } from '@/lib/categoryIcons'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

interface ProjectFormProps {
  mode?: 'create' | 'edit'
  projectId?: string
  initialData?: Partial<Project>
  onSuccess?: () => void
  onCancel?: () => void
}

type SubmitStage = 'compressing' | 'uploading' | 'saving'

const STAGE_LABEL: Record<SubmitStage, string> = {
  compressing: 'Preparing image…',
  uploading: 'Uploading image…',
  saving: 'Saving project…',
}

const FIELD_LABEL: Record<keyof ProjectFormData, string> = {
  name: 'project name',
  tagline: 'tagline',
  description: 'description',
  category_id: 'category',
  website_url: 'website URL',
  github_url: 'GitHub URL',
  video_url: 'YouTube URL',
  image_url: 'image',
}

export function ProjectForm({ mode = 'create', projectId, initialData, onSuccess, onCancel }: ProjectFormProps) {
  const { user } = useAuth()
  const { categories, loading: loadingCategories } = useCategories()
  const { handleFormError, handleAuthError, showSuccess } = useError()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stage, setStage] = useState<SubmitStage | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [image, setImage] = useState<ImagePickerValue>({ kind: 'empty' })

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, submitCount }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema)
  })

  // Populate form with initial data for edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name,
        tagline: initialData.tagline,
        description: initialData.description,
        category_id: initialData.category_id || '',
        website_url: initialData.website_url || '',
        github_url: initialData.github_url || '',
        video_url: initialData.video_url || ''
      })
      setImage(
        initialData.image_url
          ? { kind: 'existing', url: initialData.image_url }
          : { kind: 'empty' }
      )
    }
  }, [mode, initialData, reset])

  const onSubmit = async (data: ProjectFormData) => {
    if (!user) {
      handleAuthError('You must be signed in to submit a project')
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)
    setStage(null)

    // Track the current stage in a local variable too. setState calls schedule
    // a re-render but don't update the value visible inside this closure, so
    // reading `stage` from the catch block always returns the value at submit
    // start (null). The local var stays in sync with the React state and is
    // what we forward to Sentry.
    let currentStage: SubmitStage | null = null
    const advance = (next: SubmitStage) => {
      currentStage = next
      setStage(next)
    }

    try {
      // Resolve image_url according to the deferred-upload state machine
      let imageUrl: string | null = null
      if (image.kind === 'pending') {
        advance('compressing')
        const compressed = await compressImage(image.file)
        advance('uploading')
        const result = await uploadProjectImage(compressed, user.id)
        if (result.error || !result.url) {
          throw new Error(result.error ?? 'Image upload failed')
        }
        imageUrl = result.url
      } else if (image.kind === 'existing') {
        imageUrl = image.url
      }
      // 'empty' or 'cleared' → null

      advance('saving')

      const projectData = {
        ...data,
        website_url: data.website_url || null,
        github_url: data.github_url || null,
        image_url: imageUrl,
        video_url: data.video_url || null,
      }

      if (mode === 'edit' && projectId) {
        const { error } = await ProjectsService.updateProject(projectId, projectData)
        if (error) throw error
        showSuccess('Project updated successfully!', 'Your changes have been saved and are now live.')
      } else {
        const { error } = await ProjectsService.createProject({
          ...projectData,
          user_id: user.id
        })
        if (error) throw error
        showSuccess('Project submitted successfully!', 'Your project is now live on IlliniHunt!')

        // After a successful create, the new project's image is now persisted.
        // Reset the picker so any remaining `pending` File reference is dropped.
        setImage(imageUrl ? { kind: 'existing', url: imageUrl } : { kind: 'empty' })
      }

      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      setSubmitError(`${message} — your form is intact, please try again.`)
      handleFormError(
        error,
        `project ${mode === 'edit' ? 'update' : 'submission'}`,
        {
          stage: currentStage ?? 'pre-flight',
          mode,
          projectId: mode === 'edit' ? projectId : undefined,
          imageKind: image.kind,
          // For pending picks, log size/type/name so we can correlate failures
          // with file characteristics (e.g., specific MIME, very large source).
          imageType: image.kind === 'pending' ? image.file.type : undefined,
          imageSizeBytes: image.kind === 'pending' ? image.file.size : undefined,
          imageNameExt: image.kind === 'pending'
            ? image.file.name.split('.').pop()?.toLowerCase()
            : undefined,
          // Whether the user already had a server-stored image at submit time
          hadExistingImage: image.kind === 'existing' || image.kind === 'cleared',
        }
      )
    } finally {
      setIsSubmitting(false)
      setStage(null)
    }
  }

  const missingFields = Object.keys(errors) as (keyof ProjectFormData)[]
  const showMissingHint = submitCount > 0 && missingFields.length > 0 && !isSubmitting

  const submitLabel =
    stage ? STAGE_LABEL[stage] :
    mode === 'edit' ? 'Update Project' : 'Submit Project'

  return (
    <div className="max-w-2xl mx-auto p-6 pt-24 sm:pt-28">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-uiuc-blue mb-2">
          {mode === 'edit' ? 'Edit Your Project' : 'Submit Your Project'}
        </h1>
        <p className="text-gray-600">
          {mode === 'edit'
            ? 'Update your project details and share your latest improvements with the community!'
            : 'Share your amazing work with the Illinois community!'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Project Name *</Label>
          <Input
            id="name"
            placeholder="My Awesome Project"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline *</Label>
          <Input
            id="tagline"
            placeholder="A brief, catchy description of your project"
            {...register('tagline')}
          />
          {errors.tagline && (
            <p className="text-sm text-red-600">{errors.tagline.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">What problem does your project solve? *</Label>
          <p className="text-sm text-gray-600 mb-2">
            Choose the category that best describes what your project does, not just the technology used.
          </p>
          {loadingCategories ? (
            <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-uiuc-orange mr-2"></div>
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
              No categories available
            </div>
          ) : (
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={isSubmitting}
                >
                  <SelectTrigger aria-label="Category selection">
                    <SelectValue placeholder="Select the problem your project solves" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <CategoryIcon
                            iconName={category.icon}
                            className="w-4 h-4 flex-shrink-0"
                            fallback={category.name}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{category.name}</span>
                            {category.description && (
                              <span className="text-xs text-gray-500 truncate max-w-[250px]">
                                {category.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
          {errors.category_id && (
            <p className="text-sm text-red-600">{errors.category_id.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Tell us more about your project. What does it do? What problem does it solve? What technologies did you use?"
            rows={6}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Website URL */}
        <div className="space-y-2">
          <Label htmlFor="website_url">Website URL</Label>
          <Input
            id="website_url"
            type="url"
            placeholder="https://myproject.com"
            {...register('website_url')}
          />
          {errors.website_url && (
            <p className="text-sm text-red-600">{errors.website_url.message}</p>
          )}
        </div>

        {/* GitHub URL */}
        <div className="space-y-2">
          <Label htmlFor="github_url">GitHub URL (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            Only fill this if you want to make your repository publicly available. Leave blank if your code is private or not on GitHub.
          </p>
          <Input
            id="github_url"
            type="url"
            placeholder="https://github.com/username/repo"
            {...register('github_url')}
          />
          {errors.github_url && (
            <p className="text-sm text-red-600">{errors.github_url.message}</p>
          )}
        </div>

        {/* YouTube Video URL */}
        <div className="space-y-2">
          <Label htmlFor="video_url">YouTube Video (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            Add a YouTube demo or pitch video to showcase your project. Accepts YouTube or youtu.be links.
          </p>
          <Input
            id="video_url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            {...register('video_url')}
          />
          {errors.video_url && (
            <p className="text-sm text-red-600">{errors.video_url.message}</p>
          )}
        </div>

        {/* Image Upload */}
        <ImageUpload
          value={image}
          onChange={setImage}
          disabled={isSubmitting}
        />

        {/* Inline submit error — persistent, unlike a toast */}
        {submitError && (
          <div className="flex items-start space-x-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Missing-fields hint shown after the first failed submit attempt */}
        {showMissingHint && (
          <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
            Please complete: {missingFields.map(f => FIELD_LABEL[f]).join(', ')}.
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 items-center">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-uiuc-orange hover:bg-uiuc-orange/90"
          >
            {isSubmitting && (
              <span className="inline-block w-4 h-4 mr-2 align-middle border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {submitLabel}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
