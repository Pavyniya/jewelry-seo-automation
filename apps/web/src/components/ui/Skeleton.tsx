import React from 'react'
import { cn } from '@/utils/cn'

export interface SkeletonProps {
  className?: string
  lines?: number
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  animate?: boolean
  shimmer?: boolean
  children?: React.ReactNode
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  lines = 1,
  width,
  height,
  variant = 'text',
  animate = true,
  shimmer = false,
  children,
}) => {
  const baseClasses = cn(
    'bg-gray-200 dark:bg-gray-700 overflow-hidden',
    animate && 'animate-pulse',
    shimmer && 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-shimmer',
    {
      'rounded-full': variant === 'circular',
      'rounded': variant === 'rounded',
      'rounded-none': variant === 'rectangular',
      'rounded-sm': variant === 'text',
    },
    className
  )

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  }

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              index === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={{
              ...style,
              height: height || '1rem',
            }}
          />
        ))}
      </div>
    )
  }

  if (children) {
    return (
      <div className="relative">
        <div className={baseClasses} style={style}>
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-gray-200 dark:bg-gray-700 w-full h-full" />
        </div>
      </div>
    )
  }

  return <div className={baseClasses} style={style} />
}

export interface CardSkeletonProps {
  className?: string
  header?: boolean
  avatar?: boolean
  lines?: number
  actions?: boolean
  shimmer?: boolean
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  className,
  header = true,
  avatar = false,
  lines = 3,
  actions = false,
  shimmer = false,
}) => (
  <div className={cn('bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4', className)}>
    {header && (
      <div className="flex items-center space-x-4">
        {avatar && (
          <Skeleton variant="circular" width={40} height={40} shimmer={shimmer} />
        )}
        <div className="flex-1">
          <Skeleton width="60%" height={20} shimmer={shimmer} />
          <Skeleton width="40%" height={16} className="mt-2" shimmer={shimmer} />
        </div>
      </div>
    )}

    <div className="space-y-2">
      <Skeleton lines={lines} shimmer={shimmer} />
    </div>

    {actions && (
      <div className="flex justify-end space-x-2 pt-2">
        <Skeleton width={80} height={32} variant="rounded" shimmer={shimmer} />
        <Skeleton width={60} height={32} variant="rounded" shimmer={shimmer} />
      </div>
    )}
  </div>
)

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>

      {/* Body */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4 border-b dark:border-gray-700">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface StatsCardSkeletonProps {
  className?: string
}

export const StatsCardSkeleton: React.FC<StatsCardSkeletonProps> = ({ className }) => {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
    </div>
  )
}

interface ListSkeletonProps {
  items?: number
  className?: string
  showAvatar?: boolean
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  items = 5,
  className,
  showAvatar = true,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3">
          {showAvatar && (
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          </div>
          <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// Chart Skeleton Component
export interface ChartSkeletonProps {
  className?: string
  type?: 'bar' | 'line' | 'pie' | 'area'
  shimmer?: boolean
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  className,
  type = 'bar',
  shimmer = false,
}) => {
  const renderBarChart = () => (
    <div className="flex items-end justify-between h-32 px-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton
          key={index}
          width={20}
          height={`${40 + Math.random() * 60}%`}
          variant="rounded"
          shimmer={shimmer}
        />
      ))}
    </div>
  )

  const renderLineChart = () => (
    <div className="relative h-32">
      <div className="absolute inset-0 flex items-center">
        <Skeleton width="100%" height={2} shimmer={shimmer} />
      </div>
      <div className="absolute inset-0">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="absolute bottom-0"
            style={{
              left: `${(index / 4) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <Skeleton
              variant="circular"
              width={8}
              height={8}
              className="mb-1"
              shimmer={shimmer}
            />
            <Skeleton
              width={2}
              height={`${20 + Math.random() * 60}%`}
              className="mx-auto"
              shimmer={shimmer}
            />
          </div>
        ))}
      </div>
    </div>
  )

  const renderPieChart = () => (
    <div className="relative w-32 h-32 mx-auto">
      <Skeleton variant="circular" width={128} height={128} shimmer={shimmer} />
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton variant="circular" width={64} height={64} shimmer={shimmer} />
      </div>
    </div>
  )

  const renderAreaChart = () => (
    <div className="relative h-32">
      <div className="absolute bottom-0 left-0 right-0 h-24">
        <Skeleton
          width="100%"
          height="100%"
          className="transform skew-y-6 origin-bottom-left"
          shimmer={shimmer}
        />
      </div>
    </div>
  )

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg p-4', className)}>
      <div className="flex justify-between items-center mb-4">
        <Skeleton width={120} height={20} shimmer={shimmer} />
        <Skeleton width={80} height={20} shimmer={shimmer} />
      </div>

      {type === 'bar' && renderBarChart()}
      {type === 'line' && renderLineChart()}
      {type === 'pie' && renderPieChart()}
      {type === 'area' && renderAreaChart()}

      <div className="flex justify-between mt-4 pt-4 border-t dark:border-gray-700">
        <Skeleton width={60} height={14} shimmer={shimmer} />
        <Skeleton width={60} height={14} shimmer={shimmer} />
        <Skeleton width={60} height={14} shimmer={shimmer} />
      </div>
    </div>
  )
}

// Dashboard Grid Skeleton Component
export interface DashboardGridSkeletonProps {
  className?: string
  cards?: number
  shimmer?: boolean
}

export const DashboardGridSkeleton: React.FC<DashboardGridSkeletonProps> = ({
  className,
  cards = 4,
  shimmer = false,
}) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
    {Array.from({ length: cards }).map((_, index) => (
      <CardSkeleton
        key={index}
        header={true}
        avatar={false}
        lines={2}
        actions={false}
        shimmer={shimmer}
      />
    ))}
  </div>
)

export default Skeleton