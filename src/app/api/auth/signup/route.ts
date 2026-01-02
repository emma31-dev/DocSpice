import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Signup request received')
    const body = await request.json()
    console.log('Request body:', body)
    
    const { user_name, email, password } = body

    // Validate input
    if (!user_name || !email || !password) {
      console.log('Missing required fields:', { user_name: !!user_name, email: !!email, password: !!password })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (user_name.length < 3 || user_name.length > 50) {
      console.log('Invalid username length:', user_name.length)
      return NextResponse.json(
        { error: 'Username must be between 3 and 50 characters' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      console.log('Invalid password length:', password.length)
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    console.log('Creating Supabase client...')
    const supabase = await createClient()
    console.log('Supabase client created')

    // Create user in Supabase Auth
    console.log('Attempting to sign up user...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_name
        }
      }
    })

    console.log('Auth signup result:', { authData: !!authData, authError })

    if (authError) {
      console.log('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      console.log('No user returned from auth')
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      )
    }

    console.log('User created in auth, creating profile...')
    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        user_name,
        email
      })

    console.log('Profile creation result:', { profileError })

    if (profileError) {
      console.log('Profile error:', profileError)
      return NextResponse.json(
        { error: 'Failed to create user profile: ' + profileError.message },
        { status: 400 }
      )
    }

    console.log('Signup successful!')
    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        user_name
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}