import React, { forwardRef } from 'react'

interface InputProps {
  type?: string
  placeholder?: string
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  className?: string
  id?: string
  'aria-label'?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ type = 'text', placeholder, value, onChange, disabled = false, className = '', id, 'aria-label': ariaLabel }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`
          px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
          placeholder-gray-500 dark:placeholder-gray-400
          focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      />
    )
  }
)

Input.displayName = 'Input'