import { supabase } from './supabase'

export interface ImageUploadResult {
  url: string | null
  error: string | null
}

/**
 * Check if the project-images bucket exists
 */
async function checkBucketExists(): Promise<boolean> {
  console.log('[checkBucketExists] Starting bucket check...')
  try {
    console.log('[checkBucketExists] Calling supabase.storage.listBuckets()...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    console.log('[checkBucketExists] Response received. Error:', listError)
    console.log('[checkBucketExists] Buckets data:', buckets)
    
    if (listError) {
      console.error('[checkBucketExists] Failed to list buckets:', listError)
      return false
    }

    if (!buckets) {
      console.error('[checkBucketExists] No buckets data returned (null/undefined)')
      return false
    }

    console.log('[checkBucketExists] Available buckets:', buckets.map(b => ({ name: b.name, id: b.id, public: b.public })))
    const hasProjectImages = buckets.some(b => b.name === 'project-images')
    console.log('[checkBucketExists] Has project-images bucket:', hasProjectImages)
    return hasProjectImages
  } catch (err) {
    console.error('[checkBucketExists] Exception caught:', err)
    return false
  }
}

/**
 * Upload an image file to Supabase Storage
 */
export async function uploadProjectImage(file: File, userId: string): Promise<ImageUploadResult> {
  console.log('[uploadProjectImage] Starting upload for:', file.name, 'User:', userId)
  
  try {
    // Validate file type
    console.log('[uploadProjectImage] Validating file type:', file.type)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      console.log('[uploadProjectImage] Invalid file type')
      return {
        url: null,
        error: 'Please upload a valid image file (JPG, PNG, WebP, or GIF)'
      }
    }

    // Validate file size (5MB max)
    console.log('[uploadProjectImage] Validating file size:', file.size)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      console.log('[uploadProjectImage] File too large')
      return {
        url: null,
        error: 'Image must be smaller than 5MB'
      }
    }

    // Skip bucket check and try direct upload
    console.log('[uploadProjectImage] Skipping bucket check, attempting direct upload...')

    // Create unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload to Supabase Storage
    console.log('Attempting to upload file:', fileName)
    const { data, error } = await supabase.storage
      .from('project-images')
      .upload(fileName, file, {
        cacheControl: '3600', // Cache for 1 hour
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      // More specific error handling
      if (error.message.includes('not found') || error.message.includes('bucket')) {
        return {
          url: null,
          error: 'Storage bucket not configured. Please contact support.'
        }
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
    console.log('[compressImage] Starting compression for:', file.name, file.size)
    
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.error('[compressImage] Compression timed out after 30 seconds')
      resolve(file) // Return original file as fallback
    }, 30000)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      console.error('[compressImage] Could not get canvas context')
      clearTimeout(timeout)
      resolve(file)
      return
    }
    
    const img = new Image()

    img.onload = () => {
      console.log('[compressImage] Image loaded:', img.width, 'x', img.height)
      
      try {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        console.log('[compressImage] New dimensions:', canvas.width, 'x', canvas.height)

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
              console.log('[compressImage] Compression successful:', blob.size)
              resolve(compressedFile)
            } else {
              console.warn('[compressImage] No blob created, using original file')
              resolve(file) // Fallback to original file
            }
          },
          file.type,
          quality
        )
      } catch (err) {
        console.error('[compressImage] Error during compression:', err)
        clearTimeout(timeout)
        resolve(file)
      }
    }

    img.onerror = (err) => {
      console.error('[compressImage] Image load error:', err)
      clearTimeout(timeout)
      resolve(file) // Use original file if compression fails
    }

    try {
      img.src = URL.createObjectURL(file)
      console.log('[compressImage] Set image source')
    } catch (err) {
      console.error('[compressImage] Error creating object URL:', err)
      clearTimeout(timeout)
      resolve(file)
    }
  })
}