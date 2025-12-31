'use client'

import { AlertCircle, X, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface ErrorMessageProps {
  title?: string
  message: string
  type?: 'error' | 'warning' | 'info'
  dismissible?: boolean
  onDismiss?: () => void
  onRetry?: () => void
  className?: string
}

export default function ErrorMessage({
  title,
  message,
  type = 'error',
  dismissible = false,
  onDismiss,
  onRetry,
  className = ''
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const typeStyles = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-600',
      button: 'text-red-600 hover:text-red-700 hover:bg-red-100'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-600',
      button: 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-600',
      button: 'text-blue-600 hover:text-blue-700 hover:bg-blue-100'
    }
  }

  const styles = typeStyles[type]

  return (
    <div className={`border rounded-xl p-4 ${styles.container} ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${styles.icon}`} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold mb-1">{title}</h3>
          )}
          <p className="text-sm leading-relaxed">{message}</p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className={`inline-flex items-center gap-1 mt-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${styles.button}`}
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </button>
          )}
        </div>
        
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`p-1 rounded-lg transition-colors ${styles.button}`}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Specific error message components for common scenarios
export function NetworkErrorMessage({ onRetry, ...props }: Omit<ErrorMessageProps, 'message'>) {
  return (
    <ErrorMessage
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      {...props}
    />
  )
}

export function AuthErrorMessage({ onRetry, ...props }: Omit<ErrorMessageProps, 'message'>) {
  return (
    <ErrorMessage
      title="Authentication Error"
      message="Your session has expired. Please sign in again to continue."
      onRetry={onRetry}
      {...props}
    />
  )
}

export function ValidationErrorMessage({ message, ...props }: ErrorMessageProps) {
  return (
    <ErrorMessage
      title="Validation Error"
      message={message}
      type="warning"
      {...props}
    />
  )
}