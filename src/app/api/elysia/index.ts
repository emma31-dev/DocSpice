import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { authRoutes } from './auth'
import { articleRoutes } from './articles'
import { imageRoutes } from './images'
import { userRoutes } from './user'
import { generateRoutes } from './generate'

const app = new Elysia()
  .get('/test', () => ({ message: 'Test endpoint working' }))

  // CORS PERMITS ONLY REQUEST FROM THE FRONTEND
  .use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000']
      : true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }))

  // SWAGGER GENERATES UI FOR TESTING ENDPOINTS AT /api/swagger
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
        { name: 'images', description: 'Image processing endpoints' },
        { name: 'users', description: 'User profile endpoints' }
      ]
    }
  }))
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(articleRoutes)
  .use(imageRoutes)
  .use(userRoutes)
  .use(generateRoutes)

  // ERROR HANDLING MIDDLEWARE
  // Full errors are logged to the console
  .onError(({ code, error, set }) => {
    console.error('API Error:', { code, error: error instanceof Error ? error.message : String(error) })
    
    switch (code) {
      case 'VALIDATION':
        set.status = 400
        return { error: 'Validation failed', code: 'VALIDATION_ERROR' }
      case 'NOT_FOUND':
        set.status = 404
        return { error: 'Resource not found', code: 'NOT_FOUND' }
      case 'INTERNAL_SERVER_ERROR':
        set.status = 500
        return { error: 'Internal server error', code: 'INTERNAL_ERROR' }
      default:
        set.status = 500
        return { error: 'Unknown error occurred', code }
    }
  })

  

export { app }
export type App = typeof app