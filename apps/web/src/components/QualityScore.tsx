import React from 'react'
import { QualityScore } from '@jewelry-seo/shared/types/review'
import { cn } from '@/utils/cn'

interface QualityScoreProps {
  qualityScore: QualityScore | null
  loading?: boolean
  className?: string
}

export const QualityScoreComponent: React.FC<QualityScoreProps> = ({
  qualityScore,
  loading = false,
  className = ''
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100'
    if (score >= 80) return 'bg-blue-100'
    if (score >= 70) return 'bg-yellow-100'
    if (score >= 60) return 'bg-orange-100'
    return 'bg-red-100'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Fair'
    if (score >= 60) return 'Needs Improvement'
    return 'Poor'
  }

  const getMetricIcon = (metric: string) => {
    switch (metric.toLowerCase()) {
      case 'readability':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      case 'seo':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        )
      case 'brandvoice':
      case 'brand voice':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )
      case 'keyworddensity':
      case 'keyword density':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!qualityScore) {
    return (
      <div className={cn('text-center p-6 bg-gray-50 rounded-lg', className)}>
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Quality Score Not Available
        </h3>
        <p className="text-gray-600 text-sm">
          Calculate quality score to see detailed content analysis.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Score */}
      <div className="text-center">
        <div className={cn(
          'inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold',
          getScoreBgColor(qualityScore.overall),
          getScoreColor(qualityScore.overall)
        )}>
          {qualityScore.overall}
        </div>
        <div className="mt-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Overall Quality Score
          </h3>
          <p className={cn(
            'text-sm font-medium',
            getScoreColor(qualityScore.overall)
          )}>
            {getScoreLabel(qualityScore.overall)}
          </p>
        </div>
      </div>

      {/* Metrics Breakdown */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
          Quality Metrics
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-gray-500">
                  {getMetricIcon('SEO')}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  SEO Score
                </span>
              </div>
              <span className={cn(
                'text-lg font-semibold',
                getScoreColor(qualityScore.seo)
              )}>
                {qualityScore.seo}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  getScoreBgColor(qualityScore.seo)
                )}
                style={{ width: `${qualityScore.seo}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-gray-500">
                  {getMetricIcon('Readability')}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Readability
                </span>
              </div>
              <span className={cn(
                'text-lg font-semibold',
                getScoreColor(qualityScore.readability)
              )}>
                {qualityScore.readability}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  getScoreBgColor(qualityScore.readability)
                )}
                style={{ width: `${qualityScore.readability}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-gray-500">
                  {getMetricIcon('Brand Voice')}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Brand Voice
                </span>
              </div>
              <span className={cn(
                'text-lg font-semibold',
                getScoreColor(qualityScore.brandVoice)
              )}>
                {qualityScore.brandVoice}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  getScoreBgColor(qualityScore.brandVoice)
                )}
                style={{ width: `${qualityScore.brandVoice}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-gray-500">
                  {getMetricIcon('Keyword Density')}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Keyword Density
                </span>
              </div>
              <span className={cn(
                'text-lg font-semibold',
                getScoreColor(qualityScore.keywordDensity)
              )}>
                {qualityScore.keywordDensity}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  getScoreBgColor(qualityScore.keywordDensity)
                )}
                style={{ width: `${qualityScore.keywordDensity}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {qualityScore.details && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
            Detailed Analysis
          </h4>

          {qualityScore.details.strengths.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-green-900">Strengths</h5>
              <div className="space-y-2">
                {qualityScore.details.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-800">
                      {strength}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {qualityScore.details.improvements.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-yellow-900">Areas for Improvement</h5>
              <div className="space-y-2">
                {qualityScore.details.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-yellow-800">
                      {improvement}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {qualityScore.details.suggestions.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-blue-900">Suggestions</h5>
              <div className="space-y-2">
                {qualityScore.details.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-800">
                      {suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}