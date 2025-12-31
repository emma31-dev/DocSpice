import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { authRoutes } from './auth'
import { articleRoutes } from './articles'
import { imageRoutes } from './images'

const app = new Elysia({ prefix: '/api' })
  .use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000']
      : true,
    credentials: true
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'DocSpice Platform API',
        version: '1.0.0',
        description: 'Backend API for DocSpice content platform'
      },
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'articles', description: 'Article management endpoints' },
        { name: 'images', description: 'Image processing endpoints' }
      ]
    }
  }))
  .use(authRoutes)
  .use(articleRoutes)
  .use(imageRoutes)
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .onError(({ code, error, set }) => {
    console.error('API Error:', { code, error: error instanceof Error ? error.message : String(error) })
    
    switch (code) {
      case 'VALIDATION':
        set.status = 400
        return { error: 'Validation failed', details: error instanceof Error ? error.message : String(error) }
      case 'NOT_FOUND':
        set.status = 404
        return { error: 'Resource not found' }
      case 'INTERNAL_SERVER_ERROR':
        set.status = 500
        return { error: 'Internal server error' }
      default:
        set.status = 500
        return { error: 'Unknown error occurred' }
    }
  })

export { app }
export type App = typeof app