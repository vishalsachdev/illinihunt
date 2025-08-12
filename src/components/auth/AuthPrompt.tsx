import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { Lock, X } from 'lucide-react'

const ILLINOIS_DOMAIN = 'illinois.edu'

function isValidIllinoisEmail(email: string) {
  return email.toLowerCase().endsWith(`@${ILLINOIS_DOMAIN}`)
}

interface AuthPromptProps {
  actionRequired?: string
  onClose?: () => void
}

export function AuthPrompt({ actionRequired = 'vote and submit projects', onClose }: AuthPromptProps) {
  const { signInWithGoogle, signInWithEmail, error: authError } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [emailValid, setEmailValid] = useState(true)
  const [linkSent, setLinkSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    // Trigger the animation after the component mounts
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const error = localError || authError

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    setEmail(value)
    const valid = isValidIllinoisEmail(value)
    setEmailValid(valid || value === '')
    if (!valid && value) {
      setLocalError(`Only @${ILLINOIS_DOMAIN} email addresses are allowed`)
    } else {
      setLocalError(null)
    }
  }

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
    setLocalError(null)
    if (!isValidIllinoisEmail(email)) {
      setEmailValid(false)
      setLocalError(`Only @${ILLINOIS_DOMAIN} email addresses are allowed`)
      return
    }
    if (cooldown > 0) {
      setLocalError('Please wait before requesting another link')
      return
    }
    setSending(true)
    try {
      await signInWithEmail(email)
      setLinkSent(true)
      setCooldown(30)
    } catch (error: unknown) {
      setLocalError(error instanceof Error ? error.message : 'Failed to send magic link')
    } finally {
      setSending(false)
    }
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-4 transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300 ease-out ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}`}
        style={{
          transition: 'opacity 300ms ease-out, transform 300ms cubic-bezier(0.18, 0.89, 0.32, 1.28)',
          marginTop: 'max(1rem, env(safe-area-inset-top, 0px))'
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

            <form onSubmit={handleEmailSignIn} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="you@illinois.edu"
                  value={email}
                  onChange={handleEmailChange}
                  className={!emailValid && email ? 'border-red-500' : ''}
                  required
                />
                <Button
                  type="submit"
                  disabled={sending || !emailValid || cooldown > 0}
                  className="bg-uiuc-blue hover:bg-uiuc-blue/90 text-white"
                >
                  {sending
                    ? 'Sending...'
                    : cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : 'Send Magic Link'}
                </Button>
              </div>
              {error && <p className="text-sm text-red-600 text-left">{error}</p>}
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
