import React, { useState, useCallback, useMemo } from 'react'
import { X, Keyboard, Command } from 'lucide-react'
import { Card } from './Card'
import { Button } from './Button'
import { commonShortcuts, formatShortcut } from '@/hooks/useKeyboardNavigation'
import { useMemoizedCallback } from '@/hooks/useMemoizedCallback'

interface KeyboardShortcutHelpProps {
  onClose: () => void
}

interface ShortcutGroup {
  category: string
  shortcuts: typeof commonShortcuts
}

export const KeyboardShortcutHelp: React.FC<KeyboardShortcutHelpProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filterShortcuts = useMemoizedCallback((shortcuts: typeof commonShortcuts, query: string) => {
    if (!query) return shortcuts
    return shortcuts.filter(shortcut =>
      shortcut.description.toLowerCase().includes(query.toLowerCase()) ||
      shortcut.key.toLowerCase().includes(query.toLowerCase())
    )
  }, [], { maxCacheSize: 20 })

  const shortcutGroups: ShortcutGroup[] = useMemo(() => [
    {
      category: 'Global',
      shortcuts: filterShortcuts(commonShortcuts.filter(s => s.category === 'global'), searchQuery)
    },
    {
      category: 'Navigation',
      shortcuts: filterShortcuts(commonShortcuts.filter(s => s.category === 'navigation'), searchQuery)
    },
    {
      category: 'Actions',
      shortcuts: filterShortcuts(commonShortcuts.filter(s => s.category === 'actions'), searchQuery)
    },
    {
      category: 'Forms',
      shortcuts: filterShortcuts(commonShortcuts.filter(s => s.category === 'forms'), searchQuery)
    }
  ], [filterShortcuts, searchQuery])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <Keyboard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quick navigation and actions
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {shortcutGroups.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.length > 0 ? (
                  group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.ctrlKey && (
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                            {navigator.platform.includes('Mac') ? <Command className="w-3 h-3" /> : <span className="text-xs">Ctrl</span>}
                          </kbd>
                        )}
                        {shortcut.shiftKey && (
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                            ⇧
                          </kbd>
                        )}
                        {shortcut.altKey && (
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                            ⌥
                          </kbd>
                        )}
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                          {shortcut.key.toUpperCase()}
                        </kbd>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No shortcuts found
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Press <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">ESC</kbd> to close
            </p>
            <Button onClick={onClose} size="sm">
              Got it
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Re-export the formatShortcut function for use in other components
export { formatShortcut }