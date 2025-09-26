import React from 'react'
import { ContentDiff } from '@jewelry-seo/shared/types/review'
import { applyDiffHighlighting, getDiffStats } from '@/utils/diff'

interface DiffHighlighterProps {
  text: string
  diffs: ContentDiff[]
  type: 'original' | 'optimized'
  showStats?: boolean
  className?: string
}

export const DiffHighlighter: React.FC<DiffHighlighterProps> = ({
  text,
  diffs,
  type,
  showStats = false,
  className = ''
}) => {
  const stats = getDiffStats(diffs)
  const highlightedText = applyDiffHighlighting(text, diffs, type)

  return (
    <div className={className}>
      {showStats && (
        <div className="mb-2 flex gap-4 text-sm">
          <span className="text-green-600">
            +{stats.additions} additions
          </span>
          <span className="text-red-600">
            -{stats.removals} removals
          </span>
          <span className="text-yellow-600">
            ~{stats.modifications} modifications
          </span>
        </div>
      )}

      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{
          __html: highlightedText.replace(/\n/g, '<br>')
        }}
      />
    </div>
  )
}