import { createContext, useState, useContext, useEffect, useCallback, ReactNode, FC } from 'react'
import { setSentryUser, clearSentryUser } from '../utils/sentry'

interface User {
  id?: string
  email?: string
  name?: string
  role?: string
  token?: string
  [key: string]: unknown
}

interface AuthContextType {
  isLoggedIn: boolean
  user: User | null
  login: (userData: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const AUTH_TOKEN_KEY = 'authToken'

  const readStoredUser = (): User | null => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) {
      return null
    }

    try {
      const parsed = JSON.parse(savedUser)
      if (parsed && typeof parsed === 'object') {
        return parsed as User
      }
    } catch {
      // Reset corrupted storage values to prevent runtime crashes.
      localStorage.removeItem('user')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem(AUTH_TOKEN_KEY)
    }

    return null
  }

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true' && Boolean(localStorage.getItem(AUTH_TOKEN_KEY))
  })

  const [user, setUser] = useState<User | null>(() => readStoredUser())

  const login = (userData: User) => {
    setIsLoggedIn(true)
    setUser(userData)
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('user', JSON.stringify(userData))
    if (typeof userData.token === 'string' && userData.token.length > 0) {
      localStorage.setItem(AUTH_TOKEN_KEY, userData.token)
    }
    // Set Sentry user context for error tracking
    setSentryUser(userData.id || 'unknown', userData.email, userData.name)
  }

  const logout = useCallback(() => {
    setIsLoggedIn(false)
    setUser(null)
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    localStorage.removeItem(AUTH_TOKEN_KEY)
    // Clear Sentry user context
    clearSentryUser()
  }, [AUTH_TOKEN_KEY])

  // Validate stored token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!isLoggedIn || !user?.token) {
        return
      }

      try {
        // Use api directly for /me which will use interceptor token
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            console.warn('Token invalid/expired, logging out')
            logout()
          }
          return
        }

        // Token valid, optionally refresh user data
        const data = await response.json()
        setUser(prev => prev ? ({ ...prev, ...data.data }) : null)
      } catch (error) {
        console.error('Token validation failed:', error)
        logout()
      }
    }

    validateToken()
  }, [isLoggedIn, user?.token, logout])

  const value: AuthContextType = {
    isLoggedIn,
    user,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
