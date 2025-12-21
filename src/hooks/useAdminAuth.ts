import { useAuth } from '@/hooks/useAuth'

// Admin emails - hardcoded for security (compile-time)
// To add admins: add email to this list and redeploy
const ADMIN_EMAILS = [
  'vishal@illinois.edu',
] as const

export function useAdminAuth() {
  const { user, loading } = useAuth()

  // Case-insensitive email comparison
  const userEmail = user?.email?.toLowerCase()
  const isAdmin = userEmail && ADMIN_EMAILS.some(
    adminEmail => adminEmail.toLowerCase() === userEmail
  )

  // All @illinois.edu users can flag content (moderator-lite capability)
  const canFlag = user?.email?.toLowerCase().endsWith('@illinois.edu') ?? false

  return {
    isAdmin: Boolean(isAdmin),
    canFlag,
    loading,
    user,
  }
}
