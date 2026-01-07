'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PenTool, Wand2, Sparkles, Upload, Eye } from 'lucide-react'
// Calling the generate API directly from the client instead of importing a
// server action. Importing `generateArticle` (a server-only function) into a
// client component can cause runtime errors.
import { useAuth } from '@/hooks/useAuth'
import { useToastContext } from '@/components/ToastProvider'
import type { UnsplashImage } from '@/lib/unsplash'

interface GeneratedArticle {
  title: string
  content: string
  images: Array<{
    url: string
    alt: string
    position: number
  }>
  header?: {
    author?: string
    published_at?: string
    reads?: number
  }
}

export default function CreatePage() {
  const [isPending, setIsPending] = useState(false)
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [titleLength, setTitleLength] = useState(0)
  
  const { isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const toast = useToastContext()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setGeneratedArticle(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const text = formData.get('text') as string
    
    try {
      // Call the Elysia articles generate endpoint
      const res = await fetch('/api/elysia/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, title })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to generate article' }))
        toast.error(err.error || 'Article Generation Failed', { title: 'Article Generation Failed' })
        return
      }

      const result = await res.json()
      const articleData = result.article || result

      const article = {
        title: articleData.title,
        content: articleData.content,
        images: (articleData.images || []).map((img: UnsplashImage, index: number) => ({
          url: (img as unknown as { url?: string }).url || img.urls?.regular || '',
          alt: (img as unknown as { alt?: string }).alt || img.alt_description || img.description || 'Article illustration',
          position: (img as unknown as { position?: number }).position || Math.floor(index * ((articleData.content || '').split('\n\n').length / (articleData.images?.length || 1))) + 1
        }))
        ,
        // preserve header metadata returned from the generate endpoint (if present)
        header: articleData.header || undefined
      }

      setGeneratedArticle(article)
      toast.success('Article generated successfully! Review and publish when ready.', { title: 'Article Ready' })
    } catch (error) {
      console.error('Article generation error:', error)
      toast.error('An unexpected error occurred. Please try again.', { 
        title: 'Generation Error' 
      })
    } finally {
      setIsPending(false)
    }
  }

  async function handlePublish() {
    if (!generatedArticle) return

    if (!isAuthenticated) {
      // Store the current article in sessionStorage for after auth
      sessionStorage.setItem('pendingArticle', JSON.stringify(generatedArticle))
      
      toast.info('Please sign in to publish your article. Your work will be saved.', {
        title: 'Authentication Required'
      })
      
      // Redirect to signin with return URL
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      router.push(`/auth/signin?returnUrl=${returnUrl}`)
      return
    }

    setIsPublishing(true)
    
    try {
      // Call the publish API endpoint
      const response = await fetch('/api/elysia/articles/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: generatedArticle.title,
          body: generatedArticle.content,
          image_links: generatedArticle.images
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to publish article')
      }

      const result = await response.json()
      console.log('Article published:', result)
      
      // Clear any pending article from storage
      sessionStorage.removeItem('pendingArticle')
      
      toast.success('Your article has been published successfully!', {
        title: 'Article Published'
      })
      
      // Redirect to home feed after successful publish
      router.push('/home?success=true')
    } catch (error) {
      console.error('Publish error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to publish article. Please try again.',
        { title: 'Publishing Failed' }
      )
    } finally {
      setIsPublishing(false)
    }
  }

  // Check for pending article after authentication
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const pendingArticle = sessionStorage.getItem('pendingArticle')
      if (pendingArticle) {
        try {
          const article = JSON.parse(pendingArticle)
          setGeneratedArticle(article)
          sessionStorage.removeItem('pendingArticle')
          toast.success('Welcome back! Your article is ready to publish.', {
            title: 'Article Restored'
          })
        } catch (error) {
          console.error('Error restoring pending article:', error)
          sessionStorage.removeItem('pendingArticle')
          toast.error('Failed to restore your article. Please try generating it again.', {
            title: 'Restore Failed'
          })
        }
      }
    }
  }, [isAuthenticated, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent mb-2">
            Create Beautiful Articles
          </h1>
          <p className="text-gray-600">
            Add a compelling title and transform your text into visually stunning articles with AI-powered image matching
          </p>
        </div>

        {!generatedArticle ? (
          /* Article Creation Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenTool className="h-5 w-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-800">Article Title</h2>
                    <span className="text-red-500 text-sm">*</span>
                  </div>
                  <span className={`text-sm ${titleLength > 100 ? 'text-red-500' : 'text-gray-500'}`}>
                    {titleLength}/100
                  </span>
                </div>
              </div>
              <div className="p-6">
                <input
                  name="title"
                  type="text"
                  required
                  maxLength={100}
                  placeholder="Enter your article title..."
                  className="w-full border-0 outline-none text-gray-700 placeholder-gray-400 text-xl font-semibold leading-relaxed focus:ring-0"
                  disabled={isPending}
                  onChange={(e) => setTitleLength(e.target.value.length)}
                />
                <p className="text-sm text-gray-500 mt-2">
                  A compelling title helps readers understand what your article is about
                </p>
              </div>
            </div>

            {/* Text Input */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Your Text</h2>
                  <span className="text-red-500 text-sm">*</span>
                </div>
              </div>
              <div className="p-6">
                <textarea
                  name="text"
                  required
                  rows={12}
                  placeholder="Paste or write your text here... DocSpice will analyze it and create a beautiful illustrated article with relevant images from Unsplash."
                  className="w-full resize-none border-0 outline-none text-gray-700 placeholder-gray-400 text-base leading-relaxed focus:ring-0"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={isPending}
                className="px-8 py-4 bg-linear-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl
                  hover:from-blue-700 hover:to-sky-600 
                  disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed
                  transition-all duration-200 shadow-lg hover:shadow-xl
                  transform hover:scale-105 disabled:transform-none
                  flex items-center gap-2 text-lg"
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating Article...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    Generate Article
                    <Sparkles className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Generated Article Display */
          <div className="space-y-8">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Article Generated Successfully!</h3>
              <p className="text-green-600">Your text has been transformed into a beautiful illustrated article.</p>
            </div>

            {/* Generated Article */}
            <article className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  {generatedArticle.title}
                </h1>
                {/* Preview header: author, published date, reads (if available) */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="font-medium text-gray-800">
                    {generatedArticle.header?.author || 'Preview Author'}
                  </div>
                  <time className="text-gray-500">
                    {new Date(generatedArticle.header?.published_at || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </time>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Eye className="h-4 w-4" />
                    <span>{generatedArticle.header?.reads ?? 0} reads</span>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none">
                  {generatedArticle.content.split('\n\n').map((paragraph, index) => {
                    // Find images that should be placed after this paragraph
                    const imagesForThisParagraph = generatedArticle.images.filter(
                      img => img.position === index + 1
                    )
                    
                    return (
                      <div key={index}>
                        <p className="text-gray-700 leading-relaxed mb-6">
                          {paragraph}
                        </p>
                        {imagesForThisParagraph.map((image, imgIndex) => (
                          <div key={imgIndex} className="my-8">
                            <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden">
                              <Image
                                src={image.url}
                                alt={image.alt}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                              />
                            </div>
                            <p className="text-sm text-gray-500 mt-2 text-center italic">
                              {image.alt}
                            </p>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            </article>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  setGeneratedArticle(null)
                  setTitleLength(0)
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl
                  hover:bg-gray-200 transition-all duration-200 border border-gray-200"
              >
                Create Another Article
              </button>
              
              <button
                onClick={handlePublish}
                disabled={isPublishing || authLoading}
                className="px-8 py-3 bg-linear-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl
                  hover:from-blue-700 hover:to-sky-600 
                  disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed
                  transition-all duration-200 shadow-lg hover:shadow-xl
                  transform hover:scale-105 disabled:transform-none
                  flex items-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {isAuthenticated ? 'Publish Article' : 'Sign In to Publish'}
                  </>
                )}
              </button>
            </div>
            
            {/* Authentication hint for anonymous users */}
            {!isAuthenticated && !authLoading && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  You need to{' '}
                  <Link 
                    href="/auth/signin" 
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    sign in
                  </Link>
                  {' '}or{' '}
                  <Link 
                    href="/auth/signup" 
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    create an account
                  </Link>
                  {' '}to publish your articles
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}