'use client'

import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'

interface SuccessMessageProps {
  message: string
}

export function SuccessMessage({ message }: SuccessMessageProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="mb-8 animate-fade-in">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
        <p className="text-green-800 font-medium">{message}</p>
      </div>
    </div>
  )
}
