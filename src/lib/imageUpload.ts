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
      if (import.meta.env.DEV) {
        console.error('Storage upload error:', error)
      }
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
    if (import.meta.env.DEV) {
      console.error('Image upload error:', err)
    }
    return {
      url: null,
      error: 'An unexpected error occurred while uploading the image'
    }
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
    let objectUrl: string | null = null

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }

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
            cleanup()
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          file.type,
          quality
        )
      } catch (err) {
        clearTimeout(timeout)
        cleanup()
        resolve(file)
      }
    }

    img.onerror = () => {
      clearTimeout(timeout)
      cleanup()
      resolve(file)
    }

    try {
      objectUrl = URL.createObjectURL(file)
      img.src = objectUrl
    } catch (err) {
      clearTimeout(timeout)
      cleanup()
      resolve(file)
    }
  })
}