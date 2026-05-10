import { useEffect, useRef, useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Upload, X, AlertCircle } from 'lucide-react'
import { RAW_INPUT_MAX_BYTES } from '@/lib/imageUpload'
import { captureFunnelEvent } from '@/lib/sentry'

/**
 * The image input is a *deferred* picker: it never uploads. The parent
 * form holds the chosen state and uploads on submit. This makes "image
 * uploaded" and "project submitted" the same atomic user action and
 * removes the entire class of "file in storage but no project row" bugs.
 */
export type ImagePickerValue =
  | { kind: 'empty' }
  | { kind: 'existing'; url: string }   // edit mode — original server URL
  | { kind: 'pending'; file: File }     // newly picked file, not yet uploaded
  | { kind: 'cleared' }                 // edit mode — original removed by user

interface ImagePickerProps {
  value: ImagePickerValue
  onChange: (next: ImagePickerValue) => void
  disabled?: boolean
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export function ImageUpload({ value, onChange, disabled }: ImagePickerProps) {
  const [dragOver, setDragOver] = useState(false)
  const [pickError, setPickError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manage object URL for pending File previews; revoke on change/unmount
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  useEffect(() => {
    if (value.kind === 'pending') {
      const url = URL.createObjectURL(value.file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl(null)
  }, [value])

  const validateAndPick = (file: File) => {
    setPickError(null)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setPickError('Please choose a JPG, PNG, WebP, or GIF.')
      captureFunnelEvent('image-pick-rejected', { reason: 'mime', mime: file.type, size: file.size })
      return
    }
    if (file.size > RAW_INPUT_MAX_BYTES) {
      const mb = Math.round(RAW_INPUT_MAX_BYTES / (1024 * 1024))
      setPickError(`Image is too large. Please choose a file under ${mb} MB — it will be compressed automatically when you submit.`)
      captureFunnelEvent('image-pick-rejected', { reason: 'size', mime: file.type, size: file.size })
      return
    }
    captureFunnelEvent('image-picked', { mime: file.type, size: file.size })
    onChange({ kind: 'pending', file })
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndPick(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      validateAndPick(file)
    } else {
      setPickError('Please drop a valid image file.')
    }
  }

  const handleRemove = () => {
    setPickError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (value.kind === 'existing') {
      // Edit mode: signal the server-stored image should be cleared on submit
      onChange({ kind: 'cleared' })
    } else {
      onChange({ kind: 'empty' })
    }
  }

  // Display URL: object URL for pending File, server URL for existing
  const displayUrl =
    value.kind === 'pending' ? previewUrl :
    value.kind === 'existing' ? value.url :
    null

  const isPending = value.kind === 'pending'

  return (
    <div className="space-y-2">
      <Label>Project Screenshot/Logo</Label>

      {displayUrl ? (
        <div className="relative">
          <div className="border rounded-lg overflow-hidden">
            <img
              src={displayUrl}
              alt="Project preview"
              className="w-full h-48 object-cover"
            />
          </div>
          {isPending && (
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs rounded px-2 py-1">
              Will upload when you submit
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-uiuc-orange bg-orange-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
          onClick={!disabled ? () => fileInputRef.current?.click() : undefined}
        >
          <div className="flex flex-col items-center space-y-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Click to choose an image, or drag one here
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WebP or GIF (large images are compressed automatically when you submit)
              </p>
            </div>
          </div>
        </div>
      )}

      {pickError && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{pickError}</span>
        </div>
      )}

      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}
