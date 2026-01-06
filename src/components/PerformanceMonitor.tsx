'use client'

import { useEffect } from 'react'

// Minimal no-op replacements for the removed performance utilities.
export function PerformanceMonitorComponent() {
  return null
}

export function usePerformanceMonitor(_componentName: string) {
  // no-op hook to preserve API for callers
  useEffect(() => {
    return () => {}
  }, [])
}

export function PerformanceWarning() {
  return null
}