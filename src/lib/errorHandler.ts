/**
 * Service result type for consistent error handling across the application
 */
export interface ServiceResult<T> {
  data: T | null
  error: string | null
}

/**
 * Error handler service for consistent error management and logging
 */
export class ErrorHandler {
  /**
   * Wraps service operations with consistent error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<ServiceResult<T>> {
    try {
      const data = await operation()
      return { data, error: null }
    } catch (error) {
      console.error(`${context}:`, error)
      
      // Map specific Supabase errors to user-friendly messages
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        
        if (message.includes('duplicate key')) {
          return { data: null, error: 'This item already exists' }
        }
        
        if (message.includes('foreign key')) {
          return { data: null, error: 'Referenced item not found' }
        }
        
        if (message.includes('permission denied') || message.includes('rls')) {
          return { data: null, error: 'You do not have permission for this action' }
        }
        
        if (message.includes('network') || message.includes('connection')) {
          return { data: null, error: 'Network error. Please check your connection.' }
        }
        
        if (message.includes('timeout')) {
          return { data: null, error: 'Request timed out. Please try again.' }
        }
        
        if (message.includes('rate limit')) {
          return { data: null, error: 'Too many requests. Please wait a moment and try again.' }
        }
        
        // In development, show actual error for debugging
        if (import.meta.env.DEV) {
          return { data: null, error: error.message }
        }
      }
      
      // Generic error message for production
      return { 
        data: null, 
        error: 'An unexpected error occurred. Please try again.'
      }
    }
  }

  /**
   * Logs errors without exposing them to users
   */
  static logError(context: string, error: unknown): void {
    console.error(`${context}:`, error)
    
    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, etc.
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error, { tags: { context } })
    }
  }

  /**
   * Creates a user-friendly error message from a service result
   */
  static getUserMessage<T>(result: ServiceResult<T>): string {
    return result.error || 'Operation completed successfully'
  }

  /**
   * Checks if a service result indicates success
   */
  static isSuccess<T>(result: ServiceResult<T>): result is ServiceResult<T> & { data: T } {
    return result.error === null && result.data !== null
  }

  /**
   * Handles form validation errors consistently
   */
  static handleFormError(error: unknown, fieldName?: string): string {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      if (message.includes('required') || message.includes('missing')) {
        return fieldName ? `${fieldName} is required` : 'Required field is missing'
      }
      
      if (message.includes('invalid') || message.includes('format')) {
        return fieldName ? `${fieldName} format is invalid` : 'Invalid format'
      }
      
      if (message.includes('too long')) {
        return fieldName ? `${fieldName} is too long` : 'Input is too long'
      }
      
      if (message.includes('too short')) {
        return fieldName ? `${fieldName} is too short` : 'Input is too short'
      }
    }
    
    return 'Invalid input. Please check your information and try again.'
  }
}