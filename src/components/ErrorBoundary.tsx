'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} retry={this.retry} />
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.retry} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error
  retry: () => void
}

function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-sky-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h2>
          
          <p className="text-gray-600 mb-6">
            We encountered an unexpected error. This has been logged and we&apos;ll look into it.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-mono text-red-600 break-all">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={retry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl
                hover:from-blue-700 hover:to-sky-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl
                hover:bg-gray-200 transition-all duration-200 border border-gray-200"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for handling async errors in components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    console.error('Async error:', error, errorInfo)
    // In a real app, you might want to send this to an error reporting service
  }
}

export default ErrorBoundary