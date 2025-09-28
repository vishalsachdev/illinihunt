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
  const [signingIn, setSigningIn] = useState(false)
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
    setSigningIn(true)
    setLocalError(null)
    
    // Add a timeout to prevent getting stuck
    const timeoutId = setTimeout(() => {
      setSigningIn(false)
      setLocalError('Sign-in timed out. Please try again or use the email option.')
    }, 10000) // 10 second timeout
    
    try {
      await signInWithGoogle()
      clearTimeout(timeoutId)
      handleClose()
    } catch (error) {
      clearTimeout(timeoutId)
      setLocalError(error instanceof Error ? error.message : 'Sign-in failed. Please try again.')
    } finally {
      setSigningIn(false)
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
          
          <p className="text-gray-600 mb-6">
            Sign in with your Illinois account to {actionRequired}.
          </p>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Choose your sign-in method:</h3>
          </div>
          
          <div className="space-y-6">
            {/* Google OAuth Option */}
            <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 transition-colors hover:border-uiuc-blue/30">
              <div className="text-center mb-3">
                <h4 className="font-medium text-gray-800 mb-1">Quick Sign In</h4>
                <p className="text-sm text-gray-600">Use your Illinois Google account</p>
              </div>
              <Button
                onClick={handleSignIn}
                disabled={signingIn}
                className="w-full bg-uiuc-blue hover:bg-uiuc-blue/90 text-white font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg flex items-center justify-center gap-3"
                size="lg"
              >
                {signingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
                    <span>Sign in with Google</span>
                  </>
                )}
              </Button>
            </div>

            {/* OR Divider */}
            <div className="flex items-center justify-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm font-medium text-gray-500 bg-white">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Magic Link Option */}
            <div className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 transition-colors hover:border-uiuc-blue/30">
              <div className="text-center mb-3">
                <h4 className="font-medium text-gray-800 mb-1">Email Magic Link</h4>
                <p className="text-sm text-gray-600">Get a secure link sent to your Illinois email</p>
              </div>
              <form onSubmit={handleEmailSignIn} className="space-y-3">
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
                  className="w-full bg-uiuc-blue hover:bg-uiuc-blue/90 text-white font-medium py-3 px-6 rounded-lg transition-all hover:shadow-lg"
                  size="lg"
                >
                  {sending
                    ? 'Sending...'
                    : cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : 'Send Magic Link'}
                </Button>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                {linkSent && (
                  <p className="text-sm text-green-600 text-center">Magic link sent! Check your email.</p>
                )}
              </form>
            </div>

            {onClose && (
              <Button
                variant="ghost"
                onClick={handleClose}
                className="w-full text-gray-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg transition-colors mt-4"
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
