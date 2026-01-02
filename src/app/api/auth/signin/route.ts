import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Signin request received')
    const body = await request.json()
    console.log('Request body:', { email: body.email, password: '***' })
    
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('Creating Supabase client...')
    const supabase = await createClient()

    console.log('Attempting to sign in...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    console.log('Signin result:', { data: !!data, error })

    if (error) {
      console.log('Signin error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.user) {
      console.log('No user returned from signin')
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    console.log('User signed in, fetching profile...')
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('user_name, email')
      .eq('id', data.user.id)
      .single()

    console.log('Profile fetch result:', { profile, profileError })

    if (profileError) {
      console.warn('Profile fetch error:', profileError)
    }

    console.log('Signin successful!')
    return NextResponse.json({
      message: 'Signed in successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        user_name: profile?.user_name || null
      }
    })
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}