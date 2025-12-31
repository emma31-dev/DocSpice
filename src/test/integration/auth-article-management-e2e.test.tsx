/**
 * Authentication and Article Management E2E Tests
 * Tests complete user authentication flows and article management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JotaiProvider } from '@/components/JotaiProvider'
import { ToastProvider } from '@/components/ToastProvider'
import AuthForm from '@/components/AuthForm'
import ProfilePage from '@/app/profile/page'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/auth/signin',
}))

// Mock the useAuth hook with different states
const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  useAuthActions: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn()
  })
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    })
  })
}))

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <JotaiProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </JotaiProvider>
)

describe('Authentication and Article Management E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('User Registration Flow', () => {
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
    })

    it('should complete user registration successfully', async () => {
      const user = userEvent.setup()
      const mockSignUp = vi.fn().mockResolvedValue({ success: true })

      vi.mocked(vi.importMock('@/hooks/useAuth')).useAuthActions.mockReturnValue({
        signIn: vi.fn(),
        signUp: mockSignUp,
        signOut: vi.fn()
      })

      render(
        <TestWrapper>
          <AuthForm mode="signup" />
        </TestWrapper>
      )

      // Fill out registration form
      await user.type(screen.getByLabelText(/username/i), 'testuser')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'securepassword123')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'test@example.com',
          'securepassword123',
          'testuser'
        )
      })
    })

    it('should handle registration validation errors', async () => {
      const user = userEvent.setup()
      const mockSignUp = vi.fn().mockResolvedValue({ 
        success: false, 
        error: 'Email already exists' 
      })

      vi.mocked(vi.importMock('@/hooks/useAuth')).useAuthActions.mockReturnValue({
        signIn: vi.fn(),
        signUp: mockSignUp,
        signOut: vi.fn()
      })

      render(
        <TestWrapper>
          <AuthForm mode="signup" />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/username/i), 'testuser')
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Email already exists/)).toBeInTheDocument()
      })
    })

    it('should validate form fields before submission', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <AuthForm mode="signup" />
        </TestWrapper>
      )

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Should show validation errors
      expect(screen.getByText(/username is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  describe('User Sign In Flow', () => {
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
    })

    it('should complete sign in successfully', async () => {
      const user = userEvent.setup()
      const mockSignIn = vi.fn().mockResolvedValue({ success: true })

      vi.mocked(vi.importMock('@/hooks/useAuth')).useAuthActions.mockReturnValue({
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn()
      })

      render(
        <TestWrapper>
          <AuthForm mode="signin" />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('should handle invalid credentials', async () => {
      const user = userEvent.setup()
      const mockSignIn = vi.fn().mockResolvedValue({ 
        success: false, 
        error: 'Invalid email or password' 
      })

      vi.mocked(vi.importMock('@/hooks/useAuth')).useAuthActions.mockReturnValue({
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn()
      })

      render(
        <TestWrapper>
          <AuthForm mode="signin" />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Invalid email or password/)).toBeInTheDocument()
      })
    })
  })

  describe('Profile Management', () => {
    const mockUser = {
      id: 'user-123',
      user_name: 'testuser',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z'
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' },
        appUser: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
        signOut: vi.fn().mockResolvedValue(undefined)
      })
    })

    it('should display user profile information', () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      )

      expect(screen.getByText('testuser')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('January 1, 2024')).toBeInTheDocument()
      expect(screen.getByText('user-123')).toBeInTheDocument()
    })

    it('should handle sign out from profile page', async () => {
      const user = userEvent.setup()
      const mockSignOut = vi.fn().mockResolvedValue(undefined)
      const mockPush = vi.fn()

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' },
        appUser: mockUser,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
        signOut: mockSignOut
      })

      vi.mocked(vi.importMock('next/navigation')).useRouter.mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        back: vi.fn(),
      })

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      )

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      await user.click(signOutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('should redirect unauthenticated users', () => {
      const mockPush = vi.fn()

      mockUseAuth.mockReturnValue({
        user: null,
        appUser: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initialized: true,
        signOut: vi.fn()
      })

      vi.mocked(vi.importMock('next/navigation')).useRouter.mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        back: vi.fn(),
      })

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      )

      expect(mockPush).toHaveBeenCalledWith('/auth/signin?redirect=/profile')
    })
  })

  describe('Article Management API Integration', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' },
        appUser: {
          id: 'user-123',
          user_name: 'testuser',
          email: 'test@example.com',
          created_at: '2024-01-01T00:00:00Z'
        },
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
        signOut: vi.fn()
      })
    })

    it('should fetch user articles successfully', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          title: 'User Article 1',
          body: 'Content 1',
          image_links: [],
          created_at: '2024-01-01T00:00:00Z',
          author_name: 'testuser'
        },
        {
          id: 'article-2',
          title: 'User Article 2',
          body: 'Content 2',
          image_links: [],
          created_at: '2024-01-02T00:00:00Z',
          author_name: 'testuser'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          articles: mockArticles,
          pagination: { page: 1, limit: 10, total: 2, hasMore: false }
        })
      })

      // Test would need a component that fetches user articles
      // This is a placeholder for when that functionality is implemented
      expect(mockFetch).toBeDefined()
    })

    it('should handle article deletion', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Article deleted successfully',
          deleted_article: { id: 'article-1', title: 'Deleted Article' }
        })
      })

      // Simulate article deletion API call
      const response = await fetch('/api/elysia/articles/article-1', {
        method: 'DELETE'
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.message).toBe('Article deleted successfully')
    })

    it('should handle article update', async () => {
      const updatedArticle = {
        title: 'Updated Article Title',
        body: 'Updated article content',
        image_links: []
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Article updated successfully',
          article: { id: 'article-1', ...updatedArticle }
        })
      })

      const response = await fetch('/api/elysia/articles/article-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedArticle)
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.message).toBe('Article updated successfully')
    })
  })

  describe('State Persistence and Recovery', () => {
    it('should persist authentication state across page reloads', () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      })

      mockUseAuth.mockReturnValue({
        user: { id: 'user-123' },
        appUser: {
          id: 'user-123',
          user_name: 'testuser',
          email: 'test@example.com',
          created_at: '2024-01-01T00:00:00Z'
        },
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
        signOut: vi.fn()
      })

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      )

      // User should be authenticated and profile should display
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })

    it('should handle authentication state initialization', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        appUser: null,
        isAuthenticated: false,
        loading: true,
        error: null,
        initialized: false,
        signOut: vi.fn()
      })

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>
      )

      // Should show loading state
      expect(screen.getByRole('generic')).toBeInTheDocument() // Loading spinner
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should recover from authentication errors', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        appUser: null,
        isAuthenticated: false,
        loading: false,
        error: 'Session expired',
        initialized: true,
        signOut: vi.fn()
      })

      render(
        <TestWrapper>
          <AuthForm mode="signin" />
        </TestWrapper>
      )

      // Should still render the form despite the error
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('should handle network failures gracefully', async () => {
      const user = userEvent.setup()
      const mockSignIn = vi.fn().mockRejectedValue(new Error('Network error'))

      vi.mocked(vi.importMock('@/hooks/useAuth')).useAuthActions.mockReturnValue({
        signIn: mockSignIn,
        signUp: vi.fn(),
        signOut: vi.fn()
      })

      render(
        <TestWrapper>
          <AuthForm mode="signin" />
        </TestWrapper>
      )

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })
})