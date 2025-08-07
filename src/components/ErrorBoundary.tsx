import { Component, ReactNode } from 'react'
import { AlertTriangle, Copy, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: { componentStack: string } | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return { 
      hasError: true, 
      error, 
      errorInfo: null,
      errorId 
    }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Enhanced logging for debugging
    console.group('🚨 React Error Boundary')
    console.error('Error ID:', this.state.errorId)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Props:', this.props)
    console.error('User Agent:', navigator.userAgent)
    console.error('URL:', window.location.href)
    console.error('Timestamp:', new Date().toISOString())
    console.groupEnd()
    
    this.setState({ errorInfo })
    
    // In production, you might want to send this to an error tracking service
    if (import.meta.env.PROD) {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, {
      //   errorId: this.state.errorId,
      //   componentStack: errorInfo.componentStack,
      //   url: window.location.href,
      //   userAgent: navigator.userAgent
      // })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null })
    window.location.href = '/'
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null })
  }

  copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }
    
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => alert('Error details copied to clipboard!'))
      .catch(() => console.log('Error details:', errorDetails))
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-lg w-full text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We encountered an unexpected error. The development team has been notified.
            </p>
            
            {this.state.errorId && (
              <div className="bg-gray-50 border rounded-lg p-3 mb-4 text-sm">
                <p className="text-gray-600">Error ID: <code className="font-mono text-gray-800">{this.state.errorId}</code></p>
                <p className="text-xs text-gray-500 mt-1">Reference this ID when reporting the issue</p>
              </div>
            )}
            
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                <h3 className="font-semibold text-red-800 mb-2 text-sm">Development Debug Info:</h3>
                <p className="text-xs font-mono text-red-700 mb-2">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-red-600 hover:text-red-800">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex gap-2 justify-center flex-wrap">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
              <Button 
                onClick={this.handleReset}
                className="bg-uiuc-orange hover:bg-uiuc-orange/90 flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
              {import.meta.env.DEV && (
                <Button 
                  onClick={this.copyErrorDetails}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Copy className="w-3 h-3" />
                  Copy Error
                </Button>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}