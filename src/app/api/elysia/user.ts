import { Elysia, t } from "elysia";
import { createClient } from "@/lib/supabase/server";

export const userRoutes = new Elysia({ prefix: "/user" })
  // Get user profile with their articles
  .get('/profile/:userId', async ({ params, query, set }) => {
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

      // Get user profile info (prefer `user_name` which other routes use)
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('id, user_name, avatar_url, created_at')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('User profile fetch error:', userError)
        set.status = 404
        return { error: 'User not found' }
      }

      // Get articles by specific user (select created_by and resolve profile locally)
      const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, body, image_links, created_at, updated_at, created_by, views')
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

      // Strongly-type the profile and article rows to satisfy lint rules
      type ProfileRow = { id: string; user_name?: string; avatar_url?: string; created_at?: string }
      type ArticleRow = { id: string; title: string; body?: string; image_links?: unknown; created_at?: string; views?: number }

      const profile = userProfile as ProfileRow

      // Map articles to include author display name
      const mapped = (articles || []).map((a: ArticleRow) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        image_links: a.image_links as unknown,
        created_at: a.created_at,
        views: a.views ?? 0,
        author: {
          user_name: profile?.user_name || profile.id
        },
        word_count: a.body ? a.body.split(/\s+/).length : 0,
        reading_time: a.body ? Math.ceil(a.body.split(/\s+/).length / 200) : 0
      }))

      return {
        user: userProfile,
        articles: mapped,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: (count || 0) > offset + limit
        }
      }
    } catch (error) {
      console.error('User profile error:', error)
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
    tags: ['users'],
    detail: {
      summary: 'Get user profile',
      description: 'Retrieve user profile information and their articles'
    }
  })
  // Search users for searchbar
  .get('/search', async ({ query, set }) => {
    try {
      const { q, limit = 10 } = query

      if (!q || q.trim().length < 2) {
        set.status = 400
        return { error: 'Search query must be at least 2 characters' }
      }

      const supabase = await createClient()

      // Search users by name
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${q.trim()}%`)
        .limit(limit)

      if (error) {
        console.error('User search error:', error)
        set.status = 500
        return { error: 'Failed to search users' }
      }

      return {
        users: users || [],
        query: q.trim()
      }
    } catch (error) {
      console.error('User search error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    query: t.Object({
      q: t.String({ minLength: 2, maxLength: 100 }),
      limit: t.Optional(t.Numeric({ minimum: 1, maximum: 20 }))
    }),
    tags: ['users'],
    detail: {
      summary: 'Search users',
      description: 'Search for users by name for searchbar functionality'
    }
  })