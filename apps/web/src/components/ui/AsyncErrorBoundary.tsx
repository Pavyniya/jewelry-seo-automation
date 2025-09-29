import React, { Component, ReactNode } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { AlertTriangle, RefreshCw, WifiOff, Database } from 'lucide-react'

interface AsyncErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorType: 'network' | 'api' | 'timeout' | 'auth' | 'unknown'
}

interface AsyncErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorType: AsyncErrorBoundaryState['errorType']) => void
  onRetry?: () => Promise<void> | void
  maxRetries?: number
  timeout?: number
}

export class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  private retryCount = 0
  private timeoutId: NodeJS.Timeout | null = null

  constructor(props: AsyncErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorType: 'unknown',
    }
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    let errorType: AsyncErrorBoundaryState['errorType'] = 'unknown'

    if (error.name === 'NetworkError' || error.message.includes('network')) {
      errorType = 'network'
    } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      errorType = 'timeout'
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorType = 'auth'
    } else if (error.message.includes('500') || error.message.includes('API')) {
      errorType = 'api'
    }

    return { hasError: true, error, errorType }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error, this.state.errorType)
  }

  handleRetry = async () => {
    const { maxRetries = 3 } = this.props

    if (this.retryCount >= maxRetries) {
      console.warn('Max retries reached for async operation')
      return
    }

    this.retryCount++

    try {
      if (this.props.onRetry) {
        await this.props.onRetry()
      }

      this.setState({
        hasError: false,
        error: null,
        errorType: 'unknown',
      })
    } catch (error: any) {
      this.setState({
        hasError: true,
        error,
        errorType: 'unknown',
      })
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    // Custom fallback UI
    if (this.props.fallback) {
      return this.props.fallback
    }

    const { error, errorType } = this.state
    const { maxRetries = 3 } = this.props

    const getErrorIcon = () => {
      switch (errorType) {
        case 'network':
          return <WifiOff className="h-12 w-12 text-orange-500 mb-4" />
        case 'api':
          return <Database className="h-12 w-12 text-red-500 mb-4" />
        case 'timeout':
          return <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        case 'auth':
          return <AlertTriangle className="h-12 w-12 text-purple-500 mb-4" />
        default:
          return <AlertTriangle className="h-12 w-12 text-gray-500 mb-4" />
      }
    }

    const getErrorTitle = () => {
      switch (errorType) {
        case 'network':
          return 'Network Error'
        case 'api':
          return 'Server Error'
        case 'timeout':
          return 'Request Timeout'
        case 'auth':
          return 'Authentication Error'
        default:
          return 'Something went wrong'
      }
    }

    const getErrorMessage = () => {
      switch (errorType) {
        case 'network':
          return 'Unable to connect to the server. Please check your internet connection.'
        case 'api':
          return 'The server encountered an error. Please try again later.'
        case 'timeout':
          return 'The request took too long to complete. Please try again.'
        case 'auth':
          return 'You need to sign in to access this feature.'
        default:
          return 'An unexpected error occurred. Please try again.'
      }
    }

    const showRetryButton = this.retryCount < maxRetries && errorType !== 'auth'

    return (
      <Card className="p-6 max-w-md mx-auto text-center">
        {getErrorIcon()}

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {getErrorTitle()}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {getErrorMessage()}
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left text-xs text-gray-500 dark:text-gray-400 mb-4">
            <summary className="cursor-pointer mb-2 font-medium">Error details</summary>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-2">
          {showRetryButton && (
            <Button
              variant="default"
              size="sm"
              onClick={this.handleRetry}
              className="flex items-center gap-2 justify-center"
            >
              <RefreshCw className="h-4 w-4" />
              Retry ({maxRetries - this.retryCount} attempts left)
            </Button>
          )}

          {errorType === 'auth' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = '/login'
              }}
            >
              Sign In
            </Button>
          )}
        </div>
      </Card>
    )
  }
}

// Hook for handling async operations with error boundaries
export function useAsyncErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)
  const [errorType, setErrorType] = React.useState<AsyncErrorBoundaryState['errorType']>('unknown')
  const [isLoading, setIsLoading] = React.useState(false)

  const resetError = React.useCallback(() => {
    setError(null)
    setErrorType('unknown')
  }, [])

  const executeAsync = React.useCallback(async <T,>(
    operation: () => Promise<T>,
    options?: {
      onError?: (error: Error, errorType: AsyncErrorBoundaryState['errorType']) => void
      timeout?: number
    }
  ): Promise<T | null> => {
    setIsLoading(true)
    resetError()

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          if (options?.timeout) {
            setTimeout(() => reject(new Error('Operation timeout')), options.timeout)
          }
        })
      ])

      setIsLoading(false)
      return result
    } catch (error: any) {
      setIsLoading(false)

      let errorType: AsyncErrorBoundaryState['errorType'] = 'unknown'

      if (error.name === 'NetworkError' || error.message.includes('network')) {
        errorType = 'network'
      } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        errorType = 'timeout'
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorType = 'auth'
      } else if (error.message.includes('500') || error.message.includes('API')) {
        errorType = 'api'
      }

      setError(error)
      setErrorType(errorType)

      options?.onError?.(error, errorType)
      console.error('Async operation error:', error)

      return null
    }
  }, [resetError])

  return { error, errorType, isLoading, executeAsync, resetError }
}