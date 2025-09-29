import * as jwtDecode from 'jwt-decode'

export interface JwtPayload {
  sub: string
  email: string
  name: string
  iat: number
  exp: number
  role?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'jewelry_seo_access_token'
  private static readonly REFRESH_TOKEN_KEY = 'jewelry_seo_refresh_token'
  private static readonly USER_KEY = 'jewelry_seo_user'

  // Token storage methods
  static setTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken)
      if (tokens.refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken)
      }
    } catch (error) {
      console.warn('Failed to store tokens in localStorage:', error)
      // Fallback to sessionStorage
      sessionStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken)
      if (tokens.refreshToken) {
        sessionStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken)
      }
    }
  }

  static getAccessToken(): string | null {
    return this.getToken(this.ACCESS_TOKEN_KEY)
  }

  static getRefreshToken(): string | null {
    return this.getToken(this.REFRESH_TOKEN_KEY)
  }

  private static getToken(key: string): string | null {
    // Try localStorage first, then sessionStorage
    let token = localStorage.getItem(key)
    if (!token) {
      token = sessionStorage.getItem(key)
    }
    return token
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY)
    this.clearUser()
  }

  // User data storage
  static setUser(user: any): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
    } catch (error) {
      console.warn('Failed to store user data in localStorage:', error)
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user))
    }
  }

  static getUser(): any | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY)
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.warn('Failed to parse user data:', error)
      return null
    }
  }

  static clearUser(): void {
    localStorage.removeItem(this.USER_KEY)
    sessionStorage.removeItem(this.USER_KEY)
  }

  // JWT validation and decoding
  static isTokenValid(token: string | null): boolean {
    if (!token) return false

    try {
      const decoded = jwtDecode.jwtDecode<JwtPayload>(token)
      const currentTime = Math.floor(Date.now() / 1000)

      // Check if token is expired (with 5-minute buffer)
      return decoded.exp > currentTime + 300
    } catch (error) {
      console.warn('Invalid token:', error)
      return false
    }
  }

  static isAccessTokenValid(): boolean {
    const token = this.getAccessToken()
    return this.isTokenValid(token)
  }

  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode.jwtDecode<JwtPayload>(token)
    } catch (error) {
      console.warn('Failed to decode token:', error)
      return null
    }
  }

  static getCurrentUser(): JwtPayload | null {
    const token = this.getAccessToken()
    if (!token || !this.isTokenValid(token)) {
      return null
    }
    return this.decodeToken(token)
  }

  // Token refresh logic
  static async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      return null
    }

    try {
      // This would be replaced with actual API call
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      const data = await response.json()
      if (data.success && data.data.accessToken) {
        this.setTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken || refreshToken
        })
        return data.data.accessToken
      }

      return null
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.clearTokens()
      return null
    }
  }

  // Authorization header helper
  static getAuthHeader(): Record<string, string> | null {
    const token = this.getAccessToken()
    if (!token) return null

    return {
      'Authorization': `Bearer ${token}`
    }
  }

  // Session management
  static hasValidSession(): boolean {
    return this.isAccessTokenValid() && !!this.getUser()
  }

  static getTimeUntilExpiration(): number {
    const token = this.getAccessToken()
    if (!token) return 0

    try {
      const decoded = jwtDecode.jwtDecode<JwtPayload>(token)
      const currentTime = Math.floor(Date.now() / 1000)
      return Math.max(0, decoded.exp - currentTime)
    } catch (error) {
      return 0
    }
  }

  static isTokenExpiringSoon(threshold: number = 300): boolean {
    const timeLeft = this.getTimeUntilExpiration()
    return timeLeft > 0 && timeLeft <= threshold
  }
}

export default TokenManager