import { createContext, useContext, ReactNode, useCallback } from 'react'
import { showToast, getErrorMessage } from '@/components/ui/toast'

interface ErrorContextType {
  // Handle different types of errors with appropriate UI feedback
  handleError: (error: unknown, context?: string, options?: {
    showToUser?: boolean
    retry?: () => void
    staff?: boolean
  }) => void
  
  // Handle network/service errors specifically
  handleServiceError: (error: unknown, operation: string, retry?: () => void) => void
  
  // Handle authentication errors
  handleAuthError: (error: unknown, customMessage?: string) => void
  
  // Handle form submission errors
  handleFormError: (error: unknown, formName?: string) => void
  
  // Show success message
  showSuccess: (message: string, description?: string) => void
  
  // Show info message
  showInfo: (message: string, description?: string) => void
}

const ErrorContext = createContext<ErrorContextType | null>(null)

export const useError = () => {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within ErrorProvider')
  }
  return context
}

interface ErrorProviderProps {
  children: ReactNode
}

export const ErrorProvider = ({ children }: ErrorProviderProps) => {
  const handleError = useCallback((
    error: unknown, 
    context: string = 'operation',
    options: {
      showToUser?: boolean
      retry?: () => void
      staff?: boolean
    } = {}
  ) => {
    const message = getErrorMessage(error)
    
    // Always log error for debugging
    console.error(`Error in ${context}:`, error)
    
    // Show to user unless explicitly disabled
    if (options.showToUser !== false) {
      showToast.error(`Failed to ${context}`, {
        description: message,
        debugInfo: import.meta.env.DEV ? JSON.stringify(error) : undefined,
        retry: options.retry,
        staff: options.staff,
      })
    }
  }, [])

  const handleServiceError = useCallback((
    error: unknown, 
    operation: string,
    retry?: () => void
  ) => {
    const message = getErrorMessage(error)
    console.error(`Service error during ${operation}:`, error)
    
    // Check if it's a network error
    if (message.toLowerCase().includes('network') || 
        message.toLowerCase().includes('connection') ||
        message.toLowerCase().includes('timeout')) {
      showToast.networkError(operation, retry)
    } else {
      showToast.error(`Failed to ${operation}`, {
        description: message,
        retry,
        debugInfo: import.meta.env.DEV ? JSON.stringify(error) : undefined,
      })
    }
  }, [])

  const handleAuthError = useCallback((
    error: unknown,
    customMessage?: string
  ) => {
    const message = getErrorMessage(error)
    console.error('Authentication error:', error)
    
    if (customMessage) {
      showToast.authError(customMessage)
    } else if (message.toLowerCase().includes('permission') || 
               message.toLowerCase().includes('unauthorized')) {
      showToast.authError('Permission denied')
    } else if (message.toLowerCase().includes('@illinois.edu')) {
      showToast.authError('Please use your @illinois.edu email address')
    } else {
      showToast.authError()
    }
  }, [])

  const handleFormError = useCallback((
    error: unknown,
    formName: string = 'form'
  ) => {
    const message = getErrorMessage(error)
    console.error(`Form error in ${formName}:`, error)
    
    showToast.error(`${formName} error`, {
      description: message,
      debugInfo: import.meta.env.DEV ? JSON.stringify(error) : undefined,
    })
  }, [])

  const showSuccess = useCallback((message: string, description?: string) => {
    showToast.success(message, description)
  }, [])

  const showInfo = useCallback((message: string, description?: string) => {
    showToast.info(message, description)
  }, [])

  const value: ErrorContextType = {
    handleError,
    handleServiceError,
    handleAuthError,
    handleFormError,
    showSuccess,
    showInfo,
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  )
}