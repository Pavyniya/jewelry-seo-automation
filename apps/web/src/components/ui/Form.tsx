import React, { useState, useRef } from 'react'
import { useAnnouncement, generateId, FormValidation } from '@/utils/accessibility'

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio'
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  helpText?: string
  options?: Array<{ value: string; label: string }>
  defaultValue?: string | number | boolean
  validator?: (value: any) => string | null
}

export interface FormProps {
  fields: FormField[]
  onSubmit: (data: Record<string, any>) => void | Promise<void>
  onCancel?: () => void
  submitText?: string
  cancelText?: string
  loading?: boolean
  className?: string
  variant?: 'default' | 'compact' | 'cards'
}

export const Form: React.FC<FormProps> = ({
  fields,
  onSubmit,
  onCancel,
  submitText = 'Submit',
  cancelText = 'Cancel',
  loading = false,
  className = '',
  variant = 'default',
}) => {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initialValues: Record<string, any> = {}
    fields.forEach(field => {
      initialValues[field.name] = field.defaultValue || ''
    })
    return initialValues
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const formRef = useRef<HTMLFormElement>(null)
  const { announce } = useAnnouncement()

  // Generate unique IDs
  const fieldIds = React.useMemo(() => {
    const ids: Record<string, string> = {}
    fields.forEach(field => {
      ids[field.name] = generateId(`field-${field.name}`)
    })
    return ids
  }, [fields])

  const errorIds = React.useMemo(() => {
    const ids: Record<string, string> = {}
    fields.forEach(field => {
      ids[field.name] = generateId(`error-${field.name}`)
    })
    return ids
  }, [fields])

  const helpTextIds = React.useMemo(() => {
    const ids: Record<string, string> = {}
    fields.forEach(field => {
      ids[field.name] = generateId(`help-${field.name}`)
    })
    return ids
  }, [fields])

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value && value !== 0)) {
      return `${field.label} is required`
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return `${field.label} must be a valid email address`
      }
    }

    if (field.validator) {
      return field.validator(value)
    }

    return null
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    let hasErrors = false

    fields.forEach(field => {
      const error = validateField(field, values[field.name])
      if (error) {
        newErrors[field.name] = error
        hasErrors = true
      }
    })

    setErrors(newErrors)
    return !hasErrors
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    setTouched(prev => ({ ...prev, [fieldName]: true }))

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }))
    }

    // Validate field on change for immediate feedback
    const field = fields.find(f => f.name === fieldName)
    if (field) {
      const error = validateField(field, value)
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }))
      } else {
        FormValidation.announceSuccess(field.label)
      }
    }
  }

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))

    const field = fields.find(f => f.name === fieldName)
    if (field) {
      const error = validateField(field, values[fieldName])
      if (error) {
        setErrors(prev => ({ ...prev, [fieldName]: error }))
        FormValidation.announceError(field.label, error)
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {}
    fields.forEach(field => {
      allTouched[field.name] = true
    })
    setTouched(allTouched)

    if (validateForm()) {
      try {
        await onSubmit(values)
        announce('Form submitted successfully')
      } catch (error) {
        announce('Form submission failed')
      }
    } else {
      // Focus on first error
      const firstErrorField = fields.find(field => errors[field.name])
      if (firstErrorField) {
        const errorElement = document.getElementById(fieldIds[firstErrorField.name])
        errorElement?.focus()
      }
      announce('Please fix the errors in the form')
    }
  }

  const renderField = (field: FormField) => {
    const fieldId = fieldIds[field.name]
    const errorId = errorIds[field.name]
    const helpTextId = helpTextIds[field.name]
    const hasError = touched[field.name] && errors[field.name]
    const isDisabled = field.disabled || loading

    const commonProps = {
      id: fieldId,
      name: field.name,
      value: values[field.name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        handleFieldChange(field.name, e.target.value),
      onBlur: () => handleBlur(field.name),
      disabled: isDisabled,
      readOnly: field.readOnly,
      required: field.required,
      'aria-invalid': FormValidation.getAriaInvalid(hasError),
      'aria-describedby': FormValidation.getAriaDescribedBy(
        hasError ? errorId : undefined,
        field.helpText ? helpTextId : undefined
      ),
      className: `
        w-full px-3 py-2 border rounded-md
        ${hasError
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
        }
        disabled:bg-gray-100 disabled:cursor-not-allowed
        dark:bg-gray-700 dark:border-gray-600 dark:text-white
        focus:outline-none focus:ring-2
        transition-colors
      `,
    }

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
            placeholder={field.placeholder}
          />
        )

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select an option...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              {...commonProps}
              checked={!!values[field.name]}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className={`
                w-4 h-4 text-primary-600 border-gray-300 rounded
                focus:ring-primary-500 focus:ring-2
                ${commonProps.className}
              `}
            />
            <label htmlFor={fieldId} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
          </div>
        )

      default:
        return (
          <input
            type={field.type}
            {...commonProps}
            placeholder={field.placeholder}
          />
        )
    }
  }

  const variantClasses = {
    default: 'space-y-6',
    compact: 'space-y-4',
    cards: 'space-y-4',
  }

  const fieldWrapperClasses = {
    default: '',
    compact: '',
    cards: 'bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700',
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`${variantClasses[variant]} ${className}`}
      noValidate
    >
      {fields.map(field => {
        const fieldId = fieldIds[field.name]
        const errorId = errorIds[field.name]
        const helpTextId = helpTextIds[field.name]
        const hasError = touched[field.name] && errors[field.name]

        return (
          <div key={field.name} className={fieldWrapperClasses[variant]}>
            {field.type !== 'checkbox' && (
              <label
                htmlFor={fieldId}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-1" aria-label="required">
                    *
                  </span>
                )}
              </label>
            )}

            {renderField(field)}

            {/* Help text */}
            {field.helpText && (
              <div
                id={helpTextId}
                className="mt-1 text-sm text-gray-500 dark:text-gray-400"
              >
                {field.helpText}
              </div>
            )}

            {/* Error message */}
            {hasError && (
              <div
                id={errorId}
                className="mt-1 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {errors[field.name]}
              </div>
            )}
          </div>
        )
      })}

      {/* Form actions */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            {cancelText}
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : submitText}
        </button>
      </div>
    </form>
  )
}

Form.displayName = 'Form'