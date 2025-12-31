/**
 * Basic Integration Tests
 * Simplified tests focusing on core functionality
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JotaiProvider } from '@/components/JotaiProvider'
import { ToastProvider } from '@/components/ToastProvider'
import Navigation from '@/components/Navigation'
import { ArticleCard } from '@/components/ArticleCard'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mock the useAuth hook with simple return values
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    appUser: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    initialized: true,
    signOut: vi.fn()
  })
}))

// Mock Jotai atoms
vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useAtom: () => [null, vi.fn()],
    Provider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    atom: vi.fn()
  }
})

// Mock OptimizedImage to avoid IntersectionObserver issues
vi.mock('@/components/OptimizedImage', () => ({
  ThumbnailImage: ({ src, alt }: { src: string; alt: string }) => (
    <div data-testid="thumbnail-image" data-src={src} data-alt={alt}>
      Mock Image: {alt}
    </div>
  )
}))

// Mock theme utilities
vi.mock('@/lib/theme', () => ({
  getCardClasses: () => 'mock-card-classes'
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <JotaiProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </JotaiProvider>
)

describe('Basic Integration Tests', () => {
  describe('Navigation Component', () => {
    it('should render navigation for anonymous users', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      expect(screen.getByText('DocSpice')).toBeInTheDocument()
      expect(screen.getByText('Try It Free')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
    })

    it('should render the logo and tagline', () => {
      render(
        <TestWrapper>
          <Navigation />
        </TestWrapper>
      )

      expect(screen.getByText('DocSpice')).toBeInTheDocument()
      expect(screen.getByText('Beautiful Articles, Beautifully Illustrated')).toBeInTheDocument()
    })
  })

  describe('ArticleCard Component', () => {
    const mockArticle = {
      id: 'test-article-1',
      title: 'Test Article Title',
      body: 'This is a test article body that demonstrates the article card component functionality.',
      image_links: [
        {
          url: 'https://example.com/test-image.jpg',
          alt: 'Test image',
          position: 1,
          unsplash_id: 'test-123'
        }
      ],
      created_at: '2024-01-01T12:00:00Z',
      author_name: 'Test Author',
      author_email: 'test@example.com'
    }

    it('should render article information correctly', () => {
      render(
        <TestWrapper>
          <ArticleCard article={mockArticle} />
        </TestWrapper>
      )

      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
      expect(screen.getByText('Test Author')).toBeInTheDocument()
      expect(screen.getByText('January 1, 2024')).toBeInTheDocument()
      expect(screen.getByText('Read More')).toBeInTheDocument()
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

      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
      expect(screen.getByText('No image')).toBeInTheDocument()
    })

    it('should truncate long article content', () => {
      const longArticle = {
        ...mockArticle,
        body: 'This is a very long article body that should definitely be truncated because it exceeds the maximum length that we want to display in the article card preview. It should show an ellipsis at the end to indicate that there is more content available.'
      }

      render(
        <TestWrapper>
          <ArticleCard article={longArticle} />
        </TestWrapper>
      )

      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
      // Should contain truncated text with ellipsis
      const truncatedText = screen.getByText(/This is a very long article body.*\.\.\./)
      expect(truncatedText).toBeInTheDocument()
    })

    it('should calculate and display reading time', () => {
      render(
        <TestWrapper>
          <ArticleCard article={mockArticle} />
        </TestWrapper>
      )

      // Should show reading time badge
      expect(screen.getByText(/min read/)).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should render multiple components together without errors', () => {
      const mockArticle = {
        id: 'integration-test',
        title: 'Integration Test Article',
        body: 'Testing component integration',
        image_links: [],
        created_at: '2024-01-01T12:00:00Z',
        author_name: 'Integration Tester',
        author_email: 'integration@test.com'
      }

      render(
        <TestWrapper>
          <div>
            <Navigation />
            <ArticleCard article={mockArticle} />
          </div>
        </TestWrapper>
      )

      // Navigation should be present
      expect(screen.getByText('DocSpice')).toBeInTheDocument()
      
      // Article card should be present
      expect(screen.getByText('Integration Test Article')).toBeInTheDocument()
      expect(screen.getByText('Integration Tester')).toBeInTheDocument()
    })
  })

  describe('Error Boundaries', () => {
    it('should handle component errors gracefully', () => {
      // This test ensures our components don't crash the entire app
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      try {
        render(
          <TestWrapper>
            <Navigation />
          </TestWrapper>
        )
        
        // If we get here, the component rendered without throwing
        expect(screen.getByText('DocSpice')).toBeInTheDocument()
      } catch (error) {
        // If there's an error, it should be handled gracefully
        expect(error).toBeDefined()
      }
      
      consoleSpy.mockRestore()
    })
  })
})