import { useState } from 'react'
import { FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useAuthPrompt } from '@/contexts/AuthPromptContext'
import { AddToCollectionModal } from './AddToCollectionModal'
import { cn } from '@/lib/utils'

interface AddToCollectionButtonProps {
  projectId: string
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  showLabel?: boolean
}

export function AddToCollectionButton({ 
  projectId, 
  className,
  size = 'sm',
  variant = 'ghost',
  showLabel = false
}: AddToCollectionButtonProps) {
  const { user } = useAuth()
  const { showAuthPrompt } = useAuthPrompt()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    if (!user) {
      showAuthPrompt('add projects to collections')
      return
    }

    setIsModalOpen(true)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={cn(
          'transition-all duration-200',
          'text-gray-600 hover:text-uiuc-orange',
          className
        )}
        title="Add to collection"
      >
        <FolderPlus 
          className={cn(
            size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
            showLabel && 'mr-2'
          )} 
        />
        {showLabel && (
          <span className="text-xs">
            Add to Collection
          </span>
        )}
      </Button>

      <AddToCollectionModal
        projectId={projectId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Could add success feedback here
        }}
      />
    </>
  )
}