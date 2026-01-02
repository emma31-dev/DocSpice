import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid article ID format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First try to get from articles_with_author view, fallback to articles table
    let { data: article, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        body,
        image_links,
        created_at,
        updated_at,
        created_by,
        users!articles_created_by_fkey (
          user_name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        )
      }
      console.error('Article fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch article' },
        { status: 500 }
      )
    }

    // Transform the article data
    const transformedArticle = {
      id: article.id,
      title: article.title,
      body: article.body,
      image_links: article.image_links || [],
      created_at: article.created_at,
      updated_at: article.updated_at,
      author_name: article.users?.user_name || 'Anonymous',
      author_email: article.users?.email || null,
      word_count: article.body ? article.body.split(/\s+/).length : 0,
      reading_time: article.body ? Math.ceil(article.body.split(/\s+/).length / 200) : 0
    }

    return NextResponse.json({ article: transformedArticle })
  } catch (error) {
    console.error('Get article error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}