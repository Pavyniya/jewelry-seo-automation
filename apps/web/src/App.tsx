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
import Reviews from './pages/Reviews'
import Analytics from './pages/Analytics'
import SEOAnalytics from './pages/SEOAnalytics'
import Settings from './pages/Settings'
import { ContentReview } from './pages/ContentReview'
import { AnalyticsDashboard } from './pages/analytics/Dashboard'
import AutomationRules from './pages/automation/AutomationRules'
import ProtectedRoute from './components/auth/ProtectedRoute'
import './styles/index.css'

// Test CSS function
function TestCSS() {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f3f4f6',
      margin: '20px',
      borderRadius: '8px',
      border: '1px solid #d1d5db'
    }}>
      <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>CSS Test Component</h2>
      <p style={{ color: '#6b7280' }}>If you can see this styled box, CSS is working!</p>
      <button style={{
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginTop: '10px'
      }}>
        Test Button
      </button>
    </div>
  )
}

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
                <Route path="/products" element={<Products />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/content-review/:reviewId" element={<ContentReview />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/seo-analytics" element={<SEOAnalytics />} />
                <Route path="/automation" element={<AutomationRules />} />
                <Route path="/system-monitoring" element={<AnalyticsDashboard />} />
                <Route path="/settings" element={<Settings />} />
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