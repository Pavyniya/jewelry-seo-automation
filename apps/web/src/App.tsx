import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { MonitoringProvider } from './stores/monitoringStore'
// import { ToastProvider } from './components/ui/Toast'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { RoutePreloader } from './routes/lazyRoutes'
import { SkipLink, LandmarkRegions } from './utils/accessibility'
// Lazy loaded components
import {
  Login,
  Products,
  ProductDetail,
  ProductEdit,
  ProductAnalytics,
  Reviews,
  Analytics,
  SEOAnalytics,
  Settings,
  UserPreferences,
  ContentReview,
  AnalyticsDashboard,
  AutomationRules,
  AiProviderDashboard,
  ContentStrategiesPage
} from './routes/lazyRoutes'
// Import Dashboard directly to avoid lazy loading issues for now
import Dashboard from './components/Dashboard'
import './styles/index.css'

function App() {
  // Preload core routes after initial render
  useEffect(() => {
    // Preload core routes for better perceived performance
    setTimeout(() => {
      RoutePreloader.preloadCoreRoutes()
    }, 1000)
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <MonitoringProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Skip links for keyboard navigation */}
            <SkipLink href="#main-content">Skip to main content</SkipLink>
            <SkipLink href="#navigation">Skip to navigation</SkipLink>

            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Product Management Routes */}
                <Route path="/products" element={<Products />} />
                <Route path="/products/:productId" element={<ProductDetail />} />
                <Route path="/products/:productId/edit" element={<ProductEdit />} />
                <Route path="/products/:productId/analytics" element={<ProductAnalytics />} />

                <Route path="/reviews" element={<Reviews />} />
                <Route path="/content-review/:reviewId" element={<ContentReview />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/seo-analytics" element={<SEOAnalytics />} />
                <Route path="/automation" element={<AutomationRules />} />
                <Route path="/system-monitoring" element={<AnalyticsDashboard />} />
                <Route path="/ai-providers" element={<AiProviderDashboard />} />
                <Route path="/content-strategies" element={<ContentStrategiesPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/preferences" element={<UserPreferences />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  fontFamily: 'Inter, sans-serif',
                },
                success: {
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
          </div>
        </MonitoringProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App