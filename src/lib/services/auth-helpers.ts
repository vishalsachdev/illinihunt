import { supabase } from '../supabase'

/**
 * Require an authenticated user or throw.
 * Eliminates the repeated getUser() + null check boilerplate.
 */
export async function requireAuth(action: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error(`Must be authenticated to ${action}`)
  return user
}

/**
 * Check if an error indicates a missing table (votes, bookmarks, etc.)
 * PostgREST returns PGRST202 for missing relations and 406 for content-type mismatches.
 */
export function isTableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === 'PGRST202' || error.code === '406' || (error.message?.includes('406') ?? false)
}
