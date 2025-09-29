import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiService } from '../services/api'
import TokenManager from '../utils/auth'
import toast from 'react-hot-toast'

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

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (userData: {
    email: string
    password: string
    name: string
    companyName?: string
  }) => Promise<void>
  checkAuth: () => Promise<void>
  updateProfile: (userData: Partial<User>) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null })

          const { user, tokens } = await apiService.login(email, password)

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          toast.success(`Welcome back, ${user.name}!`)
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed'
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          toast.error(errorMessage)
          throw error
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true })
          await apiService.logout()
        } catch (error) {
          console.warn('Logout API call failed:', error)
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
          toast.success('You have been logged out')
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true, error: null })

          const { user, tokens } = await apiService.register(userData)

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          toast.success(`Welcome to Ohh Glam, ${user.name}!`)
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed'
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          toast.error(errorMessage)
          throw error
        }
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true, error: null })

          // Check if we have valid tokens
          if (!TokenManager.hasValidSession()) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
            return
          }

          // Verify token with API
          const user = await apiService.getCurrentUser()

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          console.warn('Auth check failed:', error)

          // Clear invalid tokens
          TokenManager.clearTokens()

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || 'Session expired',
          })
        }
      },

      updateProfile: async (userData: Partial<User>) => {
        try {
          set({ isLoading: true, error: null })

          const updatedUser = await apiService.put('/auth/profile', userData)

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          })

          TokenManager.setUser(updatedUser)
          toast.success('Profile updated successfully')
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Profile update failed'
          set({
            isLoading: false,
            error: errorMessage,
          })
          toast.error(errorMessage)
          throw error
        }
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)