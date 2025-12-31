/**
 * Complete User Journey Integration Tests
 * Tests the full user flow from landing to publishing articles
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { JotaiProvider } from '@/components/JotaiProvider'
import { ToastProvider } from '@/components/ToastProvider'
import Navigation from '@/components/Navigation'
import { useAuth } from '@/hooks/useAuth'

// Mock Jotai atoms
vi.mock('@/atoms/auth', () => ({
  appUserAtom: {
    toString: () => 'appUserAtom'
  }
}))

// Mock the useAuth hook
vi.mock('@/hooks/useAuth')
const mockUseAuth = vi.mocked(useAuth)

// Mock useAtom to control the appUserAtom value
const mockUseAtom = vi.fn()
vi.mock('jotai', () => ({
  useAtom: (atom: unknown) => {
    if (atom.toString() === 'appUserAtom') {
      return mockUseAtom()
    }
    return [null, vi.fn()]
  }
}))

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mock DocSpiceIcon component
vi.mock('@/components/DocSpiceIcon', () => ({
  DocSpiceIcon: ({ size, className }: { size: number; className: string }) => (
    <div data-testid="docspice-icon" style={{ width: size, height: size }} className={className}>
      DocSpice Icon
    </div>
  )
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    })
  })
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <JotaiProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </JotaiProvider>
)

describe('Complete User Journey Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Anonymous User Flow', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        appUser: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initialized: true,
        signOut: vi.fn()
      })
      mockUseAtom.mockReturnValue([null, vi.fn()]) // Mock appUserAtom as null
    })

    it('should show anonymous navigation options', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      expect(screen.getByText('Try It Free')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.queryByText('Home')).not.toBeInTheDocument()
      expect(screen.queryByText('Profile')).not.toBeInTheDocument()
    })

    it('should handle mobile menu for anonymous users', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      // Find the mobile menu button
      const menuButton = screen.getByRole('button')
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText('Try DocSpice Free')).toBeInTheDocument()
        expect(screen.getByText('Create Account')).toBeInTheDocument()
      })
    })
  })

  describe('Authenticated User Flow', () => {
    const mockUser = {
      id: 'user-123',
      user_name: 'testuser',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z'
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' } as { id: string },
        appUser: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
        signOut: vi.fn().mockResolvedValue(undefined)
      })
      mockUseAtom.mockReturnValue([mockUser, vi.fn()]) // Mock appUserAtom with user data
    })

    it('should show authenticated navigation options', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Create')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument()
    })

    it('should handle sign out flow', async () => {
      const mockSignOut = vi.fn().mockResolvedValue(undefined)
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' } as { id: string },
        appUser: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
        signOut: mockSignOut
      })

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('should show authenticated mobile menu options', async () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      // Find the mobile menu button by its SVG content
      const menuButton = screen.getByRole('button')
      fireEvent.click(menuButton)

      await waitFor(() => {
        expect(screen.getByText('Home Feed')).toBeInTheDocument()
        expect(screen.getByText('Create Article')).toBeInTheDocument()
        expect(screen.getByText('My Profile')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during authentication', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        appUser: null,
        isAuthenticated: false,
        loading: true,
        error: null,
        initialized: false,
        signOut: vi.fn()
      })
      mockUseAtom.mockReturnValue([null, vi.fn()])

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      // Should show loading placeholders
      const loadingElements = screen.getAllByRole('generic')
      const hasLoadingClass = loadingElements.some(el => 
        el.className.includes('animate-pulse')
      )
      expect(hasLoadingClass).toBe(true)
    })
  })

  describe('Error States', () => {
    it('should handle authentication errors gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        appUser: null,
        isAuthenticated: false,
        loading: false,
        error: 'Authentication failed',
        initialized: true,
        signOut: vi.fn()
      })
      mockUseAtom.mockReturnValue([null, vi.fn()])

      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      // Should still render navigation but in anonymous state
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
    })
  })

  describe('State Synchronization', () => {
    it('should properly sync authentication state changes', async () => {
      // Start with anonymous state
      mockUseAuth.mockReturnValue({
        user: null,
        appUser: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initialized: true,
        signOut: vi.fn()
      })
      mockUseAtom.mockReturnValue([null, vi.fn()])

      const { rerender } = render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      expect(screen.getByText('Sign In')).toBeInTheDocument()

      // Change to authenticated state
      const mockUser = {
        id: 'user-123',
        user_name: 'testuser',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z'
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' } as { id: string },
        appUser: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
        signOut: vi.fn()
      })
      mockUseAtom.mockReturnValue([mockUser, vi.fn()])

      rerender(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      expect(screen.getByText('Create')).toBeInTheDocument()
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    })
  })

  describe('Navigation Integration', () => {
    it('should show correct logo link based on auth state', () => {
      // Anonymous user - logo should link to home page
      mockUseAuth.mockReturnValue({
        user: null,
        appUser: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initialized: true,
        signOut: vi.fn()
      })
      mockUseAtom.mockReturnValue([null, vi.fn()])

      const { rerender } = render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      const logoLink = screen.getByRole('link', { name: /docspice/i })
      expect(logoLink).toHaveAttribute('href', '/')

      // Authenticated user - logo should link to home feed
      const mockUser = {
        id: 'user-123',
        user_name: 'testuser',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z'
      }

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' } as { id: string },
        appUser: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
        signOut: vi.fn()
      })
      mockUseAtom.mockReturnValue([mockUser, vi.fn()])

      rerender(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      const authenticatedLogoLink = screen.getByRole('link', { name: /docspice/i })
      expect(authenticatedLogoLink).toHaveAttribute('href', '/home')
    })
  })
})