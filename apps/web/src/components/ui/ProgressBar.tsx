import React from 'react'
import { generateId } from '@/utils/accessibility'

export interface ProgressBarProps {
  value: number
  min?: number
  max?: number
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  indeterminate?: boolean
  animated?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
}

const sizeClasses = {
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
}

const variantClasses = {
  default: 'bg-primary-600',
  success: 'bg-emerald-600',
  warning: 'bg-amber-600',
  error: 'bg-red-600',
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  min = 0,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  variant = 'default',
  indeterminate = false,
  animated = true,
  ariaLabel,
  ariaDescribedBy,
}) => {
  const progressId = generateId('progress')
  const valueId = generateId('progress-value')

  // Calculate percentage
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100)

  // Generate status text for screen readers
  const getStatusText = () => {
    if (indeterminate) return 'Loading, please wait'
    return `${Math.round(percentage)}% complete`
  }

  return (
    <div className="w-full">
      {/* Label */}
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <label
              htmlFor={progressId}
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {label}
            </label>
          )}
          {showValue && (
            <span
              id={valueId}
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              {indeterminate ? 'Loading...' : `${Math.round(percentage)}%`}
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div
        role="progressbar"
        id={progressId}
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={getStatusText()}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy || (showValue ? valueId : undefined)}
        className={`
          w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
          ${sizeClasses[size]}
        `}
      >
        <div
          className={`
            h-full rounded-full transition-all duration-300 ease-out
            ${variantClasses[variant]}
            ${animated && !indeterminate ? 'animate-pulse' : ''}
            ${indeterminate
              ? 'animate-indeterminate-progress bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 bg-[length:200%_100%]'
              : ''
            }
          `}
          style={{
            width: indeterminate ? '100%' : `${percentage}%`,
          }}
        />
      </div>

      {/* Screen reader only status */}
      <div className="sr-only" aria-live="polite">
        {getStatusText()}
      </div>
    </div>
  )
}

ProgressBar.displayName = 'ProgressBar'