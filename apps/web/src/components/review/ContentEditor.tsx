import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

interface ContentEditorProps {
  _content: {
    title: string
    description: string
    seoTitle?: string
    seoDescription?: string
  }
  // eslint-disable-next-line no-unused-vars
  onSave: (_content: {
    title: string
    description: string
    seoTitle?: string
    seoDescription?: string
  }) => void
  onCancel: () => void
  loading?: boolean
  className?: string
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  _content: content,
  onSave,
  onCancel,
  loading = false,
  className = ''
}) => {
  const [editedContent, setEditedContent] = useState(content)
  const [history, setHistory] = useState<typeof content[]>([content])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Update edited content when prop changes
  useEffect(() => {
    setEditedContent(content)
    setHistory([content])
    setHistoryIndex(0)
  }, [content])

  const handleFieldChange = (field: keyof typeof content, value: string) => {
    const newContent = { ...editedContent, [field]: value }
    setEditedContent(newContent)

    // Add to history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newContent)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setEditedContent(history[historyIndex - 1])
    }
  }, [historyIndex, history])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setEditedContent(history[historyIndex + 1])
    }
  }, [historyIndex, history])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const calculateStats = (text: string) => {
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
    const charCount = text.length
    const charCountNoSpaces = text.replace(/\s/g, '').length
    const readingTime = Math.ceil(wordCount / 200)

    return { wordCount, charCount, charCountNoSpaces, readingTime }
  }

  const titleStats = calculateStats(editedContent.title)
  const descriptionStats = calculateStats(editedContent.description)

  const getSeoSuggestions = (field: string, value: string) => {
    const suggestions: string[] = []

    if (field === 'title') {
      if (value.length < 30) suggestions.push('Title should be at least 30 characters')
      if (value.length > 60) suggestions.push('Title should be under 60 characters for optimal SEO')
    }

    if (field === 'description') {
      if (value.length < 120) suggestions.push('Description should be at least 120 characters')
      if (value.length > 160) suggestions.push('Description should be under 160 characters for meta description')
    }

    if (field === 'seoTitle') {
      if (value && value.length > 60) suggestions.push('SEO title should be under 60 characters')
    }

    if (field === 'seoDescription') {
      if (value && value.length > 160) suggestions.push('SEO description should be under 160 characters')
    }

    return suggestions
  }

  const titleSuggestions = getSeoSuggestions('title', editedContent.title)
  const descriptionSuggestions = getSeoSuggestions('description', editedContent.description)
  const seoTitleSuggestions = getSeoSuggestions('seoTitle', editedContent.seoTitle || '')
  const seoDescriptionSuggestions = getSeoSuggestions('seoDescription', editedContent.seoDescription || '')

  return (
    <div className={className}>
      <Card title="Edit Content">
        <div className="space-y-6">
          {/* Undo/Redo Controls */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                onClick={undo}
                disabled={!canUndo || loading}
                variant="outline"
                size="sm"
              >
                ↶ Undo
              </Button>
              <Button
                onClick={redo}
                disabled={!canRedo || loading}
                variant="outline"
                size="sm"
              >
                ↷ Redo
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              {historyIndex + 1} / {history.length} changes
            </div>
          </div>

          {/* Title Field */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Product Title
              </label>
              <div className="text-xs text-gray-500">
                {titleStats.wordCount} words • {titleStats.charCount} chars
              </div>
            </div>
            <Input
              value={editedContent.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Enter product title..."
              className="w-full"
              disabled={loading}
            />
            {titleSuggestions.length > 0 && (
              <div className="mt-1 text-xs text-yellow-600">
                {titleSuggestions.join(' • ')}
              </div>
            )}
          </div>

          {/* Description Field */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Product Description
              </label>
              <div className="text-xs text-gray-500">
                {descriptionStats.wordCount} words • {descriptionStats.readingTime}min read
              </div>
            </div>
            <Textarea
              value={editedContent.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Enter product description..."
              rows={8}
              className="w-full"
              disabled={loading}
            />
            {descriptionSuggestions.length > 0 && (
              <div className="mt-1 text-xs text-yellow-600">
                {descriptionSuggestions.join(' • ')}
              </div>
            )}
          </div>

          {/* SEO Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Title (Optional)
              </label>
              <Input
                value={editedContent.seoTitle || ''}
                onChange={(e) => handleFieldChange('seoTitle', e.target.value)}
                placeholder="Enter SEO title..."
                className="w-full"
                disabled={loading}
              />
              {seoTitleSuggestions.length > 0 && (
                <div className="mt-1 text-xs text-yellow-600">
                  {seoTitleSuggestions.join(' • ')}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Description (Optional)
              </label>
              <Textarea
                value={editedContent.seoDescription || ''}
                onChange={(e) => handleFieldChange('seoDescription', e.target.value)}
                placeholder="Enter SEO description..."
                rows={3}
                className="w-full"
                disabled={loading}
              />
              {seoDescriptionSuggestions.length > 0 && (
                <div className="mt-1 text-xs text-yellow-600">
                  {seoDescriptionSuggestions.join(' • ')}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => onSave(editedContent)}
              disabled={loading}
              className="flex-1"
            >
              Save Changes
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>

          {/* SEO Guidelines */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <h4 className="font-medium mb-2">SEO Best Practices:</h4>
            <ul className="space-y-1">
              <li>• Title: 30-60 characters, include primary keywords</li>
              <li>• Description: 120-160 characters, compelling and informative</li>
              <li>• Use natural language that appeals to customers</li>
              <li>• Include unique selling points and benefits</li>
              <li>• Maintain brand voice: accessible, professional, approachable</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}