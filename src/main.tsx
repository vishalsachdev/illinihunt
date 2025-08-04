import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ensureSupabaseInitialized } from './lib/supabaseInit'

// Initialize Supabase before rendering the app
ensureSupabaseInitialized().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})