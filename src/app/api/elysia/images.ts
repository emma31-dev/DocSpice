import { Elysia, t } from 'elysia';
import { searchImages, getFallbackImages } from '@/lib/unsplash';

export const imageRoutes = new Elysia({ prefix: '/images' })
  .get('/search', async ({ query, set }) => {
    try {
      const { q, per_page } = query;

      if (!q) {
        set.status = 400;
        return { error: 'Search query is required' }
      }

      set.status = 200;
      
      // If no results from API, use fallback images
      const images = await searchImages(q, per_page) || getFallbackImages().slice(0, per_page);

      const response = {
        images: images.map((image, index) => ({
          id: image.id,
          url: image.urls.regular,
          thumb: image.urls.thumb,
          small: image.urls.small,
          alt: image.alt_description || image.description || `Image ${index + 1}`,
          width: image.width,
          height: image.height,
          aspect_ratio: image.width / image.height,
          color: '#ffffff', // Default color since UnsplashImage doesn't have color property
          user: {
            name: image.user.name,
            username: image.user.username,
            profile_url: `https://unsplash.com/@${image.user.username}`
          },
          download_url: undefined, // UnsplashImage doesn't have links property
          unsplash_url: undefined
        })),
        search_metadata: {
          query: q,
          total_results: images.length,
          per_page
        },
        pagination: {
          total: images.length,
          per_page,
          has_more: false // Since we're using the existing simple API
        }
      }

      return response
    } catch (error) {
      console.error('Image search error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    query: t.Object({
      q: t.String({ minLength: 1, maxLength: 100 }),
      per_page: t.Optional(t.Numeric({ minimum: 1, maximum: 30 })),
    }),
    tags: ['images'],
    detail: {
      summary: 'Enhanced image search',
      description: 'Search for images in unsplash with advanced filtering'
    }
  })

  .post('/process', async ({ body, set }) => {
    try {
      const { images, optimization } = body

      if (!images || !Array.isArray(images) || images.length === 0) {
        set.status = 400
        return { error: 'Images array is required and cannot be empty' }
      }

      // Process images based on optimization settings
      const processedImages = images.map((image, index) => {
        let processedUrl = image.url
        
        // Apply optimization parameters
        if (optimization?.resize && optimization.width && optimization.height) {
          const params = new URLSearchParams()
          params.set('w', optimization.width.toString())
          params.set('h', optimization.height.toString())
          params.set('fit', optimization.fit || 'crop')
          
          if (optimization.quality) {
            params.set('q', optimization.quality.toString())
          }
          
          processedUrl = `${image.url}&${params.toString()}`
        }

        // Calculate optimal dimensions based on content
        const aspectRatio = image.width / image.height
        let optimalWidth = image.width
        let optimalHeight = image.height

        if (optimization?.auto_optimize) {
          // Auto-optimize based on aspect ratio and content type
          if (aspectRatio > 1.5) {
            // Wide landscape - good for headers
            optimalWidth = Math.min(1200, image.width)
            optimalHeight = Math.round(optimalWidth / aspectRatio)
          } else if (aspectRatio < 0.8) {
            // Portrait - good for sidebars
            optimalHeight = Math.min(800, image.height)
            optimalWidth = Math.round(optimalHeight * aspectRatio)
          } else {
            // Square-ish - good for thumbnails
            const size = Math.min(600, Math.max(image.width, image.height))
            optimalWidth = size
            optimalHeight = size
          }
        }

        return {
          ...image,
          position: index + 1,
          processed_url: processedUrl,
          optimal_dimensions: {
            width: optimalWidth,
            height: optimalHeight,
            aspect_ratio: aspectRatio
          },
          optimization_applied: optimization || null,
          file_size_estimate: Math.round((optimalWidth * optimalHeight * 3) / 1024), // Rough KB estimate
          recommended_usage: aspectRatio > 1.5 ? 'header' : aspectRatio < 0.8 ? 'sidebar' : 'thumbnail'
        }
      })

      return {
        message: 'Images processed successfully',
        images: processedImages,
        processing_summary: {
          total_images: processedImages.length,
          optimization_applied: !!optimization,
          estimated_total_size_kb: processedImages.reduce((sum, img) => sum + (img.file_size_estimate || 0), 0)
        }
      }
    } catch (error) {
      console.error('Image processing error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    body: t.Object({
      images: t.Array(t.Object({
        id: t.String(),
        url: t.String({ format: 'uri' }),
        alt: t.String(),
        width: t.Number({ minimum: 1 }),
        height: t.Number({ minimum: 1 })
      }), { minItems: 1, maxItems: 20 }),
      optimization: t.Optional(t.Object({
        resize: t.Boolean(),
        width: t.Optional(t.Number({ minimum: 100, maximum: 2000 })),
        height: t.Optional(t.Number({ minimum: 100, maximum: 2000 })),
        quality: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        fit: t.Optional(t.Union([
          t.Literal('crop'),
          t.Literal('fill'),
          t.Literal('scale'),
          t.Literal('clip')
        ])),
        auto_optimize: t.Optional(t.Boolean())
      }))
    }),
    tags: ['images'],
    detail: {
      summary: 'Process and optimize images',
      description: 'Apply optimization settings and calculate optimal dimensions for images'
    }
  })

  .get('/collections', async ({ query, set }) => {
    try {
      const { featured = false, per_page = 10 } = query

      // This would typically fetch from Unsplash collections API
      // For now, return curated collections data
      const collections = [
        {
          id: 'nature',
          title: 'Nature & Landscapes',
          description: 'Beautiful natural scenery and landscapes',
          preview_images: [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
            'https://images.unsplash.com/photo-1501594907352-04cda38ebc29'
          ],
          total_photos: 1000
        },
        {
          id: 'business',
          title: 'Business & Technology',
          description: 'Professional business and technology images',
          preview_images: [
            'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
            'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158'
          ],
          total_photos: 800
        },
        {
          id: 'people',
          title: 'People & Lifestyle',
          description: 'Diverse people and lifestyle photography',
          preview_images: [
            'https://images.unsplash.com/photo-1494790108755-2616b612b786',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9'
          ],
          total_photos: 1200
        }
      ]

      const filteredCollections = featured 
        ? collections.filter(c => ['nature', 'business'].includes(c.id))
        : collections

      return {
        collections: filteredCollections.slice(0, per_page),
        pagination: {
          total: filteredCollections.length,
          per_page,
          has_more: filteredCollections.length > per_page
        }
      }
    } catch (error) {
      console.error('Collections fetch error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    query: t.Object({
      featured: t.Optional(t.Boolean()),
      per_page: t.Optional(t.Numeric({ minimum: 1, maximum: 30 }))
    }),
    tags: ['images'],
    detail: {
      summary: 'Get image collections',
      description: 'Retrieve curated image collections'
    }
  })
