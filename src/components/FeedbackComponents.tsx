'use client'

import { CheckCircle, Info, AlertTriangle, X, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ToastProps {
  id?: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

export function Toast({
  type,
  title,
  message,
  duration = 5000,
  dismissible = true,
  onDismiss,
  action
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onDismiss?.(), 300) // Allow fade out animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onDismiss])

  if (!isVisible) return null

  const typeConfig = {
    success: {
      icon: CheckCircle,
      colors: 'bg-green-50 border-green-200 text-green-800',
      iconColor: 'text-green-600',
      buttonColor: 'text-green-600 hover:text-green-700 hover:bg-green-100'
    },
    error: {
      icon: AlertTriangle,
      colors: 'bg-red-50 border-red-200 text-red-800',
      iconColor: 'text-red-600',
      buttonColor: 'text-red-600 hover:text-red-700 hover:bg-red-100'
    },
    warning: {
      icon: AlertTriangle,
      colors: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconColor: 'text-yellow-600',
      buttonColor: 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100'
    },
    info: {
      icon: Info,
      colors: 'bg-blue-50 border-blue-200 text-blue-800',
      iconColor: 'text-blue-600',
      buttonColor: 'text-blue-600 hover:text-blue-700 hover:bg-blue-100'
    }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss?.(), 300)
  }

  return (
    <div className={`
      border rounded-xl p-4 shadow-lg transition-all duration-300 transform
      ${config.colors}
      ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
    `}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold mb-1">{title}</h3>
          )}
          <p className="text-sm leading-relaxed">{message}</p>
          
          {action && (
            <button
              onClick={action.onClick}
              className={`inline-flex items-center gap-1 mt-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${config.buttonColor}`}
            >
              {action.label}
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
        
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`p-1 rounded-lg transition-colors ${config.buttonColor}`}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Toast container for managing multiple toasts
interface ToastContainerProps {
  toasts: (ToastProps & { id: string })[]
  onRemove: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'
}

export function ToastContainer({ 
  toasts, 
  onRemove, 
  position = 'top-right' 
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2'
  }

  return (
    <div className={`fixed z-50 ${positionClasses[position]} space-y-2 max-w-sm w-full`}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([])

  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearToasts = () => {
    setToasts([])
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success: (message: string, options?: Partial<ToastProps>) => 
      addToast({ type: 'success', message, ...options }),
    error: (message: string, options?: Partial<ToastProps>) => 
      addToast({ type: 'error', message, ...options }),
    warning: (message: string, options?: Partial<ToastProps>) => 
      addToast({ type: 'warning', message, ...options }),
    info: (message: string, options?: Partial<ToastProps>) => 
      addToast({ type: 'info', message, ...options })
  }
}

// Banner component for persistent messages
interface BannerProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  dismissible?: boolean
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function Banner({
  type,
  title,
  message,
  dismissible = true,
  onDismiss,
  action,
  className = ''
}: BannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const typeConfig = {
    success: {
      icon: CheckCircle,
      colors: 'bg-green-50 border-green-200 text-green-800',
      iconColor: 'text-green-600'
    },
    error: {
      icon: AlertTriangle,
      colors: 'bg-red-50 border-red-200 text-red-800',
      iconColor: 'text-red-600'
    },
    warning: {
      icon: AlertTriangle,
      colors: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    info: {
      icon: Info,
      colors: 'bg-blue-50 border-blue-200 text-blue-800',
      iconColor: 'text-blue-600'
    }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <div className={`border-l-4 p-4 ${config.colors} ${className}`}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 mt-0.5 mr-3 ${config.iconColor}`} />
        <div className="flex-1">
          {title && (
            <h3 className="font-semibold mb-1">{title}</h3>
          )}
          <p className="text-sm">{message}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline"
            >
              {action.label}
            </button>
          )}
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Status indicator component
interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading'
  message: string
  className?: string
}

export function StatusIndicator({ status, message, className = '' }: StatusIndicatorProps) {
  const statusConfig = {
    success: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    error: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    info: {
      icon: Info,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    loading: {
      icon: null,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${className}`}>
      {status === 'loading' ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className={`h-4 w-4 ${config.color}`} />
      ) : null}
      <span className={`text-sm font-medium ${config.color}`}>{message}</span>
    </div>
  )
}