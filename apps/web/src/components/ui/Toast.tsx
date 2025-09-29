import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Announcer, generateId } from '@/utils/accessibility'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id?: string
  type: ToastType
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  onClose?: () => void
  className?: string
}

const ToastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const ToastColors = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-900 dark:text-green-100',
    description: 'text-green-700 dark:text-green-300',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-100',
    description: 'text-red-700 dark:text-red-300',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-900 dark:text-yellow-100',
    description: 'text-yellow-700 dark:text-yellow-300',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-100',
    description: 'text-blue-700 dark:text-blue-300',
  },
}

export const Toast: React.FC<ToastProps> = ({
  id = generateId('toast'),
  type,
  title,
  description,
  action,
  duration = 5000,
  onClose,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)

  const Icon = ToastIcons[type]
  const colors = ToastColors[type]

  useEffect(() => {
    if (duration <= 0) return

    let timer: NodeJS.Timeout

    if (!isPaused && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 100)
      }, 100)
    } else if (timeLeft <= 0) {
      handleClose()
    }

    return () => clearTimeout(timer)
  }, [timeLeft, isPaused, duration])

  useEffect(() => {
    // Announce to screen readers
    Announcer.announce(`${title}${description ? `: ${description}` : ''}`, 'polite')
  }, [title, description])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()

    // Announce removal to screen readers
    setTimeout(() => {
      Announcer.announce('Toast notification dismissed', 'polite')
    }, 100)
  }

  const handlePause = () => {
    setIsPaused(true)
  }

  const handleResume = () => {
    setIsPaused(false)
  }

  if (!isVisible) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300',
        colors.bg,
        colors.border,
        className
      )}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
      tabIndex={0}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Icon className={cn('h-5 w-5', colors.icon)} aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={cn('text-sm font-medium', colors.title)}>
            {title}
          </h4>

          {description && (
            <p className={cn('mt-1 text-sm', colors.description)}>
              {description}
            </p>
          )}

          {action && (
            <div className="mt-3">
              <button
                type="button"
                onClick={action.onClick}
                className={cn(
                  'text-sm font-medium underline',
                  colors.title.replace('900', '600').replace('100', '400')
                )}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              'inline-flex rounded-md p-1.5',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              colors.title.replace('900', '600').replace('100', '400')
            )}
            aria-label="Close notification"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {duration > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div
              className={cn(
                'h-1 rounded-full transition-all duration-100',
                {
                  'bg-green-600 dark:bg-green-500': type === 'success',
                  'bg-red-600 dark:bg-red-500': type === 'error',
                  'bg-yellow-600 dark:bg-yellow-500': type === 'warning',
                  'bg-blue-600 dark:bg-blue-500': type === 'info',
                }
              )}
              style={{
                width: `${(timeLeft / duration) * 100}%`,
              }}
              role="progressbar"
              aria-valuenow={Math.round((timeLeft / duration) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Notification progress"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Toast provider and context
interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id'>) => string
  removeToast: (id: string) => void
  clearAllToasts: () => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: React.ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  limit?: number
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  limit = 5,
}) => {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([])

  const showToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = generateId('toast')
    const newToast = { ...toast, id }

    setToasts(prev => {
      const updated = [...prev, newToast]
      if (updated.length > limit) {
        return updated.slice(-limit)
      }
      return updated
    })

    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAllToasts = () => {
    setToasts([])
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      default:
        return 'top-4 right-4'
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, removeToast, clearAllToasts }}>
      {children}

      {/* Toast container */}
      <div
        className={cn(
          'fixed z-50 space-y-2',
          getPositionClasses()
        )}
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}