import * as Sentry from '@sentry/react'

/**
 * Initialize Sentry. No-op in dev, or when VITE_SENTRY_DSN is not set
 * (e.g., a local production build with no DSN configured).
 *
 * Privacy note: we deliberately do NOT enable Session Replay or capture
 * email/full_name. Only the user's UUID and username are attached so we
 * can correlate an error to a specific student without storing PII.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN

  if (!dsn || !import.meta.env.PROD) {
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,

    // Performance tracing — keep low to control quota. Bump for short
    // investigation windows by setting this higher in env.
    tracesSampleRate: 0.05,

    // Capture browser console errors and unhandled rejections
    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    // Filter noisy known-benign errors before they hit the wire
    beforeSend(event, hint) {
      const error = hint.originalException
      if (error instanceof Error) {
        // Browser extensions / chrome-extension:// origins
        if (error.message.includes('ResizeObserver loop')) return null
        if (error.message.includes('Non-Error promise rejection')) return null
      }
      return event
    },
  })
}

/**
 * Attach the current user to Sentry's scope, or clear it on sign-out.
 * Caller is responsible for invoking this when auth state changes.
 */
export function setSentryUser(user: { id: string; username?: string | null } | null): void {
  if (user) {
    Sentry.setUser({ id: user.id, username: user.username ?? undefined })
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Capture an exception with optional context. Used by ErrorContext so
 * every toast surface ALSO produces a Sentry event we can investigate.
 */
export function captureError(error: unknown, context?: { operation?: string; extra?: Record<string, unknown> }): void {
  Sentry.captureException(error, {
    tags: context?.operation ? { operation: context.operation } : undefined,
    extra: context?.extra,
  })
}
