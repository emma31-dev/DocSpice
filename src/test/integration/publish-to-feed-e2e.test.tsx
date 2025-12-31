/**
 * End-to-End Publish to Feed Workflow Tests
 * Tests the complete flow from article creation to feed display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JotaiProvider } from '@/components/JotaiProvider'
import { ToastProvider } from '@/components/ToastProvider'
import CreatePage from '@/app/create/page'
import { ArticleCard } from '@/components/ArticleCard'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/create',
}))

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => <img src={src} alt={alt} {...props} />
}))

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
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
}))

// Mock the generateArticle action
vi.mock('@/app/actions', () => ({
  generateArticle: vi.fn().mockResolvedValue({
    article: {
      title: 'Test Article Title',
      content: 'This is a test article content with multiple paragraphs.\n\nThis is the second paragraph of the test article.',
      images: [
        {
          url: 'https://images.unsplash.com/test-image-1',
          alt: 'Test image 1',
          position: 1,
          unsplash_id: 'test-1'
        },
        {
          url: 'https://images.unsplash.com/test-image-2',
          alt: 'Test image 2',
          position: 2,
          unsplash_id: 'test-2'
        }
      ]
    }
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

describe('Publish to Feed E2E Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('Complete Article Creation and Publishing Flow', () => {
    it('should complete the full workflow from text input to published article', async () => {
      const user = userEvent.setup()

      // Mock successful publish API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Article published successfully',
          article: {
            id: 'article-123',
            title: 'Test Article Title',
            created_at: '2024-01-01T00:00:00Z'
          }
        })
      })

      render(
        <TestWrapper>
          <CreatePage />
        </TestWrapper>
      )

      // Step 1: Enter text content
      const textArea = screen.getByPlaceholderText(/paste or write your text here/i)
      await user.type(textArea, 'This is a test article about technology and innovation. It explores various aspects of modern development.')

      // Step 2: Generate article
      const generateButton = screen.getByRole('button', { name: /generate article/i })
      await user.click(generateButton)

      // Wait for article generation
      await waitFor(() => {
        expect(screen.getByText('Article Generated Successfully!')).toBeInTheDocument()
      })

      // Verify generated article is displayed
      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
      expect(screen.getByText(/This is a test article content/)).toBeInTheDocument()

      // Step 3: Publish article
      const publishButton = screen.getByRole('button', { name: /publish article/i })
      await user.click(publishButton)

      // Wait for publish API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/elysia/articles/publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Article Title',
            body: 'This is a test article content with multiple paragraphs.\n\nThis is the second paragraph of the test article.',
            image_links: [
              {
                url: 'https://images.unsplash.com/test-image-1',
                alt: 'Test image 1',
                position: 1,
                unsplash_id: 'test-1'
              },
              {
                url: 'https://images.unsplash.com/test-image-2',
                alt: 'Test image 2',
                position: 2,
                unsplash_id: 'test-2'
              }
            ]
          })
        })
      })
    })

    it('should handle publish errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock failed publish API response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Database connection failed'
        })
      })

      render(
        <TestWrapper>
          <CreatePage />
        </TestWrapper>
      )

      // Generate article first
      const textArea = screen.getByPlaceholderText(/paste or write your text here/i)
      await user.type(textArea, 'Test content for error handling')

      const generateButton = screen.getByRole('button', { name: /generate article/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Article Generated Successfully!')).toBeInTheDocument()
      })

      // Try to publish
      const publishButton = screen.getByRole('button', { name: /publish article/i })
      await user.click(publishButton)

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Database connection failed/)).toBeInTheDocument()
      })
    })
  })

  describe('Article Feed Display', () => {
    const mockArticle = {
      id: 'article-123',
      title: 'Test Article from Feed',
      body: 'This is a test article body that should be truncated in the card view if it is too long to display properly.',
      image_links: [
        {
          url: 'https://images.unsplash.com/test-feed-image',
          alt: 'Test feed image',
          position: 1,
          unsplash_id: 'feed-test'
        }
      ],
      created_at: '2024-01-01T12:00:00Z',
      author_name: 'Test Author',
      author_email: 'author@test.com'
    }

    it('should display article in feed format correctly', () => {
      render(
        <TestWrapper>
          <ArticleCard article={mockArticle} />
        </TestWrapper>
      )

      // Verify article card content
      expect(screen.getByText('Test Article from Feed')).toBeInTheDocument()
      expect(screen.getByText('Test Author')).toBeInTheDocument()
      expect(screen.getByText('January 1, 2024')).toBeInTheDocument()
      expect(screen.getByText(/This is a test article body that should be truncated/)).toBeInTheDocument()
      expect(screen.getByRole('img', { name: /test feed image/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /read more/i })).toBeInTheDocument()
    })

    it('should handle articles without images', () => {
      const articleWithoutImage = {
        ...mockArticle,
        image_links: []
      }

      render(
        <TestWrapper>
          <ArticleCard article={articleWithoutImage} />
        </TestWrapper>
      )

      expect(screen.getByText('No image')).toBeInTheDocument()
      expect(screen.getByText('Test Article from Feed')).toBeInTheDocument()
    })

    it('should truncate long article content', () => {
      const longArticle = {
        ...mockArticle,
        body: 'This is a very long article body that should definitely be truncated because it exceeds the maximum length that we want to display in the article card preview. It should show an ellipsis at the end.'
      }

      render(
        <TestWrapper>
          <ArticleCard article={longArticle} />
        </TestWrapper>
      )

      const truncatedText = screen.getByText(/This is a very long article body.*\.\.\./)
      expect(truncatedText).toBeInTheDocument()
    })
  })

  describe('Authentication Integration in Publish Flow', () => {
    it('should redirect unauthenticated users to signin', async () => {
      const mockPush = vi.fn()
      
      // Mock unauthenticated state
      vi.mocked(vi.importMock('@/hooks/useAuth')).useAuth.mockReturnValue({
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

      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CreatePage />
        </TestWrapper>
      )

      // Generate article first
      const textArea = screen.getByPlaceholderText(/paste or write your text here/i)
      await user.type(textArea, 'Test content')

      const generateButton = screen.getByRole('button', { name: /generate article/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Article Generated Successfully!')).toBeInTheDocument()
      })

      // Try to publish - should redirect to signin
      const publishButton = screen.getByRole('button', { name: /sign in to publish/i })
      await user.click(publishButton)

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/auth/signin'))
    })

    it('should restore pending article after authentication', async () => {
      // Mock sessionStorage
      const mockSessionStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage
      })

      // Mock pending article in session storage
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify({
        title: 'Pending Article',
        content: 'This article was pending publication',
        images: []
      }))

      render(
        <TestWrapper>
          <CreatePage />
        </TestWrapper>
      )

      // Should restore the pending article
      await waitFor(() => {
        expect(screen.getByText('Pending Article')).toBeInTheDocument()
        expect(screen.getByText('This article was pending publication')).toBeInTheDocument()
      })

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('pendingArticle')
    })
  })

  describe('Performance and Concurrent Users', () => {
    it('should handle multiple simultaneous publish requests', async () => {
      const user = userEvent.setup()

      // Mock successful responses for multiple requests
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Article 1 published', article: { id: 'article-1' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Article 2 published', article: { id: 'article-2' } })
        })

      const { rerender } = render(
        <TestWrapper>
          <CreatePage />
        </TestWrapper>
      )

      // Simulate first user publishing
      const textArea1 = screen.getByPlaceholderText(/paste or write your text here/i)
      await user.type(textArea1, 'First user content')

      const generateButton1 = screen.getByRole('button', { name: /generate article/i })
      await user.click(generateButton1)

      await waitFor(() => {
        expect(screen.getByText('Article Generated Successfully!')).toBeInTheDocument()
      })

      const publishButton1 = screen.getByRole('button', { name: /publish article/i })
      
      // Start first publish (don't wait)
      user.click(publishButton1)

      // Simulate second user (rerender with new component)
      rerender(
        <TestWrapper>
          <CreatePage />
        </TestWrapper>
      )

      const textArea2 = screen.getByPlaceholderText(/paste or write your text here/i)
      await user.type(textArea2, 'Second user content')

      const generateButton2 = screen.getByRole('button', { name: /generate article/i })
      await user.click(generateButton2)

      await waitFor(() => {
        expect(screen.getByText('Article Generated Successfully!')).toBeInTheDocument()
      })

      const publishButton2 = screen.getByRole('button', { name: /publish article/i })
      await user.click(publishButton2)

      // Both requests should complete successfully
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })

    it('should handle API rate limiting gracefully', async () => {
      const user = userEvent.setup()

      // Mock rate limit response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'Too many requests. Please try again later.'
        })
      })

      render(
        <TestWrapper>
          <CreatePage />
        </TestWrapper>
      )

      // Generate and try to publish
      const textArea = screen.getByPlaceholderText(/paste or write your text here/i)
      await user.type(textArea, 'Rate limit test content')

      const generateButton = screen.getByRole('button', { name: /generate article/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Article Generated Successfully!')).toBeInTheDocument()
      })

      const publishButton = screen.getByRole('button', { name: /publish article/i })
      await user.click(publishButton)

      // Should show rate limit error
      await waitFor(() => {
        expect(screen.getByText(/Too many requests/)).toBeInTheDocument()
      })
    })
  })

  describe('Data Validation and Error Handling', () => {
    it('should validate article data before publishing', async () => {
      const user = userEvent.setup()

      // Mock validation error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Missing required article data'
        })
      })

      render(
        <TestWrapper>
          <CreatePage />
        </TestWrapper>
      )

      const textArea = screen.getByPlaceholderText(/paste or write your text here/i)
      await user.type(textArea, 'Test content')

      const generateButton = screen.getByRole('button', { name: /generate article/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Article Generated Successfully!')).toBeInTheDocument()
      })

      const publishButton = screen.getByRole('button', { name: /publish article/i })
      await user.click(publishButton)

      await waitFor(() => {
        expect(screen.getByText(/Missing required article data/)).toBeInTheDocument()
      })
    })

    it('should handle network errors during publish', async () => {
      const user = userEvent.setup()

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <TestWrapper>
          <CreatePage />
        </TestWrapper>
      )

      const textArea = screen.getByPlaceholderText(/paste or write your text here/i)
      await user.type(textArea, 'Network error test')

      const generateButton = screen.getByRole('button', { name: /generate article/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Article Generated Successfully!')).toBeInTheDocument()
      })

      const publishButton = screen.getByRole('button', { name: /publish article/i })
      await user.click(publishButton)

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
      })
    })
  })
})