import { supabase } from './supabase'

export interface ImageUploadResult {
  url: string | null
  error: string | null
}


/**
 * Upload an image file to Supabase Storage
 */
export async function uploadProjectImage(file: File, userId: string): Promise<ImageUploadResult> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return {
        url: null,
        error: 'Please upload a valid image file (JPG, PNG, WebP, or GIF)'
      }
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return {
        url: null,
        error: 'Image must be smaller than 5MB'
      }
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('project-images')
      .upload(fileName, file, {
        cacheControl: '3600', // Cache for 1 hour
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return {
        url: null,
        error: `Upload failed: ${error.message}`
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-images')
      .getPublicUrl(data.path)

    return {
      url: publicUrl,
      error: null
    }
  } catch (err) {
    console.error('Image upload error:', err)
    return {
      url: null,
      error: 'An unexpected error occurred while uploading the image'
    }
  }
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteProjectImage(imageUrl: string): Promise<{ error: string | null }> {
  try {
    // Extract path from public URL
    const url = new URL(imageUrl)
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/project-images\/(.+)$/)
    
    if (!pathMatch) {
      return { error: 'Invalid image URL' }
    }

    const filePath = pathMatch[1]

    const { error } = await supabase.storage
      .from('project-images')
      .remove([filePath])

    if (error) {
      console.error('Storage delete error:', error)
      return { error: 'Failed to delete image' }
    }

    return { error: null }
  } catch (err) {
    console.error('Image delete error:', err)
    return { error: 'An unexpected error occurred while deleting the image' }
  }
}

/**
 * Compress image file before upload (optional optimization)
 */
export function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      resolve(file) // Return original file as fallback
    }, 30000)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      clearTimeout(timeout)
      resolve(file)
      return
    }
    
    const img = new Image()

    img.onload = () => {
      try {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        // Draw compressed image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Convert to blob and create new file
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout)
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file) // Fallback to original file
            }
          },
          file.type,
          quality
        )
      } catch (err) {
        clearTimeout(timeout)
        resolve(file)
      }
    }

    img.onerror = () => {
      clearTimeout(timeout)
      resolve(file) // Use original file if compression fails
    }

    try {
      img.src = URL.createObjectURL(file)
    } catch (err) {
      clearTimeout(timeout)
      resolve(file)
    }
  })
}