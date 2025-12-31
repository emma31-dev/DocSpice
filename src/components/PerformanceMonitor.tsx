'use client'

import { useEffect, useState } from 'react'
import { PerformanceMonitor } from '@/lib/performance'
import { getCacheStats } from '@/lib/api-cache'

interface PerformanceStats {
  loadTime: number
  renderTime: number
  cacheSize: number
  memoryUsage: number
  networkRequests: number
}

interface PerformanceMonitorProps {
  enabled?: boolean
  showStats?: boolean
}

export function PerformanceMonitorComponent({ 
  enabled = process.env.NODE_ENV === 'development',
  showStats = false 
}: PerformanceMonitorProps) {
  const [stats, setStats] = useState<PerformanceStats>({
    loadTime: 0,
    renderTime: 0,
    cacheSize: 0,
    memoryUsage: 0,
    networkRequests: 0
  })
  const [isVisible, setIsVisible] = useState(showStats)

  useEffect(() => {
    if (!enabled) return

    // Mark performance start
    PerformanceMonitor.mark('app-start')

    // Monitor page load performance
    const measurePageLoad = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.fetchStart
          const renderTime = navigation.domContentLoadedEventEnd - navigation.fetchStart
          
          setStats(prev => ({
            ...prev,
            loadTime: Math.round(loadTime),
            renderTime: Math.round(renderTime)
          }))
        }
      }
    }

    // Monitor memory usage (if available)
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory
        setStats(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
        }))
      }
    }

    // Monitor cache size
    const measureCache = () => {
      const cacheStats = getCacheStats()
      setStats(prev => ({
        ...prev,
        cacheSize: cacheStats.size
      }))
    }

    // Monitor network requests
    let requestCount = 0
    const originalFetch = window.fetch
    window.fetch = (...args) => {
      requestCount++
      setStats(prev => ({
        ...prev,
        networkRequests: requestCount
      }))
      return originalFetch(...args)
    }

    // Initial measurements
    measurePageLoad()
    measureMemory()
    measureCache()

    // Periodic updates
    const interval = setInterval(() => {
      measureMemory()
      measureCache()
    }, 5000)

    // Measure render time
    setTimeout(() => {
      PerformanceMonitor.measure('app-render', 'app-start')
    }, 100)

    // Cleanup
    return () => {
      clearInterval(interval)
      window.fetch = originalFetch
    }
  }, [enabled])

  // Keyboard shortcut to toggle stats
  useEffect(() => {
    if (!enabled) return

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [enabled])

  if (!enabled || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Performance Stats</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Load Time:</span>
          <span className={stats.loadTime > 3000 ? 'text-red-400' : stats.loadTime > 1000 ? 'text-yellow-400' : 'text-green-400'}>
            {stats.loadTime}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Render Time:</span>
          <span className={stats.renderTime > 2000 ? 'text-red-400' : stats.renderTime > 500 ? 'text-yellow-400' : 'text-green-400'}>
            {stats.renderTime}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Cache Size:</span>
          <span className="text-blue-400">{stats.cacheSize} items</span>
        </div>
        
        {stats.memoryUsage > 0 && (
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className={stats.memoryUsage > 100 ? 'text-red-400' : stats.memoryUsage > 50 ? 'text-yellow-400' : 'text-green-400'}>
              {stats.memoryUsage}MB
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>Requests:</span>
          <span className="text-purple-400">{stats.networkRequests}</span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600 text-gray-400">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  )
}

// Hook for component-level performance monitoring
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startMark = `${componentName}-start`
    const endMark = `${componentName}-end`
    
    PerformanceMonitor.mark(startMark)
    
    return () => {
      PerformanceMonitor.mark(endMark)
      PerformanceMonitor.measure(`${componentName}-render`, startMark, endMark)
    }
  }, [componentName])
}

// Performance warning component
export function PerformanceWarning({ 
  threshold = 3000,
  message = "This page is loading slowly. Please check your network connection." 
}: {
  threshold?: number
  message?: string
}) {
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWarning(true)
    }, threshold)

    const handleLoad = () => {
      clearTimeout(timer)
      setShowWarning(false)
    }

    window.addEventListener('load', handleLoad)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('load', handleLoad)
    }
  }, [threshold])

  if (!showWarning) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => setShowWarning(false)}
          className="ml-2 text-yellow-600 hover:text-yellow-800"
        >
          ×
        </button>
      </div>
    </div>
  )
}