import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ProductViewMode = 'grid' | 'list' | 'compact'
export type TableDensity = 'compact' | 'normal' | 'comfortable'
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
export type TimeFormat = '12h' | '24h'
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD'

interface ProductPreferences {
  viewMode: ProductViewMode
  itemsPerPage: number
  sortBy: 'title' | 'price' | 'date' | 'seoScore'
  sortOrder: 'asc' | 'desc'
  showAdvancedFilters: boolean
  autoRefresh: boolean
  refreshInterval: number // in seconds
  selectedColumns: string[]
}

interface TablePreferences {
  density: TableDensity
  stickyHeader: boolean
  showBorders: boolean
  showZebraStripes: boolean
  resizableColumns: boolean
  defaultPageSize: number
}

interface NotificationPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  browserNotifications: boolean
  optimizationAlerts: boolean
  weeklyReports: boolean
  criticalAlerts: boolean
  soundEffects: boolean
}

interface DashboardPreferences {
  defaultView: 'overview' | 'analytics' | 'products' | 'automation'
  collapsedWidgets: string[]
  widgetOrder: string[]
  refreshInterval: number // in seconds
  showWelcomeTour: boolean
}

interface DisplayPreferences {
  dateFormat: DateFormat
  timeFormat: TimeFormat
  timezone: string
  currency: Currency
  numberFormat: string
  language: string
  showRelativeDates: boolean
}

interface UserPreferences {
  // Product preferences
  products: ProductPreferences

  // Table preferences
  tables: TablePreferences

  // Notification preferences
  notifications: NotificationPreferences

  // Dashboard preferences
  dashboard: DashboardPreferences

  // Display preferences
  display: DisplayPreferences

  // Actions
  updateProductPreferences: (preferences: Partial<ProductPreferences>) => void
  updateTablePreferences: (preferences: Partial<TablePreferences>) => void
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void
  updateDashboardPreferences: (preferences: Partial<DashboardPreferences>) => void
  updateDisplayPreferences: (preferences: Partial<DisplayPreferences>) => void

  // Reset actions
  resetProductPreferences: () => void
  resetTablePreferences: () => void
  resetNotificationPreferences: () => void
  resetDashboardPreferences: () => void
  resetDisplayPreferences: () => void
  resetAllPreferences: () => void

  // Export/Import
  exportPreferences: () => string
  importPreferences: (preferencesData: string) => boolean
}

const defaultProductPreferences: ProductPreferences = {
  viewMode: 'grid',
  itemsPerPage: 12,
  sortBy: 'title',
  sortOrder: 'asc',
  showAdvancedFilters: false,
  autoRefresh: false,
  refreshInterval: 300, // 5 minutes
  selectedColumns: ['title', 'price', 'status', 'seoScore', 'lastOptimized'],
}

const defaultTablePreferences: TablePreferences = {
  density: 'normal',
  stickyHeader: true,
  showBorders: true,
  showZebraStripes: true,
  resizableColumns: true,
  defaultPageSize: 25,
}

const defaultNotificationPreferences: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  browserNotifications: false,
  optimizationAlerts: true,
  weeklyReports: true,
  criticalAlerts: true,
  soundEffects: false,
}

const defaultDashboardPreferences: DashboardPreferences = {
  defaultView: 'overview',
  collapsedWidgets: [],
  widgetOrder: ['overview-stats', 'recent-products', 'seo-performance', 'activity-feed'],
  refreshInterval: 60, // 1 minute
  showWelcomeTour: true,
}

const defaultDisplayPreferences: DisplayPreferences = {
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  currency: 'USD',
  numberFormat: '1,000.00',
  language: 'en',
  showRelativeDates: true,
}

