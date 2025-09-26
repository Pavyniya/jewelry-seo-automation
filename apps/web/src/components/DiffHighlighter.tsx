import React from 'react'
import { ContentDiff } from '@jewelry-seo/shared/types/review'
import { cn } from '@/utils/cn'

interface DiffHighlighterProps {
  text: string
  diffs: ContentDiff[]
  type: 'original' | 'optimized'
  className?: string
}

export const DiffHighlighter: React.FC<DiffHighlighterProps> = ({
  text,
  diffs,
  type,
  className = ''
}) => {
  if (!diffs || diffs.length === 0) {
    return (
      <div className={cn('whitespace-pre-wrap', className)}>
        {text}
      </div>
    )
  }

  const getHighlightClass = (diffType: string) => {
    if (type === 'original') {
      switch (diffType) {
        case 'deletion':
        case 'modified':
          return 'bg-red-100 text-red-800 line-through'
        default:
          return ''
      }
    } else {
      switch (diffType) {
        case 'addition':
        case 'modified':
          return 'bg-green-100 text-green-800'
        default:
          return ''
      }
    }
  }

  const processText = () => {
    const words = text.split(/(\s+)/) // Keep spaces for proper formatting
    const processedWords = words.map((word, index) => {
      const diff = diffs.find(d => {
        // Check if this word matches any diff text
        const diffText = type === 'original' ? d.text : d.text
        return word.trim() === diffText?.trim()
      })

      if (diff) {
        const highlightClass = getHighlightClass(diff.type)
        if (highlightClass) {
          return (
            <span
              key={index}
              className={cn(highlightClass, 'px-1 py-0.5 rounded-sm')}
              title={`${diff.type}: ${diff.text}`}
            >
              {word}
            </span>
          )
        }
      }

      return word
    })

    return processedWords
  }

  return (
    <div className={cn('whitespace-pre-wrap leading-relaxed', className)}>
      {processText()}
    </div>
  )
}