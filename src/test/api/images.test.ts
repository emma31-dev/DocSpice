import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { app } from '@/app/api/elysia'

// Mock Unsplash functions
const mockSearchImages = vi.fn()
const mockGetFallbackImages = vi.fn()

vi.mock('@/lib/unsplash', () => ({
  searchImages: mockSearchImages,
  getFallbackImages: mockGetFallbackImages
}))

describe('Image Processing API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/images/search', () => {
    const mockUnsplashImages = [
      {
        id: 'image-1',
        urls: {
          regular: 'https://images.unsplash.com/photo-1/regular',
          thumb: 'https://images.unsplash.com/photo-1/thumb',
          small: 'https://images.unsplash.com/photo-1/small'
        },
        alt_description: 'Beautiful landscape',
        width: 1200,
        height: 800,
        color: '#4a90e2',
        user: {
          name: 'John Photographer',
          username: 'johnphoto'
        },
        links: {
          download: 'https://unsplash.com/photos/image-1/download',
          html: 'https://unsplash.com/photos/image-1'
        }
      },
      {
        id: 'image-2',
        urls: {
          regular: 'https://images.unsplash.com/photo-2/regular',
          thumb: 'https://images.unsplash.com/photo-2/thumb',
          small: 'https://images.unsplash.com/photo-2/small'
        },
        description: 'City skyline',
        width: 1600,
        height: 900,
        color: '#2c3e50',
        user: {
          name: 'Jane Photographer',
          username: 'janephoto'
        },
        links: {
          download: 'https://unsplash.com/photos/image-2/download',
          html: 'https://unsplash.com/photos/image-2'
        }
      }
    ]

    it('should return search results with enhanced metadata', async () => {
      mockSearchImages.mockResolvedValue(mockUnsplashImages)

      const response = await app.handle(
        new Request('http://localhost/api/images/search?q=landscape&per_page=2')
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.images).toHaveLength(2)
      expect(data.images[0]).toEqual({
        id: 'image-1',
        url: 'https://images.unsplash.com/photo-1/regular',
        thumb: 'https://images.unsplash.com/photo-1/thumb',
        small: 'https://images.unsplash.com/photo-1/small',
        alt: 'Beautiful landscape',
        width: 1200,
        height: 800,
        aspect_ratio: 1.5,
        color: '#4a90e2',
        user: {
          name: 'John Photographer',
          username: 'johnphoto',
          profile_url: 'https://unsplash.com/@johnphoto'
        },
        download_url: 'https://unsplash.com/photos/image-1/download',
        unsplash_url: 'https://unsplash.com/photos/image-1'
      })

      expect(data.search_metadata).toEqual({
        query: 'landscape',
        total_results: 2,
        per_page: 2,
        filters: {
          orientation: null,
          color: null,
          category: null
        }
      })

      expect(mockSearchImages).toHaveBeenCalledWith('landscape', 2, { per_page: 2 })
    })

    it('should apply search filters correctly', async () => {
      mockSearchImages.mockResolvedValue(mockUnsplashImages)

      const response = await app.handle(
        new Request('http://localhost/api/images/search?q=nature&orientation=landscape&color=green&category=nature')
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.search_metadata.filters).toEqual({
        orientation: 'landscape',
        color: 'green',
        category: 'nature'
      })

      expect(mockSearchImages).toHaveBeenCalledWith('nature', 10, {
        per_page: 10,
        orientation: 'landscape',
        color: 'green',
        category: 'nature'
      })
    })

    it('should return fallback images when API fails', async () => {
      const mockFallbackImages = [
        {
          id: 'fallback-1',
          urls: { regular: 'https://fallback.com/1', thumb: 'https://fallback.com/1/thumb', small: 'https://fallback.com/1/small' },
          alt_description: 'Fallback image',
          width: 800,
          height: 600,
          color: '#ffffff',
          user: { name: 'Fallback', username: 'fallback' },
          links: { download: '', html: '' }
        }
      ]

      mockSearchImages.mockResolvedValue([])
      mockGetFallbackImages.mockReturnValue(mockFallbackImages)

      const response = await app.handle(
        new Request('http://localhost/api/images/search?q=test')
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.images).toHaveLength(1)
      expect(data.images[0].id).toBe('fallback-1')
    })

    it('should return 400 for missing query parameter', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/images/search')
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Search query is required')
    })

    it('should cache search results', async () => {
      mockSearchImages.mockResolvedValue(mockUnsplashImages)

      // First request
      await app.handle(
        new Request('http://localhost/api/images/search?q=cached-test')
      )

      // Second request with same parameters
      const response = await app.handle(
        new Request('http://localhost/api/images/search?q=cached-test')
      )

      expect(response.status).toBe(200)
      // Should only call the API once due to caching
      expect(mockSearchImages).toHaveBeenCalledTimes(1)
    })
  })

  describe('POST /api/images/process', () => {
    const mockImages = [
      {
        id: 'img-1',
        url: 'https://example.com/image1.jpg',
        alt: 'Test image 1',
        width: 1200,
        height: 800
      },
      {
        id: 'img-2',
        url: 'https://example.com/image2.jpg',
        alt: 'Test image 2',
        width: 600,
        height: 900
      }
    ]

    it('should process images with optimization settings', async () => {
      const optimization = {
        resize: true,
        width: 800,
        height: 600,
        quality: 85,
        fit: 'crop' as const,
        auto_optimize: true
      }

      const response = await app.handle(
        new Request('http://localhost/api/images/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: mockImages,
            optimization
          })
        })
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.message).toBe('Images processed successfully')
      expect(data.images).toHaveLength(2)
      
      const processedImage = data.images[0]
      expect(processedImage.position).toBe(1)
      expect(processedImage.processed_url).toContain('w=800')
      expect(processedImage.processed_url).toContain('h=600')
      expect(processedImage.processed_url).toContain('q=85')
      expect(processedImage.optimal_dimensions.aspect_ratio).toBe(1.5)
      expect(processedImage.recommended_usage).toBe('header') // aspect ratio > 1.5
      expect(processedImage.file_size_estimate).toBeGreaterThan(0)
    })

    it('should handle auto-optimization for different aspect ratios', async () => {
      const optimization = {
        resize: false,
        auto_optimize: true
      }

      const response = await app.handle(
        new Request('http://localhost/api/images/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: mockImages,
            optimization
          })
        })
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // First image (1200x800, ratio 1.5) should be optimized for header
      expect(data.images[0].recommended_usage).toBe('header')
      expect(data.images[0].optimal_dimensions.width).toBeLessThanOrEqual(1200)
      
      // Second image (600x900, ratio 0.67) should be optimized for sidebar
      expect(data.images[1].recommended_usage).toBe('sidebar')
      expect(data.images[1].optimal_dimensions.height).toBeLessThanOrEqual(800)
    })

    it('should return processing summary', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/images/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: mockImages
          })
        })
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.processing_summary).toEqual({
        total_images: 2,
        optimization_applied: false,
        estimated_total_size_kb: expect.any(Number)
      })
    })

    it('should return 400 for empty images array', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/images/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: []
          })
        })
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Images array is required and cannot be empty')
    })
  })

  describe('GET /api/images/collections', () => {
    it('should return curated collections', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/images/collections')
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.collections).toHaveLength(3)
      expect(data.collections[0]).toEqual({
        id: 'nature',
        title: 'Nature & Landscapes',
        description: 'Beautiful natural scenery and landscapes',
        preview_images: expect.any(Array),
        total_photos: 1000
      })
    })

    it('should filter featured collections', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/images/collections?featured=true')
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.collections).toHaveLength(2)
      expect(data.collections.map(c => c.id)).toEqual(['nature', 'business'])
    })
  })

  describe('DELETE /api/images/cache', () => {
    it('should clear image cache', async () => {
      // First, populate cache with a search
      mockSearchImages.mockResolvedValue([])
      await app.handle(
        new Request('http://localhost/api/images/search?q=cache-test')
      )

      // Clear cache
      const response = await app.handle(
        new Request('http://localhost/api/images/cache', {
          method: 'DELETE'
        })
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.message).toBe('Image cache cleared successfully')
      expect(data.cleared_entries).toBeGreaterThanOrEqual(0)
    })
  })
})