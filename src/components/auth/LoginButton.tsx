import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export function LoginButton() {
  const { signInWithGoogle, loading } = useAuth()

  const handleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      // Login errors are handled by the auth hook
    }
  }

  return (
    <Button 
      onClick={handleLogin} 
      disabled={loading}
      className="bg-uiuc-orange hover:bg-uiuc-orange/90 text-white"
    >
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  )
}