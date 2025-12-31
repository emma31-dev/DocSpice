import { atom } from 'jotai'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// User type from our application
export interface AppUser {
  id: string
  user_name: string
  email: string
  created_at: string
}

// Core authentication atoms
export const supabaseUserAtom = atom<User | null>(null)
export const appUserAtom = atom<AppUser | null>(null)
export const isAuthenticatedAtom = atom(get => get(supabaseUserAtom) !== null)
export const authLoadingAtom = atom<boolean>(true)
export const authErrorAtom = atom<string | null>(null)

// Derived atom for user initialization status
export const authInitializedAtom = atom<boolean>(false)

// Write-only atom for setting authentication state
export const setAuthStateAtom = atom(
  null,
  (get, set, { user, appUser, loading, error }: {
    user?: User | null
    appUser?: AppUser | null
    loading?: boolean
    error?: string | null
  }) => {
    if (user !== undefined) set(supabaseUserAtom, user)
    if (appUser !== undefined) set(appUserAtom, appUser)
    if (loading !== undefined) set(authLoadingAtom, loading)
    if (error !== undefined) set(authErrorAtom, error)
  }
)

// Write-only atom for initializing auth state
export const initializeAuthAtom = atom(
  null,
  async (get, set) => {
    try {
      set(authLoadingAtom, true)
      set(authErrorAtom, null)
      
      const supabase = createClient()
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      if (session?.user) {
        set(supabaseUserAtom, session.user)
        
        // Fetch app user data from our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, user_name, email, created_at')
          .eq('id', session.user.id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
          // Don't throw here, just set supabase user without app user data
        } else {
          set(appUserAtom, userData)
        }
      } else {
        set(supabaseUserAtom, null)
        set(appUserAtom, null)
      }
      
      set(authInitializedAtom, true)
    } catch (error) {
      console.error('Auth initialization error:', error)
      set(authErrorAtom, error instanceof Error ? error.message : 'Authentication error')
      set(supabaseUserAtom, null)
      set(appUserAtom, null)
      set(authInitializedAtom, true)
    } finally {
      set(authLoadingAtom, false)
    }
  }
)

// Write-only atom for signing out
export const signOutAtom = atom(
  null,
  async (get, set) => {
    try {
      set(authLoadingAtom, true)
      set(authErrorAtom, null)
      
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      set(supabaseUserAtom, null)
      set(appUserAtom, null)
    } catch (error) {
      console.error('Sign out error:', error)
      set(authErrorAtom, error instanceof Error ? error.message : 'Sign out error')
    } finally {
      set(authLoadingAtom, false)
    }
  }
)