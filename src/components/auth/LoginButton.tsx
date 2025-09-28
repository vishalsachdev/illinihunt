import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AuthPrompt } from '@/components/auth/AuthPrompt'
import { useAuth } from '@/hooks/useAuth'

export function LoginButton() {
  const { user, retryAuth } = useAuth()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  // Don't show the button if user is already authenticated
  if (user) {
    return null
  }

  const handleRetryAuth = async () => {
    setIsRetrying(true)
    try {
      await retryAuth()
    } catch (error) {
      console.error('Retry auth failed:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setShowPrompt(true)}
          disabled={isRetrying}
          className="bg-uiuc-orange hover:bg-uiuc-orange/90 text-white"
        >
          {isRetrying ? 'Retrying...' : 'Sign in'}
        </Button>
        {/* Add a small retry button if auth seems stuck */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRetryAuth}
          disabled={isRetrying}
          className="text-xs text-gray-500 hover:text-gray-700 px-2"
          title="Retry authentication if stuck"
        >
          {isRetrying ? '...' : '↻'}
        </Button>
      </div>
      {showPrompt && <AuthPrompt onClose={() => setShowPrompt(false)} />}
    </>
  )
}