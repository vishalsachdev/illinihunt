/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { User, Session, type PostgrestError } from '@supabase/supabase-js'
import { z } from 'zod'
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
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  retryAuth: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

// Simple localStorage based profile cache
const PROFILE_CACHE_KEY = 'illinihunt-profile'
const PROFILE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const AUTH_CHECK_TIMEOUT = 5000
const MAX_PROFILE_RETRIES = 3
const PROFILE_RETRY_BASE_DELAY = 500
const ILLINOIS_DOMAIN = 'illinois.edu'

const CachedProfileSchema = z.object({
  profile: z.object({
    id: z.string(),
    email: z.string()
  }).passthrough(),
  timestamp: z.number()
})

function isValidIllinoisEmail(email: string | undefined) {
  return !!email && email.toLowerCase().endsWith(`@${ILLINOIS_DOMAIN}`)
}

type CachedProfile = { profile: UserProfile; timestamp: number }

function getCachedProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  const cached = window.localStorage.getItem(PROFILE_CACHE_KEY)
  if (!cached) return null
  try {
    const parsedResult = CachedProfileSchema.safeParse(JSON.parse(cached))
    if (
      parsedResult.success &&
      Date.now() - parsedResult.data.timestamp < PROFILE_CACHE_TTL &&
      isValidIllinoisEmail(parsedResult.data.profile.email)
    ) {
      return parsedResult.data.profile as UserProfile
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error('Failed to parse cached profile', e)
    }
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
  const [state, setState] = useState<Omit<AuthState, 'signInWithGoogle' | 'signInWithEmail' | 'signOut' | 'refreshProfile' | 'retryAuth'>>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null
  })

  const mountedRef = useRef(true)
  const loadingRef = useRef(state.loading)
  const profileLoadingRef = useRef(false)

  useEffect(() => {
    loadingRef.current = state.loading
  }, [state.loading])

  const loadUserProfile = useCallback(async (user: User, force = false) => {
    if (profileLoadingRef.current && !force) return
    profileLoadingRef.current = true

    if (import.meta.env.DEV) {
      console.log('Loading user profile for:', user.email)
    }

    try {
      const cached = !force ? getCachedProfile() : null
      if (cached) {
        setState(prev => ({ ...prev, profile: cached, error: null, loading: false }))
        return
      }

      if (!isValidIllinoisEmail(user.email)) {
        await supabase.auth.signOut()
        if (mountedRef.current) {
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: `Only @${ILLINOIS_DOMAIN} email addresses are allowed`
          })
        }
        return
      }

      let retries = 0
      let data: UserProfile | null = null
      let error: PostgrestError | null = null
      while (retries < MAX_PROFILE_RETRIES) {
        const response = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        data = response.data as UserProfile | null
        error = response.error
        if (!error || (error.code !== 'ECONNRESET' && error.code !== 'ETIMEDOUT')) {
          break
        }
        retries++
        await new Promise(res => setTimeout(res, PROFILE_RETRY_BASE_DELAY * 2 ** retries))
      }

      if (!mountedRef.current) return

      if (error && error.code === 'PGRST116') {
        const newProfile = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata.full_name || '',
          avatar_url: user.user_metadata.avatar_url || '',
          username: user.email!.split('@')[0]
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
            error: `Failed to create profile: ${createError.message}`,
            loading: false
          }))
          return
        }

        setCachedProfile(createdProfile)
        setState(prev => ({
          ...prev,
          profile: createdProfile,
          error: null,
          loading: false
        }))
      } else if (error) {
        setState(prev => ({
          ...prev,
          profile: null,
          error: `Failed to load profile: ${error.message}`,
          loading: false
        }))
      } else if (data) {
        setCachedProfile(data)
        setState(prev => ({
          ...prev,
          profile: data,
          error: null,
          loading: false
        }))
      }
    } catch (err) {
      if (!mountedRef.current) return
      if (import.meta.env.DEV) {
        console.error('Profile loading error:', err)
      }
      setState(prev => ({
        ...prev,
        profile: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        loading: false
      }))
    } finally {
      profileLoadingRef.current = false
    }
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const initializeAuth = async () => {
      timeoutId = setTimeout(() => {
        if (mountedRef.current && loadingRef.current) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Authentication check timed out. Please refresh the page.'
          }))
        }
      }, AUTH_CHECK_TIMEOUT)

      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }

        if (!mountedRef.current) return

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
        if (!mountedRef.current) return
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to initialize auth',
          loading: false
        }))
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return

      if (import.meta.env.DEV) {
        console.log('Auth state change:', event, session?.user?.email)
      }

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
      mountedRef.current = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      subscription.unsubscribe()
    }
  }, [loadUserProfile])

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

  const signInWithEmail = async (email: string) => {
    if (!isValidIllinoisEmail(email)) {
      setState(prev => ({ ...prev, error: `Only @${ILLINOIS_DOMAIN} email addresses are allowed` }))
      throw new Error(`Only @${ILLINOIS_DOMAIN} email addresses are allowed`)
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    })

    if (error) {
      setState(prev => ({ ...prev, error: error.message }))
      throw error
    }

    setState(prev => ({ ...prev, error: null }))
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

  const refreshProfile = async () => {
    if (state.user) {
      await loadUserProfile(state.user, true)
    }
  }

  const retryAuth = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (!mountedRef.current) return

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
      if (!mountedRef.current) return
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to retry auth',
        loading: false
      }))
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, signInWithGoogle, signInWithEmail, signOut, refreshProfile, retryAuth }}>
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
