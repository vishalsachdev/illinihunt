import { supabase } from './supabase'

export interface ImageUploadResult {
  url: string | null
  error: string | null
}

const UPLOAD_TIMEOUT_MS = 30000
const COMPRESSION_TIMEOUT_MS = 5000

// Hard cap matching the storage bucket's file_size_limit. compressImage
// is expected to bring large source files under this; this guard exists
// so a bucket rejection turns into a clear UI error instead of a 4xx.
const BUCKET_MAX_BYTES = 5 * 1024 * 1024

// Permissive cap on the raw file before compression. Most phone screenshots
// and camera photos land between 4–15 MB; canvas can re-encode them down
// to a few hundred KB. We cap at 25 MB to avoid canvas OOM on huge sources.
export const RAW_INPUT_MAX_BYTES = 25 * 1024 * 1024

/**
 * Upload an image file to Supabase Storage. Expects the caller to have
 * already run the file through compressImage; this function only checks
 * the post-compression payload against the bucket's 5 MB limit.
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

    // Final guard: the storage bucket rejects > 5 MB. compressImage should
    // have shrunk the file already; if we still exceed the cap, the encoder
    // didn't help (e.g., browser without WebP encode support) and the user
    // needs a smaller source.
    if (file.size > BUCKET_MAX_BYTES) {
      return {
        url: null,
        error: 'Image is too large to upload after compression. Please use a smaller image (under 5 MB after compression).'
      }
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload to Supabase Storage with a timeout to prevent infinite hangs
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined
    const uploadTimeout = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error('Upload timed out. Please check your connection and try again.')),
        UPLOAD_TIMEOUT_MS
      )
    })

    const uploadRequest = supabase.storage
      .from('project-images')
      .upload(fileName, file, {
        cacheControl: '3600', // Cache for 1 hour
        upsert: false
      })

    let result: Awaited<typeof uploadRequest>
    try {
      result = await Promise.race([uploadRequest, uploadTimeout])
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle)
    }
    const { data, error } = result

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
      error: err instanceof Error ? err.message : 'An unexpected error occurred while uploading the image'
    }
  }
}

/**
 * Compress image file before upload (optional optimization)
 */
export function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    // Add timeout to prevent hanging (ample time for canvas operations)
    const timeout = setTimeout(() => {
      resolve(file) // Return original file as fallback
    }, COMPRESSION_TIMEOUT_MS)

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
        // Calculate new dimensions — only downscale, never upscale
        const ratio = Math.min(1, maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        // Draw onto canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Re-encode as WebP. WebP supports transparency (preserves logos)
        // and applies the quality argument to all sources, unlike PNG where
        // the quality arg is ignored and the output stays uncompressed.
        // GIFs are passed through unchanged so animation isn't lost.
        if (file.type === 'image/gif') {
          clearTimeout(timeout)
          cleanup()
          resolve(file)
          return
        }

        const outputType = 'image/webp'
        const outputName = file.name.replace(/\.[^.]+$/, '') + '.webp'

        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout)
            cleanup()
            if (blob && blob.size < file.size) {
              resolve(new File([blob], outputName, {
                type: outputType,
                lastModified: Date.now()
              }))
            } else {
              // WebP encode unavailable or made the file larger — keep original
              resolve(file)
            }
          },
          outputType,
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