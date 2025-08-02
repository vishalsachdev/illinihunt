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
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    let mounted = true

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          setState(prev => ({ ...prev, error: error.message, loading: false }))
          return
        }

        if (session?.user) {
          await loadUserProfile(session.user, session)
        } else {
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (err) {
        if (!mounted) return
        setState(prev => ({ 
          ...prev, 
          error: err instanceof Error ? err.message : 'Failed to initialize auth',
          loading: false 
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
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (user: User, session: Session) => {
    try {
      // Validate email domain
      if (!user.email?.endsWith('@illinois.edu')) {
        await supabase.auth.signOut()
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: 'Only @illinois.edu email addresses are allowed'
        })
        return
      }

      // Get or create user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
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

        if (createError) {
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: `Failed to create profile: ${createError.message}`
          })
          return
        }

        setState({
          user,
          profile: createdProfile,
          session,
          loading: false,
          error: null
        })
      } else if (error) {
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: `Failed to load profile: ${error.message}`
        })
      } else {
        setState({
          user,
          profile,
          session,
          loading: false,
          error: null
        })
      }
    } catch (err) {
      setState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

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