import React from 'react'
import { cn } from '@/utils/cn'

interface SkeletonProps {
  className?: string
  lines?: number
  animate?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  lines = 1,
  animate = true,
}) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gray-200 dark:bg-gray-700 rounded',
            animate && 'animate-pulse',
            className
          )}
          style={{
            width: i === lines - 1 && lines > 1 ? '80%' : '100%',
            height: lines === 1 ? '1rem' : '0.75rem',
          }}
        />
      ))}
    </div>
  )
}

interface CardSkeletonProps {
  className?: string
  showAvatar?: boolean
  showTitle?: boolean
  showDescription?: boolean
  lines?: number
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  className,
  showAvatar = true,
  showTitle = true,
  showDescription = true,
  lines = 3,
}) => {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3', className)}>
      {showAvatar && (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="space-y-1 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          </div>
        </div>
      )}

      {showTitle && (
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
      )}

      {showDescription && (
        <div className="space-y-2">
          <Skeleton lines={lines} animate={true} />
        </div>
      )}
    </div>
  )
}

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

export default Skeleton