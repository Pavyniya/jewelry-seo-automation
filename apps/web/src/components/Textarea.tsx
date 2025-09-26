import React, { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  charCount?: {
    current: number
    max: number
  }
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      required = false,
      charCount,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error
    const isCharLimitExceeded = charCount && charCount.current > charCount.max

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium',
              hasError ? 'text-red-600' : 'text-gray-700'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            value={value}
            className={cn(
              'block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              'resize-none',
              hasError || isCharLimitExceeded
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : '',
              className
            )}
            {...props}
          />

          {/* Character Count */}
          {charCount && (
            <div className={cn(
              'absolute bottom-2 right-2 text-xs',
              isCharLimitExceeded ? 'text-red-600' : 'text-gray-500'
            )}>
              {charCount.current}/{charCount.max}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}

        {/* Character Limit Warning */}
        {charCount && isCharLimitExceeded && (
          <p className="text-sm text-red-600">
            Character limit exceeded by {charCount.current - charCount.max} characters
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'