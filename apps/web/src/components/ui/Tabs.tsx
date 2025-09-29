import React, { useState, useRef } from 'react'
import { useAnnouncement, generateId } from '@/utils/accessibility'

export interface Tab {
  id: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

export interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  variant?: 'underline' | 'pills' | 'bordered'
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'horizontal' | 'vertical'
}

const variantClasses = {
  underline: {
    container: 'border-b border-gray-200 dark:border-gray-700',
    tab: (isActive: boolean) =>
      `border-b-2 font-medium ${
        isActive
          ? 'border-primary-600 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
      }`,
  },
  pills: {
    container: 'space-x-1',
    tab: (isActive: boolean) =>
      `rounded-md font-medium ${
        isActive
          ? 'bg-primary-600 text-white'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700'
      }`,
  },
  bordered: {
    container: 'border border-gray-200 dark:border-gray-700 rounded-lg p-1 space-x-1',
    tab: (isActive: boolean) =>
      `rounded-md font-medium ${
        isActive
          ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700'
      }`,
  },
}

const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

const orientationClasses = {
  horizontal: 'flex',
  vertical: 'flex-col space-y-1',
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'underline',
  size = 'md',
  orientation = 'horizontal',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  const tabListRef = useRef<HTMLDivElement>(null)
  const { announce } = useAnnouncement()

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)

    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      announce(`Switched to ${tab.label} tab`)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, tabId: string) => {
    const tabsArray = Array.from(tabListRef.current?.children || [])
    const currentIndex = tabsArray.findIndex(child =>
      child.getAttribute('data-tab-id') === tabId
    )

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = (currentIndex + 1) % tabsArray.length
        const nextTab = tabsArray[nextIndex].getAttribute('data-tab-id')
        if (nextTab) handleTabChange(nextTab)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = (currentIndex - 1 + tabsArray.length) % tabsArray.length
        const prevTab = tabsArray[prevIndex].getAttribute('data-tab-id')
        if (prevTab) handleTabChange(prevTab)
        break
      case 'Home':
        event.preventDefault()
        const firstTab = tabsArray[0].getAttribute('data-tab-id')
        if (firstTab) handleTabChange(firstTab)
        break
      case 'End':
        event.preventDefault()
        const lastTab = tabsArray[tabsArray.length - 1].getAttribute('data-tab-id')
        if (lastTab) handleTabChange(lastTab)
        break
    }
  }

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className="w-full">
      {/* Tab List */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-orientation={orientation}
        className={`${variantClasses[variant].container} ${orientationClasses[orientation]}`}
      >
        {tabs.map((tab) => {
          const tabId = generateId(`tab-${tab.id}`)
          const panelId = generateId(`panel-${tab.id}`)

          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={panelId}
              aria-disabled={tab.disabled}
              tabIndex={activeTab === tab.id ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              onKeyDown={(e) => !tab.disabled && handleKeyDown(e, tab.id)}
              className={`
                ${sizeClasses[size]}
                ${variantClasses[variant].tab(activeTab === tab.id)}
                ${orientation === 'vertical' ? 'w-full text-left' : ''}
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              `}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {tabs.map((tab) => {
          const tabId = generateId(`tab-${tab.id}`)
          const panelId = generateId(`panel-${tab.id}`)

          return (
            <div
              key={tab.id}
              id={panelId}
              role="tabpanel"
              aria-labelledby={tabId}
              tabIndex={0}
              hidden={activeTab !== tab.id}
              className={`
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded
                ${activeTab === tab.id ? 'block' : 'hidden'}
              `}
            >
              {tab.content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

Tabs.displayName = 'Tabs'