import { create } from 'zustand'

interface AuthState {
  user: null | {
    id: string
    email: string
    name: string
  }
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async (email: string, password: string) => {
    set({ isLoading: true })
    // Mock login for now
    setTimeout(() => {
      set({
        user: {
          id: '1',
          email,
          name: 'User'
        },
        isAuthenticated: true,
        isLoading: false
      })
    }, 1000)
  },
  logout: () => {
    set({
      user: null,
      isAuthenticated: false
    })
  },
  checkAuth: async () => {
    set({ isLoading: true })
    // Mock auth check
    setTimeout(() => {
      set({
        user: {
          id: '1',
          email: 'user@example.com',
          name: 'User'
        },
        isAuthenticated: true,
        isLoading: false
      })
    }, 500)
  }
}))