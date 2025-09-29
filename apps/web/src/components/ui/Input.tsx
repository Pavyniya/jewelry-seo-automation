import React, { forwardRef, useState } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  placeholder?: string
  value?: string | number
  // eslint-disable-next-line no-unused-vars
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  // eslint-disable-next-line no-unused-vars
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  // eslint-disable-next-line no-unused-vars
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  className?: string
  id?: string
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyDown,
  onKeyUp,
  disabled = false,
  className = '',
  id,
  label,
  error,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  maxLength,
  minLength,
  pattern,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [inputType, setInputType] = useState(type)

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  React.useEffect(() => {
    if (type === 'password' && showPasswordToggle) {
      setInputType(showPassword ? 'text' : 'password')
    }
  }, [showPassword, type, showPasswordToggle])

  const handleTogglePassword = () => {
    setShowPassword(!showPassword)
  }

  const hasError = !!error
  const hasIcon = leftIcon || rightIcon || (type === 'password' && showPasswordToggle)

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`
            block text-sm font-medium mb-1
            ${hasError
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-700 dark:text-gray-300'
            }
          `}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          )}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 dark:text-gray-400" aria-hidden="true">
              {leftIcon}
            </span>
          </div>
        )}

        <input
          ref={ref}
          type={inputType}
          id={inputId}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          aria-required={required}
          className={`
            block w-full px-3 py-2 border rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            ${hasError
              ? 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600'
            }
            ${leftIcon ? 'pl-10' : ''}
            ${hasIcon ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 dark:text-gray-400" aria-hidden="true">
              {rightIcon}
            </span>
          </div>
        )}

        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            onClick={handleTogglePassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            <span className="text-gray-500 dark:text-gray-400">
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </span>
          </button>
        )}
      </div>

      {hasError && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}

      {helperText && !hasError && (
        <p
          id={`${inputId}-helper`}
          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'