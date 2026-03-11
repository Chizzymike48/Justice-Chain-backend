import { createContext, useState, useContext, ReactNode, FC } from 'react'

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
  }

  const logout = () => {
    setIsLoggedIn(false)
    setUser(null)
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }

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
