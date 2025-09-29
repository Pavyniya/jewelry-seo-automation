import React, { Component, ReactNode } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  // eslint-disable-next-line no-unused-vars
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  level?: 'page' | 'section' | 'component'
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)

    this.setState({ error, errorInfo })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
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
    const { error, errorInfo } = this.state

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

        {error && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error.message}
          </p>
        )}

        {errorInfo && (
          <details className="text-left text-xs text-gray-500 dark:text-gray-400 mb-4">
            <summary className="cursor-pointer mb-2 font-medium">Error details</summary>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-32">
              {errorInfo.componentStack}
            </pre>
          </details>
        )}

        <div className="flex gap-2 justify-center">
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
            <Button
              variant="default"
              size="sm"
              onClick={this.handleReload}
            >
              Reload page
            </Button>
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