export const useUserPreferencesStore = create<UserPreferences>()(
  persist(
    (set, get) => ({
      // Default preferences
      products: defaultProductPreferences,
      tables: defaultTablePreferences,
      notifications: defaultNotificationPreferences,
      dashboard: defaultDashboardPreferences,
      display: defaultDisplayPreferences,

      // Update actions
      updateProductPreferences: (preferences) => {
        set((state) => ({
          products: { ...state.products, ...preferences }
        }))
      },

      updateTablePreferences: (preferences) => {
        set((state) => ({
          tables: { ...state.tables, ...preferences }
        }))
      },

      updateNotificationPreferences: (preferences) => {
        set((state) => ({
          notifications: { ...state.notifications, ...preferences }
        }))
      },

      updateDashboardPreferences: (preferences) => {
        set((state) => ({
          dashboard: { ...state.dashboard, ...preferences }
        }))
      },

      updateDisplayPreferences: (preferences) => {
        set((state) => ({
          display: { ...state.display, ...preferences }
        }))
      },

      // Reset actions
      resetProductPreferences: () => {
        set({ products: defaultProductPreferences })
      },

      resetTablePreferences: () => {
        set({ tables: defaultTablePreferences })
      },

      resetNotificationPreferences: () => {
        set({ notifications: defaultNotificationPreferences })
      },

      resetDashboardPreferences: () => {
        set({ dashboard: defaultDashboardPreferences })
      },

      resetDisplayPreferences: () => {
        set({ display: defaultDisplayPreferences })
      },

      resetAllPreferences: () => {
        set({
          products: defaultProductPreferences,
          tables: defaultTablePreferences,
          notifications: defaultNotificationPreferences,
          dashboard: defaultDashboardPreferences,
          display: defaultDisplayPreferences,
        })
      },

      // Export/Import actions
      exportPreferences: () => {
        const state = get()
        return JSON.stringify(state, null, 2)
      },

      importPreferences: (preferencesData: string) => {
        try {
          const parsed = JSON.parse(preferencesData)

          // Validate the imported data structure
          if (
            parsed.products &&
            parsed.tables &&
            parsed.notifications &&
            parsed.dashboard &&
            parsed.display
          ) {
            set(parsed)
            return true
          }
          return false
        } catch (error) {
          console.error('Failed to import preferences:', error)
          return false
        }
      },
    }),
    {
      name: 'user-preferences',
      // Don't persist sensitive or temporary data
      partialize: (state) => ({
        products: state.products,
        tables: state.tables,
        notifications: state.notifications,
        dashboard: state.dashboard,
        display: state.display,
      }),
      version: 1,
      // Migration function for future schema changes
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            products: {
              ...defaultProductPreferences,
              ...persistedState.products,
              selectedColumns: persistedState.products?.selectedColumns || defaultProductPreferences.selectedColumns,
            },
          }
        }
        return persistedState
      },
    }
  )
)

// Hook for managing preferences with validation
export function useUserPreferences() {
  const store = useUserPreferencesStore()

  const validatePreferences = (preferences: any): boolean => {
    // Add validation logic here
    return true
  }

  return {
    ...store,
    validatePreferences,

    // Convenience getters
    get currentViewMode() {
      return store.products.viewMode
    },

    get currentTableDensity() {
      return store.tables.density
    },

    get currentDateFormat() {
      return store.display.dateFormat
    },

    get currentCurrency() {
      return store.display.currency
    },

    // Formatted date/time utilities
    formatDate: (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      const { dateFormat, timeFormat, timezone } = store.display

      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }

      if (timeFormat === '12h') {
        options.hour12 = true
        options.hour = '2-digit'
        options.minute = '2-digit'
      } else if (timeFormat === '24h') {
        options.hour12 = false
        options.hour = '2-digit'
        options.minute = '2-digit'
      }

      return new Intl.DateTimeFormat('en-US', options).format(dateObj)
    },

    formatCurrency: (amount: number) => {
      const { currency, numberFormat } = store.display
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    },

    formatNumber: (number: number) => {
      const { numberFormat } = store.display
      return new Intl.NumberFormat('en-US').format(number)
    },
  }
}

// Hook for managing auto-refresh based on preferences
export function useAutoRefresh(
  callback: () => void,
  options: {
    enabled?: boolean
    interval?: number
  } = {}
) {
  const { enabled = true, interval } = options
  const preferences = useUserPreferencesStore()
  const refreshInterval = interval || preferences.products.refreshInterval * 1000

  React.useEffect(() => {
    if (!enabled || !preferences.products.autoRefresh) return

    const intervalId = setInterval(callback, refreshInterval)

    return () => clearInterval(intervalId)
  }, [enabled, callback, refreshInterval, preferences.products.autoRefresh])
}