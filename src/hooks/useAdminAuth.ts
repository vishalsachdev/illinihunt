import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

/**
 * Hook to check if current user has admin privileges.
 *
 * Admin status is determined by the database (single source of truth).
 * The is_admin() function in the database checks against the admin email list.
 */
export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user?.email) {
        setIsAdmin(false)
        setAdminLoading(false)
        return
      }

      try {
        // Call the database function to check admin status
        // This is the single source of truth for admin emails
        const { data, error } = await supabase.rpc('is_admin')

        if (error) {
          // If RPC fails (e.g., function doesn't exist yet), fall back to false
          if (import.meta.env.DEV) {
            console.warn('Admin check failed:', error.message)
          }
          setIsAdmin(false)
        } else {
          setIsAdmin(Boolean(data))
        }
      } catch {
        setIsAdmin(false)
      } finally {
        setAdminLoading(false)
      }
    }

    if (!authLoading) {
      checkAdminStatus()
    }
  }, [user?.email, authLoading])

  // All @illinois.edu users can flag content (moderator-lite capability)
  const canFlag = user?.email?.toLowerCase().endsWith('@illinois.edu') ?? false

  return {
    isAdmin,
    canFlag,
    loading: authLoading || adminLoading,
    user,
  }
}
