import { useState, useEffect } from 'react'
import { X, AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface DeleteProjectModalProps {
  projectName: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isDeleting?: boolean
}

export function DeleteProjectModal({
  projectName,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false
}: DeleteProjectModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isValid, setIsValid] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('')
      setIsValid(false)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Validate confirmation text
  useEffect(() => {
    setIsValid(confirmText === 'DELETE')
  }, [confirmText])

  const handleConfirm = async () => {
    if (!isValid || isDeleting) return
    await onConfirm()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid && !isDeleting) {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={!isDeleting ? onClose : undefined}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Delete Project
            </h2>
          </div>
          {!isDeleting && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete <span className="font-semibold">"{projectName}"</span>?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete the project and remove all associated data including:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-4 pl-4">
              <li>• All upvotes and user engagement</li>
              <li>• All comments and discussions</li>
              <li>• All bookmarks and collections</li>
              <li>• Project images and metadata</li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-mono bg-gray-100 px-1 rounded">DELETE</span> to confirm:
            </label>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={isDeleting}
              className={cn(
                "font-mono",
                isValid && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isValid || isDeleting}
              className="min-w-[120px]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Forever
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}