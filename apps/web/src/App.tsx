import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { MonitoringProvider } from './stores/monitoringStore'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductDetail from './pages/products/ProductDetail'
import ProductEdit from './pages/products/ProductEdit'
import ProductAnalytics from './pages/products/ProductAnalytics'
import Reviews from './pages/Reviews'
import Analytics from './pages/Analytics'
import SEOAnalytics from './pages/SEOAnalytics'
import Settings from './pages/Settings'
import UserPreferences from './pages/settings/UserPreferences'
import { ContentReview } from './pages/ContentReview'
import { AnalyticsDashboard } from './pages/analytics/Dashboard'
import AutomationRules from './pages/automation/AutomationRules'
import { AiProviderDashboard } from './pages/ai-providers/Dashboard'
import { ContentStrategiesPage } from './pages/content-strategies/ContentStrategiesPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import './styles/index.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MonitoringProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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