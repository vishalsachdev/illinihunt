import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface PageErrorProps {
  title?: string
  message?: string
  onRetry?: () => void
  onBack?: () => void
  backLabel?: string
}

export function PageError({
  title = 'Something went wrong',
  message = 'An error occurred while loading this page.',
  onRetry,
  onBack,
  backLabel = 'Go Back'
}: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">{message}</p>
      <div className="flex gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
        )}
        {onBack && (
          <Button onClick={onBack} variant="outline">
            {backLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
