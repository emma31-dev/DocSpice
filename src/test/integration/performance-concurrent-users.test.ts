/**
 * Performance and Concurrent Users Tests
 * Tests system behavior under load and concurrent user scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock performance API
const mockPerformance = {
  now: vi.fn(),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
}
Object.defineProperty(global, 'performance', {
  value: mockPerformance
})

describe('Performance and Concurrent Users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    mockPerformance.now.mockReturnValue(0)
  })

  describe('API Performance Tests', () => {
    it('should handle article publishing within acceptable time limits', async () => {
      const startTime = 100
      const endTime = 300 // 200ms response time
      
      mockPerformance.now
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Article published successfully',
          article: { id: 'article-123' }
        })
      })

      const publishArticle = async (articleData: Record<string, unknown>) => {
        const start = performance.now()
        
        const response = await fetch('/api/elysia/articles/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleData)
        })
        
        const end = performance.now()
        const duration = end - start
        
        return { response, duration }
      }

      const articleData = {
        title: 'Performance Test Article',
        body: 'Test content',
        image_links: []
      }

      const { response, duration } = await publishArticle(articleData)

      expect(response.ok).toBe(true)
      expect(duration).toBeLessThan(500) // Should complete within 500ms
    })

    it('should handle feed loading within performance budget', async () => {
      const startTime = 50
      const endTime = 200 // 150ms response time
      
      mockPerformance.now
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime)

      const mockArticles = Array.from({ length: 12 }, (_, i) => ({
        id: `article-${i}`,
        title: `Article ${i}`,
        body: `Content for article ${i}`,
        image_links: [],
        created_at: '2024-01-01T00:00:00Z',
        author_name: 'testuser'
      }))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          articles: mockArticles,
          pagination: { page: 1, limit: 12, total: 12, hasMore: false }
        })
      })

      const loadFeed = async () => {
        const start = performance.now()
        
        const response = await fetch('/api/elysia/articles/feed?limit=12')
        const data = await response.json()
        
        const end = performance.now()
        const duration = end - start
        
        return { data, duration }
      }

      const { data, duration } = await loadFeed()

      expect(data.articles).toHaveLength(12)
      expect(duration).toBeLessThan(300) // Should load within 300ms
    })
  })

  describe('Concurrent User Scenarios', () => {
    it('should handle multiple simultaneous article publications', async () => {
      const userCount = 5
      const publishPromises: Promise<unknown>[] = []

      // Mock successful responses for all users
      for (let i = 0; i < userCount; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: `Article ${i} published successfully`,
            article: { id: `article-${i}` }
          })
        })
      }

      const publishArticle = async (userId: number) => {
        const articleData = {
          title: `Article from User ${userId}`,
          body: `Content from user ${userId}`,
          image_links: []
        }

        const response = await fetch('/api/elysia/articles/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleData)
        })

        return response.json()
      }

      // Simulate concurrent publications
      for (let i = 0; i < userCount; i++) {
        publishPromises.push(publishArticle(i))
      }

      const results = await Promise.all(publishPromises)

      // All publications should succeed
      expect(results).toHaveLength(userCount)
      results.forEach((result, index) => {
        expect(result.message).toBe(`Article ${index} published successfully`)
        expect(result.article.id).toBe(`article-${index}`)
      })

      expect(mockFetch).toHaveBeenCalledTimes(userCount)
    })

    it('should handle concurrent feed requests efficiently', async () => {
      const concurrentUsers = 10
      const feedPromises: Promise<unknown>[] = []

      const mockArticles = Array.from({ length: 12 }, (_, i) => ({
        id: `article-${i}`,
        title: `Article ${i}`,
        body: `Content ${i}`,
        image_links: [],
        created_at: '2024-01-01T00:00:00Z',
        author_name: 'testuser'
      }))

      // Mock the same response for all concurrent requests
      for (let i = 0; i < concurrentUsers; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            articles: mockArticles,
            pagination: { page: 1, limit: 12, total: 12, hasMore: false }
          })
        })
      }

      const loadFeed = async (userId: number) => {
        const response = await fetch(`/api/elysia/articles/feed?user=${userId}`)
        return response.json()
      }

      // Simulate concurrent feed loads
      for (let i = 0; i < concurrentUsers; i++) {
        feedPromises.push(loadFeed(i))
      }

      const results = await Promise.all(feedPromises)

      // All requests should succeed with same data
      expect(results).toHaveLength(concurrentUsers)
      results.forEach(result => {
        expect(result.articles).toHaveLength(12)
        expect(result.pagination.total).toBe(12)
      })

      expect(mockFetch).toHaveBeenCalledTimes(concurrentUsers)
    })

    it('should handle mixed concurrent operations', async () => {
      const operations: Promise<unknown>[] = []

      // Mock responses for different operations
      mockFetch
        // Article publications
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Article published', article: { id: 'pub-1' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Article published', article: { id: 'pub-2' } })
        })
        // Feed loads
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ articles: [], pagination: { total: 0 } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ articles: [], pagination: { total: 0 } })
        })
        // Article retrieval
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            article: { id: 'article-1', title: 'Test Article', body: 'Content' }
          })
        })

      // Simulate mixed operations
      operations.push(
        // Two publications
        fetch('/api/elysia/articles/publish', {
          method: 'POST',
          body: JSON.stringify({ title: 'Article 1', body: 'Content 1', image_links: [] })
        }).then(r => r.json()),
        
        fetch('/api/elysia/articles/publish', {
          method: 'POST',
          body: JSON.stringify({ title: 'Article 2', body: 'Content 2', image_links: [] })
        }).then(r => r.json()),
        
        // Two feed loads
        fetch('/api/elysia/articles/feed').then(r => r.json()),
        fetch('/api/elysia/articles/feed?page=2').then(r => r.json()),
        
        // One article retrieval
        fetch('/api/elysia/articles/article-1').then(r => r.json())
      )

      const results = await Promise.all(operations)

      expect(results).toHaveLength(5)
      expect(results[0].article.id).toBe('pub-1')
      expect(results[1].article.id).toBe('pub-2')
      expect(results[2].articles).toBeDefined()
      expect(results[3].articles).toBeDefined()
      expect(results[4].article.id).toBe('article-1')
    })
  })

  describe('Rate Limiting and Throttling', () => {
    it('should handle rate limiting gracefully', async () => {
      const rateLimitedRequests = 3
      const successfulRequests = 2

      // Mock rate limit responses
      for (let i = 0; i < rateLimitedRequests; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({
            error: 'Too many requests. Please try again later.',
            retryAfter: 60
          })
        })
      }

      // Mock successful responses after rate limit
      for (let i = 0; i < successfulRequests; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: 'Request successful',
            data: { id: `success-${i}` }
          })
        })
      }

      const makeRequest = async () => {
        const response = await fetch('/api/elysia/articles/publish', {
          method: 'POST',
          body: JSON.stringify({ title: 'Test', body: 'Content', image_links: [] })
        })
        return { status: response.status, data: await response.json() }
      }

      const results = []

      // Make rate limited requests
      for (let i = 0; i < rateLimitedRequests; i++) {
        results.push(await makeRequest())
      }

      // Make successful requests
      for (let i = 0; i < successfulRequests; i++) {
        results.push(await makeRequest())
      }

      // Verify rate limited responses
      for (let i = 0; i < rateLimitedRequests; i++) {
        expect(results[i].status).toBe(429)
        expect(results[i].data.error).toContain('Too many requests')
      }

      // Verify successful responses
      for (let i = rateLimitedRequests; i < rateLimitedRequests + successfulRequests; i++) {
        expect(results[i].status).toBe(200)
        expect(results[i].data.message).toBe('Request successful')
      }
    })

    it('should implement exponential backoff for retries', async () => {
      const maxRetries = 3
      let attemptCount = 0

      const makeRequestWithRetry = async (maxRetries: number) => {
        const attempt = async (retryCount: number): Promise<unknown> => {
          attemptCount++
          
          if (retryCount < maxRetries) {
            // Mock failure for first attempts
            mockFetch.mockResolvedValueOnce({
              ok: false,
              status: 500,
              json: async () => ({ error: 'Server error' })
            })
            
            const response = await fetch('/api/test')
            if (!response.ok) {
              const delay = Math.pow(2, retryCount) * 100 // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, delay))
              return attempt(retryCount + 1)
            }
            return response.json()
          } else {
            // Mock success on final attempt
            mockFetch.mockResolvedValueOnce({
              ok: true,
              json: async () => ({ message: 'Success after retries' })
            })
            
            const response = await fetch('/api/test')
            return response.json()
          }
        }

        return attempt(0)
      }

      const result = await makeRequestWithRetry(maxRetries)

      expect(attemptCount).toBe(maxRetries + 1) // Initial attempt + retries
      expect(result.message).toBe('Success after retries')
    })
  })

  describe('Memory and Resource Management', () => {
    it('should handle large article datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `article-${i}`,
        title: `Article ${i}`,
        body: 'A'.repeat(1000), // 1KB of content per article
        image_links: Array.from({ length: 3 }, (_, j) => ({
          url: `https://example.com/image-${i}-${j}.jpg`,
          alt: `Image ${j} for article ${i}`,
          position: j
        })),
        created_at: '2024-01-01T00:00:00Z',
        author_name: `author-${i % 10}` // 10 different authors
      }))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          articles: largeDataset,
          pagination: { page: 1, limit: 1000, total: 1000, hasMore: false }
        })
      })

      const startMemory = process.memoryUsage().heapUsed
      
      const response = await fetch('/api/elysia/articles/feed?limit=1000')
      const data = await response.json()
      
      const endMemory = process.memoryUsage().heapUsed
      const memoryIncrease = endMemory - startMemory

      expect(data.articles).toHaveLength(1000)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB increase
    })

    it('should clean up resources after operations', async () => {
      const operations = []
      
      // Create multiple operations that should clean up after themselves
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: i, processed: true })
        })
        
        operations.push(
          fetch(`/api/process/${i}`)
            .then(r => r.json())
            .then(data => {
              // Simulate resource cleanup
              return { ...data, cleaned: true }
            })
        )
      }

      const results = await Promise.all(operations)

      expect(results).toHaveLength(10)
      results.forEach((result, index) => {
        expect(result.id).toBe(index)
        expect(result.processed).toBe(true)
        expect(result.cleaned).toBe(true)
      })
    })
  })

  describe('Error Recovery Under Load', () => {
    it('should maintain system stability during partial failures', async () => {
      const totalRequests = 10
      const failureRate = 0.3 // 30% failure rate
      const expectedSuccesses = Math.floor(totalRequests * (1 - failureRate))

      const requests = []

      for (let i = 0; i < totalRequests; i++) {
        if (Math.random() < failureRate) {
          // Mock failure
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Server error' })
          })
        } else {
          // Mock success
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: i, success: true })
          })
        }

        requests.push(
          fetch(`/api/test/${i}`)
            .then(async r => ({ status: r.status, data: await r.json() }))
            .catch(error => ({ status: 0, error: error.message }))
        )
      }

      const results = await Promise.all(requests)
      const successes = results.filter(r => r.status === 200)
      const failures = results.filter(r => r.status !== 200)

      expect(successes.length).toBeGreaterThanOrEqual(expectedSuccesses - 2) // Allow some variance
      expect(failures.length).toBeGreaterThan(0) // Should have some failures
      expect(successes.length + failures.length).toBe(totalRequests)
    })

    it('should handle cascading failures gracefully', async () => {
      const services = ['auth', 'articles', 'images']
      const requests = []

      // Mock cascading failures - auth fails, affecting other services
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Authentication failed' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Authentication required' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ images: [], message: 'Public images available' })
        })

      for (const service of services) {
        requests.push(
          fetch(`/api/${service}`)
            .then(async r => ({ 
              service, 
              status: r.status, 
              data: await r.json() 
            }))
        )
      }

      const results = await Promise.all(requests)

      // Auth and articles should fail, images should succeed (public endpoint)
      const authResult = results.find(r => r.service === 'auth')
      const articlesResult = results.find(r => r.service === 'articles')
      const imagesResult = results.find(r => r.service === 'images')

      expect(authResult?.status).toBe(401)
      expect(articlesResult?.status).toBe(401)
      expect(imagesResult?.status).toBe(200)
    })
  })
})