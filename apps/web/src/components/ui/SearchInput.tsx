import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, X, Filter, ChevronDown, Clock, TrendingUp } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { useMemoizedCallback } from '@/hooks/useMemoizedCallback'

export interface SearchResult {
  id: string
  type: 'product' | 'review' | 'task' | 'setting' | 'page'
  title: string
  description?: string
  url: string
  category?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface SearchInputProps {
  placeholder?: string
  onSearch?: (query: string) => void
  onResultSelect?: (result: SearchResult) => void
  className?: string
  showRecent?: boolean
  showFilters?: boolean
  maxResults?: number
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search products, reviews, settings...',
  onSearch,
  onResultSelect,
  className = '',
  showRecent = true,
  showFilters = true,
  maxResults = 8
}) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recent-searches')
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error)
    }
  }, [])

  // Save recent searches to localStorage
  const saveToRecent = useMemoizedCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return

    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5)
    setRecentSearches(updated)
    try {
      localStorage.setItem('recent-searches', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save recent searches:', error)
    }
  }, [recentSearches], { maxCacheSize: 10 })

  // Handle search with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim()) {
        setLoading(true)
        onSearch?.(query)
        saveToRecent(query)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, onSearch, saveToRecent])

  // Mock search results - replace with actual API call
  const mockSearchResults = useMemo(() => {
    if (!query || !query.trim()) return []

      const allResults: SearchResult[] = [
        // Products
        {
          id: '1',
          type: 'product',
          title: 'Diamond Engagement Ring',
          description: 'Classic solitaire diamond ring with platinum band',
          url: '/products/1',
          category: 'Engagement Rings',
          tags: ['diamond', 'engagement', 'platinum']
        },
        {
          id: '2',
          type: 'product',
          title: 'Gold Tennis Bracelet',
          description: '14k yellow gold tennis bracelet with round diamonds',
          url: '/products/2',
          category: 'Bracelets',
          tags: ['gold', 'diamonds', 'tennis bracelet']
        },
        // Reviews
        {
          id: '3',
          type: 'review',
          title: 'Summer Collection Review',
          description: 'Review pending for new summer collection items',
          url: '/reviews/3',
          category: 'Pending Reviews',
          metadata: { status: 'pending', items: 12 }
        },
        // Tasks
        {
          id: '4',
          type: 'task',
          title: 'Optimize product descriptions',
          description: 'SEO optimization for diamond category products',
          url: '/tasks/4',
          category: 'SEO Tasks',
          metadata: { priority: 'high', dueDate: '2024-10-15' }
        },
        // Settings
        {
          id: '5',
          type: 'setting',
          title: 'SEO Configuration',
          description: 'Configure SEO settings and meta tags',
          url: '/settings/seo',
          category: 'Settings'
        },
        // Pages
        {
          id: '6',
          type: 'page',
          title: 'Analytics Dashboard',
          description: 'View SEO performance and analytics',
          url: '/analytics',
          category: 'Analytics'
        }
      ]

      return allResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description?.toLowerCase().includes(query.toLowerCase()) ||
        result.category?.toLowerCase().includes(query.toLowerCase()) ||
        result.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, maxResults)
  }, [query, maxResults])

  // Simulate search API call
  useEffect(() => {
    if (query.trim()) {
      setResults(mockSearchResults)
      setLoading(false)
      setSelectedIndex(-1)
    } else {
      setResults([])
    }
  }, [query, mockSearchResults])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev =>
            prev < results.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleResultSelect(results[selectedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSelectedIndex(-1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target as Node) &&
        resultsRef.current && !resultsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResultSelect = useMemoizedCallback((result: SearchResult) => {
    onResultSelect?.(result)
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(-1)

    // Navigate to the result URL
    if (result.url) {
      window.location.href = result.url
    }
  }, [onResultSelect], { maxCacheSize: 20 })

  const handleRecentSearch = useMemoizedCallback((searchTerm: string) => {
    setQuery(searchTerm)
    setIsOpen(true)
  }, [], { maxCacheSize: 10 })

  const clearSearch = useMemoizedCallback(() => {
    setQuery('')
    setResults([])
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }, [], { maxCacheSize: 5 })

  const getTypeIcon = useMemoizedCallback((type: SearchResult['type']) => {
    switch (type) {
      case 'product':
        return <div className="w-4 h-4 bg-blue-100 rounded" />
      case 'review':
        return <div className="w-4 h-4 bg-purple-100 rounded" />
      case 'task':
        return <div className="w-4 h-4 bg-green-100 rounded" />
      case 'setting':
        return <div className="w-4 h-4 bg-gray-100 rounded" />
      case 'page':
        return <div className="w-4 h-4 bg-indigo-100 rounded" />
      default:
        return <div className="w-4 h-4 bg-gray-100 rounded" />
    }
  }, [], { maxCacheSize: 10 })

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm text-gray-900 dark:text-white"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query || (showRecent && recentSearches.length > 0)) && (
        <Card
          ref={resultsRef}
          className="absolute top-full mt-2 w-full max-h-96 overflow-hidden z-50 shadow-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="p-2">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            )}

            {/* Recent Searches */}
            {!query && showRecent && recentSearches.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <Clock className="w-3 h-3" />
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearch(search)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {query && !loading && (
              <>
                {results.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      <TrendingUp className="w-3 h-3" />
                      Search Results
                    </div>
                    {results.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultSelect(result)}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors ${
                          index === selectedIndex ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {result.title}
                            </h4>
                            {result.category && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                {result.category}
                              </span>
                            )}
                          </div>
                          {result.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {result.description}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No results found for "{query}"
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Filters Footer */}
          {showFilters && query && !loading && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-3">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default SearchInput