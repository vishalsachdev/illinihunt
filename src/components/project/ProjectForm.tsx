import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { useError } from '@/contexts/ErrorContext'
import { ProjectsService } from '@/lib/database'
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
import { ImageUpload } from '@/components/ui/ImageUpload'
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

export function ProjectForm({ mode = 'create', projectId, initialData, onSuccess, onCancel }: ProjectFormProps) {
  const { user } = useAuth()
  const { categories, loading: loadingCategories } = useCategories()
  const { handleFormError, handleAuthError, showSuccess } = useError()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
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
        github_url: initialData.github_url || ''
      })
      setImageUrl(initialData.image_url || '')
    }
  }, [mode, initialData, reset])

  const onSubmit = async (data: ProjectFormData) => {
    if (!user) {
      handleAuthError('You must be signed in to submit a project')
      return
    }

    setIsSubmitting(true)
    
    try {
      const projectData = {
        ...data,
        user_id: user.id,
        website_url: data.website_url || null,
        github_url: data.github_url || null,
        image_url: imageUrl || null,
      }

      if (mode === 'edit' && projectId) {
        const { error } = await ProjectsService.updateProject(projectId, projectData)
        if (error) throw error
        showSuccess('Project updated successfully!', 'Your changes have been saved and are now live.')
      } else {
        const { error } = await ProjectsService.createProject(projectData)
        if (error) throw error
        showSuccess('Project submitted successfully!', 'Your project is now live on IlliniHunt!')
      }

      onSuccess?.()
    } catch (error) {
      handleFormError(error, `project ${mode === 'edit' ? 'update' : 'submission'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

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
          onImageUploaded={setImageUrl}
          onImageRemoved={() => setImageUrl('')}
          currentImageUrl={imageUrl}
          disabled={isSubmitting}
        />

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-uiuc-orange hover:bg-uiuc-orange/90"
          >
            {isSubmitting 
              ? (mode === 'edit' ? 'Updating...' : 'Submitting...') 
              : (mode === 'edit' ? 'Update Project' : 'Submit Project')
            }
          </Button>
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}