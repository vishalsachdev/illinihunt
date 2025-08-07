import { toast } from 'sonner'
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'

// Enhanced toast functions with consistent styling and debugging info
export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: <CheckCircle className="w-4 h-4 text-green-600" />,
      classNames: {
        toast: 'border-l-4 border-l-green-500',
      },
    })
  },
  
  error: (message: string, options?: { 
    description?: string
    debugInfo?: string
    retry?: () => void
    staff?: boolean
  }) => {
    const isStaff = options?.staff || import.meta.env.DEV
    
    toast.error(message, {
      description: options?.description || 'Please try again or contact support if the issue persists.',
      icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
      classNames: {
        toast: 'border-l-4 border-l-red-500',
      },
      action: options?.retry ? {
        label: 'Retry',
        onClick: options.retry,
      } : undefined,
      // Show debug info for staff in development
      ...(isStaff && options?.debugInfo && {
        description: `${options.description || 'Operation failed.'}\n\n🔧 Debug Info: ${options.debugInfo}`,
      }),
      duration: 6000, // Longer duration for error messages
    })
  },
  
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
      classNames: {
        toast: 'border-l-4 border-l-yellow-500',
      },
    })
  },
  
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: <Info className="w-4 h-4 text-blue-600" />,
      classNames: {
        toast: 'border-l-4 border-l-blue-500',
      },
    })
  },
  
  // Specialized toast for network errors with retry functionality
  networkError: (operation: string, retry?: () => void) => {
    toast.error('Connection Error', {
      description: `Failed to ${operation}. Check your connection and try again.`,
      icon: <X className="w-4 h-4 text-red-600" />,
      classNames: {
        toast: 'border-l-4 border-l-red-500',
      },
      action: retry ? {
        label: 'Retry',
        onClick: retry,
      } : undefined,
      duration: 8000,
    })
  },
  
  // Specialized toast for auth errors
  authError: (message: string = 'Authentication required') => {
    toast.error(message, {
      description: 'Please sign in to continue.',
      icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
      classNames: {
        toast: 'border-l-4 border-l-red-500',
      },
      duration: 5000,
    })
  },
  
  // Loading toast that can be updated
  loading: (message: string, id?: string) => {
    return toast.loading(message, { id })
  },
  
  // Dismiss specific toast
  dismiss: (id?: string) => {
    if (id) {
      toast.dismiss(id)
    } else {
      toast.dismiss()
    }
  },
}

// Helper function to extract error message from various error types
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message)
  }
  return 'An unexpected error occurred'
}

// Helper function to show form errors
export const showFormError = (error: unknown, context: string = 'form submission') => {
  const message = getErrorMessage(error)
  
  showToast.error('Form Error', {
    description: message,
    debugInfo: import.meta.env.DEV ? `Context: ${context}` : undefined,
  })
}