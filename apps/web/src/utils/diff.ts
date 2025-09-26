import { ContentDiff } from '@jewelry-seo/shared/types/review'

/**
 * Simple text diff algorithm for highlighting changes between original and optimized content
 * This is a basic implementation - in production, you might want to use a more sophisticated library
 */
export function computeTextDiff(original: string, optimized: string): ContentDiff[] {
  const diffs: ContentDiff[] = []

  if (original === optimized) {
    return diffs
  }

  // Split into words for comparison
  const originalWords = original.split(/\s+/)
  const optimizedWords = optimized.split(/\s+/)

  let originalIndex = 0
  let optimizedIndex = 0

  while (originalIndex < originalWords.length || optimizedIndex < optimizedWords.length) {
    const originalWord = originalWords[originalIndex]
    const optimizedWord = optimizedWords[optimizedIndex]

    if (originalWord === optimizedWord) {
      // Words match, move both pointers
      originalIndex++
      optimizedIndex++
    } else if (isWordAdded(originalWords, optimizedWords, originalIndex, optimizedIndex)) {
      // Word was added
      diffs.push({
        type: 'added',
        text: optimizedWord,
        position: optimizedIndex
      })
      optimizedIndex++
    } else if (isWordRemoved(originalWords, optimizedWords, originalIndex, optimizedIndex)) {
      // Word was removed
      diffs.push({
        type: 'removed',
        text: originalWord,
        position: originalIndex
      })
      originalIndex++
    } else {
      // Word was modified
      diffs.push({
        type: 'removed',
        text: originalWord,
        position: originalIndex
      })
      diffs.push({
        type: 'added',
        text: optimizedWord,
        position: optimizedIndex
      })
      originalIndex++
      optimizedIndex++
    }
  }

  return diffs
}

function isWordAdded(originalWords: string[], optimizedWords: string[], originalIndex: number, optimizedIndex: number): boolean {
  if (optimizedIndex >= optimizedWords.length) return false

  const optimizedWord = optimizedWords[optimizedIndex]

  // Check if this word appears later in the original text
  for (let i = originalIndex; i < originalWords.length; i++) {
    if (originalWords[i] === optimizedWord) {
      return true
    }
  }

  return false
}

function isWordRemoved(originalWords: string[], optimizedWords: string[], originalIndex: number, optimizedIndex: number): boolean {
  if (originalIndex >= originalWords.length) return false

  const originalWord = originalWords[originalIndex]

  // Check if this word appears later in the optimized text
  for (let i = optimizedIndex; i < optimizedWords.length; i++) {
    if (optimizedWords[i] === originalWord) {
      return true
    }
  }

  return false
}

/**
 * Apply diffs to highlight text changes
 */
export function applyDiffHighlighting(text: string, diffs: ContentDiff[], type: 'original' | 'optimized'): string {
  let result = text

  // Sort diffs by position in reverse order to avoid index shifting
  const sortedDiffs = [...diffs].sort((a, b) => b.position - a.position)

  for (const diff of sortedDiffs) {
    const relevantText = type === 'original' ? (diff.originalText || diff.text) : diff.text

    if (relevantText) {
      const shouldHighlight =
        (type === 'original' && (diff.type === 'removed' || diff.type === 'modified')) ||
        (type === 'optimized' && (diff.type === 'added' || diff.type === 'modified'))

      if (shouldHighlight) {
        const spanClass = {
          added: 'bg-green-100 text-green-800',
          removed: 'bg-red-100 text-red-800 line-through',
          modified: type === 'optimized' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800 line-through'
        }[diff.type]

        const highlightedText = `<span class="${spanClass}" title="${diff.type}">${relevantText}</span>`
        result = result.replace(new RegExp(`\\b${relevantText}\\b`, 'g'), highlightedText)
      }
    }
  }

  return result
}

/**
 * Get diff statistics
 */
export function getDiffStats(diffs: ContentDiff[]) {
  return {
    additions: diffs.filter(d => d.type === 'added').length,
    removals: diffs.filter(d => d.type === 'removed').length,
    modifications: diffs.filter(d => d.type === 'modified').length,
    total: diffs.length
  }
}