import { createContext, useState, useContext, ReactNode, FC, Dispatch, SetStateAction } from 'react'

interface AppState {
  [key: string]: unknown
}

interface AppContextType {
  state: AppState
  setState: Dispatch<SetStateAction<AppState>>
}

export const AppContext = createContext<AppContextType | undefined>(undefined)

interface AppProviderProps {
  children: ReactNode
}

export const AppProvider: FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>({})

  const value: AppContextType = {
    state,
    setState,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = (): AppContextType => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
