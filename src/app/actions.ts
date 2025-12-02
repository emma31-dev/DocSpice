'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface ActionResponse {
  error?: string
  success?: boolean
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
