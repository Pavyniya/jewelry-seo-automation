import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/utils/cn'
import { generateId } from '@/utils/accessibility'

interface BreadcrumbItemProps {
  label: string
  path?: string
  icon?: React.ReactNode
  current?: boolean
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  separator?: React.ReactNode
  maxItems?: number
  className?: string
  showHome?: boolean
  homePath?: string
  ariaLabel?: string
}

interface BreadcrumbNavProps extends BreadcrumbProps {
  /**
   * Whether to generate breadcrumbs automatically from the current route
   */
  autoGenerate?: boolean
  /**
   * Custom mapping for route path to breadcrumb label
   */
  routeMap?: Record<string, string>
  // eslint-disable-next-line no-unused-vars
  dynamicLabelGenerator?: (pathname: string, params: Record<string, string>) => string
}

const defaultRouteMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/reviews': 'Reviews',
  '/analytics': 'Analytics',
  '/seo-analytics': 'SEO Analytics',
  '/automation': 'Automation',
  '/system-monitoring': 'System Monitoring',
  '/settings': 'Settings',
  '/content-review': 'Content Review',
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items = [],
  separator = <ChevronRight className="h-4 w-4" />,
  maxItems = 5,
  className = '',
  showHome = true,
  homePath = '/dashboard',
  ariaLabel = 'Breadcrumb navigation',
}) => {
  const visibleItems = items.slice(-maxItems)
  const hasHiddenItems = items.length > maxItems

  return (
    <nav
      aria-label={ariaLabel}
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <ol className="flex items-center space-x-1" role="list">
        {/* Home breadcrumb */}
        {showHome && (
          <li className="flex items-center">
            <Link
              to={homePath}
              className={cn(
                'flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                'transition-colors duration-200'
              )}
              aria-label="Go to home"
            >
              <Home className="h-4 w-4" />
            </Link>
          </li>
        )}

        {/* Hidden items indicator */}
        {hasHiddenItems && (
          <li className="flex items-center text-gray-400 dark:text-gray-500">
            {separator}
            <span className="px-2">...</span>
          </li>
        )}

        {/* Breadcrumb items */}
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1
          const itemKey = generateId(`breadcrumb-${index}`)

          return (
            <React.Fragment key={itemKey}>
              {(showHome || hasHiddenItems || index > 0) && (
                <li className="flex items-center text-gray-400 dark:text-gray-500">
                  {separator}
                </li>
              )}
              <li className="flex items-center">
                {item.path && !item.current ? (
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center space-x-1',
                      'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                      'transition-colors duration-200',
                      item.icon && 'space-x-1'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.icon && <span aria-hidden="true">{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'flex items-center space-x-1',
                      'text-gray-900 dark:text-gray-100',
                      item.icon && 'space-x-1'
                    )}
                    aria-current="page"
                  >
                    {item.icon && <span aria-hidden="true">{item.icon}</span>}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  items,
  autoGenerate = false,
  routeMap = defaultRouteMap,
  dynamicLabelGenerator,
  ...props
}) => {
  const location = useLocation()

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (!autoGenerate) return items || []

    const pathname = location.pathname
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Build breadcrumbs from path segments
    let currentPath = ''

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Check if this segment represents a dynamic route (contains parameters)
      const isDynamic = segment.startsWith(':') || /[[.*]]/.test(segment)

      let label = routeMap[currentPath] || segment

      // If we have a dynamic label generator and this looks like a dynamic segment
      if (isDynamic && dynamicLabelGenerator) {
        // Extract params from the current location
        const params: Record<string, string> = {}
        const routePattern = currentPath.replace(/:\w+|\[.*?\]/g, '([^/]+)')
        const regex = new RegExp(`^${routePattern}$`)
        const match = pathname.match(regex)

        if (match) {
          const paramNames = currentPath.match(/:\w+|\[(.*?)\]/g) || []
          paramNames.forEach((param, i) => {
            const paramName = param.replace(/[:\[\]]/g, '')
            params[paramName] = match[i + 1] || ''
          })
        }

        label = dynamicLabelGenerator(currentPath, params)
      }

      // Format the label (capitalize first letter, replace hyphens with spaces)
      label = label
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())

      breadcrumbs.push({
        label,
        path: index < pathSegments.length - 1 ? currentPath : undefined,
        current: index === pathSegments.length - 1,
      })
    })

    return breadcrumbs
  }

  const breadcrumbItems = generateBreadcrumbs()

  return <Breadcrumb items={breadcrumbItems} {...props} />
}

// Hook for generating breadcrumbs
export function useBreadcrumb(options?: {
  routeMap?: Record<string, string>
  // eslint-disable-next-line no-unused-vars
  dynamicLabelGenerator?: (pathname: string, params: Record<string, string>) => string
}) {
  const location = useLocation()
  const { routeMap = defaultRouteMap, dynamicLabelGenerator } = options || {}

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathname = location.pathname
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    let currentPath = ''

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`

      const isDynamic = segment.startsWith(':') || /[[.*]]/.test(segment)
      let label = routeMap[currentPath] || segment

      if (isDynamic && dynamicLabelGenerator) {
        const params: Record<string, string> = {}
        const routePattern = currentPath.replace(/:\w+|\[.*?\]/g, '([^/]+)')
        const regex = new RegExp(`^${routePattern}$`)
        const match = pathname.match(regex)

        if (match) {
          const paramNames = currentPath.match(/:\w+|\[(.*?)\]/g) || []
          paramNames.forEach((param, i) => {
            const paramName = param.replace(/[:\[\]]/g, '')
            params[paramName] = match[i + 1] || ''
          })
        }

        label = dynamicLabelGenerator(currentPath, params)
      }

      label = label
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())

      breadcrumbs.push({
        label,
        path: index < pathSegments.length - 1 ? currentPath : undefined,
        current: index === pathSegments.length - 1,
      })
    })

    return breadcrumbs
  }

  return {
    breadcrumbs: generateBreadcrumbs(),
    currentPath: location.pathname,
  }
}

// Individual breadcrumb item component
export const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({
  label,
  path,
  icon,
  current = false,
}) => {
  if (path && !current) {
    return (
      <Link
        to={path}
        className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
        aria-current={current ? 'page' : undefined}
      >
        {icon && <span aria-hidden="true">{icon}</span>}
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <span
      className="flex items-center space-x-1 text-gray-900 dark:text-gray-100"
      aria-current="page"
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
    </span>
  )
}

// Breadcrumb separator component
export const BreadcrumbSeparator: React.FC<{
  children?: React.ReactNode
}> = ({ children = <ChevronRight className="h-4 w-4" /> }) => (
  <span className="flex items-center text-gray-400 dark:text-gray-500" aria-hidden="true">
    {children}
  </span>
)
