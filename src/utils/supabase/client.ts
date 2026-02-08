import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'

let client: SupabaseClient | null = null

export function createClient() {
  // Always create a fresh client for now to avoid singleton state issues
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        }
      }
    )
  }
  
  return client
}

// Reset client - useful when having connection issues
export function resetClient() {
  client = null
}

// Race a promise against a timeout
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
  ])
}

// Helper to get session - returns null if no valid session
export async function getSessionSafe(retries = 1): Promise<{
  session: Awaited<ReturnType<SupabaseClient['auth']['getSession']>>['data']['session']
  error: any
}> {
  const supabase = createClient()
  
  for (let i = 0; i < retries; i++) {
    try {
      const { data: { session }, error } = await withTimeout(
        supabase.auth.getSession(),
        10000 // 10s timeout
      )
      return { session: error ? null : session, error: null }
    } catch (err) {
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 150 * (i + 1)))
      } else {
        return { session: null, error: null }
      }
    }
  }
  
  return { session: null, error: null }
}

export { withTimeout }
