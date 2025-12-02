import { createClient } from '@/lib/supabase/server'
import { DocSpiceIcon } from '@/components/DocSpiceIcon'
import { SuccessMessage } from '@/components/SuccessMessage'
import Image from 'next/image'
import Link from 'next/link'
import { PenTool, Plus } from 'lucide-react'

interface Article {
  id: string
  created_at: string
  title: string
  content: string
  image_url: string
  user_id: string
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const params = await searchParams
  // Fetch articles from Supabase
  const supabase = await createClient()
  
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching articles:', error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Header */}
      <header className="px-6 py-8 border-b border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-sky-400 rounded-xl text-white">
                <DocSpiceIcon size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
                  DocSpice
                </h1>
                <p className="text-sm text-gray-600">Beautiful Articles, Beautifully Illustrated</p>
              </div>
            </div>
            <Link
              href="/create-article"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl
                hover:from-blue-700 hover:to-sky-600 transition-all duration-200 shadow-lg hover:shadow-xl
                transform hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              Create Article
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Success Message */}
          {params.success === 'true' && (
            <SuccessMessage message="Article created successfully!" />
          )}
          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <p className="text-red-600 font-medium">Error loading articles</p>
              <p className="text-red-500 text-sm mt-1">
                Please check your database connection and try again.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!error && (!articles || articles.length === 0) && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <PenTool className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No Articles Yet</h2>
              <p className="text-gray-600 mb-6">
                Be the first to create an article and share your story!
              </p>
              <Link
                href="/create-article"
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
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Recent Articles</h2>
                <p className="text-gray-600">
                  Discover stories from our community
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article: Article) => (
                  <article
                    key={article.id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden
                      hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {/* Article Image */}
                    <div className="relative w-full h-56 bg-gray-100">
                      <Image
                        src={article.image_url}
                        alt={article.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>

                    {/* Article Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                        {article.content}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <time dateTime={article.created_at}>
                          {new Date(article.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
