import { lazy } from 'react'
import { withLazyLoad } from '@/components/ui/LazyLoadWrapper'

// Core routes with lazy loading
const LazyLogin = lazy(() => import('@/pages/Login'))
const LazyDashboard = lazy(() => import('@/pages/Dashboard'))
const LazyProducts = lazy(() => import('@/pages/Products'))
const LazyReviews = lazy(() => import('@/pages/Reviews'))
const LazyAnalytics = lazy(() => import('@/pages/Analytics'))
const LazySettings = lazy(() => import('@/pages/Settings'))

// Product management routes
const LazyProductDetail = lazy(() => import('@/pages/products/ProductDetail'))
const LazyProductEdit = lazy(() => import('@/pages/products/ProductEdit'))
const LazyProductAnalytics = lazy(() => import('@/pages/products/ProductAnalytics'))

// Settings routes
const LazyUserPreferences = lazy(() => import('@/pages/settings/UserPreferences'))

// Advanced features (conditionally loaded)
const LazySEOAnalytics = lazy(() => import('@/pages/SEOAnalytics'))
const LazyContentReview = lazy(() => import('@/pages/ContentReview'))
const LazyAutomationRules = lazy(() => import('@/pages/automation/AutomationRules'))

// Wrap components with error handling
export const Login = withLazyLoad(() => import('@/pages/Login'))
export const Dashboard = withLazyLoad(() => import('@/pages/Dashboard'))
export const Products = withLazyLoad(() => import('@/pages/Products'))
export const ProductDetail = withLazyLoad(() => import('@/pages/products/ProductDetail'))
export const ProductEdit = withLazyLoad(() => import('@/pages/products/ProductEdit'))
export const ProductAnalytics = withLazyLoad(() => import('@/pages/products/ProductAnalytics'))
export const Reviews = withLazyLoad(() => import('@/pages/Reviews'))
export const Analytics = withLazyLoad(() => import('@/pages/Analytics'))
export const SEOAnalytics = withLazyLoad(() => import('@/pages/SEOAnalytics'))
export const Settings = withLazyLoad(() => import('@/pages/Settings'))
export const UserPreferences = withLazyLoad(() => import('@/pages/settings/UserPreferences'))
export const ContentReview = withLazyLoad(() => import('@/pages/ContentReview'))
export const AutomationRules = withLazyLoad(() => import('@/pages/automation/AutomationRules'))

// Analytics dashboard (heavy component)
export const AnalyticsDashboard = withLazyLoad(
  () => import('@/pages/analytics/Dashboard'),
  <div className="p-8">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
)

// AI Providers (conditionally loaded)
export const AiProviderDashboard = withLazyLoad(
  () => import('@/pages/ai-providers/Dashboard')
)

// Content strategies (conditionally loaded)
export const ContentStrategiesPage = withLazyLoad(
  () => import('@/pages/content-strategies/ContentStrategiesPage')
)

// Route configuration for preloading
export const routeConfig = {
  // Core routes (preload immediately)
  core: [
    { path: '/dashboard', component: Dashboard },
    { path: '/products', component: Products },
    { path: '/reviews', component: Reviews },
  ],

  // Secondary routes (preload on hover/demand)
  secondary: [
    { path: '/analytics', component: Analytics },
    { path: '/settings', component: Settings },
  ],

  // Product routes (preload when navigating to products)
  product: [
    { path: '/products/:productId', component: ProductDetail },
    { path: '/products/:productId/edit', component: ProductEdit },
    { path: '/products/:productId/analytics', component: ProductAnalytics },
  ],

  // Advanced features (lazy load only when accessed)
  advanced: [
    { path: '/seo-analytics', component: SEOAnalytics },
    { path: '/automation', component: AutomationRules },
    { path: '/system-monitoring', component: AnalyticsDashboard },
    { path: '/ai-providers', component: AiProviderDashboard },
    { path: '/content-strategies', component: ContentStrategiesPage },
    { path: '/content-review/:reviewId', component: ContentReview },
  ]
}

// Preloading utility
export class RoutePreloader {
  private static preloadedRoutes = new Set<string>()

  static preloadRoute(path: string): void {
    if (this.preloadedRoutes.has(path)) return

    const route = [...routeConfig.core, ...routeConfig.secondary, ...routeConfig.product, ...routeConfig.advanced]
      .find(r => r.path === path)

    if (route) {
      // Trigger the lazy load
      route.component
      this.preloadedRoutes.add(path)
    }
  }

  static preloadCoreRoutes(): void {
    routeConfig.core.forEach(route => {
      this.preloadRoute(route.path)
    })
  }

  static preloadSecondaryRoutes(): void {
    routeConfig.secondary.forEach(route => {
      this.preloadRoute(route.path)
    })
  }

  static clearPreloads(): void {
    this.preloadedRoutes.clear()
  }
}