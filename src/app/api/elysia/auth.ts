import { Elysia, t } from 'elysia'
import { createClient } from '@/lib/supabase/server'
import { request } from 'http';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/signup', async ({ body, set }) => {
    try {
      const { user_name, email, password } = body;
      const supabase = await createClient();

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_name
          }
        }
      })

      if (authError) {
        set.status = 400
        return { error: authError.message }
      }

      if (!authData.user) {
        set.status = 400
        return { error: 'Failed to create user' }
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          user_name,
          email
        })

      if (profileError) {
        set.status = 400
        return { error: 'Failed to create user profile: ' + profileError.message }
      }

      set.status = 200

      return {
        message: 'User created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          user_name
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    body: t.Object({
      user_name: t.String({ minLength: 3, maxLength: 50 }),
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 })
    }),
    tags: ['auth']
  })
  
  .post('/signin', async ({ body, set }) => {
    try {
      const { email, password } = body
      const supabase = await createClient()

      // VALIDATE USER LOGINS
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        set.status = 401
        return { error: `Authentication error: ${error.message}` }
      }

      if (!data.user) {
        set.status = 401
        return { error: 'User not found' }
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('user_name, email')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.warn('Profile fetch error:', profileError)
      }

      return {
        message: 'Signed in successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
          user_name: profile?.user_name || null
        }
      }
    } catch (error) {
      console.error('Signin error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 })
    }),
    tags: ['auth']
  })

  .post('/signout', async ({ set }) => {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        set.status = 400
        return { error: error.message }
      }

      return { message: 'Signed out successfully' }
    } catch (error) {
      console.error('Signout error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    tags: ['auth']
  })

  .get('/user', async ({ set }) => {
    try {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        set.status = 401
        return { error: 'Not authenticated' }
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('user_name, email, created_at')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.warn('Profile fetch error:', profileError)
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          user_name: profile?.user_name || null,
          created_at: profile?.created_at || user.created_at
        }
      }
    } catch (error) {
      console.error('Get user error:', error)
      set.status = 500
      return { error: 'Internal server error' }
    }
  }, {
    tags: ['auth']
  })