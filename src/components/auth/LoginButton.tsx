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
          size="sm"
          className="bg-neon-orange hover:bg-neon-orange/90 text-white shadow-lg shadow-neon-orange/30 h-10 px-6 font-semibold transition-all duration-300 hover:scale-105"
        >
          {isRetrying ? 'Retrying...' : 'Sign in'}
        </Button>
        {/* Add a small retry button if auth seems stuck */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRetryAuth}
          disabled={isRetrying}
          className="text-xs text-slate-400 hover:text-white px-2 h-10"
          title="Retry authentication if stuck"
        >
          {isRetrying ? '...' : '↻'}
        </Button>
      </div>
      {showPrompt && <AuthPrompt onClose={() => setShowPrompt(false)} />}
    </>
  )
}