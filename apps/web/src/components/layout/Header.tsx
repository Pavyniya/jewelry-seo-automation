import React, { Fragment, useState, useCallback } from 'react'
import { Menu, Bell, Search, Settings, LogOut, User, Keyboard } from 'lucide-react'
import { Popover, Transition } from '@headlessui/react'
import { useAuthStore } from '@/stores/authStore'
import { useKeyboardNavigation, commonShortcuts } from '@/hooks/useKeyboardNavigation'
import { KeyboardShortcutHelp } from '@/components/ui/KeyboardShortcutHelp'
import { Button } from '@/components/ui/Button'
import SearchInput from '@/components/ui/SearchInput'
import MobileSearchOverlay from '@/components/ui/MobileSearchOverlay'

interface HeaderProps {
  title?: string
  onMenuClick?: () => void
}

const Header: React.FC<HeaderProps> = ({ title = 'Dashboard', onMenuClick }) => {
  const { user, logout } = useAuthStore()
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  // Initialize keyboard navigation
  useKeyboardNavigation(commonShortcuts)

  const toggleShortcutsHelp = useCallback(() => {
    setShowShortcutsHelp(!showShortcutsHelp)
  }, [showShortcutsHelp])

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={onMenuClick}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Mobile search button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setShowMobileSearch(true)}
              aria-label="Search"
            >
              <Search className="h-6 w-6" />
            </button>

            {/* Page title */}
            <div className="ml-4 lg:ml-0">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden lg:block flex-1 max-w-md">
              <SearchInput
                placeholder="Search products, reviews, settings..."
                onResultSelect={(result) => {
                  console.log('Selected search result:', result)
                }}
              />
            </div>

            {/* Keyboard shortcuts help */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleShortcutsHelp}
              className="text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200"
              title="Keyboard shortcuts (?)"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <button
              type="button"
              className="p-1 rounded-full text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              aria-label="Notifications"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
              {/* Notification badge */}
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800" />
            </button>

            {/* User menu */}
            <Popover className="relative">
              <Popover.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Popover.Panel className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black dark:ring-gray-600 ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                  </div>

                  <div className="py-1">
                    <a
                      href="#"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <User className="mr-3 h-4 w-4" />
                      Profile
                    </a>
                    <a
                      href="#"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Settings
                    </a>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 py-1">
                    <button
                      onClick={logout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </Popover.Panel>
              </Transition>
            </Popover>

            {/* Keyboard Shortcuts Help Modal */}
            {showShortcutsHelp && (
              <KeyboardShortcutHelp onClose={toggleShortcutsHelp} />
            )}

            {/* Mobile Search Overlay */}
            {showMobileSearch && (
              <MobileSearchOverlay
                isOpen={showMobileSearch}
                onClose={() => setShowMobileSearch(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header