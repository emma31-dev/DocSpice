'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PenTool, Wand2, Sparkles, Upload } from 'lucide-react'
import { generateArticle } from '@/app/actions'
import { useAuth } from '@/hooks/useAuth'
import ErrorMessage from '@/components/ErrorMessage'

interface GeneratedArticle {
  title: string
  content: string
  images: Array<{
    url: string
    alt: string
    position: number
  }>
}

interface FormState {
  error?: string
  success?: boolean
}

export default function CreatePage() {
  const [formState, setFormState] = useState<FormState>({})
  const [isPending, setIsPending] = useState(false)
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [titleLength, setTitleLength] = useState(0)
  
  const { isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setFormState({})
    setGeneratedArticle(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const text = formData.get('text') as string
    
    try {
      const result = await generateArticle(text, title)
      
      if (result.error) {
        setFormState({ error: result.error })
      } else if (result.article) {
        setGeneratedArticle(result.article)
        setFormState({ success: true })
      }
    } catch (error) {
      console.error('Article generation error:', error)
      setFormState({ error: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsPending(false)
    }
  }

  async function handlePublish() {
    if (!generatedArticle) return

    if (!isAuthenticated) {
      // Store the current article in sessionStorage for after auth
      sessionStorage.setItem('pendingArticle', JSON.stringify(generatedArticle))
      
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
      
      // Redirect to home feed after successful publish
      router.push('/home?success=true')
    } catch (error) {
      console.error('Publish error:', error)
      setFormState({ 
        error: error instanceof Error ? error.message : 'Failed to publish article. Please try again.' 
      })
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
          setFormState({ success: true })
          sessionStorage.removeItem('pendingArticle')
        } catch (error) {
          console.error('Error restoring pending article:', error)
          sessionStorage.removeItem('pendingArticle')
        }
      }
    }
  }, [isAuthenticated, authLoading])

  return (
    <div className="px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent mb-2">
            Create Beautiful Articles
          </h1>
          <p className="text-gray-600">
            Add a compelling title and transform your text into visually stunning articles with AI-powered image matching
          </p>
        </div>

        {!generatedArticle ? (
          /* Article Creation Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {formState.error && (
              <ErrorMessage 
                message={formState.error} 
                dismissible 
                onDismiss={() => setFormState(prev => ({ ...prev, error: undefined }))}
                onRetry={() => {
                  setFormState({})
                  setGeneratedArticle(null)
                }}
              />
            )}

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
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl
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

            {/* Publish Error Message */}
            {formState.error && (
              <ErrorMessage 
                message={formState.error} 
                dismissible 
                onDismiss={() => setFormState(prev => ({ ...prev, error: undefined }))}
              />
            )}

            {/* Generated Article */}
            <article className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  {generatedArticle.title}
                </h1>
                
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
                  setFormState({})
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
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl
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