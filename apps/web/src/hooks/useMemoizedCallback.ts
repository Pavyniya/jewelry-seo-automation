import { useCallback, useRef, useMemo } from 'react'

// Enhanced useMemo with cache invalidation
export function useMemoWithInvalidation<T>(
  factory: () => T,
  deps: React.DependencyList,
  invalidationKey?: any
): T {
  const cacheRef = useRef<Map<any, T>>(new Map())

  return useMemo(() => {
    const key = invalidationKey || deps
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!
    }

    const value = factory()
    cacheRef.current.set(key, value)
    return value
  }, [deps, invalidationKey])
}

// Enhanced useCallback with cache size limit
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options: {
    maxCacheSize?: number
    keyGenerator?: (...args: Parameters<T>) => string
  } = {}
): T {
  const { maxCacheSize = 50, keyGenerator } = options
  const cacheRef = useRef<Map<string, ReturnType<T>>>(new Map())
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  callbackRef.current = callback

  return useCallback((...args: Parameters<T>): ReturnType<T> => {
    // Generate cache key
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)

    // Check cache
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!
    }

    // Execute callback
    const result = callbackRef.current(...args)

    // Cache management
    if (cacheRef.current.size >= maxCacheSize) {
      // Remove oldest entry (FIFO)
      const firstKey = cacheRef.current.keys().next().value
      cacheRef.current.delete(firstKey)
    }

    // Cache result
    cacheRef.current.set(key, result)
    return result
  }, deps) as T
}

// Memoize expensive computations with time-based expiration
export function useMemoWithExpiration<T>(
  factory: () => T,
  deps: React.DependencyList,
  expirationMs: number = 5000
): T {
  const cacheRef = useRef<{ value: T; timestamp: number } | null>(null)

  return useMemo(() => {
    const now = Date.now()
    const cached = cacheRef.current

    if (cached && now - cached.timestamp < expirationMs) {
      return cached.value
    }

    const value = factory()
    cacheRef.current = { value, timestamp: now }
    return value
  }, deps)
}

// Memoize async operations
export function useMemoizedAsync<T, Args extends any[]>(
  asyncFn: (...args: Args) => Promise<T>,
  deps: React.DependencyList
): (...args: Args) => Promise<T> {
  const cacheRef = useRef<Map<string, Promise<T>>>(new Map())

  return useCallback((...args: Args): Promise<T> => {
    const key = JSON.stringify(args)

    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!
    }

    const promise = asyncFn(...args)
      .then(result => {
        // Cache successful results
        cacheRef.current.set(key, Promise.resolve(result))
        return result
      })
      .catch(error => {
        // Remove failed requests from cache
        cacheRef.current.delete(key)
        throw error
      })

    cacheRef.current.set(key, promise)
    return promise
  }, deps)
}

// Memoize DOM measurements
export function useMemoizedMeasurements<T>(
  measureFn: () => T,
  deps: React.DependencyList,
  options: {
    throttleMs?: number
    resizeObserver?: boolean
  } = {}
): T {
  const { throttleMs = 100, resizeObserver = false } = options
  const [value, setValue] = React.useState<T>(measureFn())
  const timeoutRef = useRef<NodeJS.Timeout>()

  React.useEffect(() => {
    const updateValue = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setValue(measureFn())
      }, throttleMs)
    }

    if (resizeObserver) {
      const observer = new ResizeObserver(updateValue)
      const element = document.documentElement

      observer.observe(element)
      return () => observer.disconnect()
    }

    window.addEventListener('resize', updateValue)
    return () => {
      window.removeEventListener('resize', updateValue)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, deps)

  return value
}

// Memoize event handlers with delegation
export function useMemoizedEventHandler<T extends Event>(
  handler: (event: T) => void,
  deps: React.DependencyList,
  options: {
    throttleMs?: number
    passive?: boolean
  } = {}
): (event: T) => void {
  const { throttleMs = 100, passive = false } = options
  const handlerRef = useRef(handler)
  const lastCallRef = useRef<number>(0)

  handlerRef.current = handler

  return useCallback((event: T) => {
    const now = Date.now()

    if (throttleMs && now - lastCallRef.current < throttleMs) {
      return
    }

    lastCallRef.current = now
    handlerRef.current(event)
  }, deps)
}

// Cache for expensive calculations with LRU eviction
export class LRUCache<K, V> {
  private cache = new Map<K, V>()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Hook for using LRU cache
export function useLRUCache<K, V>(maxSize: number = 100) {
  const cacheRef = React.useRef(new LRUCache<K, V>(maxSize))

  const get = React.useCallback((key: K) => cacheRef.current.get(key), [])
  const set = React.useCallback((key: K, value: V) => cacheRef.current.set(key, value), [])
  const has = React.useCallback((key: K) => cacheRef.current.has(key), [])
  const remove = React.useCallback((key: K) => cacheRef.current.delete(key), [])
  const clear = React.useCallback(() => cacheRef.current.clear(), [])

  return { get, set, has, remove, clear, size: () => cacheRef.current.size() }
}