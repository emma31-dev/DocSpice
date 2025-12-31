'use client'

import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  supabaseUserAtom,
  appUserAtom,
  isAuthenticatedAtom,
  authLoadingAtom,
  authErrorAtom,
  authInitializedAtom,
  initializeAuthAtom,
  signOutAtom,
  setAuthStateAtom
} from '@/atoms/auth'

export function useAuth() {
  const supabaseUser = useAtomValue(supabaseUserAtom)
  const appUser = useAtomValue(appUserAtom)
  const isAuthenticated = useAtomValue(isAuthenticatedAtom)
  const loading = useAtomValue(authLoadingAtom)
  const error = useAtomValue(authErrorAtom)
  const initialized = useAtomValue(authInitializedAtom)
  
  const initializeAuth = useSetAtom(initializeAuthAtom)
  const signOut = useSetAtom(signOutAtom)
  const setAuthState = useSetAtom(setAuthStateAtom)

  // Initialize auth state and set up auth state listener
  useEffect(() => {
    const supabase = createClient()
    
    // Initialize auth state
    initializeAuth()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthState({ user: session.user, loading: true })
          
          // Fetch app user data
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, user_name, email, created_at')
            .eq('id', session.user.id)
            .single()

          if (userError) {
            console.error('Error fetching user data:', userError)
            setAuthState({ appUser: null, loading: false })
          } else {
            setAuthState({ appUser: userData, loading: false })
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthState({ 
            user: null, 
            appUser: null, 
            loading: false, 
            error: null 
          })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [initializeAuth, setAuthState])

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
  const signOut = useSetAtom(signOutAtom)
  
  const signIn = async (email: string, password: string) => {
    try {
      setAuthState({ loading: true, error: null })
      
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        throw error
      }
      
      // Auth state will be updated by the onAuthStateChange listener
      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setAuthState({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  const signUp = async (email: string, password: string, userName: string) => {
    try {
      setAuthState({ loading: true, error: null })
      
      const supabase = createClient()
      
      // First, sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })
      
      if (authError) {
        throw authError
      }
      
      if (!authData.user) {
        throw new Error('User creation failed')
      }
      
      // Then create user record in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          user_name: userName,
          email: email
        })
        .select('id, user_name, email, created_at')
        .single()
      
      if (userError) {
        throw userError
      }
      
      // Auth state will be updated by the onAuthStateChange listener
      return { success: true, data: { auth: authData, user: userData } }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      setAuthState({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  return {
    signIn,
    signUp,
    signOut
  }
}