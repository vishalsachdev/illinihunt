import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AuthPrompt } from '@/components/auth/AuthPrompt'
import { useAuth } from '@/hooks/useAuth'

export function LoginButton() {
  const { loading } = useAuth()
  const [showPrompt, setShowPrompt] = useState(false)

  return (
    <>
      <Button
        onClick={() => setShowPrompt(true)}
        disabled={loading}
        className="bg-uiuc-orange hover:bg-uiuc-orange/90 text-white"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
      {showPrompt && <AuthPrompt onClose={() => setShowPrompt(false)} />}
    </>
  )
}