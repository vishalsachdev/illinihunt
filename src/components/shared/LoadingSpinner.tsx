interface LoadingSpinnerProps {
  message?: string
  className?: string
}

export function LoadingSpinner({ message = 'Loading...', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4"></div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}
