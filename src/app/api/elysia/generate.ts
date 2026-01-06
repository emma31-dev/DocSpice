import { Elysia, t } from 'elysia'
import { analyzeText, generateImageSearchQueries } from '@/lib/textAnalysis'
import { searchImagesForQueries, getFallbackImages, UnsplashImage } from '@/lib/unsplash'

// Simple in-memory store for generated articles (sufficient for dev)
const generatedStore = new Map<string, unknown>()

export const generateRoutes = new Elysia({ prefix: '/generate' })
  .post('/', async ({ body, set }) => {
    try {
      const { text, title } = body as { text: string; title?: string }

      if (!text || typeof text !== 'string' || text.trim().length < 20) {
        set.status = 400
        return { error: 'Text is required and should be at least 20 characters' }
      }

      // Analyze text and build image search queries
      const analysis = analyzeText(text)
      const queries = generateImageSearchQueries(analysis)

      // Search Unsplash (or fallback images) for queries
      let images = await searchImagesForQueries(queries)
      if (!images || images.length === 0) {
        images = getFallbackImages()
      }

      // Build article structure
      const article = {
        title: title && title.trim().length > 0 ? title : (analysis.sentences[0] || 'Untitled Article').slice(0, 120),
        content: text,
        images: (images || []).map((img: UnsplashImage, index: number, arr: UnsplashImage[]) => ({
          url: img.urls?.regular || (img as unknown as { url?: string }).url || '',
          alt: img.alt_description || img.description || 'Article illustration',
          position: Math.floor(index * ((text.split('\n\n') || []).length / (arr.length || 1))) + 1,
          unsplash_id: img.id || null
        }))
      }

      const id = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID ? (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto!.randomUUID!() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`

      generatedStore.set(id, article)

      return { id }
    } catch (error) {
      console.error('Generate POST error:', error)
      set.status = 500
      return { error: 'Failed to generate article' }
    }
  }, {
    body: t.Object({ text: t.String(), title: t.Optional(t.String()) }),
    tags: ['generate']
  })

  .get('/', async ({ query, set }) => {
    try {
      const id = typeof query.id === 'string' ? query.id : undefined
      if (!id) {
        set.status = 400
        return { error: 'Missing id query parameter' }
      }

      const article = generatedStore.get(id)
      if (!article) {
        set.status = 404
        return { error: 'Generated article not found' }
      }

      return article
    } catch (error) {
      console.error('Generate GET error:', error)
      set.status = 500
      return { error: 'Failed to retrieve generated article' }
    }
  }, {
    query: t.Object({ id: t.Optional(t.String()) }),
    tags: ['generate']
  })


export default generateRoutes
