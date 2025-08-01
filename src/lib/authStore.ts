// Global auth state to prevent multiple loading states across tabs
let authStateCache: {
  initialized: boolean
  timestamp: number
} = {
  initialized: false,
  timestamp: 0
}

const CACHE_DURATION = 5000 // 5 seconds

export function isAuthInitialized(): boolean {
  const now = Date.now()
  if (authStateCache.initialized && (now - authStateCache.timestamp) < CACHE_DURATION) {
    return true
  }
  return false
}

export function setAuthInitialized(): void {
  authStateCache.initialized = true
  authStateCache.timestamp = Date.now()
}

export function resetAuthCache(): void {
  authStateCache.initialized = false
  authStateCache.timestamp = 0
}