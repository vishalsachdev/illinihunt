import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ensureSupabaseInitialized } from './lib/supabaseInit'

// Validate required environment variables before app initialization
// This provides a user-friendly error instead of a blank page
const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const

function validateEnvironment(): string | null {
  for (const key of requiredEnvVars) {
    if (!import.meta.env[key]) {
      return `Missing required environment variable: ${key}`
    }
  }
  return null
}

function renderError(message: string) {
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; padding: 2rem; text-align: center; background: #13294B; color: white;">
        <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #FF6B35;">Configuration Error</h1>
        <p style="color: #94a3b8; max-width: 400px;">${message}</p>
        <p style="color: #64748b; font-size: 0.875rem; margin-top: 1rem;">Check your .env.local file and restart the development server.</p>
      </div>
    `
  }
}

// Check environment before initializing
const envError = validateEnvironment()
if (envError) {
  renderError(envError)
} else {
  // Initialize Supabase and render the app
  ensureSupabaseInitialized()
    .then(() => {
      ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      )
    })
    .catch((error) => {
      console.error('Failed to initialize app:', error)
      renderError(error instanceof Error ? error.message : 'Failed to initialize application')
    })
}