import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  category?: 'global' | 'navigation' | 'actions' | 'forms'
}

export interface UseKeyboardNavigationOptions {
  preventDefault?: boolean
  stopPropagation?: boolean
  enabled?: boolean
}

export const useKeyboardNavigation = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardNavigationOptions = {}
) => {
  const { preventDefault = true, stopPropagation = true, enabled = true } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = !!event.ctrlKey === !!shortcut.ctrlKey
        const shiftMatches = !!event.shiftKey === !!shortcut.shiftKey
        const altMatches = !!event.altKey === !!shortcut.altKey
        const metaMatches = !!event.metaKey === !!shortcut.metaKey

        return (
          keyMatches &&
          ctrlMatches &&
          shiftMatches &&
          altMatches &&
          metaMatches
        )
      })

      if (matchingShortcut) {
        if (preventDefault) {
          event.preventDefault()
        }
        if (stopPropagation) {
          event.stopPropagation()
        }

        matchingShortcut.action()
      }
    },
    [shortcuts, preventDefault, stopPropagation, enabled]
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

// Common keyboard shortcuts
export const commonShortcuts: KeyboardShortcut[] = [
  // Global shortcuts
  {
    key: '?',
    action: () => {
      // Show help modal
      console.log('Show keyboard shortcuts help')
    },
    description: 'Show keyboard shortcuts',
    category: 'global'
  },
  {
    key: 'k',
    ctrlKey: true,
    action: () => {
      // Focus search input or open mobile search
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      } else {
        // Trigger mobile search if no desktop search input
        const mobileSearchButton = document.querySelector('[aria-label="Search"]') as HTMLButtonElement
        if (mobileSearchButton) {
          mobileSearchButton.click()
        }
      }
    },
    description: 'Focus search',
    category: 'global'
  },
  {
    key: '/',
    action: () => {
      // Focus search input (alternative)
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    },
    description: 'Focus search (alternative)',
    category: 'global'
  },

  // Navigation shortcuts
  {
    key: 'h',
    altKey: true,
    action: () => {
      // Navigate to home
      window.location.href = '/dashboard'
    },
    description: 'Go to dashboard',
    category: 'navigation'
  },
  {
    key: 'p',
    altKey: true,
    action: () => {
      // Navigate to products
      window.location.href = '/products'
    },
    description: 'Go to products',
    category: 'navigation'
  },
  {
    key: 'a',
    altKey: true,
    action: () => {
      // Navigate to analytics
      window.location.href = '/analytics'
    },
    description: 'Go to analytics',
    category: 'navigation'
  },
  {
    key: 's',
    altKey: true,
    action: () => {
      // Navigate to settings
      window.location.href = '/settings'
    },
    description: 'Go to settings',
    category: 'navigation'
  },

  // Action shortcuts
  {
    key: 'n',
    ctrlKey: true,
    action: () => {
      // Create new item
      const createButton = document.querySelector('[data-action="create"]') as HTMLButtonElement
      if (createButton) {
        createButton.click()
      }
    },
    description: 'Create new item',
    category: 'actions'
  },
  {
    key: 'e',
    ctrlKey: true,
    action: () => {
      // Export data
      const exportButton = document.querySelector('[data-action="export"]') as HTMLButtonElement
      if (exportButton) {
        exportButton.click()
      }
    },
    description: 'Export data',
    category: 'actions'
  },
  {
    key: 'r',
    ctrlKey: true,
    action: () => {
      // Refresh current page
      window.location.reload()
    },
    description: 'Refresh page',
    category: 'actions'
  },
  {
    key: 'f',
    ctrlKey: true,
    action: () => {
      // Open filter panel
      const filterButton = document.querySelector('[data-action="filter"]') as HTMLButtonElement
      if (filterButton) {
        filterButton.click()
      }
    },
    description: 'Open filters',
    category: 'actions'
  },

  // Form shortcuts
  {
    key: 'Escape',
    action: () => {
      // Close modals/dropdowns
      const closeButton = document.querySelector('[data-action="close"]') as HTMLButtonElement
      if (closeButton) {
        closeButton.click()
      }
      // Close any open dropdown
      const openDropdown = document.querySelector('[role="menu"][aria-expanded="true"]')
      if (openDropdown) {
        const trigger = document.querySelector('[aria-haspopup="menu"][aria-expanded="true"]') as HTMLButtonElement
        if (trigger) {
          trigger.click()
        }
      }
    },
    description: 'Close modal/dropdown',
    category: 'forms'
  },
  {
    key: 'Enter',
    action: () => {
      // Submit form
      const activeElement = document.activeElement as HTMLElement
      if (activeElement?.form) {
        const submitButton = activeElement.form.querySelector('button[type="submit"]') as HTMLButtonElement
        if (submitButton) {
          submitButton.click()
        }
      }
    },
    description: 'Submit form',
    category: 'forms'
  },
  {
    key: 's',
    ctrlKey: true,
    shiftKey: true,
    action: () => {
      // Save form
      const saveButton = document.querySelector('[data-action="save"]') as HTMLButtonElement
      if (saveButton) {
        saveButton.click()
      }
    },
    description: 'Save form',
    category: 'forms'
  }
]

// Hook for keyboard shortcuts help modal
export const useShortcutsHelp = () => {
  const showShortcutsHelp = useCallback(() => {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
          <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onclick="this.closest('.fixed').remove()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Global</h3>
            <div class="space-y-1">
              ${commonShortcuts.filter(s => s.category === 'global').map(shortcut => `
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">${shortcut.description}</span>
                  <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    ${formatShortcut(shortcut)}
                  </kbd>
                </div>
              `).join('')}
            </div>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Navigation</h3>
            <div class="space-y-1">
              ${commonShortcuts.filter(s => s.category === 'navigation').map(shortcut => `
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">${shortcut.description}</span>
                  <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    ${formatShortcut(shortcut)}
                  </kbd>
                </div>
              `).join('')}
            </div>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Actions</h3>
            <div class="space-y-1">
              ${commonShortcuts.filter(s => s.category === 'actions').map(shortcut => `
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">${shortcut.description}</span>
                  <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    ${formatShortcut(shortcut)}
                  </kbd>
                </div>
              `).join('')}
            </div>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Forms</h3>
            <div class="space-y-1">
              ${commonShortcuts.filter(s => s.category === 'forms').map(shortcut => `
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">${shortcut.description}</span>
                  <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    ${formatShortcut(shortcut)}
                  </kbd>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }, [])

  return { showShortcutsHelp }
}

// Helper function to format shortcut display
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts = []

  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.shiftKey) parts.push('Shift')
  if (shortcut.altKey) parts.push('Alt')
  if (shortcut.metaKey) parts.push('⌘')

  parts.push(shortcut.key.toUpperCase())

  return parts.join(' + ')
}