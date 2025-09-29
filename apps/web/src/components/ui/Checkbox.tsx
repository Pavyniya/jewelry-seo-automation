import React, { forwardRef } from 'react'

interface CheckboxProps {
  checked?: boolean
  // eslint-disable-next-line no-unused-vars
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
  'aria-label'?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked = false, onCheckedChange, disabled = false, className = '', id, 'aria-label': ariaLabel }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`
          h-4 w-4 rounded border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-700
          text-primary-600 focus:ring-primary-500
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:ring-2 focus:ring-offset-2
          ${className}
        `}
      />
    )
  }
)

Checkbox.displayName = 'Checkbox'