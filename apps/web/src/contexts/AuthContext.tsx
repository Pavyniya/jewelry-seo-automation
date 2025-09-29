import React, { createContext, useContext, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  role?: string
  companyName?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  // eslint-disable-next-line no-unused-vars
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  // eslint-disable-next-line no-unused-vars
  register: (userData: {
    email: string
    password: string
    name: string
    companyName?: string
  }) => Promise<void>
  checkAuth: () => Promise<void>
  // eslint-disable-next-line no-unused-vars
  updateProfile: (userData: Partial<User>) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // TEMPORARY: Mock authentication for development
  const mockAuth = {
    user: {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      companyName: 'Ohh Glam',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: async (_email: string, _password: string) => {
      // Mock login - always succeed
      console.log('Mock login for:', _email)
    },
    logout: async () => {
      console.log('Mock logout')
    },
    register: async (_userData: any) => {
      console.log('Mock register:', _userData)
    },
    checkAuth: async () => {
      console.log('Mock checkAuth')
    },
    updateProfile: async (_userData: any) => {
      console.log('Mock updateProfile:', _userData)
    },
    clearError: () => {
      console.log('Mock clearError')
    }
  }

  return (
    <AuthContext.Provider value={mockAuth}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}