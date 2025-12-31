import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { app } from '@/app/api/elysia'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    range: vi.fn(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis()
  })),
  rpc: vi.fn()
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabaseClient)
}))

describe('Article Management API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/articles/:id', () => {
    it('should return article by valid ID', async () => {
      const mockArticle = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Article',
        body: 'This is a test article with some content.',
        image_links: [],
        created_at: '2024-01-01T00:00:00Z',
        author_name: 'Test User'
      }

      const mockFrom = mockSupabaseClient.from()
      mockFrom.select.mockReturnValue(mockFrom)
      mockFrom.eq.mockReturnValue(mockFrom)
      mockFrom.single.mockResolvedValue({
        data: mockArticle,
        error: null
      })

      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null })

      const response = await app.handle(
        new Request('http://localhost/api/articles/123e4567-e89b-12d3-a456-426614174000')
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.article).toEqual({
        ...mockArticle,
        word_count: 8,
        reading_time: 1
      })
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/articles/invalid-id')
      )

      expect(response.status).toBe(422) // Elysia validation returns 422
      const data = await response.json()
      expect(data.error).toBe('Validation failed')
    })

    it('should return 404 for non-existent article', async () => {
      const mockFrom = mockSupabaseClient.from()
      mockFrom.select.mockReturnValue(mockFrom)
      mockFrom.eq.mockReturnValue(mockFrom)
      mockFrom.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const response = await app.handle(
        new Request('http://localhost/api/articles/123e4567-e89b-12d3-a456-426614174000')
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Article not found')
    })
  })

  describe('PUT /api/articles/:id', () => {
    const validArticleData = {
      title: 'Updated Article',
      body: 'Updated content for the article.',
      image_links: [
        {
          url: 'https://example.com/image.jpg',
          alt: 'Test image',
          position: 1
        }
      ]
    }

    it('should update article when user is owner', async () => {
      const mockUser = { id: 'user-123' }
      const mockExistingArticle = {
        created_by: 'user-123',
        title: 'Old Title',
        body: 'Old content'
      }
      const mockUpdatedArticle = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...validArticleData,
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseClient.from().select().eq().single
        .mockResolvedValueOnce({
          data: mockExistingArticle,
          error: null
        })

      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
        data: mockUpdatedArticle,
        error: null
      })

      const response = await app.handle(
        new Request('http://localhost/api/articles/123e4567-e89b-12d3-a456-426614174000', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validArticleData)
        })
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('Article updated successfully')
      expect(data.article.word_count).toBe(5)
    })

    it('should return 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const response = await app.handle(
        new Request('http://localhost/api/articles/123e4567-e89b-12d3-a456-426614174000', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validArticleData)
        })
      )

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })

    it('should return 403 when user is not the owner', async () => {
      const mockUser = { id: 'user-123' }
      const mockExistingArticle = {
        created_by: 'different-user',
        title: 'Old Title',
        body: 'Old content'
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockExistingArticle,
        error: null
      })

      const response = await app.handle(
        new Request('http://localhost/api/articles/123e4567-e89b-12d3-a456-426614174000', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validArticleData)
        })
      )

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Not authorized to update this article')
    })
  })

  describe('DELETE /api/articles/:id', () => {
    it('should delete article when user is owner', async () => {
      const mockUser = { id: 'user-123' }
      const mockExistingArticle = {
        created_by: 'user-123',
        title: 'Article to Delete'
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockExistingArticle,
        error: null
      })

      mockSupabaseClient.from().delete().eq.mockResolvedValue({
        error: null
      })

      const response = await app.handle(
        new Request('http://localhost/api/articles/123e4567-e89b-12d3-a456-426614174000', {
          method: 'DELETE'
        })
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('Article deleted successfully')
      expect(data.deleted_article.title).toBe('Article to Delete')
    })

    it('should return 403 when user is not the owner', async () => {
      const mockUser = { id: 'user-123' }
      const mockExistingArticle = {
        created_by: 'different-user',
        title: 'Article to Delete'
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockExistingArticle,
        error: null
      })

      const response = await app.handle(
        new Request('http://localhost/api/articles/123e4567-e89b-12d3-a456-426614174000', {
          method: 'DELETE'
        })
      )

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Not authorized to delete this article')
    })
  })

  describe('GET /api/articles/user/:userId', () => {
    it('should return user articles with pagination', async () => {
      const mockArticles = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'User Article 1',
          body: 'Content of first article.',
          created_at: '2024-01-01T00:00:00Z',
          author_name: 'Test User'
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          title: 'User Article 2',
          body: 'Content of second article.',
          created_at: '2024-01-02T00:00:00Z',
          author_name: 'Test User'
        }
      ]

      mockSupabaseClient.from().select().eq().order().range.mockResolvedValue({
        data: mockArticles,
        error: null
      })

      mockSupabaseClient.from().select.mockReturnValue({
        eq: vi.fn(() => Promise.resolve({ count: 2, error: null }))
      })

      const response = await app.handle(
        new Request('http://localhost/api/articles/user/123e4567-e89b-12d3-a456-426614174000?page=1&limit=10')
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.articles).toHaveLength(2)
      expect(data.articles[0].word_count).toBe(4)
      expect(data.pagination.total).toBe(2)
    })

    it('should return 400 for invalid user ID format', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/articles/user/invalid-id')
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid user ID format')
    })
  })

  describe('GET /api/articles/feed', () => {
    it('should return paginated article feed', async () => {
      const mockArticles = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Feed Article 1',
          body: 'Content of feed article.',
          created_at: '2024-01-01T00:00:00Z',
          author_name: 'Author 1'
        }
      ]

      mockSupabaseClient.from().select().order().range.mockResolvedValue({
        data: mockArticles,
        error: null
      })

      mockSupabaseClient.from().select.mockReturnValue({
        count: 1,
        error: null
      })

      const response = await app.handle(
        new Request('http://localhost/api/articles/feed?page=1&limit=10')
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.articles).toHaveLength(1)
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(10)
    })
  })
})