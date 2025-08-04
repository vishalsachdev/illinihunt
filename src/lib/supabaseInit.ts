import { supabase } from './supabase'

let isInitialized = false
let initPromise: Promise<void> | null = null

/**
 * Ensures Supabase client has restored its session from localStorage
 * This should be called before the app renders to prevent race conditions
 */
export async function ensureSupabaseInitialized(): Promise<void> {
  if (isInitialized) return
  
  if (initPromise) return initPromise
  
  initPromise = (async () => {
    try {
      // This will restore the session from localStorage if it exists
      // It's important to wait for this before rendering the app
      await supabase.auth.getSession()
      isInitialized = true
    } catch (error) {
      console.error('Failed to initialize Supabase session:', error)
      isInitialized = true // Mark as initialized even on error
    }
  })()
  
  return initPromise
}