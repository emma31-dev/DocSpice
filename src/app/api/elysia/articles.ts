import { Elysia, t } from 'elysia'
import { createClient } from '@/lib/supabase/server'

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

      return {
        message: 'Article published successfully',
        article: {
          id: article.id,
          title: article.title,
          created_at: article.created_at
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
      body: t.String({ minLength: 1 }),
      image_links: t.Array(t.Object({
        url: t.String(),
        alt: t.String(),
        position: t.Number(),
        unsplash_id: t.Optional(t.String())
      }))
    }),
    tags: ['articles']
  })

  .get('/feed', async ({ query, set }) => {
    try {
      const { page = 1, limit = 10 } = query
      const offset = (page - 1) * limit
      const supabase = await createClient()

      // Get articles with author information
      const { data: articles, error } = await supabase
        .from('articles_with_author')
        .select('id, title, body, image_links, created_at, author_name, author_email')
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

      return {
        articles: articles || [],
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
      page: t.Optional(t.Numeric({ minimum: 1 })),
      limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 }))
    }),
    tags: ['articles']
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
        .from('articles_with_author')
        .select('*')
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

      // Add view tracking (optional enhancement)
      try {
        await supabase.rpc('increment_article_views', { article_id: id })
      } catch (err: unknown) {
        console.warn('Failed to increment view count:', err)
      }

      return { 
        article: {
          ...article,
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
        .select()
        .single()

      if (updateError) {
        console.error('Article update error:', updateError)
        set.status = 400
        return { error: 'Failed to update article: ' + updateError.message }
      }

      return {
        message: 'Article updated successfully',
        article: {
          ...article,
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

  .get('/user/:userId', async ({ params, query, set }) => {
    try {
      const { userId } = params
      const { page = 1, limit = 10 } = query
      const offset = (page - 1) * limit
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(userId)) {
        set.status = 400
        return { error: 'Invalid user ID format' }
      }

      const supabase = await createClient()

      // Get articles by specific user
      const { data: articles, error } = await supabase
        .from('articles_with_author')
        .select('id, title, body, image_links, created_at, updated_at, author_name')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('User articles fetch error:', error)
        set.status = 500
        return { error: 'Failed to fetch user articles' }
      }

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)

      if (countError) {
        console.warn('Count fetch error:', countError)
      }

      return {
        articles: articles?.map(article => ({
          ...article,
          word_count: article.body ? article.body.split(/\s+/).length : 0,
          reading_time: article.body ? Math.ceil(article.body.split(/\s+/).length / 200) : 0
        })) || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: (count || 0) > offset + limit
        }
      }
    } catch (error) {
      console.error('User articles error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    params: t.Object({
      userId: t.String({ pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' })
    }),
    query: t.Object({
      page: t.Optional(t.Numeric({ minimum: 1 })),
      limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 }))
    }),
    tags: ['articles'],
    detail: {
      summary: 'Get articles by user',
      description: 'Retrieve all articles created by a specific user'
    }
  })