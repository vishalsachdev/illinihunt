import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters'),
  
  tagline: z.string()
    .min(1, 'Tagline is required')
    .max(120, 'Tagline must be less than 120 characters'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  
  website_url: z.string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  
  github_url: z.string()
    .url('Please enter a valid GitHub URL')
    .optional()
    .or(z.literal('')),

  video_url: z.string()
    .url('Please enter a valid YouTube URL')
    .refine(
      (url) => {
        if (!url) return true // Optional field
        try {
          const urlObj = new URL(url)
          const validDomains = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com']
          return validDomains.includes(urlObj.hostname)
        } catch {
          return false
        }
      },
      { message: 'Please enter a valid YouTube URL (youtube.com or youtu.be)' }
    )
    .optional()
    .or(z.literal('')),

  category_id: z.string()
    .min(1, 'Please select a category'),

  image_url: z.string()
    .optional()
})

export type ProjectFormData = z.infer<typeof projectSchema>