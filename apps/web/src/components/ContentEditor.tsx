import React, { useState, useRef, useEffect } from 'react'
import { Textarea } from './Textarea'
import { cn } from '@/utils/cn'

interface ContentEditorProps {
  value: string
  // eslint-disable-next-line no-unused-vars
  onChange: (value: string) => void
  // eslint-disable-next-line no-unused-vars
  onSave?: (value: string) => void
  onCancel?: () => void
  placeholder?: string
  label?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  maxLength?: number
  showActions?: boolean
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = 'Enter your content...',
  label,
  disabled = false,
  loading = false,
  className = '',
  maxLength = 5000,
  showActions = true
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const [isDirty, setIsDirty] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocalValue(value)
    setIsDirty(false)
  }, [value])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      )
    }
  }, [isEditing])

  const handleEdit = () => {
    setIsEditing(true)
    setLocalValue(value)
  }

  const handleSave = () => {
    if (isDirty && localValue.trim()) {
      onChange(localValue)
      onSave?.(localValue)
    }
    setIsEditing(false)
    setIsDirty(false)
  }

  const handleCancel = () => {
    setLocalValue(value)
    setIsEditing(false)
    setIsDirty(false)
    onCancel?.()
  }

  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    setIsDirty(newValue !== value)
    onChange(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    }
  }

  if (isEditing) {
    return (
      <div className={cn('space-y-3', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}

        <Textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || loading}
          charCount={{
            current: localValue.length,
            max: maxLength
          }}
          rows={6}
          onKeyDown={handleKeyDown}
        />

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">Ctrl</kbd> +
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded ml-1">Enter</kbd> to save •
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded ml-2">Esc</kbd> to cancel
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !isDirty || !localValue.trim()}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <button
            onClick={handleEdit}
            disabled={disabled || loading}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Edit
          </button>
        </div>
      )}

      {/* Content Display */}
      <div className="relative">
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px]">
          {localValue ? (
            <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
              {localValue}
            </div>
          ) : (
            <div className="text-gray-500 italic">
              No content available
            </div>
          )}
        </div>

        {/* Edit Button Overlay */}
        <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            disabled={disabled || loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Edit content"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>

        {/* Character Count */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          {localValue.length}/{maxLength}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Click "Edit" to modify content
        </span>
        <span>
          {localValue.length} characters
        </span>
      </div>
    </div>
  )
}