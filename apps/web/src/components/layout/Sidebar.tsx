import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Settings,
  LogOut,
  X,
  Sun,
  Moon,
  FileText,
  Zap,
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Reviews', href: '/reviews', icon: MessageSquare },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'SEO Analytics', href: '/seo-analytics', icon: TrendingUp },
  { name: 'Automation', href: '/automation', icon: Zap },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:bg-white lg:dark:bg-gray-800 lg:border-r lg:border-gray-200 lg:dark:border-gray-700">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">OG</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Ohh Glam</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-3 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-r-2 border-primary-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
                onClick={onClose}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Theme toggle and user section */}
          <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="mr-3 h-5 w-5 flex-shrink-0" />
                  Dark Mode
                </>
              ) : (
                <>
                  <Sun className="mr-3 h-5 w-5 flex-shrink-0" />
                  Light Mode
                </>
              )}
            </button>

            <div className="mt-3 flex items-center px-3 py-2">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'user@example.com'}</p>
              </div>
              <button
                onClick={logout}
                className="ml-3 flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
            onClick={onClose}
          />

          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
              {/* Close button */}
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">OG</span>
                  </div>
                  <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Ohh Glam</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="mt-8 flex-1 px-3 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                    onClick={onClose}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>

              {/* Theme toggle and user section */}
              <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="mr-3 h-5 w-5 flex-shrink-0" />
                      Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="mr-3 h-5 w-5 flex-shrink-0" />
                      Light Mode
                    </>
                  )}
                </button>

                <div className="mt-3 flex items-center px-3 py-2">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-medium">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="ml-3 flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300"
                    title="Sign out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar