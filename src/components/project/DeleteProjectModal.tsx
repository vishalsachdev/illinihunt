import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, AlertTriangle, Loader2 } from 'lucide-react'

interface DeleteProjectModalProps {
  projectName: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  loading?: boolean
}

export function DeleteProjectModal({ 
  projectName, 
  isOpen, 
  onClose, 
  onConfirm,
  loading = false
}: DeleteProjectModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('')
      setIsConfirming(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (confirmText !== 'DELETE' || isConfirming || loading) return
    
    setIsConfirming(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      // Error handling will be done by parent component
    } finally {
      setIsConfirming(false)
    }
  }

  const canConfirm = confirmText === 'DELETE' && !isConfirming && !loading

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={!isConfirming && !loading ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Delete Project
            </h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            disabled={isConfirming || loading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-gray-900 mb-2">
                Are you sure you want to delete <span className="font-semibold">"{projectName}"</span>?
              </p>
              <p className="text-sm text-gray-600 mb-4">
                This action cannot be undone. This will permanently delete the project and all associated data including votes, comments, and bookmarks.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-3">
                To confirm deletion, please type <span className="font-mono font-semibold bg-red-100 px-1 rounded">DELETE</span> in the box below:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="font-mono"
                disabled={isConfirming || loading}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isConfirming || loading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {isConfirming || loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Project'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}