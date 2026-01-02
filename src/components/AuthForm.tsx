'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ErrorMessage from '@/components/ErrorMessage'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onSuccess?: () => void
  redirectTo?: string
}

interface FormData {
  email: string
  password: string
  user_name?: string
}

interface FormErrors {
  email?: string
  password?: string
  user_name?: string
  general?: string
}

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    user_name: mode === 'signup' ? '' : undefined
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get redirect URL from search params or default to /home
  const redirectTo = searchParams.get('redirect') || '/home'

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (mode === 'signup' && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
    }

    // Username validation for signup
    if (mode === 'signup') {
      if (!formData.user_name) {
        newErrors.user_name = 'Username is required'
      } else if (formData.user_name.length < 3) {
        newErrors.user_name = 'Username must be at least 3 characters long'
      } else if (formData.user_name.length > 50) {
        newErrors.user_name = 'Username must be less than 50 characters'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const supabase = createClient()

      if (mode === 'signin') {
        console.log('Starting signin process...')
        // Sign in with Supabase directly
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        console.log('Signin result:', { data: !!data, error })

        if (error) {
          console.log('Signin error:', error)
          setErrors({ general: error.message })
          setIsLoading(false)
          return
        }

        if (!data.user) {
          console.log('No user returned from signin')
          setErrors({ general: 'Authentication failed' })
          setIsLoading(false)
          return
        }

        console.log('Signin successful, user:', data.user.id)
      } else {
        // Sign up with Supabase directly
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password
        })

        if (authError) {
          setErrors({ general: authError.message })
          setIsLoading(false)
          return
        }

        if (!authData.user) {
          setErrors({ general: 'Failed to create user' })
          setIsLoading(false)
          return
        }

        // Create user profile in our users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            user_name: formData.user_name!,
            email: formData.email
          })

        if (profileError) {
          setErrors({ general: 'Failed to create user profile: ' + profileError.message })
          setIsLoading(false)
          return
        }
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      } else {
        // Small delay to allow auth state to update
        setTimeout(() => {
          router.push(redirectTo)
        }, 100)
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Auth error:', error)
      setErrors({ general: 'Network error. Please try again.' })
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSwitchMode = () => {
    const currentRedirect = searchParams.get('redirect')
    const targetPath = mode === 'signin' ? '/auth/signup' : '/auth/signin'
    const url = currentRedirect ? `${targetPath}?redirect=${encodeURIComponent(currentRedirect)}` : targetPath
    router.push(url)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {mode === 'signin' ? 'Welcome Back' : 'Join DocSpice'}
          </h2>
          <p className="mt-2 text-gray-600">
            {mode === 'signin' 
              ? 'Sign in to publish and manage your articles' 
              : 'Create an account to start publishing beautiful articles'
            }
          </p>
        </div>

        {errors.general && (
          <ErrorMessage 
            message={errors.general} 
            dismissible 
            onDismiss={() => setErrors(prev => ({ ...prev, general: undefined }))}
          />
        )}

        {mode === 'signup' && (
          <div>
            <label htmlFor="user_name" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="user_name"
              value={formData.user_name || ''}
              onChange={handleInputChange('user_name')}
              className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.user_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Choose a username"
              disabled={isLoading}
            />
            {errors.user_name && (
              <p className="mt-1 text-sm text-red-600">{errors.user_name}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter your email"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.password ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={mode === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white py-3 px-4 rounded-xl font-semibold
            hover:from-blue-700 hover:to-sky-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
            disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl
            transform hover:scale-105 disabled:transform-none"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
            </span>
          ) : (
            mode === 'signin' ? 'Sign In' : 'Create Account'
          )}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={handleSwitchMode}
              className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              disabled={isLoading}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}