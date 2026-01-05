import { atom } from 'jotai'

// User type from our API
export interface ApiUser {
  id: string
  user_name: string
  email: string
  created_at: string
}

// Core authentication atoms - now using our API user type
export const supabaseUserAtom = atom<ApiUser | null>(null)
export const appUserAtom = atom<ApiUser | null>(null)
export const isAuthenticatedAtom = atom(get => get(supabaseUserAtom) !== null)
export const authLoadingAtom = atom<boolean>(true)
export const authErrorAtom = atom<string | null>(null)

// Derived atom for user initialization status
export const authInitializedAtom = atom<boolean>(false)

// Write-only atom for setting authentication state
export const setAuthStateAtom = atom(
  null,
  (get, set, { user, appUser, loading, error }: {
    user?: ApiUser | null
    appUser?: ApiUser | null
    loading?: boolean
    error?: string | null
  }) => {
    if (user !== undefined) set(supabaseUserAtom, user)
    if (appUser !== undefined) set(appUserAtom, appUser)
    if (loading !== undefined) set(authLoadingAtom, loading)
    if (error !== undefined) set(authErrorAtom, error)
  }
)