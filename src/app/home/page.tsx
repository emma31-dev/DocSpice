import { createClient } from '@/lib/supabase/server'
import { SuccessMessage } from '@/components/SuccessMessage'
import { ArticleGrid } from '@/components/ArticleCard'
import ErrorMessage from '@/components/ErrorMessage'
import Link from 'next/link'
import { PenTool, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'

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
  author_name: string
  author_email: string
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const params = await searchParams
  
  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/signin?redirect=/home')
  }

  // Fetch articles from the API endpoint
  let articles: Article[] = []
  let error: string | null = null

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/articles/feed?limit=12`, {
      cache: 'no-store' // Ensure fresh data
    })
    
    if (response.ok) {
      const data = await response.json()
      articles = data.articles || []
    } else {
      error = 'Failed to fetch articles'
    }
  } catch (fetchError) {
    console.error('Error fetching articles:', fetchError)
    error = 'Network error while fetching articles'
  }

  return (
    <div className="px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user.user_metadata?.user_name || user.email?.split('@')[0]}!
          </h2>
          <p className="text-gray-600">
            Discover the latest articles from our community
          </p>
        </div>

        {/* Success Message */}
        {params.success === 'true' && (
          <div className="mb-8">
            <SuccessMessage message="Article published successfully! 🎉" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorMessage 
            title="Error loading articles"
            message="Please check your database connection and try again."
            onRetry={() => window.location.reload()}
          />
        )}

        {/* Empty State */}
        {!error && (!articles || articles.length === 0) && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <PenTool className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Articles Yet</h2>
            <p className="text-gray-600 mb-6">
              Be the first to create an article and share your story with the community!
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl
                hover:from-blue-700 hover:to-sky-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Create Your First Article
            </Link>
          </div>
        )}

        {/* Articles Grid */}
        {!error && articles && articles.length > 0 && (
          <>
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Community Articles</h3>
              <p className="text-gray-600">
                {articles.length} {articles.length === 1 ? 'article' : 'articles'} published by our community
              </p>
            </div>

            <ArticleGrid articles={articles} />

            {/* Load More Section (Placeholder for future pagination) */}
            {articles.length >= 12 && (
              <div className="text-center mt-12">
                <button
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl
                    hover:bg-gray-200 transition-all duration-200 border border-gray-200"
                  disabled
                >
                  Load More Articles (Coming Soon)
                </button>
              </div>
            )}
          </>
        )}

        {/* Quick Actions */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-sky-500 rounded-3xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Share Your Story?</h3>
          <p className="text-lg mb-6 opacity-90">
            Transform your ideas into beautiful illustrated articles with AI-powered image matching.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl
              hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl
              transform hover:scale-105"
          >
            <PenTool className="h-5 w-5" />
            Create New Article
          </Link>
        </div>
      </div>
    </div>
  )
}