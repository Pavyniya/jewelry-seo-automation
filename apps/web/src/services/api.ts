import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'
import TokenManager, { AuthTokens } from '../utils/auth'

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

class ApiService {
  private instance: AxiosInstance
  private refreshTokenPromise: Promise<string> | null = null

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      (config) => {
        const authHeader = TokenManager.getAuthHeader()
        if (authHeader) {
          config.headers = {
            ...config.headers,
            ...authHeader,
          }
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle auth errors
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            // Try to refresh the token
            const newToken = await this.refreshAuthToken()
            if (newToken) {
              // Update the auth header and retry the request
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return this.instance(originalRequest)
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            // Clear tokens and redirect to login
            TokenManager.clearTokens()
            window.location.href = '/login'
            return Promise.reject(error)
          }
        }

        // Handle other errors
        this.handleApiError(error)
        return Promise.reject(error)
      }
    )
  }

  private async refreshAuthToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise
    }

    this.refreshTokenPromise = TokenManager.refreshAccessToken()

    try {
      const token = await this.refreshTokenPromise
      return token || ''
    } finally {
      this.refreshTokenPromise = null
    }
  }

  private handleApiError(error: any): void {
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An unknown error occurred',
      code: error.response?.data?.code,
      status: error.response?.status,
      details: error.response?.data,
    }

    // Don't show toast for 401 errors (handled by auth redirect)
    if (error.response?.status !== 401) {
      toast.error(apiError.message)
    }

    console.error('API Error:', apiError)
  }

  // Generic HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<ApiResponse<T>>(url, config)
    return response.data.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config)
    return response.data.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config)
    return response.data.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data, config)
    return response.data.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config)
    return response.data.data
  }

  // Auth-specific methods
  async login(email: string, password: string): Promise<{
    user: any
    tokens: AuthTokens
  }> {
    const response = await this.instance.post('/auth/login', { email, password })
    const { user, tokens } = response.data.data

    // Store tokens and user data
    TokenManager.setTokens(tokens)
    TokenManager.setUser(user)

    return { user, tokens }
  }

  async logout(): Promise<void> {
    try {
      await this.instance.post('/auth/logout')
    } catch (error) {
      console.warn('Logout API call failed:', error)
    } finally {
      TokenManager.clearTokens()
    }
  }

  async register(userData: {
    email: string
    password: string
    name: string
    companyName?: string
  }): Promise<{
    user: any
    tokens: AuthTokens
  }> {
    const response = await this.instance.post('/auth/register', userData)
    const { user, tokens } = response.data.data

    // Store tokens and user data
    TokenManager.setTokens(tokens)
    TokenManager.setUser(user)

    return { user, tokens }
  }

  async getCurrentUser(): Promise<any> {
    return this.get('/auth/me')
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return TokenManager.hasValidSession()
  }

  // Get the current access token
  getAccessToken(): string | null {
    return TokenManager.getAccessToken()
  }

  // Get auth headers for external API calls
  getAuthHeaders(): Record<string, string> | null {
    return TokenManager.getAuthHeader()
  }
}

// Create and export singleton instance
export const apiService = new ApiService()

// Export default for convenience
export default apiService