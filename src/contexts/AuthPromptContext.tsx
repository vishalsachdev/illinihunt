import { createContext, useContext, useState, ReactNode } from 'react'
import { AuthPrompt } from '@/components/auth/AuthPrompt'

interface AuthPromptContextType {
  showAuthPrompt: (actionRequired?: string) => void
  hideAuthPrompt: () => void
}

const AuthPromptContext = createContext<AuthPromptContextType | undefined>(undefined)

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [actionRequired, setActionRequired] = useState('access this feature')

  const showAuthPrompt = (action = 'access this feature') => {
    setActionRequired(action)
    setIsOpen(true)
  }

  const hideAuthPrompt = () => {
    setIsOpen(false)
  }

  return (
    <AuthPromptContext.Provider value={{ showAuthPrompt, hideAuthPrompt }}>
      {children}
      {isOpen && (
        <AuthPrompt 
          actionRequired={actionRequired} 
          onClose={hideAuthPrompt} 
        />
      )}
    </AuthPromptContext.Provider>
  )
}

export function useAuthPrompt() {
  const context = useContext(AuthPromptContext)
  if (context === undefined) {
    throw new Error('useAuthPrompt must be used within an AuthPromptProvider')
  }
  return context
}
