import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'jotai'
import AuthForm from '@/components/AuthForm'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('AuthForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    mockPush.mockClear()
  })

  const renderAuthForm = (mode: 'signin' | 'signup') => {
    return render(
      <Provider>
        <AuthForm mode={mode} />
      </Provider>
    )
  }

  describe('Sign In Mode', () => {
    it('should render signin form with correct fields', () => {
      renderAuthForm('signin')
      
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.getByText('Welcome back! Please sign in to your account.')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
      
      // Should not show username field
      expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      renderAuthForm('signin')
      
      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      
      await user.type(emailInput, 'invalid-email')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      // Check that form validation prevents submission
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      renderAuthForm('signin')
      
      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      await user.click(submitButton)
      
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })

    it('should submit signin form successfully', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Signed in successfully',
          user: { id: '1', email: 'test@example.com', user_name: 'testuser' }
        })
      })
      
      renderAuthForm('signin')
      
      await user.type(screen.getByLabelText('Email Address'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      })
      
      expect(mockPush).toHaveBeenCalledWith('/home')
    })

    it('should handle signin error', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      })
      
      renderAuthForm('signin')
      
      await user.type(screen.getByLabelText('Email Address'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })
  })

  describe('Sign Up Mode', () => {
    it('should render signup form with correct fields', () => {
      renderAuthForm('signup')
      
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument()
      expect(screen.getByText('Join DocSpice to start publishing your articles.')).toBeInTheDocument()
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
      expect(screen.getByText('Already have an account?')).toBeInTheDocument()
    })

    it('should validate username requirements', async () => {
      const user = userEvent.setup()
      renderAuthForm('signup')
      
      const usernameInput = screen.getByLabelText('Username')
      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      
      // Test short username
      await user.type(usernameInput, 'ab')
      await user.click(submitButton)
      
      expect(screen.getByText('Username must be at least 3 characters long')).toBeInTheDocument()
      
      // Clear and test long username
      await user.clear(usernameInput)
      await user.type(usernameInput, 'a'.repeat(51))
      await user.click(submitButton)
      
      expect(screen.getByText('Username must be less than 50 characters')).toBeInTheDocument()
    })

    it('should validate password length for signup', async () => {
      const user = userEvent.setup()
      renderAuthForm('signup')
      
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      
      await user.type(passwordInput, '123')
      await user.click(submitButton)
      
      expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument()
    })

    it('should submit signup form successfully', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'User created successfully',
          user: { id: '1', email: 'test@example.com', user_name: 'testuser' }
        })
      })
      
      renderAuthForm('signup')
      
      await user.type(screen.getByLabelText('Username'), 'testuser')
      await user.type(screen.getByLabelText('Email Address'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Create Account' }))
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('testuser')
        }))
      })
      
      expect(mockPush).toHaveBeenCalledWith('/home')
    })
  })

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Success', user: {} })
        }), 100))
      )
      
      renderAuthForm('signin')
      
      await user.type(screen.getByLabelText('Email Address'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))
      
      // Should show loading state
      expect(screen.getByText('Signing In...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })
  })

  describe('Navigation', () => {
    it('should navigate to signup from signin', async () => {
      const user = userEvent.setup()
      renderAuthForm('signin')
      
      const signupLink = screen.getByRole('button', { name: 'Sign up' })
      await user.click(signupLink)
      
      expect(mockPush).toHaveBeenCalledWith('/auth/signup')
    })

    it('should navigate to signin from signup', async () => {
      const user = userEvent.setup()
      renderAuthForm('signup')
      
      const signinLink = screen.getByRole('button', { name: 'Sign in' })
      await user.click(signinLink)
      
      expect(mockPush).toHaveBeenCalledWith('/auth/signin')
    })
  })
})