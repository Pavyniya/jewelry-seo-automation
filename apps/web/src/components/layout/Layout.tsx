import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { BreadcrumbNav } from '@/components/ui/Breadcrumb'

interface LayoutProps {
  children?: React.ReactNode
}

const Layout: React.FC<LayoutProps> = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top navigation */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Breadcrumb navigation */}
              <div className="mb-6">
                <BreadcrumbNav autoGenerate showHome={true} />
              </div>

              <Outlet />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <p>&copy; 2025 Ohh Glam. All rights reserved.</p>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Privacy</a>
                <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Terms</a>
                <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Layout