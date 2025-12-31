import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { app } from '@/app/api/elysia'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        range: vi.fn(),
        order: vi.fn(() => ({
          range: vi.fn()
        }))
      })),
      order: vi.fn(() => ({
        range: vi.fn()
      })),
      range: vi.fn()
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn()
    }))
  })),
  rpc: vi.fn()
}

// Mock Unsplash functions
const mockSearchImages = vi.fn()
const mockGetFallbackImages = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabaseClient)
}))

vi.mock('@/lib/unsplash', () => ({
  searchImages: mockSearchImages,
  getFallbackImages: mockGetFallbackImages
}))

describe('Complete Publish-to-Feed Workflow Integration', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const mockImages = [
    {
      id: 'img-1',
      urls: {
        regular: 'https://images.unsplash.com/photo-1/regular',
        thumb: 'https://images.unsplash.com/photo-1/thumb',
        small: 'https://images.unsplash.com/photo-1/small'
      },
      alt_description: 'Test image',
      width: 1200,
      height: 800,
      color: '#4a90e2',
      user: {
        name: 'Photographer',
        username: 'photographer'
      },
      links: {
        download: 'https://unsplash.com/download',
        html: 'https://unsplash.com/photo'
      }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default auth mock
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should complete full workflow: search images -> process -> publish -> appear in feed', async () => {
    // Step 1: Search for images
    mockSearchImages.mockResolvedValue(mockImages)
    
    const searchResponse = await app.handle(
      new Request('http://localhost/api/images/search?q=nature&per_page=1')
    )
    
    expect(searchResponse.status).toBe(200)
    const searchData = await searchResponse.json()
    expect(searchData.images).toHaveLength(1)

    // Step 2: Process images for optimization
    const processResponse = await app.handle(
      new Request('http://localhost/api/images/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [{
            id: searchData.images[0].id,
            url: searchData.images[0].url,
            alt: searchData.images[0].alt,
            width: searchData.images[0].width,
            height: searchData.images[0].height
          }],
          optimization: {
            resize: true,
            width: 800,
            height: 600,
            auto_optimize: true
          }
        })
      })
    )

    expect(processResponse.status).toBe(200)
    const processData = await processResponse.json()
    expect(processData.images[0].processed_url).toContain('w=800')

    // Step 3: Publish article with processed images
    const mockPublishedArticle = {
      id: 'article-123',
      title: 'Nature Article',
      body: 'Beautiful nature content with images.',
      image_links: [{
        url: processData.images[0].processed_url,
        alt: processData.images[0].alt,
        position: 1,
        unsplash_id: processData.images[0].id
      }],
      created_at: '2024-01-01T00:00:00Z',
      created_by: mockUser.id
    }

    mockSupabaseClient.from().insert().select().single.mockResolvedValue({
      data: mockPublishedArticle,
      error: null
    })

    const publishResponse = await app.handle(
      new Request('http://localhost/api/articles/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Nature Article',
          body: 'Beautiful nature content with images.',
          image_links: [{
            url: processData.images[0].processed_url,
            alt: processData.images[0].alt,
            position: 1,
            unsplash_id: processData.images[0].id
          }]
        })
      })
    )

    expect(publishResponse.status).toBe(200)
    const publishData = await publishResponse.json()
    expect(publishData.message).toBe('Article published successfully')
    expect(publishData.article.id).toBe('article-123')

    // Step 4: Verify article appears in feed
    const mockFeedArticles = [{
      id: 'article-123',
      title: 'Nature Article',
      body: 'Beautiful nature content with images.',
      image_links: [{
        url: processData.images[0].processed_url,
        alt: processData.images[0].alt,
        position: 1,
        unsplash_id: processData.images[0].id
      }],
      created_at: '2024-01-01T00:00:00Z',
      author_name: 'Test User',
      author_email: 'test@example.com'
    }]

    mockSupabaseClient.from().select().order().range.mockResolvedValue({
      data: mockFeedArticles,
      error: null
    })

    mockSupabaseClient.from().select.mockReturnValue({
      count: 1,
      error: null
    })

    const feedResponse = await app.handle(
      new Request('http://localhost/api/articles/feed?page=1&limit=10')
    )

    expect(feedResponse.status).toBe(200)
    const feedData = await feedResponse.json()
    expect(feedData.articles).toHaveLength(1)
    expect(feedData.articles[0].id).toBe('article-123')
    expect(feedData.articles[0].title).toBe('Nature Article')
    expect(feedData.articles[0].image_links[0].url).toContain('w=800')
  })

  it('should handle workflow with fallback images when Unsplash fails', async () => {
    // Step 1: Search fails, use fallback images
    mockSearchImages.mockResolvedValue([])
    mockGetFallbackImages.mockReturnValue([{
      id: 'fallback-1',
      urls: {
        regular: 'https://fallback.com/image.jpg',
        thumb: 'https://fallback.com/thumb.jpg',
        small: 'https://fallback.com/small.jpg'
      },
      alt_description: 'Fallback image',
      width: 800,
      height: 600,
      color: '#cccccc',
      user: { name: 'Fallback', username: 'fallback' },
      links: { download: '', html: '' }
    }])

    const searchResponse = await app.handle(
      new Request('http://localhost/api/images/search?q=unavailable')
    )

    expect(searchResponse.status).toBe(200)
    const searchData = await searchResponse.json()
    expect(searchData.images[0].id).toBe('fallback-1')

    // Step 2: Process fallback image
    const processResponse = await app.handle(
      new Request('http://localhost/api/images/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [{
            id: searchData.images[0].id,
            url: searchData.images[0].url,
            alt: searchData.images[0].alt,
            width: searchData.images[0].width,
            height: searchData.images[0].height
          }]
        })
      })
    )

    expect(processResponse.status).toBe(200)
    const processData = await processResponse.json()
    expect(processData.images[0].recommended_usage).toBe('thumbnail') // 800x600 is squarish

    // Step 3: Publish with fallback image
    const mockPublishedArticle = {
      id: 'article-fallback',
      title: 'Article with Fallback',
      body: 'Content with fallback image.',
      image_links: [{
        url: processData.images[0].url,
        alt: processData.images[0].alt,
        position: 1
      }],
      created_at: '2024-01-01T00:00:00Z',
      created_by: mockUser.id
    }

    mockSupabaseClient.from().insert().select().single.mockResolvedValue({
      data: mockPublishedArticle,
      error: null
    })

    const publishResponse = await app.handle(
      new Request('http://localhost/api/articles/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Article with Fallback',
          body: 'Content with fallback image.',
          image_links: [{
            url: processData.images[0].url,
            alt: processData.images[0].alt,
            position: 1
          }]
        })
      })
    )

    expect(publishResponse.status).toBe(200)
    const publishData = await publishResponse.json()
    expect(publishData.article.id).toBe('article-fallback')
  })

  it('should handle authentication failure during publish step', async () => {
    // Step 1: Search images successfully
    mockSearchImages.mockResolvedValue(mockImages)
    
    const searchResponse = await app.handle(
      new Request('http://localhost/api/images/search?q=test')
    )
    expect(searchResponse.status).toBe(200)

    // Step 2: Process images successfully
    const processResponse = await app.handle(
      new Request('http://localhost/api/images/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [{
            id: 'img-1',
            url: 'https://example.com/image.jpg',
            alt: 'Test image',
            width: 800,
            height: 600
          }]
        })
      })
    )
    expect(processResponse.status).toBe(200)

    // Step 3: Publish fails due to authentication
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated')
    })

    const publishResponse = await app.handle(
      new Request('http://localhost/api/articles/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Article',
          body: 'Test content',
          image_links: [{
            url: 'https://example.com/image.jpg',
            alt: 'Test image',
            position: 1
          }]
        })
      })
    )

    expect(publishResponse.status).toBe(401)
    const publishData = await publishResponse.json()
    expect(publishData.error).toBe('Authentication required')
  })

  it('should handle concurrent user publishing scenario', async () => {
    // Simulate two users publishing articles simultaneously
    const user1 = { id: 'user-1', email: 'user1@example.com' }
    const user2 = { id: 'user-2', email: 'user2@example.com' }

    // Mock different users for different requests
    let callCount = 0
    mockSupabaseClient.auth.getUser.mockImplementation(() => {
      callCount++
      return Promise.resolve({
        data: { user: callCount % 2 === 1 ? user1 : user2 },
        error: null
      })
    })

    // Mock successful inserts for both users
    mockSupabaseClient.from().insert().select().single
      .mockResolvedValueOnce({
        data: { id: 'article-user1', title: 'User 1 Article', created_by: user1.id, created_at: '2024-01-01T00:00:00Z' },
        error: null
      })
      .mockResolvedValueOnce({
        data: { id: 'article-user2', title: 'User 2 Article', created_by: user2.id, created_at: '2024-01-01T00:00:01Z' },
        error: null
      })

    // User 1 publishes
    const publish1Response = await app.handle(
      new Request('http://localhost/api/articles/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'User 1 Article',
          body: 'Content from user 1',
          image_links: []
        })
      })
    )

    // User 2 publishes
    const publish2Response = await app.handle(
      new Request('http://localhost/api/articles/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'User 2 Article',
          body: 'Content from user 2',
          image_links: []
        })
      })
    )

    expect(publish1Response.status).toBe(200)
    expect(publish2Response.status).toBe(200)

    const publish1Data = await publish1Response.json()
    const publish2Data = await publish2Response.json()

    expect(publish1Data.article.id).toBe('article-user1')
    expect(publish2Data.article.id).toBe('article-user2')
  })
})