import React, { useEffect, useRef } from 'react'
import { generateId } from '@/utils/accessibility'

export interface LiveRegionProps {
  children: React.ReactNode
  ariaLive?: 'polite' | 'assertive' | 'off'
  ariaAtomic?: boolean
  ariaRelevant?: 'additions' | 'removals' | 'text' | 'all'
  role?: 'status' | 'alert' | 'log' | 'marquee' | 'timer'
  isVisible?: boolean
  delay?: number
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  ariaLive = 'polite',
  ariaAtomic = true,
  ariaRelevant = 'additions text',
  role = 'status',
  isVisible = false,
  delay = 0,
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (delay > 0 && contentRef.current) {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.textContent = typeof children === 'string' ? children : ''
        }
      }, delay)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [children, delay])

  const id = generateId('live-region')

  return (
    <div
      ref={contentRef}
      id={id}
      role={role}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      aria-relevant={ariaRelevant}
      className={`
        ${isVisible ? 'sr-only' : 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap'}
        border-0
      `}
      style={{
        clip: isVisible ? undefined : 'rect(0, 0, 0, 0)',
        clipPath: isVisible ? undefined : 'inset(50%)',
      }}
    >
      {delay === 0 && children}
    </div>
  )
}

LiveRegion.displayName = 'LiveRegion'

// Hook for managing live announcements
export function useLiveAnnouncements() {
  const [announcements, setAnnouncements] = React.useState<Array<{
    id: string
    message: string
    priority: 'polite' | 'assertive'
    timestamp: number
  }>>([])

  const announce = React.useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const id = generateId('announcement')
      setAnnouncements(prev => [
        ...prev,
        { id, message, priority, timestamp: Date.now() }
      ])

      // Remove announcement after it should have been read
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(a => a.id !== id))
      }, 5000)
    },
    []
  )

  return {
    announce,
    announcements: announcements.map(announcement => (
      <LiveRegion
        key={announcement.id}
        ariaLive={announcement.priority}
        role={announcement.priority === 'assertive' ? 'alert' : 'status'}
      >
        {announcement.message}
      </LiveRegion>
    )),
  }
}