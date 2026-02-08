import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth refresh for non-page requests to avoid slowing down HMR/API
  const pathname = request.nextUrl.pathname
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

  // Refresh session if expired - with real timeout to prevent hanging
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((resolve) => setTimeout(resolve, 3000)) // 3s max
    ])
  } catch {
    // If auth refresh fails/times out, continue without blocking
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Only match page routes - skip static files, images, fonts, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|Fonts|textures|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|woff|woff2)$).*)',
  ],
}
