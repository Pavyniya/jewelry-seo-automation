import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Save,
  Eye,
  LayoutGrid,
  List,
  Calendar,
  Clock,
  Bell,
  Monitor,
  Palette
} from 'lucide-react'
import { useUserPreferences } from '@/stores/userPreferencesStore'
import { useToast } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

interface TabProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  icon: React.ReactNode
}

const Tab: React.FC<TabProps> = ({ active, onClick, children, icon }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
      ${active
        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
      }
    `}
  >
    {icon}
    <span>{children}</span>
  </button>
)

const UserPreferencesContent: React.FC = () => {
  const {
    products,
    tables,
    notifications,
    dashboard,
    display,
    updateProductPreferences,
    updateTablePreferences,
    updateNotificationPreferences,
    updateDashboardPreferences,
    updateDisplayPreferences,
    resetProductPreferences,
    resetTablePreferences,
    resetNotificationPreferences,
    resetDashboardPreferences,
    resetDisplayPreferences,
    exportPreferences,
    importPreferences,
    formatDate,
    formatCurrency,
  } = useUserPreferences()

  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('display')
  const [fileInputKey, setFileInputKey] = useState(0)

  const handleExportPreferences = () => {
    const preferencesData = exportPreferences()
    const blob = new Blob([preferencesData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ohh-glam-preferences-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast({
      type: 'success',
      title: 'Preferences Exported',
      description: 'Your preferences have been exported successfully.',
    })
  }

  const handleImportPreferences = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const success = importPreferences(content)

      if (success) {
        showToast({
          type: 'success',
          title: 'Preferences Imported',
          description: 'Your preferences have been imported successfully.',
        })
      } else {
        showToast({
          type: 'error',
          title: 'Import Failed',
          description: 'The preferences file is invalid or corrupted.',
        })
      }

      // Reset file input to allow importing the same file again
      setFileInputKey(prev => prev + 1)
    }
    reader.readAsText(file)
  }

  const tabs = [
    { id: 'display', label: 'Display', icon: <Monitor className="h-4 w-4" /> },
    { id: 'products', label: 'Products', icon: <LayoutGrid className="h-4 w-4" /> },
    { id: 'tables', label: 'Tables', icon: <List className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <Eye className="h-4 w-4" /> },
  ]

  const renderDisplayTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Format
              </label>
              <select
                value={display.dateFormat}
                onChange={(e) => updateDisplayPreferences({ dateFormat: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Example: {formatDate(new Date())}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Format
              </label>
              <select
                value={display.timeFormat}
                onChange={(e) => updateDisplayPreferences({ timeFormat: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={display.currency}
                onChange={(e) => updateDisplayPreferences({ currency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Example: {formatCurrency(1234.56)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <select
                value={display.timezone}
                onChange={(e) => updateDisplayPreferences({ timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderProductsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Product Display
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default View Mode
              </label>
              <select
                value={products.viewMode}
                onChange={(e) => updateProductPreferences({ viewMode: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="grid">Grid View</option>
                <option value="list">List View</option>
                <option value="compact">Compact View</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Items Per Page
              </label>
              <select
                value={products.itemsPerPage}
                onChange={(e) => updateProductPreferences({ itemsPerPage: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="6">6 items</option>
                <option value="12">12 items</option>
                <option value="24">24 items</option>
                <option value="48">48 items</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Sort By
              </label>
              <select
                value={products.sortBy}
                onChange={(e) => updateProductPreferences({ sortBy: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="title">Title</option>
                <option value="price">Price</option>
                <option value="date">Date</option>
                <option value="seoScore">SEO Score</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort Order
              </label>
              <select
                value={products.sortOrder}
                onChange={(e) => updateProductPreferences({ sortOrder: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={products.showAdvancedFilters}
                onChange={(e) => updateProductPreferences({ showAdvancedFilters: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show advanced filters</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={products.autoRefresh}
                onChange={(e) => updateProductPreferences({ autoRefresh: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto-refresh products</span>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTabs = () => {
    switch (activeTab) {
      case 'display':
        return renderDisplayTab()
      case 'products':
        return renderProductsTab()
      case 'tables':
        return <div className="text-center py-8 text-gray-500">Table preferences coming soon...</div>
      case 'notifications':
        return <div className="text-center py-8 text-gray-500">Notification preferences coming soon...</div>
      case 'dashboard':
        return <div className="text-center py-8 text-gray-500">Dashboard preferences coming soon...</div>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Preferences
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize your experience and manage your settings.
          </p>
        </div>
        <div className="flex space-x-2">
          <input
            key={fileInputKey}
            type="file"
            accept=".json"
            onChange={handleImportPreferences}
            className="hidden"
            id="import-preferences"
          />
          <label htmlFor="import-preferences">
            <Button variant="outline" asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
          </label>

          <Button variant="outline" onClick={handleExportPreferences}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              switch (activeTab) {
                case 'display':
                  resetDisplayPreferences()
                  break
                case 'products':
                  resetProductPreferences()
                  break
                case 'tables':
                  resetTablePreferences()
                  break
                case 'notifications':
                  resetNotificationPreferences()
                  break
                case 'dashboard':
                  resetDashboardPreferences()
                  break
              }
              showToast({
                type: 'success',
                title: 'Preferences Reset',
                description: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} preferences have been reset to defaults.`,
              })
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
            >
              {tab.label}
            </Tab>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabs()}
    </div>
  )
}

const UserPreferences: React.FC = () => {
  return (
    <ErrorBoundary>
      <UserPreferencesContent />
    </ErrorBoundary>
  )
}

export default UserPreferences