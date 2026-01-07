'use client'

import Link from 'next/link'
import { memo } from 'react'
import { Eye } from 'lucide-react'
import { ThumbnailImage } from './OptimizedImage'
import { getCardClasses } from '@/lib/theme'

interface ImageLink {
  url: string
  alt: string
  position: number
  unsplash_id?: string
}

interface Article {
  id: string
  title: string
  body: string
  image_links: ImageLink[]
  created_at: string
  views?: number
  author?: {
    user_name: string
  }
  // Legacy support for direct properties
  author_name?: string
  author_email?: string
  created_by?: string
  featured_image?: ImageLink | null
}

interface ArticleCardProps {
  article: Article
}

// Memoized component to prevent unnecessary re-renders
export const ArticleCard = memo(function ArticleCard({ article }: ArticleCardProps) {
  // Choose a featured image from available fields (compatibility across responses)
  const featuredImage = (
    // Prefer `featured_image` if provided (normalized by feed)
    (article.featured_image && article.featured_image) ||
    (article.image_links && article.image_links.length && article.image_links[0]) ||
    // some endpoints might return `preview_images` or `images`
    ((article as unknown as { preview_images?: ImageLink[] }).preview_images && (article as unknown as { preview_images?: ImageLink[] }).preview_images![0]) ||
    ((article as unknown as { images?: ImageLink[] }).images && (article as unknown as { images?: ImageLink[] }).images![0]) ||
    null
  ) as ImageLink | null
  
  // Format the date
  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Truncate body text for preview (optimized for performance)
  const previewText = article.body.length > 150 
    ? `${article.body.substring(0, 150)}...`
    : article.body

  // Calculate reading time
  const wordCount = article.body.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200) // Average reading speed

  return (
    <article className={`${getCardClasses('md', true)} group animate-fade-in-up`}>
      {/* Article Image */}
      <div className="relative w-full h-56 bg-linear-to-br from-gray-100 to-gray-200">
        {featuredImage ? (
          <ThumbnailImage
            src={featuredImage.url}
            alt={featuredImage.alt || article.title}
            fill
            className="transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-50 to-sky-50">
            <div className="text-blue-300 text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium">No image</p>
            </div>
          </div>
        )}
        
        {/* Creator overlay (bottom-left on image) */}
        {featuredImage && (
          <div className="absolute left-3 bottom-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-sky-400 text-white flex items-center justify-center text-xs font-semibold">
              {(article.author?.user_name || (article.created_by ? article.created_by.slice(0,8) : undefined) || article.author_email)?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="truncate max-w-40">{article.author?.user_name || (article.created_by ? article.created_by.slice(0,8) : undefined) || article.author_email?.split('@')[0] || 'Anonymous'}</span>
          </div>
        )}

        {/* Reading time and view count badges */}
        <div className="absolute top-3 right-3 flex gap-2">
          {article.views !== undefined && (
            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-600 flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.views}
            </div>
          )}
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-600">
            {readingTime} min read
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
          <Link href={`/article/${article.id}`} className="hover:underline">
            {article.title}
          </Link>
        </h3>
        
        <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
          {previewText}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-sky-400 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {(article.author?.user_name || (article.created_by ? article.created_by.slice(0,8) : undefined) || article.author_email)?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">
                {article.author?.user_name || (article.created_by ? article.created_by.slice(0,8) : undefined) || article.author_email?.split('@')[0] || 'Anonymous'}
              </p>
              <time dateTime={article.created_at} className="text-xs text-gray-500">
                {formattedDate}
              </time>
            </div>
          </div>
          
          <Link
            href={`/article/${article.id}`}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors hover:underline shrink-0 ml-2"
          >
            Read More
          </Link>
        </div>
      </div>
    </article>
  )
})

// Loading skeleton component for better perceived performance
export function ArticleCardSkeleton() {
  return (
    <div className={`${getCardClasses('md')} animate-gentle-pulse`}>
      <div className="w-full h-56 loading-skeleton" />
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="h-6 loading-skeleton rounded w-3/4" />
          <div className="h-6 loading-skeleton rounded w-1/2" />
        </div>
        <div className="space-y-2">
          <div className="h-4 loading-skeleton rounded w-full" />
          <div className="h-4 loading-skeleton rounded w-full" />
          <div className="h-4 loading-skeleton rounded w-2/3" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 loading-skeleton rounded-full" />
            <div className="space-y-1">
              <div className="h-4 loading-skeleton rounded w-20" />
              <div className="h-3 loading-skeleton rounded w-16" />
            </div>
          </div>
          <div className="h-4 loading-skeleton rounded w-16" />
        </div>
      </div>
    </div>
  )
}

// Grid component for optimal layout
export function ArticleGrid({ 
  articles, 
  loading = false 
}: { 
  articles: Article[]
  loading?: boolean 
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <ArticleCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {articles.map((article, index) => (
        <div 
          key={article.id} 
          className={`animate-fade-in-up animate-stagger-${Math.min(index + 1, 6)}`}
        >
          <ArticleCard article={article} />
        </div>
      ))}
    </div>
  )
}