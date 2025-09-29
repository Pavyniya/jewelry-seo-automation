import React, { useRef, useState, useEffect, useCallback } from 'react'

export interface SwipeableProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  className?: string
  disabled?: boolean
  preventDefault?: boolean
}

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = '',
  disabled = false,
  preventDefault = true,
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null)
  const [touchEnd, setTouchEnd] = useState<TouchPoint | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)

  const getTouchPoint = (touch: Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    timestamp: Date.now(),
  })

  const getDistance = (start: TouchPoint, end: TouchPoint) => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getAngle = (start: TouchPoint, end: TouchPoint) => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    return Math.atan2(dy, dx) * 180 / Math.PI
  }

  const getDirection = (angle: number) => {
    if (angle >= -45 && angle < 45) return 'right'
    if (angle >= 45 && angle < 135) return 'down'
    if (angle >= 135 || angle < -135) return 'left'
    return 'up'
  }

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (disabled) return

    const touch = event.touches[0]
    setTouchStart(getTouchPoint(touch))
    setTouchEnd(null)
    setIsSwiping(true)

    if (preventDefault) {
      event.preventDefault()
    }
  }, [disabled, preventDefault])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (disabled || !touchStart) return

    const touch = event.touches[0]
    setTouchEnd(getTouchPoint(touch))

    if (preventDefault) {
      event.preventDefault()
    }
  }, [disabled, touchStart, preventDefault])

  const handleTouchEnd = useCallback(() => {
    if (disabled || !touchStart || !touchEnd) {
      setIsSwiping(false)
      return
    }

    const distance = getDistance(touchStart, touchEnd)
    const angle = getAngle(touchStart, touchEnd)
    const direction = getDirection(angle)

    if (distance >= threshold) {
      const velocity = distance / (touchEnd.timestamp - touchStart.timestamp)

      switch (direction) {
        case 'left':
          onSwipeLeft?.()
          break
        case 'right':
          onSwipeRight?.()
          break
        case 'up':
          onSwipeUp?.()
          break
        case 'down':
          onSwipeDown?.()
          break
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
    setIsSwiping(false)
  }, [disabled, touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault })
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault })
    element.addEventListener('touchend', handleTouchEnd)
    element.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault])

  return (
    <div
      ref={elementRef}
      className={`
        relative touch-none
        ${isSwiping ? 'cursor-grabbing' : 'cursor-grab'}
        ${className}
      `}
      style={{
        touchAction: preventDefault ? 'none' : 'auto',
      }}
    >
      {children}
      {isSwiping && touchStart && touchEnd && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-1 h-full bg-primary-400 opacity-50 transition-all"
            style={{
              left: Math.min(touchStart.x, touchEnd.x),
              width: Math.abs(touchEnd.x - touchStart.x),
            }}
          />
        </div>
      )}
    </div>
  )
}

Swipeable.displayName = 'Swipeable'

// Hook for pull-to-refresh functionality
export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  threshold = 100
) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    if (scrollTop === 0) {
      setPullDistance(0)
    }
  }, [])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const touches = event.touches
    if (touches.length === 0) return

    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    if (scrollTop > 0) return

    const touch = touches[0]
    const distance = touch.clientY

    if (distance > 0) {
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5))
      setCanRefresh(distance >= threshold)
    }
  }, [threshold])

  const handleTouchEnd = useCallback(async () => {
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setCanRefresh(false)
      }
    }
    setPullDistance(0)
  }, [canRefresh, isRefreshing, onRefresh])

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    pullDistance,
    isRefreshing,
    canRefresh,
    refreshIndicator: (
      <div
        className="fixed top-0 left-0 right-0 flex justify-center items-center transition-transform duration-200 z-50"
        style={{
          transform: `translateY(${pullDistance > 0 ? pullDistance - 50 : -50}px)`,
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-4">
          {isRefreshing ? (
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="text-primary-600">
              <svg
                className={`w-6 h-6 transition-transform duration-200 ${
                  canRefresh ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    ),
  }
}