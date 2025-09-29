import React, { Component, ReactNode } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { AlertCircle, RefreshCw, Home, Copy, Bug } from 'lucide-react'
import toast from 'react-hot-toast'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  // eslint-disable-next-line no-unused-vars
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  level?: 'page' | 'section' | 'component'
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  showToast?: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Using react-hot-toast
  private resetTimeoutId?: number

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId(),
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)

    this.setState({ error, errorInfo, errorId: this.generateErrorId() })

    // Show toast notification if enabled
    if (this.props.showToast !== false) {
      toast.error(`Error occurred: ${error.message}`)
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    // Reset error boundary when resetKeys change
    if (
      hasError &&
      prevProps.resetKeys !== resetKeys &&
      resetKeys &&
      resetKeys.length > 0
    ) {
      const prevKeys = JSON.stringify(prevProps.resetKeys?.sort())
      const currentKeys = JSON.stringify(resetKeys.sort())

      if (prevKeys !== currentKeys) {
        this.resetErrorBoundary()
      }
    }

    // Reset error boundary when any props change if resetOnPropsChange is true
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary()
    }
  }

  handleReset = () => {
    this.resetErrorBoundary()
  }

  resetErrorBoundary = () => {
    // Clear any pending reset timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    // Set timeout for reset
    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: this.generateErrorId(),
      })
    }, 0)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  copyErrorDetails = async () => {
    const { error, errorInfo, errorId } = this.state
    if (!error) return

    const errorDetails = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      toast.success('Error details copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy error details to clipboard')
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

    // Default error UI based on level
    const { level = 'component' } = this.props
    const { error, errorInfo, errorId } = this.state

    const errorContent = (
      <div className="text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />

        {level === 'page' && (
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>
        )}

        {level === 'section' && (
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            This section encountered an error
          </h2>
        )}

        {level === 'component' && (
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Component error
          </h3>
        )}

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Error ID: {errorId}
            </span>
          </div>
          {error && (
            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
              {error.message}
            </p>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && errorInfo && (
          <details className="text-left text-xs text-gray-500 dark:text-gray-400 mb-4">
            <summary className="cursor-pointer mb-2 font-medium">Component Stack</summary>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-32">
              {errorInfo.componentStack}
            </pre>
          </details>
        )}

        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>

          {level === 'page' && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={this.handleReload}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload page
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go home
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={this.copyErrorDetails}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy details
              </Button>
            </>
          )}
        </div>
      </div>
    )

    if (level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="max-w-md w-full">
            {errorContent}
          </Card>
        </div>
      )
    }

    return (
      <Card className="p-6 border-red-200 dark:border-red-800">
        {errorContent}
      </Card>
    )
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
    console.error('Error captured by useErrorHandler:', error)
  }, [])

  React.useEffect(() => {
    if (error) {
      // Re-throw the error to trigger parent ErrorBoundary
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

// HOC for adding error boundary to components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}