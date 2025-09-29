import React, { useState, useRef, useEffect } from 'react'
import { ContentDiff } from '@jewelry-seo/shared/types/review'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface ContentComparisonProps {
  originalContent: {
    title: string
    description: string
    seoTitle?: string
    seoDescription?: string
  }
  optimizedContent: {
    title: string
    description: string
    seoTitle: string
    seoDescription: string
  }
  diffs?: ContentDiff[]
  // eslint-disable-next-line no-unused-vars
  onEdit?: (content: any) => void
  loading?: boolean
}

export const ContentComparison: React.FC<ContentComparisonProps> = ({
  originalContent,
  optimizedContent,
  diffs = [],
  onEdit,
  loading = false
}) => {
  const [showDiffs, setShowDiffs] = useState(true)
  const [syncScroll, setSyncScroll] = useState(true)
  const originalRef = useRef<HTMLDivElement>(null)
  const optimizedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!syncScroll) return

    const handleScroll = (source: 'original' | 'optimized') => {
      return (e: Event) => {
        const target = source === 'original' ? optimizedRef.current : originalRef.current
        const sourceElement = e.target as HTMLElement

        if (target && sourceElement) {
          const scrollPercentage = sourceElement.scrollTop / (sourceElement.scrollHeight - sourceElement.clientHeight)
          target.scrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight)
        }
      }
    }

    const originalElement = originalRef.current
    const optimizedElement = optimizedRef.current

    if (originalElement && optimizedElement) {
      originalElement.addEventListener('scroll', handleScroll('original'))
      optimizedElement.addEventListener('scroll', handleScroll('optimized'))

      return () => {
        originalElement.removeEventListener('scroll', handleScroll('original'))
        optimizedElement.removeEventListener('scroll', handleScroll('optimized'))
      }
    }
  }, [syncScroll])

  const renderContentWithDiffs = (content: string, type: 'original' | 'optimized') => {
    if (!showDiffs || !diffs.length) {
      return <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
    }

    // Apply diff highlighting to the content
    let highlightedContent = content

    // Sort diffs by position in reverse order to avoid index shifting
    const sortedDiffs = [...diffs].sort((a, b) => b.position - a.position)

    sortedDiffs.forEach(diff => {
      const relevantText = type === 'original' ? (diff.originalText || diff.text) : diff.text

      if (relevantText) {
        const shouldHighlight =
          (type === 'original' && (diff.type === 'removed' || diff.type === 'modified')) ||
          (type === 'optimized' && (diff.type === 'added' || diff.type === 'modified'))

        if (shouldHighlight) {
          const spanClass = {
            added: 'bg-green-100 text-green-800 px-1 rounded',
            removed: 'bg-red-100 text-red-800 line-through px-1 rounded',
            modified: type === 'optimized' ? 'bg-yellow-100 text-yellow-800 px-1 rounded' : 'bg-red-100 text-red-800 line-through px-1 rounded'
          }[diff.type]

          const highlightedText = `<span class="${spanClass}" title="${diff.type}">${relevantText}</span>`
          highlightedContent = highlightedContent.replace(new RegExp(`\\b${relevantText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), highlightedText)
        }
      }
    })

    return (
      <p
        className="text-gray-700 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
      />
    )
  }

  const calculateStats = (content: string) => {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length
    const charCount = content.length
    const readingTime = Math.ceil(wordCount / 200) // Average reading speed

    return { wordCount, charCount, readingTime }
  }

  const originalStats = calculateStats(originalContent.description)
  const optimizedStats = calculateStats(optimizedContent.description)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={showDiffs ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDiffs(!showDiffs)}
          >
            {showDiffs ? 'Hide Differences' : 'Show Differences'}
          </Button>
          <Button
            variant={syncScroll ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSyncScroll(!syncScroll)}
          >
            {syncScroll ? 'Sync Scrolling On' : 'Sync Scrolling Off'}
          </Button>
        </div>
        {onEdit && (
          <Button
            onClick={() => onEdit(optimizedContent)}
            disabled={loading}
          >
            Edit Content
          </Button>
        )}
      </div>

      {/* Title Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <Card title="Original Title" className="h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {originalContent.title}
          </h3>
        </Card>
        <Card title="Optimized Title" className="h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {optimizedContent.title}
          </h3>
        </Card>
      </div>

      {/* Description Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          title={`Original Description (${originalStats.wordCount} words, ${originalStats.readingTime}min read)`}
        >
          <div
            ref={originalRef}
            className="max-h-96 overflow-y-auto p-4 bg-gray-50 rounded"
          >
            {renderContentWithDiffs(originalContent.description, 'original')}
          </div>
        </Card>
        <Card
          title={`Optimized Description (${optimizedStats.wordCount} words, ${optimizedStats.readingTime}min read)`}
        >
          <div
            ref={optimizedRef}
            className="max-h-96 overflow-y-auto p-4 bg-gray-50 rounded"
          >
            {renderContentWithDiffs(optimizedContent.description, 'optimized')}
          </div>
        </Card>
      </div>

      {/* SEO Metadata Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <Card title="Original SEO">
          <div className="space-y-3">
            {originalContent.seoTitle && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SEO Title
                </label>
                <p className="text-sm text-gray-600">{originalContent.seoTitle}</p>
              </div>
            )}
            {originalContent.seoDescription && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SEO Description
                </label>
                <p className="text-sm text-gray-600">{originalContent.seoDescription}</p>
              </div>
            )}
          </div>
        </Card>
        <Card title="Optimized SEO">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Title
              </label>
              <p className="text-sm text-gray-600">{optimizedContent.seoTitle}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Description
              </label>
              <p className="text-sm text-gray-600">{optimizedContent.seoDescription}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Change Summary */}
      {showDiffs && diffs.length > 0 && (
        <Card title="Change Summary">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {diffs.filter(d => d.type === 'added').length}
              </div>
              <div className="text-sm text-gray-600">Additions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {diffs.filter(d => d.type === 'removed').length}
              </div>
              <div className="text-sm text-gray-600">Removals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {diffs.filter(d => d.type === 'modified').length}
              </div>
              <div className="text-sm text-gray-600">Modifications</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}