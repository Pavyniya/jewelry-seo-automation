import React, { useState, useEffect, ReactNode } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'

interface NetworkErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReconnect?: () => void
  pingInterval?: number
  pingEndpoint?: string
}

interface NetworkStatus {
  isOnline: boolean
  isServerReachable: boolean
  lastCheck: Date | null
  error: string | null
}

export const NetworkErrorBoundary: React.FC<NetworkErrorBoundaryProps> = ({
  children,
  fallback,
  onReconnect,
  pingInterval = 30000, // 30 seconds
  pingEndpoint = '/api/health',
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isServerReachable: false,
    lastCheck: null,
    error: null,
  })

  const [isReconnecting, setIsReconnecting] = useState(false)

  const checkNetworkStatus = async () => {
    const isOnline = navigator.onLine

    if (!isOnline) {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isServerReachable: false,
        lastCheck: new Date(),
        error: 'No internet connection',
      }))
      return
    }

    try {
      const response = await fetch(pingEndpoint, {
        method: 'HEAD',
        cache: 'no-cache',
        timeout: 5000, // 5 second timeout
      })

      if (response.ok) {
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: true,
          isServerReachable: true,
          lastCheck: new Date(),
          error: null,
        }))

        // Trigger reconnect callback if we just came back online
        if (!networkStatus.isServerReachable && onReconnect) {
          onReconnect()
        }
      } else {
        throw new Error(`Server responded with ${response.status}`)
      }
    } catch (error: any) {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isServerReachable: false,
        lastCheck: new Date(),
        error: error.message || 'Server unreachable',
      }))
    }
  }

  const handleManualReconnect = async () => {
    setIsReconnecting(true)
    await checkNetworkStatus()
    setIsReconnecting(false)
  }

  // Set up network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
      }))
      checkNetworkStatus()
    }

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isServerReachable: false,
        lastCheck: new Date(),
        error: 'No internet connection',
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkNetworkStatus])

  // Set up periodic health checks
  useEffect(() => {
    if (!networkStatus.isOnline) return

    const interval = setInterval(checkNetworkStatus, pingInterval)
    return () => clearInterval(interval)
  }, [networkStatus.isOnline, pingInterval, pingEndpoint, checkNetworkStatus])

  useEffect(() => {
    checkNetworkStatus()
  }, [checkNetworkStatus])

  // If network is healthy, render children
  if (networkStatus.isOnline && networkStatus.isServerReachable) {
    return <>{children}</>
  }

  // Custom fallback UI
  if (fallback) {
    return <>{fallback}</>
  }

  const isCompletelyOffline = !networkStatus.isOnline
  const isServerUnreachable = networkStatus.isOnline && !networkStatus.isServerReachable

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full p-6 text-center">
        {isCompletelyOffline && (
          <WifiOff className="mx-auto h-16 w-16 text-red-500 mb-4" />
        )}

        {isServerUnreachable && (
          <AlertCircle className="mx-auto h-16 w-16 text-orange-500 mb-4" />
        )}

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isCompletelyOffline ? 'No Internet Connection' : 'Server Unreachable'}
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isCompletelyOffline
            ? 'Please check your internet connection and try again.'
            : networkStatus.error || 'Unable to connect to the server. Please try again later.'}
        </p>

        {networkStatus.lastCheck && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Last checked: {networkStatus.lastCheck.toLocaleTimeString()}
          </p>
        )}

        <div className="space-y-3">
          <Button
            variant="default"
            size="lg"
            onClick={handleManualReconnect}
            disabled={isReconnecting}
            className="w-full flex items-center justify-center gap-2"
          >
            {isReconnecting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                Reconnect
              </>
            )}
          </Button>

          {isCompletelyOffline && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p className="mb-2">Troubleshooting tips:</p>
              <ul className="text-left space-y-1">
                <li>• Check your Wi-Fi or ethernet connection</li>
                <li>• Restart your router if needed</li>
                <li>• Try loading other websites</li>
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// Hook for network status monitoring
export function useNetworkStatus(
  options: {
    pingInterval?: number
    pingEndpoint?: string
  } = {}
) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isServerReachable: false,
    lastCheck: null,
    error: null,
  })

  const checkNetworkStatus = async () => {
    const { pingEndpoint = '/api/health' } = options
    const isOnline = navigator.onLine

    if (!isOnline) {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isServerReachable: false,
        lastCheck: new Date(),
        error: 'No internet connection',
      }))
      return
    }

    try {
      const response = await fetch(pingEndpoint, {
        method: 'HEAD',
        cache: 'no-cache',
      })

      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isServerReachable: response.ok,
        lastCheck: new Date(),
        error: response.ok ? null : `Server responded with ${response.status}`,
      }))
    } catch (error: any) {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isServerReachable: false,
        lastCheck: new Date(),
        error: error.message || 'Server unreachable',
      }))
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
      }))
      checkNetworkStatus()
    }

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isServerReachable: false,
        lastCheck: new Date(),
        error: 'No internet connection',
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkNetworkStatus])

  useEffect(() => {
    const { pingInterval = 30000 } = options
    if (!networkStatus.isOnline) return

    const interval = setInterval(checkNetworkStatus, pingInterval)
    return () => clearInterval(interval)
  }, [networkStatus.isOnline, options, checkNetworkStatus])

  useEffect(() => {
    checkNetworkStatus()
  }, [checkNetworkStatus])

  return { ...networkStatus, checkNetworkStatus }
}