import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  // Check if we potentially have a session to minimize loading flash
  const hasStoredSession = typeof window !== 'undefined' && 
    window.localStorage.getItem('illinihunt-auth') !== null

  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: !hasStoredSession, // If no stored session, we know we need to show loading
    error: null
  })

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    // Get initial session
    const initializeAuth = async () => {
      // Set a timeout to prevent indefinite loading
      timeoutId = setTimeout(() => {
        if (mounted && state.loading) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Authentication check timed out. Please refresh the page.' 
          }))
        }
      }, 5000) // 5 second timeout

      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        if (!mounted) return
        
        if (error) {
          setState(prev => ({ ...prev, error: error.message, loading: false }))
          return
        }

        if (session?.user) {
          // Set session state
          setState(prev => ({ 
            ...prev, 
            user: session.user, 
            session, 
            loading: false
          }))
          
          // Load profile asynchronously without blocking UI
          loadUserProfile(session.user, session).catch(err => {
            console.error('Failed to load user profile:', err)
            // Don't reset loading state - user is still authenticated
          })
        } else {
          setState(prev => ({ ...prev, loading: false, user: null, session: null }))
        }
      } catch (err) {
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        if (!mounted) return
        setState(prev => ({ 
          ...prev, 
          error: err instanceof Error ? err.message : 'Failed to initialize auth',
          loading: false 
        }))
      }
    }

    const loadUserProfile = async (user: User, _session: Session) => {
      try {
        // Validate email domain
        if (!user.email?.endsWith('@illinois.edu')) {
          await supabase.auth.signOut()
          if (mounted) {
            setState({
              user: null,
              profile: null,
              session: null,
              loading: false,
              error: 'Only @illinois.edu email addresses are allowed'
            })
          }
          return
        }

        // Profile loading with retry logic for network errors
        let retries = 0
        let profile = null
        let lastError = null

        while (retries < 3) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

          if (!error || (error.code !== 'ECONNRESET' && error.code !== 'ETIMEDOUT')) {
            // Success or non-network error
            profile = data
            lastError = error
            break
          }
          
          lastError = error
          retries++
          if (retries < 3) {
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 500))
          }
        }

        if (!mounted) return

        // Handle the result after retries
        if (lastError && lastError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const newProfile = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata.full_name || '',
            avatar_url: user.user_metadata.avatar_url || '',
            username: user.email.split('@')[0] // Default username from email
          }

          const { data: createdProfile, error: createError } = await supabase
            .from('users')
            .insert(newProfile)
            .select()
            .single()

          if (!mounted) return

          if (createError) {
            // Keep user authenticated but show profile error
            setState(prev => ({
              ...prev,
              profile: null,
              error: `Failed to create profile: ${createError.message}`
            }))
            return
          }

          setState(prev => ({
            ...prev,
            profile: createdProfile,
            error: null
          }))
        } else if (lastError) {
          // Keep user authenticated but show profile error
          console.error('Failed to load profile after retries:', lastError)
          setState(prev => ({
            ...prev,
            profile: null,
            error: `Failed to load profile: ${lastError.message}`
          }))
        } else if (profile) {
          setState(prev => ({
            ...prev,
            profile,
            error: null
          }))
        }
      } catch (err) {
        if (!mounted) return
        console.error('Profile loading error:', err)
        // Keep user authenticated even if profile fails
        setState(prev => ({
          ...prev,
          profile: null,
          error: err instanceof Error ? err.message : 'Unknown error'
        }))
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user, session)
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: null
        })
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Update session without reloading profile
        setState(prev => ({ ...prev, session }))
      }
    })

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      subscription.unsubscribe()
    }
  }, []) // Empty deps is ok since we only need to run once on mount

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          hd: 'illinois.edu' // Restrict to Illinois domain
        },
        redirectTo: window.location.origin // Let Supabase handle the callback
      }
    })

    if (error) throw error
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))
    const { error } = await supabase.auth.signOut()
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }))
      throw error
    }
  }

  return {
    ...state,
    signInWithGoogle,
    signOut
  }
}