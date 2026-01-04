/**
 * API caching strategies for improved performance
 */

import { apiCache, deduplicateRequest } from './performance'

// Cache keys
export const CACHE_KEYS = {
  ARTICLES_FEED: 'articles:feed',
  ARTICLE_BY_ID: (id: string) => `article:${id}`,
  USER_ARTICLES: (userId: string) => `user:${userId}:articles`,
  USER_PROFILE: (userId: string) => `user:${userId}:profile`,
  IMAGES_SEARCH: (query: string) => `images:search:${query}`,
} as const

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL = {
  ARTICLES_FEED: 5 * 60 * 1000, // 5 minutes
  ARTICLE: 15 * 60 * 1000, // 15 minutes
  USER_PROFILE: 10 * 60 * 1000, // 10 minutes
  IMAGES: 30 * 60 * 1000, // 30 minutes
} as const

// Cached API functions
export async function getCachedArticlesFeed(
  page: number = 1,
  limit: number = 12
): Promise<unknown> {
  const cacheKey = `${CACHE_KEYS.ARTICLES_FEED}:${page}:${limit}`
  
  return deduplicateRequest(cacheKey, async () => {
    // Check cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Fetch from API
    const response = await fetch(`/api/elysia/articles/feed?page=${page}&limit=${limit}`)
    if (!response.ok) {
      throw new Error('Failed to fetch articles feed')
    }

    const data = await response.json()
    
    // Cache the result
    apiCache.set(cacheKey, data, CACHE_TTL.ARTICLES_FEED)
    
    return data
  })
}

export async function getCachedArticleById(id: string): Promise<unknown> {
  const cacheKey = CACHE_KEYS.ARTICLE_BY_ID(id)
  
  return deduplicateRequest(cacheKey, async () => {
    // Check cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Fetch from API
    const response = await fetch(`/api/elysia/articles/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch article')
    }

    const data = await response.json()
    
    // Cache the result
    apiCache.set(cacheKey, data, CACHE_TTL.ARTICLE)
    
    return data
  })
}

export async function getCachedUserProfile(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<unknown> {
  const cacheKey = `${CACHE_KEYS.USER_PROFILE(userId)}:${page}:${limit}`
  
  return deduplicateRequest(cacheKey, async () => {
    // Check cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Fetch from API - now includes both profile and articles
    const response = await fetch(`/api/elysia/user/profile/${userId}?page=${page}&limit=${limit}`)
    if (!response.ok) {
      throw new Error('Failed to fetch user profile')
    }

    const data = await response.json()
    
    // Cache the result
    apiCache.set(cacheKey, data, CACHE_TTL.USER_PROFILE)
    
    return data
  })
}

export async function getCachedUserArticles(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<unknown> {
  // Use the profile endpoint since it now returns both profile and articles
  return getCachedUserProfile(userId, page, limit)
}

export async function getCachedUserSearch(query: string, limit: number = 10): Promise<unknown> {
  const cacheKey = `user:search:${query}:${limit}`
  
  return deduplicateRequest(cacheKey, async () => {
    // Check cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Fetch from API
    const response = await fetch(`/api/elysia/user/search?q=${encodeURIComponent(query)}&limit=${limit}`)
    if (!response.ok) {
      throw new Error('Failed to search users')
    }

    const data = await response.json()
    
    // Cache the result for shorter time since search results change frequently
    apiCache.set(cacheKey, data, 2 * 60 * 1000) // 2 minutes
    
    return data
  })
}

export async function getCachedImageSearch(query: string): Promise<unknown> {
  const cacheKey = CACHE_KEYS.IMAGES_SEARCH(query)
  
  return deduplicateRequest(cacheKey, async () => {
    // Check cache first
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Fetch from API
    const response = await fetch(`/api/elysia/images/search?q=${encodeURIComponent(query)}`)
    if (!response.ok) {
      throw new Error('Failed to search images')
    }

    const data = await response.json()
    
    // Cache the result
    apiCache.set(cacheKey, data, CACHE_TTL.IMAGES)
    
    return data
  })
}

// Cache invalidation functions
export function invalidateArticlesFeedCache(): void {
  // Clear all feed-related cache entries
  const keys = Array.from(apiCache['cache'].keys()).filter(key => 
    key.startsWith(CACHE_KEYS.ARTICLES_FEED)
  )
  
  keys.forEach(key => {
    apiCache['cache'].delete(key)
  })
}

export function invalidateArticleCache(articleId: string): void {
  const cacheKey = CACHE_KEYS.ARTICLE_BY_ID(articleId)
  apiCache['cache'].delete(cacheKey)
  
  // Also invalidate feeds since they might contain this article
  invalidateArticlesFeedCache()
}

export function invalidateUserCache(userId: string): void {
  const profileKey = CACHE_KEYS.USER_PROFILE(userId)
  apiCache['cache'].delete(profileKey)
  
  // Clear user articles cache
  const keys = Array.from(apiCache['cache'].keys()).filter(key => 
    key.startsWith(CACHE_KEYS.USER_ARTICLES(userId))
  )
  
  keys.forEach(key => {
    apiCache['cache'].delete(key)
  })
}

// Preload critical data
export async function preloadCriticalData(): Promise<void> {
  try {
    // Preload first page of articles feed
    await getCachedArticlesFeed(1, 12)
    
    console.log('Critical data preloaded successfully')
  } catch (error) {
    console.warn('Failed to preload critical data:', error)
  }
}

// Cache warming for better performance
export function warmCache(): void {
  // Warm the cache with commonly accessed data
  setTimeout(() => {
    preloadCriticalData()
  }, 1000) // Delay to avoid blocking initial page load
}

// Cache statistics for monitoring
export function getCacheStats(): {
  size: number
  hitRate: number
  keys: string[]
} {
  const cache = apiCache['cache']
  const keys = Array.from(cache.keys())
  
  return {
    size: cache.size,
    hitRate: 0, // Would need to implement hit/miss tracking
    keys
  }
}

// Clear all cache
export function clearAllCache(): void {
  apiCache.clear()
  console.log('All cache cleared')
}

// Background cache cleanup
export function startCacheCleanup(): void {
  // Clean up expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now()
    const cache = apiCache['cache']
    
    for (const [key, item] of cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        cache.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}