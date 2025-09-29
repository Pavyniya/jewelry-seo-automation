import React, { Suspense, ComponentType, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CardSkeleton } from './Skeleton'

interface SuspenseRouteProps {
  component: ComponentType
  fallback?: React.ReactNode
  preloadOnHover?: boolean
  preloadDelay?: number
}

// Route component with built-in suspense and preloading
export const SuspenseRoute: React.FC<SuspenseRouteProps> = ({
  component: Component,
  fallback,
  preloadOnHover = true,
  preloadDelay = 100
}) => {
  const location = useLocation()
  const navigate = useNavigate()

  // Preload component when hovering over navigation links
  useEffect(() => {
    if (!preloadOnHover) return

    const handleMouseOver = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest('a')
      if (link && link.getAttribute('href') === location.pathname) {
        // Preload the component after a delay
        const timer = setTimeout(() => {
          // This would typically trigger webpack's magic comment for preloading
          // For now, we'll just mark it as ready
        }, preloadDelay)

        return () => clearTimeout(timer)
      }
    }

    document.addEventListener('mouseover', handleMouseOver)
    return () => document.removeEventListener('mouseover', handleMouseOver)
  }, [location.pathname, preloadOnHover, preloadDelay])

  const defaultFallback = (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <CardSkeleton key={i} header={true} lines={2} />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component />
    </Suspense>
  )
}

// Higher-order component for route-level code splitting
export function createLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ReactNode
    preloadOnHover?: boolean
    preloadDelay?: number
    errorFallback?: React.ReactNode
  } = {}
) {
  const LazyComponent = React.lazy(importFn)

  const WrappedRoute: React.FC = () => (
    <SuspenseRoute
      component={LazyComponent}
      fallback={options.fallback}
      preloadOnHover={options.preloadOnHover}
      preloadDelay={options.preloadDelay}
    />
  )

  return WrappedRoute
}

// Progressive loading component for large datasets
interface ProgressiveLoadProps {
  items: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  batchSize?: number
  initialBatchSize?: number
  renderPlaceholder?: () => React.ReactNode
}

export const ProgressiveLoad: React.FC<ProgressiveLoadProps> = ({
  items,
  renderItem,
  batchSize = 20,
  initialBatchSize = 10,
  renderPlaceholder
}) => {
  const [visibleCount, setVisibleCount] = React.useState(initialBatchSize)
  const [loading, setLoading] = React.useState(false)

  const loadMore = React.useCallback(() => {
    if (visibleCount >= items.length || loading) return

    setLoading(true)

    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + batchSize, items.length))
      setLoading(false)
    }, 300)
  }, [visibleCount, items.length, batchSize, loading])

  const visibleItems = items.slice(0, visibleCount)

  return (
    <div>
      {visibleItems.map(renderItem)}

      {visibleCount < items.length && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : `Load More (${items.length - visibleCount} remaining)`}
          </button>
        </div>
      )}

      {renderPlaceholder && loading && (
        <div className="space-y-4">
          {Array.from({ length: Math.min(batchSize, items.length - visibleCount) }).map((_, i) => (
            <div key={i}>
              {renderPlaceholder()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Image lazy loading component
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  placeholder?: string
  threshold?: number
  rootMargin?: string
  onLoad?: () => void
  onError?: () => void
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  placeholder,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  alt,
  className = '',
  ...props
}) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder || '')
  const [imageRef, setImageRef] = React.useState<HTMLImageElement | null>(null)
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    if (!imageRef) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image()
          img.onload = () => {
            setImageSrc(src)
            setLoaded(true)
            onLoad?.()
          }
          img.onerror = () => {
            onError?.()
          }
          img.src = src
          observer.unobserve(entry.target)
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(imageRef)

    return () => {
      if (imageRef) {
        observer.unobserve(imageRef)
      }
    }
  }, [src, threshold, rootMargin, onLoad, onError])

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${!loaded ? 'animate-pulse' : ''}`}
      {...props}
    />
  )
}