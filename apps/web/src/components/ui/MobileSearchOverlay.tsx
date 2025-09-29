import React, { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from './Button'
import SearchInput, { SearchResult } from './SearchInput'

interface MobileSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  onResultSelect?: (result: SearchResult) => void
}

const MobileSearchOverlay: React.FC<MobileSearchOverlayProps> = ({
  isOpen,
  onClose,
  onResultSelect
}) => {
  const [isMounted, setIsMounted] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsMounted(true)

    // Focus search input when opened
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }

    // Handle escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isMounted) return null

  return (
    <div
      className={`fixed inset-0 z-50 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 flex-1">
          <Search className="w-5 h-5 text-gray-400" />
          <SearchInput
            ref={searchInputRef}
            placeholder="Search products, reviews, settings..."
            className="flex-1"
            showRecent={false}
            showFilters={false}
            onResultSelect={(result) => {
              onResultSelect?.(result)
              onClose()
            }}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="ml-2"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick Access Categories */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quick Access
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              window.location.href = '/products'
              onClose()
            }}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Products
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Manage your jewelry catalog
            </div>
          </button>
          <button
            onClick={() => {
              window.location.href = '/reviews'
              onClose()
            }}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Reviews
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Content review queue
            </div>
          </button>
          <button
            onClick={() => {
              window.location.href = '/analytics'
              onClose()
            }}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Analytics
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              SEO performance metrics
            </div>
          </button>
          <button
            onClick={() => {
              window.location.href = '/settings'
              onClose()
            }}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Settings
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Configure preferences
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileSearchOverlay