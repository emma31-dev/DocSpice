'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useToast, ToastContainer } from '@/components/FeedbackComponents'

interface ToastContextType {
  success: (message: string, options?: Partial<{ title?: string; duration?: number; dismissible?: boolean }>) => void
  error: (message: string, options?: Partial<{ title?: string; duration?: number; dismissible?: boolean }>) => void
  warning: (message: string, options?: Partial<{ title?: string; duration?: number; dismissible?: boolean }>) => void
  info: (message: string, options?: Partial<{ title?: string; duration?: number; dismissible?: boolean }>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer 
        toasts={toast.toasts} 
        onRemove={toast.removeToast}
        position="top-right"
      />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}