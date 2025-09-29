import React, { forwardRef, useRef, useState, useEffect } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link' | 'secondary' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  className?: string
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  ripple?: boolean
  loadingText?: string
  loader?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  onClick,
  type = 'button',
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ripple = true,
  loadingText,
  loader,
  ...props
}, ref) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    if (ripple && buttonRef.current && !disabled && !loading) {
      const button = buttonRef.current

      const handleClick = (e: MouseEvent) => {
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const newRipple = { x, y, id: Date.now() }
        setRipples(prev => [...prev, newRipple])

        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== newRipple.id))
        }, 600)
      }

      button.addEventListener('click', handleClick)

      // Touch feedback
      const handleTouchStart = () => setIsPressed(true)
      const handleTouchEnd = () => setIsPressed(false)

      button.addEventListener('touchstart', handleTouchStart)
      button.addEventListener('touchend', handleTouchEnd)
      button.addEventListener('touchcancel', handleTouchEnd)

      return () => {
        button.removeEventListener('click', handleClick)
        button.removeEventListener('touchstart', handleTouchStart)
        button.removeEventListener('touchend', handleTouchEnd)
        button.removeEventListener('touchcancel', handleTouchEnd)
      }
    }
  }, [ripple, disabled, loading])

  const mergedRef = (node: HTMLButtonElement) => {
    buttonRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden'

  const variantClasses = {
    default: 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:ring-primary-500',
    outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-gray-500',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 focus:ring-red-500',
    link: 'text-primary-600 dark:text-primary-400 hover:underline bg-transparent hover:bg-transparent focus:ring-primary-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 focus:ring-gray-500',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 focus:ring-emerald-500',
    warning: 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 focus:ring-amber-500',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
    icon: 'p-2',
  }

  const isDisabled = disabled || loading

  const defaultLoader = (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  const displayLoader = loader || defaultLoader
  const displayText = loading ? (loadingText || 'Loading...') : children

  return (
    <button
      ref={mergedRef}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${loading ? 'cursor-not-allowed' : ''}
        ${ripple ? 'overflow-hidden' : ''}
        ${isPressed && !loading ? 'scale-95 active:scale-95' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Ripple effects */}
      {ripple && ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute block bg-white/30 rounded-full animate-ripple"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}

      {loading && (
        <span className="mr-2" aria-hidden="true">
          {displayLoader}
        </span>
      )}

      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2" aria-hidden="true">
          {icon}
        </span>
      )}

      <span className="flex items-center">
        {displayText}
      </span>

      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  )
})

Button.displayName = 'Button'