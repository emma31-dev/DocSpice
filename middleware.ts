import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh session if expired - with error handling
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Log auth errors for debugging (but don't block the request)
    if (authError) {
      console.warn('Auth error in middleware:', authError.message)
    }

    const pathname = request.nextUrl.pathname

    // Protected routes that require authentication
    const protectedRoutes = ['/home', '/profile']
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    )

    // Auth routes that should redirect authenticated users
    const authRoutes = ['/auth/signin', '/auth/signup']
    const isAuthRoute = authRoutes.some(route => 
      pathname.startsWith(route)
    )

    // Handle protected routes
    if (!user && isProtectedRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth/signin'
      redirectUrl.searchParams.set('redirect', pathname)
      
      // Preserve any existing search params
      if (request.nextUrl.search) {
        redirectUrl.searchParams.set('returnUrl', pathname + request.nextUrl.search)
      }
      
      return NextResponse.redirect(redirectUrl)
    }

    // Handle auth routes - redirect authenticated users to home
    if (user && isAuthRoute) {
      const redirectUrl = request.nextUrl.clone()
      
      // Check if there's a redirect parameter
      const redirectParam = request.nextUrl.searchParams.get('redirect')
      const returnUrlParam = request.nextUrl.searchParams.get('returnUrl')
      
      if (redirectParam) {
        redirectUrl.pathname = redirectParam
        redirectUrl.search = ''
      } else if (returnUrlParam) {
        const [path, search] = returnUrlParam.split('?')
        redirectUrl.pathname = path
        redirectUrl.search = search ? `?${search}` : ''
      } else {
        redirectUrl.pathname = '/home'
        redirectUrl.search = ''
      }
      
      return NextResponse.redirect(redirectUrl)
    }

    // Handle root path - redirect authenticated users to home
    if (user && pathname === '/') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/home'
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse

  } catch (error) {
    // Log middleware errors but don't block the request
    console.error('Middleware error:', error)
    
    // If there's a critical error, still allow the request to proceed
    // but clear any potentially corrupted auth cookies
    const response = NextResponse.next({
      request,
    })
    
    // Clear auth cookies on critical errors
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|manifest)$).*)',
  ],
}
