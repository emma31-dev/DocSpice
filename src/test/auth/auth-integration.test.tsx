import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'jotai'
import AuthForm from '@/components/AuthForm'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    mockPush.mockClear()
  })

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<Provider>{component}</Provider>)
  }

  describe('Complete Authentication Flow', () => {
    it('should handle successful signup and redirect', async () => {
      const user = userEvent.setup()
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'User created successfully',
          user: {
            id: 'test-user-id',
            email: 'newuser@example.com',
            user_name: 'newuser'
          }
        })
      })

      renderWithProvider(<AuthForm mode="signup" />)

      await user.type(screen.getByLabelText('Username'), 'newuser')
      await user.type(screen.getByLabelText('Email Address'), 'newuser@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Create Account' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }))
      })

      expect(mockPush).toHaveBeenCalledWith('/home')
    })

    it('should handle successful signin and redirect', async () => {
      const user = userEvent.setup()
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Signed in successfully',
          user: {
            id: 'existing-user-id',
            email: 'user@example.com',
            user_name: 'existinguser'
          }
        })
      })

      renderWithProvider(<AuthForm mode="signin" />)

      await user.type(screen.getByLabelText('Email Address'), 'user@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/signin', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }))
      })

      expect(mockPush).toHaveBeenCalledWith('/home')
    })

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup()
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Email already exists'
        })
      })

      renderWithProvider(<AuthForm mode="signup" />)

      await user.type(screen.getByLabelText('Username'), 'testuser')
      await user.type(screen.getByLabelText('Email Address'), 'existing@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Create Account' }))

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument()
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      renderWithProvider(<AuthForm mode="signin" />)

      await user.type(screen.getByLabelText('Email Address'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument()
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should use custom redirect path when provided', async () => {
      const user = userEvent.setup()
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Signed in successfully',
          user: { id: '1', email: 'test@example.com' }
        })
      })

      renderWithProvider(<AuthForm mode="signin" redirectTo="/custom-path" />)

      await user.type(screen.getByLabelText('Email Address'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-path')
      })
    })

    it('should call onSuccess callback when provided', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Signed in successfully',
          user: { id: '1', email: 'test@example.com' }
        })
      })

      renderWithProvider(<AuthForm mode="signin" onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText('Email Address'), 'test@example.com')
      await user.type(screen.getByLabelText('Password'), 'password123')
      await user.click(screen.getByRole('button', { name: 'Sign In' }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})