import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/useAuth'
import { ProjectsService, CategoriesService } from '@/lib/database'
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

type Category = Database['public']['Tables']['categories']['Row']

interface ProjectFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema)
  })


  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const { data, error } = await CategoriesService.getCategories()
      if (error) {
        throw error
      }
      setCategories(data || [])
    } catch (error) {
      // Categories will remain empty, form will still be functional
    }
  }

  const onSubmit = async (data: ProjectFormData) => {
    if (!user) {
      alert('You must be signed in to submit a project')
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

      const { error } = await ProjectsService.createProject(projectData)
      if (error) throw error

      alert('Project submitted successfully!')
      onSuccess?.()
    } catch (error) {
      alert('Failed to submit project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 pt-24 sm:pt-28">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-uiuc-blue mb-2">Submit Your Project</h1>
        <p className="text-gray-600">Share your amazing work with the Illinois community!</p>
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
          <Select onValueChange={(value) => setValue('category_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select the problem your project solves" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <CategoryIcon 
                      iconName={category.icon} 
                      className="w-4 h-4" 
                      fallback={category.name}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{category.name}</span>
                      {category.description && (
                        <span className="text-xs text-gray-500 line-clamp-1">
                          {category.description}
                        </span>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label htmlFor="github_url">GitHub URL</Label>
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
            {isSubmitting ? 'Submitting...' : 'Submit Project'}
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