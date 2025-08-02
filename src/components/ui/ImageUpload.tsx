import { useState, useRef } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Upload, X, AlertCircle } from 'lucide-react'
import { uploadProjectImage, compressImage, type ImageUploadResult } from '@/lib/imageUpload'
import { useAuth } from '@/hooks/useAuth'

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  onImageRemoved: () => void
  currentImageUrl?: string
  disabled?: boolean
}

export function ImageUpload({ 
  onImageUploaded, 
  onImageRemoved, 
  currentImageUrl, 
  disabled 
}: ImageUploadProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    console.log('[ImageUpload] Starting file selection:', file.name, file.type, file.size)
    
    if (!user) {
      console.log('[ImageUpload] No user found')
      setError('You must be logged in to upload images')
      return
    }

    console.log('[ImageUpload] User found, starting upload process')
    setUploading(true)
    setError(null)

    try {
      console.log('[ImageUpload] Starting image compression...')
      // Compress large images
      const compressedFile = await compressImage(file)
      console.log('[ImageUpload] Compression complete:', compressedFile.size)
      
      console.log('[ImageUpload] Starting Supabase upload...')
      // Upload to Supabase
      const result: ImageUploadResult = await uploadProjectImage(compressedFile, user.id)
      console.log('[ImageUpload] Upload result:', result)
      
      if (result.error) {
        console.error('[ImageUpload] Upload error:', result.error)
        setError(result.error)
      } else if (result.url) {
        console.log('[ImageUpload] Upload successful:', result.url)
        onImageUploaded(result.url)
      } else {
        console.error('[ImageUpload] No URL or error returned')
        setError('Upload completed but no URL returned')
      }
    } catch (err) {
      console.error('[ImageUpload] Unexpected error:', err)
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      console.log('[ImageUpload] Setting uploading to false')
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    } else {
      setError('Please drop a valid image file')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    onImageRemoved()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label>Project Screenshot/Logo</Label>
      
      {currentImageUrl ? (
        // Show current image with remove option
        <div className="relative">
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={currentImageUrl} 
              alt="Project preview" 
              className="w-full h-48 object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeImage}
            disabled={disabled || uploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        // Show upload area
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-uiuc-orange bg-orange-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!disabled ? openFileDialog : undefined}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange"></div>
              <p className="text-sm text-gray-600">Uploading image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP or GIF (max 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden file input */}
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
      />

      <p className="text-xs text-gray-500">
        Your image will be automatically compressed and optimized for web display.
      </p>
    </div>
  )
}