'use client'

import { useState } from 'react'
import { createArticle } from '@/app/actions'
import Link from 'next/link'
import Image from 'next/image'
import { PenTool, Image as ImageIcon, FileText, ArrowLeft } from 'lucide-react'

interface FormState {
  error?: string
  success?: boolean
}

export default function CreateArticlePage() {
  const [formState, setFormState] = useState<FormState>({})
  const [isPending, setIsPending] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormState({ error: 'Image size must be less than 5MB' })
        e.target.value = ''
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormState({ error: 'Please select a valid image file' })
        e.target.value = ''
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setFormState({})
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setFormState({})

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await createArticle(formData)
      
      if (result.error) {
        setFormState({ error: result.error })
        setIsPending(false)
      }
      // If successful, the server action will redirect
    } catch (error) {
      console.error('Form submission error:', error)
      setFormState({ error: 'An unexpected error occurred. Please try again.' })
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Header */}
      <header className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent mb-2">
              Create New Article
            </h1>
            <p className="text-gray-600">
              Share your story with a beautiful cover image
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pb-12">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {formState.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm font-medium">{formState.error}</p>
              </div>
            )}

            {/* Title Input */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Article Title</h2>
                  <span className="text-red-500 text-sm">*</span>
                </div>
              </div>
              <div className="p-6">
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Enter a compelling title for your article..."
                  className="w-full border-0 outline-none text-gray-700 placeholder-gray-400 text-lg font-medium focus:ring-0"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Content Textarea */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Article Content</h2>
                  <span className="text-red-500 text-sm">*</span>
                </div>
              </div>
              <div className="p-6">
                <textarea
                  name="content"
                  required
                  rows={12}
                  placeholder="Write your article content here... Share your thoughts, stories, and ideas."
                  className="w-full resize-none border-0 outline-none text-gray-700 placeholder-gray-400 text-base leading-relaxed focus:ring-0"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Cover Image</h2>
                  <span className="text-red-500 text-sm">*</span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <input
                    type="file"
                    name="image"
                    required
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-600
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      file:cursor-pointer cursor-pointer
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isPending}
                  />
                  <p className="text-sm text-gray-500">
                    Upload a cover image for your article (max 5MB, JPG, PNG, WebP, or GIF)
                  </p>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                      <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
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
                  flex items-center gap-2"
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
                    Creating Article...
                  </>
                ) : (
                  <>
                    <PenTool className="h-5 w-5" />
                    Publish Article
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
