'use client'

import { useEffect } from 'react'
import { CheckCircle } from 'lucide-react'

interface AuthSuccessProps {
  message: string
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

export default function AuthSuccess({ 
  message, 
  onClose, 
  autoClose = true, 
  duration = 3000 
}: AuthSuccessProps) {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">{message}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-3 flex-shrink-0 text-green-400 hover:text-green-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}