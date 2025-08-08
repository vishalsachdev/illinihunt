import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

// Type for user profile from database
type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

// Simple localStorage based profile cache
const PROFILE_CACHE_KEY = 'illinihunt-profile'
const PROFILE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

type CachedProfile = { profile: UserProfile; timestamp: number }

function getCachedProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  const cached = window.localStorage.getItem(PROFILE_CACHE_KEY)
  if (!cached) return null
  try {
    const parsed = JSON.parse(cached) as CachedProfile
    if (Date.now() - parsed.timestamp < PROFILE_CACHE_TTL) {
      return parsed.profile
    }
  } catch (e) {
    console.error('Failed to parse cached profile', e)
  }
  return null
}

function setCachedProfile(profile: UserProfile) {
  if (typeof window === 'undefined') return
  const cached: CachedProfile = { profile, timestamp: Date.now() }
  window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cached))
}

function clearCachedProfile() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(PROFILE_CACHE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'signInWithGoogle' | 'signOut'>>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const initializeAuth = async () => {
      timeoutId = setTimeout(() => {
        if (mounted && state.loading) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Authentication check timed out. Please refresh the page.'
          }))
        }
      }, 5000)

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
          setState(prev => ({
            ...prev,
            user: session.user,
            session,
            loading: false
          }))
          await loadUserProfile(session.user)
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

    const loadUserProfile = async (user: User) => {
      try {
        // check cache first
        const cached = getCachedProfile()
        if (cached) {
          setState(prev => ({ ...prev, profile: cached, error: null }))
          return
        }

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

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!mounted) return

        if (error && error.code === 'PGRST116') {
          const newProfile = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata.full_name || '',
            avatar_url: user.user_metadata.avatar_url || '',
            username: user.email.split('@')[0]
          }

          const { data: createdProfile, error: createError } = await supabase
            .from('users')
            .insert(newProfile)
            .select()
            .single()

          if (createError) {
            setState(prev => ({
              ...prev,
              profile: null,
              error: `Failed to create profile: ${createError.message}`
            }))
            return
          }

          setCachedProfile(createdProfile)
          setState(prev => ({
            ...prev,
            profile: createdProfile,
            error: null
          }))
        } else if (error) {
          setState(prev => ({
            ...prev,
            profile: null,
            error: `Failed to load profile: ${error.message}`
          }))
        } else if (data) {
          setCachedProfile(data)
          setState(prev => ({
            ...prev,
            profile: data,
            error: null
          }))
        }
      } catch (err) {
        if (!mounted) return
        console.error('Profile loading error:', err)
        setState(prev => ({
          ...prev,
          profile: null,
          error: err instanceof Error ? err.message : 'Unknown error'
        }))
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        setState(prev => ({
          ...prev,
          user: session.user,
          session,
          loading: false
        }))
        await loadUserProfile(session.user)
      } else if (event === 'SIGNED_OUT') {
        clearCachedProfile()
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: null
        })
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setState(prev => ({ ...prev, session, user: session.user }))
      }
    })

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          hd: 'illinois.edu'
        },
        redirectTo: window.location.origin
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
    clearCachedProfile()
  }

  return (
    <AuthContext.Provider value={{ ...state, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }
