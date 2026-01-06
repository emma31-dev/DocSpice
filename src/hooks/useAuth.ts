'use client'

import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import {
  supabaseUserAtom,
  appUserAtom,
  isAuthenticatedAtom,
  authLoadingAtom,
  authErrorAtom,
  authInitializedAtom,
  setAuthStateAtom
} from '@/atoms/auth'

export function useAuth() {
  const supabaseUser = useAtomValue(supabaseUserAtom)
  const appUser = useAtomValue(appUserAtom)
  const isAuthenticated = useAtomValue(isAuthenticatedAtom)
  const loading = useAtomValue(authLoadingAtom)
  const error = useAtomValue(authErrorAtom)
  const initialized = useAtomValue(authInitializedAtom)
  
  const setAuthState = useSetAtom(setAuthStateAtom)

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthState({ loading: true })
        
        const response = await fetch('/api/elysia/auth/user', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setAuthState({ 
            user: data.user, 
            appUser: data.user, 
            loading: false
          })
        } else {
          setAuthState({ 
            user: null, 
            appUser: null, 
            loading: false
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthState({ 
          user: null, 
          appUser: null, 
          loading: false, 
          error: 'Failed to initialize auth'
        })
      }
    }

    initializeAuth()
  }, [setAuthState])

  const signOut = async () => {
    try {
      setAuthState({ loading: true })
      
      const response = await fetch('/api/elysia/auth/signout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        setAuthState({ 
          user: null, 
          appUser: null, 
          loading: false, 
          error: null 
        })
        // Redirect to home or login page
        window.location.href = '/'
      } else {
        const data = await response.json()
        setAuthState({ 
          loading: false, 
          error: data.error || 'Sign out failed' 
        })
      }
    } catch (error) {
      console.error('Sign out error:', error)
      setAuthState({ 
        loading: false, 
        error: 'Sign out failed' 
      })
    }
  }

  return {
    user: supabaseUser,
    appUser,
    isAuthenticated,
    loading,
    error,
    initialized,
    signOut
  }
}

export function useAuthActions() {
  const setAuthState = useSetAtom(setAuthStateAtom)
  
  const signIn = async (email: string, password: string) => {
    try {
      setAuthState({ loading: true, error: null })
      
      const response = await fetch('/api/elysia/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setAuthState({ 
          user: data.user, 
          appUser: data.user, 
          loading: false 
        })
        return { success: true, data }
      } else {
        setAuthState({ 
          loading: false, 
          error: data.error || 'Sign in failed' 
        })
        return { success: false, error: data.error || 'Sign in failed' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setAuthState({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  const signUp = async (email: string, password: string, userName: string) => {
    try {
      setAuthState({ loading: true, error: null })
      
      const response = await fetch('/api/elysia/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email, 
          password, 
          user_name: userName 
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setAuthState({ 
          user: data.user, 
          appUser: data.user, 
          loading: false 
        })
        return { success: true, data }
      } else {
        setAuthState({ 
          loading: false, 
          error: data.error || 'Sign up failed' 
        })
        return { success: false, error: data.error || 'Sign up failed' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      setAuthState({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      setAuthState({ loading: true })
      
      const response = await fetch('/api/elysia/auth/signout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        setAuthState({ 
          user: null, 
          appUser: null, 
          loading: false, 
          error: null 
        })
        // Redirect to home or login page
        window.location.href = '/'
      } else {
        const data = await response.json()
        setAuthState({ 
          loading: false, 
          error: data.error || 'Sign out failed' 
        })
      }
    } catch (error) {
      console.error('Sign out error:', error)
      setAuthState({ 
        loading: false, 
        error: 'Sign out failed' 
      })
    }
  }

  return {
    signIn,
    signUp,
    signOut
  }
}