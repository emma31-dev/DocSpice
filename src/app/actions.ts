'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface ActionResponse {
  error?: string
  success?: boolean
}

export interface GeneratedArticle {
  title: string
  content: string
  images: Array<{
    url: string
    alt: string
    position: number
  }>
}

export interface GenerateArticleResponse {
  error?: string
  article?: GeneratedArticle
}

export async function generateArticle(text: string, title?: string): Promise<GenerateArticleResponse> {
  try {
    // Call the generate API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, title }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { error: errorData.error || 'Failed to generate article' }
    }

    const result = await response.json()
    
    // Get the full article data
    const articleResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/generate?id=${result.id}`)
    
    if (!articleResponse.ok) {
      return { error: 'Failed to retrieve generated article' }
    }

    const articleData = await articleResponse.json()
    
    // Transform the data to match our interface
    const article: GeneratedArticle = {
      title: articleData.title,
      content: articleData.content,
      images: articleData.images.map((img: { urls: { regular: string }; alt_description?: string; description?: string }, index: number) => ({
        url: img.urls.regular,
        alt: img.alt_description || img.description || 'Article illustration',
        position: Math.floor(index * (articleData.content.split('\n\n').length / articleData.images.length)) + 1
      }))
    }

    return { article }
  } catch (error) {
    console.error('Error generating article:', error)
    return { error: 'An unexpected error occurred while generating the article' }
  }
}

export async function createArticle(formData: FormData): Promise<ActionResponse> {
  try {
    // Create Supabase client
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return { error: 'You must be logged in to create an article' }
    }

    // Extract form data
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const imageFile = formData.get('image') as File

    // Validate required fields
    if (!title || !content || !imageFile) {
      return { error: 'All fields are required' }
    }

    // Validate file is an image
    if (!imageFile.type.startsWith('image/')) {
      return { error: 'Please upload a valid image file' }
    }

    // Generate unique file path
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Upload image to storage
    const { error: uploadError } = await supabase.storage
      .from('article_images')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'Failed to upload image. Please try again.' }
    }

    // Get public URL for the uploaded image
    const {
      data: { publicUrl },
    } = supabase.storage.from('article_images').getPublicUrl(filePath)

    // Insert article into database
    const { error: dbError } = await supabase
      .from('articles')
      .insert({
        title,
        content,
        image_url: publicUrl,
        user_id: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to clean up uploaded image
      await supabase.storage.from('article_images').remove([filePath])
      return { error: 'Failed to save article. Please try again.' }
    }

    // Revalidate the homepage cache
    revalidatePath('/')

    // Redirect to homepage with success message
    redirect('/?success=true')
  } catch (error) {
    console.error('Unexpected error in createArticle:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
