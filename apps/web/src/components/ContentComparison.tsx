import React from 'react'
import { ContentDiff } from '@jewelry-seo/shared/types/review'
import { DiffHighlighter } from './DiffHighlighter'
import { getDiffStats } from '@/utils/diff'
import { cn } from '@/utils/cn'

interface ContentComparisonProps {
  originalContent: string
  optimizedContent: string
  diffs: ContentDiff[]
  loading?: boolean
  className?: string
}

export const ContentComparison: React.FC<ContentComparisonProps> = ({
  originalContent,
  optimizedContent,
  diffs,
  loading = false,
  className = ''
}) => {
  const stats = diffs ? getDiffStats(diffs) : null

  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Summary */}
      {stats && stats.total > 0 && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-600">
              {stats.additions} added
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-600">
              {stats.removals} removed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-600">
              {stats.modifications} modified
            </span>
          </div>
        </div>
      )}

      {/* Side-by-side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Original Content
            </h3>
            <span className="text-sm text-gray-500">
              {originalContent.length} characters
            </span>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            <DiffHighlighter
              text={originalContent}
              diffs={diffs}
              type="original"
              className="text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Optimized Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Optimized Content
            </h3>
            <span className="text-sm text-gray-500">
              {optimizedContent.length} characters
            </span>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
            <DiffHighlighter
              text={optimizedContent}
              diffs={diffs}
              type="optimized"
              className="text-sm leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* No Changes Indicator */}
      {(!diffs || diffs.length === 0) && (
        <div className="flex items-center justify-center p-6 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-blue-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              No Changes Detected
            </h3>
            <p className="text-blue-700">
              The content appears to be identical. No optimization changes were made.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}