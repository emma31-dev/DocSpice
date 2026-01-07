import { Elysia, t } from 'elysia'
import { createClient } from '@/lib/supabase/server'
import { analyzeText, generateImageSearchQueries } from '@/lib/textAnalysis'
import { searchImagesForQueries, getFallbackImages, UnsplashImage } from '@/lib/unsplash'
import type { ImageLink } from '@/atoms'

export const articleRoutes = new Elysia({ prefix: '/articles' })
  .post('/publish', async ({ body, set }) => {
    try {
      const { title, body: articleBody, image_links } = body
      const supabase = await createClient()

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        set.status = 401
        return { error: 'Authentication required' }
      }

      // Validate article data
      if (!title || !articleBody || !image_links || !Array.isArray(image_links)) {
        set.status = 400
        return { error: 'Missing required article data' }
      }

      // Insert article
      const { data: article, error: insertError } = await supabase
        .from('articles')
        .insert({
          title,
          body: articleBody,
          image_links,
          created_by: user.id
        })
        .select()
        .single()

      if (insertError) {
        console.error('Article insert error:', insertError)
        set.status = 400
        return { error: 'Failed to publish article: ' + insertError.message }
      }

      // Resolve author display name (if available) for response
      let authorName: string | null = null
      try {
        const { data: profile } = await supabase.from('profiles').select('user_name').eq('id', user.id).single()
        authorName = (profile as { user_name?: string } | null)?.user_name || (user.user_metadata as { full_name?: string } | undefined)?.full_name || user.email || null
      } catch (err) {
        authorName = (user.user_metadata as { full_name?: string } | undefined)?.full_name || user.email || null
        console.warn('Failed to resolve profile for publish response', err)
      }

      return {
        message: 'Article published successfully',
        article: {
          id: article.id,
          title: article.title,
          created_at: article.created_at,
          views: article.views ?? 0,
          author: {
            user_name: authorName
          }
        }
      }
    } catch (error) {
      console.error('Publish article error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 255 }),
      body: t.String({ minLength: 20 }),
      image_links: t.Array(t.Object({
        url: t.String(),
        alt: t.String(),
        position: t.Number(),
        unsplash_id: t.Optional(t.String())
      }))
    }),
    tags: ['articles']
  })

  // Generate a draft article (analysis + image search) without publishing
  .post('/generate', async ({ body, set }) => {
    try {
      const { text, title } = body as { text: string; title?: string }

      if (!text || typeof text !== 'string' || text.trim().length < 20) {
        set.status = 400
        return { error: 'Text is required and should be at least 20 characters' }
      }

      // Attempt to resolve a preview author from the current auth session (optional)
      const supabase = await createClient()
      let authorName = 'Preview Author'
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (!authError && user) {
          authorName = (user.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name || (user.user_metadata as { full_name?: string; name?: string } | undefined)?.name || user.email || 'Preview Author'
        }
      } catch (err) {
        // Ignore auth resolution errors for preview; keep default authorName
        console.warn('Preview author resolution failed', err)
      }

      const analysis = analyzeText(text)
      const queries = generateImageSearchQueries(analysis)

      let images = await searchImagesForQueries(queries)
      if (!images || images.length === 0) {
        images = getFallbackImages()
      }

      const article = {
        title: title && title.trim().length > 0 ? title : (analysis.sentences[0] || 'Untitled Article').slice(0, 120),
        content: text,
        images: (images || []).map((img: UnsplashImage, index: number, arr: UnsplashImage[]) => ({
          url: img.urls?.regular || (img as unknown as { url?: string }).url || '',
          alt: img.alt_description || img.description || 'Article illustration',
          position: Math.floor(index * ((text.split('\n\n') || []).length / (arr.length || 1))) + 1,
          unsplash_id: img.id || null
        })),
        // Structured preview header replacing the static preview text
        header: {
          author: authorName,
          published_at: new Date().toISOString(),
          reads: 0
        }
      }

      return { article }
    } catch (error) {
      console.error('Article generate error:', error)
      set.status = 500
      return { error: 'Failed to generate article' }
    }
  }, {
    body: t.Object({ text: t.String(), title: t.Optional(t.String()) }),
    tags: ['articles']
  })

  .get('/feed', async ({ query, set }) => {
    try {
      const page = typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page || 1)
      const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit || 10)

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 50) {
        set.status = 400
        return { error: 'Invalid pagination parameters' }
      }

      const offset = (page - 1) * limit
      const supabase = await createClient()

      // Get articles with author information
      const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, body, image_links, created_at, created_by, views')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Feed fetch error:', error)
        set.status = 500
        return { error: 'Failed to fetch articles' }
      }

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.warn('Count fetch error:', countError)
      }

      // If articles were fetched, try to resolve author display names from `profiles`
      let articlesWithAuthor: unknown[] = (articles || [])
      const profileMap: Record<string, { id: string; user_name?: string } | undefined> = {}

      try {
        const userIds = Array.from(new Set((articlesWithAuthor || []).map((a: unknown) => (a as { created_by?: string }).created_by).filter(Boolean)))
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, user_name')
            .in('id', userIds)

            ; (profiles || []).forEach((p: unknown) => { const pr = p as { id: string; user_name?: string }; profileMap[pr.id] = pr })
        }
      } catch (err) {
        console.warn('Failed to resolve author names for articles feed', err)
      }

      // Normalize articles to include `author` object and `views`
      articlesWithAuthor = (articlesWithAuthor || []).map((a) => {
        const row = a as { id: string; title: string; body: string; image_links?: ImageLink[]; created_at: string; created_by?: string; views?: number }
        const createdBy = row.created_by
        return {
          id: row.id,
          title: row.title,
          body: row.body,
          image_links: row.image_links,
          created_at: row.created_at,
          views: row.views ?? 0,
          author: {
            user_name: createdBy ? profileMap?.[createdBy]?.user_name || null : null
          }
        }
      })

      set.status = 200
      return {
        articles: articlesWithAuthor,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: (count || 0) > offset + limit
        }
      }
    } catch (error) {
      console.error('Feed error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String())
    }),
    tags: ['articles'],
    detail: {
      summary: 'Get article feed',
      description: 'Retrieve paginated list of all articles'
    }
  })

  .get('/:id', async ({ params, set }) => {
    try {
      const { id } = params

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(id)) {
        set.status = 400
        return { error: 'Invalid article ID format' }
      }

      const supabase = await createClient()

      const { data: article, error } = await supabase
        .from('articles')
        .select('id, title, body, image_links, created_at, created_by, updated_at, views')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          set.status = 404
          return { error: 'Article not found' }
        }
        console.error('Article fetch error:', error)
        set.status = 500
        return { error: 'Failed to fetch article' }
      }

      article.views = (article.views || 0) + 1
      await supabase.from('articles').update({ views: article.views }).eq('id', id)

      // Resolve author display name for this article
      let authorName: string | null = null
      try {
        const { data: profile } = await supabase.from('profiles').select('user_name').eq('id', article.created_by).single()
        authorName = (profile as { user_name?: string } | null)?.user_name || null
      } catch (err) {
        authorName = null
        console.warn('Failed to resolve profile for article id', id, err)
      }

      return {
        article: {
          ...article,
          views: article.views ?? 0,
          author: { user_name: authorName },
          word_count: article.body ? article.body.split(/\s+/).length : 0,
          reading_time: article.body ? Math.ceil(article.body.split(/\s+/).length / 200) : 0
        }
      }
    } catch (error) {
      console.error('Get article error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' })
    }),
    tags: ['articles'],
    detail: {
      summary: 'Get article by ID',
      description: 'Retrieve a single article with author information and reading metrics'
    }
  })

  .put('/:id', async ({ params, body, set }) => {
    try {
      const { id } = params
      const { title, body: articleBody, image_links } = body

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(id)) {
        set.status = 400
        return { error: 'Invalid article ID format' }
      }

      const supabase = await createClient()

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        set.status = 401
        return { error: 'Authentication required' }
      }

      // Check if article exists and user owns it
      const { data: existingArticle, error: fetchError } = await supabase
        .from('articles')
        .select('created_by, title, body, image_links')
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          set.status = 404
          return { error: 'Article not found' }
        }
        set.status = 500
        return { error: 'Failed to fetch article' }
      }

      if (existingArticle.created_by !== user.id) {
        set.status = 403
        return { error: 'Not authorized to update this article' }
      }

      // Check if there are actual changes
      const hasChanges = existingArticle.title !== title ||
        existingArticle.body !== articleBody ||
        JSON.stringify(existingArticle.image_links) !== JSON.stringify(image_links)

      if (!hasChanges) {
        set.status = 200
        return { message: 'No changes detected', article: existingArticle }
      }

      // Update article with updated_at timestamp
      const { data: article, error: updateError } = await supabase
        .from('articles')
        .update({
          title,
          body: articleBody,
          image_links,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, title, body, image_links, created_by, created_at, updated_at, views')
        .single()

      if (updateError) {
        console.error('Article update error:', updateError)
        set.status = 400
        return { error: 'Failed to update article: ' + updateError.message }
      }

      // Resolve author display name
      let authorName: string | null = null
      try {
        const { data: profile } = await supabase.from('profiles').select('user_name').eq('id', article.created_by).single()
        authorName = (profile as { user_name?: string } | null)?.user_name || null
      } catch (err) {
        authorName = null
        console.warn('Failed to resolve profile after update for article id', id, err)
      }

      return {
        message: 'Article updated successfully',
        article: {
          ...article,
          views: article.views ?? 0,
          author: { user_name: authorName },
          word_count: article.body ? article.body.split(/\s+/).length : 0,
          reading_time: article.body ? Math.ceil(article.body.split(/\s+/).length / 200) : 0
        }
      }
    } catch (error) {
      console.error('Update article error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' })
    }),
    body: t.Object({
      title: t.String({ minLength: 1, maxLength: 255 }),
      body: t.String({ minLength: 1, maxLength: 50000 }),
      image_links: t.Array(t.Object({
        url: t.String({ format: 'uri' }),
        alt: t.String({ maxLength: 255 }),
        position: t.Number({ minimum: 0 }),
        unsplash_id: t.Optional(t.String())
      }), { maxItems: 20 })
    }),
    tags: ['articles'],
    detail: {
      summary: 'Update article',
      description: 'Update an existing article (requires ownership)'
    }
  })

  .delete('/:id', async ({ params, set }) => {
    try {
      const { id } = params

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(id)) {
        set.status = 400
        return { error: 'Invalid article ID format' }
      }

      const supabase = await createClient()

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        set.status = 401
        return { error: 'Authentication required' }
      }

      // Check if article exists and user owns it
      const { data: existingArticle, error: fetchError } = await supabase
        .from('articles')
        .select('created_by, title')
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          set.status = 404
          return { error: 'Article not found' }
        }
        set.status = 500
        return { error: 'Failed to fetch article' }
      }

      if (existingArticle.created_by !== user.id) {
        set.status = 403
        return { error: 'Not authorized to delete this article' }
      }

      // Soft delete or hard delete based on business logic
      // For now, implementing hard delete
      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Article delete error:', deleteError)
        set.status = 400
        return { error: 'Failed to delete article: ' + deleteError.message }
      }

      return {
        message: 'Article deleted successfully',
        deleted_article: {
          id,
          title: existingArticle.title
        }
      }
    } catch (error) {
      console.error('Delete article error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    params: t.Object({
      id: t.String({ pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' })
    }),
    tags: ['articles'],
    detail: {
      summary: 'Delete article',
      description: 'Delete an article (requires ownership)'
    }
  })