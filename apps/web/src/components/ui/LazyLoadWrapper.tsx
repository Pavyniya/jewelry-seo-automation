import React, { Suspense, ComponentType, LazyExoticComponent } from 'react'
import { CardSkeleton } from './Skeleton'

interface LazyLoadWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
  className?: string
}

// Wrapper component for lazy loaded components with loading and error states
export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  className = ''
}) => {
  return (
    <Suspense
      fallback={
        fallback || (
          <div className={`p-6 ${className}`}>
            <CardSkeleton header={true} lines={3} />
          </div>
        )
      }
    >
      <ErrorBoundary fallback={errorFallback}>
        {children}
      </ErrorBoundary>
    </Suspense>
  )
}

// Error boundary component for lazy loaded components
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 text-center">
            <div className="text-red-500 mb-2">Failed to load component</div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-primary-600 hover:text-primary-700"
            >
              Try again
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Higher-order component for lazy loading with error handling
export function withLazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode,
  errorFallback?: React.ReactNode
): LazyExoticComponent<T> {
  const LazyComponent = React.lazy(importFn)

  const WrappedComponent: React.FC<any> = (props) => (
    <LazyLoadWrapper fallback={fallback} errorFallback={errorFallback}>
      <LazyComponent {...props} />
    </LazyLoadWrapper>
  )

  return React.memo(WrappedComponent) as LazyExoticComponent<T>
}

// Hook for lazy loading outside of component context
export function useLazyLoader<T>(
  importFn: () => Promise<{ default: T }>
): {
  Component: LazyExoticComponent<T>
  load: () => Promise<void>
  loading: boolean
  error: Error | null
} {
  const [Component, setComponent] = React.useState<LazyExoticComponent<T> | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const load = React.useCallback(async () => {
    if (Component) return

    setLoading(true)
    setError(null)

    try {
      const module = await importFn()
      const LazyComponent = React.lazy(() => Promise.resolve(module))
      setComponent(LazyComponent)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [importFn, Component])

  return {
    Component: Component!,
    load,
    loading,
    error
  }
}

// Preloading utility
export class ComponentPreloader {
  private static preloadedComponents = new Map<string, Promise<any>>()

  static preload<T>(
    componentName: string,
    importFn: () => Promise<{ default: T }>
  ): Promise<T> {
    if (this.preloadedComponents.has(componentName)) {
      return this.preloadedComponents.get(componentName)!
    }

    const promise = importFn().then(module => module.default)
    this.preloadedComponents.set(componentName, promise)

    return promise
  }

  static getPreloaded<T>(componentName: string): T | null {
    const promise = this.preloadedComponents.get(componentName)
    return promise ? null : null // Return null if not preloaded or still loading
  }

  static clearPreload(componentName: string): void {
    this.preloadedComponents.delete(componentName)
  }

  static clearAllPreloads(): void {
    this.preloadedComponents.clear()
  }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = React.useState(false)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isIntersecting
}

// Component for viewport-based lazy loading
interface ViewportLazyLoadProps {
  children: React.ReactNode
  placeholder?: React.ReactNode
  rootMargin?: string
  threshold?: number
}

export const ViewportLazyLoad: React.FC<ViewportLazyLoadProps> = ({
  children,
  placeholder,
  rootMargin = '50px',
  threshold = 0.1
}) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const isIntersecting = useIntersectionObserver(ref, { rootMargin, threshold })

  return (
    <div ref={ref}>
      {isIntersecting ? children : (placeholder || <div className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
    </div>
  )
}