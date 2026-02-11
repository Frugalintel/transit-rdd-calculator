import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Only run Supabase session refresh on admin routes.
  // Running this on every page request can make login/logout feel hung
  // when auth endpoints are slow.
  const pathname = request.nextUrl.pathname
  if (!pathname.startsWith('/admin')) {
    return supabaseResponse
  }

  // Skip auth refresh for non-page requests.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return supabaseResponse
  }

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

  // Refresh auth session deterministically so cookies are updated
  // before server components (like admin layout) read auth state.
  try {
    await supabase.auth.getUser()
  } catch {
    // If auth refresh fails, continue without blocking request.
    // Downstream server checks can still handle unauthenticated state.
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
