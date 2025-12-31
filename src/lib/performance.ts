/**
 * Performance optimization utilities
 */

// Debounce function for search inputs and API calls
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Throttle function for scroll events and frequent updates
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }
  
  return new IntersectionObserver(callback, defaultOptions)
}

// Image preloader for better UX
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Batch multiple state updates to prevent excessive re-renders
export function batchUpdates(
  updates: Array<() => void>,
  delay: number = 0
): void {
  if (delay === 0) {
    // Use React's automatic batching for synchronous updates
    updates.forEach(update => update())
  } else {
    // Batch with delay for async updates
    setTimeout(() => {
      updates.forEach(update => update())
    }, delay)
  }
}

// Memory-efficient array chunking for large datasets
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

// Virtual scrolling helper for large lists
export interface VirtualScrollConfig {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export function calculateVirtualScrollRange(
  scrollTop: number,
  totalItems: number,
  config: VirtualScrollConfig
): { startIndex: number; endIndex: number; offsetY: number } {
  const { itemHeight, containerHeight, overscan = 5 } = config
  
  const visibleItemCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    totalItems - 1,
    startIndex + visibleItemCount + overscan * 2
  )
  
  return {
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map()
  
  static mark(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(name)
      this.marks.set(name, performance.now())
    }
  }
  
  static measure(name: string, startMark: string, endMark?: string): number {
    if (typeof performance !== 'undefined') {
      const endTime = endMark ? this.marks.get(endMark) : performance.now()
      const startTime = this.marks.get(startMark)
      
      if (startTime && endTime) {
        const duration = endTime - startTime
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
        return duration
      }
    }
    return 0
  }
  
  static clearMarks(): void {
    if (typeof performance !== 'undefined') {
      performance.clearMarks()
      this.marks.clear()
    }
  }
}

// Cache implementation for API responses
export class SimpleCache<T> {
  private cache: Map<string, { data: T; timestamp: number; ttl: number }> = new Map()
  
  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  size(): number {
    return this.cache.size
  }
}

// Global cache instance for API responses
export const apiCache = new SimpleCache<unknown>()

// Request deduplication to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<unknown>>()

export async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)! as Promise<T>
  }
  
  const promise = requestFn().finally(() => {
    pendingRequests.delete(key)
  })
  
  pendingRequests.set(key, promise as Promise<unknown>)
  return promise
}