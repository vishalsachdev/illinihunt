import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { Lock, X } from 'lucide-react'

interface AuthPromptProps {
  actionRequired?: string
  onClose?: () => void
}

export function AuthPrompt({ actionRequired = 'vote and submit projects', onClose }: AuthPromptProps) {
  const { signInWithGoogle, signInWithEmail } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [linkSent, setLinkSent] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    // Trigger the animation after the component mounts
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 50)
    
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    // Wait for the animation to complete before calling onClose
    if (onClose) {
      setTimeout(onClose, 300)
    }
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
      handleClose()
    } catch (error) {
      // Sign in errors are handled by the auth hook
    }
  }

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await signInWithEmail(email)
      setLinkSent(true)
    } catch (error) {
      // errors handled by auth hook
    } finally {
      setSending(false)
    }
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{
        transition: 'opacity 300ms ease-out, backdrop-filter 300ms ease-out',
        backdropFilter: isVisible ? 'blur(4px)' : 'blur(0)'
      }}
    >
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        style={{
          opacity: isVisible ? 1 : 0
        }}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        style={{
          transition: 'opacity 300ms ease-out, transform 300ms cubic-bezier(0.18, 0.89, 0.32, 1.28)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {onClose && (
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        )}
        
        <div className="p-8 text-center">
          {/* Animated icon */}
          <div className="mx-auto w-20 h-20 bg-uiuc-orange/10 rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-uiuc-orange/20 animate-ping"></div>
            <Lock className="w-10 h-10 text-uiuc-orange" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">@illinois.edu Authentication Required</h2>
          
          <p className="text-gray-600 mb-8">
            Sign in with your Illinois account to {actionRequired}.
          </p>
          
          <div className="space-y-4">
            <Button
              onClick={handleSignIn}
              className="w-full bg-uiuc-blue hover:bg-uiuc-blue/90 text-white font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg flex items-center justify-center gap-3"
              size="lg"
            >
              <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
              <span>Continue with Illinois Email</span>
            </Button>

            <form onSubmit={handleEmailSignIn} className="flex gap-2">
              <Input
                type="email"
                placeholder="you@illinois.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={sending} className="bg-uiuc-blue hover:bg-uiuc-blue/90 text-white">
                {sending ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </form>

            {linkSent && (
              <p className="text-sm text-green-600">Magic link sent! Check your email.</p>
            )}

            {onClose && (
              <Button
                variant="ghost"
                onClick={handleClose}
                className="w-full text-gray-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg transition-colors"
                size="lg"
              >
                Maybe later
              </Button>
            )}
          </div>
          
          <p className="mt-6 text-sm text-gray-500">
            Your information will only be used to verify your Illinois affiliation.
          </p>
        </div>
      </div>
    </div>
  )
}
