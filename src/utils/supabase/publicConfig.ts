const PROD_SUPABASE_URL = 'https://lwvqkqwtlazaarpxyvon.supabase.co'
const PROD_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3dnFrcXd0bGF6YWFycHh5dm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzM0OTMsImV4cCI6MjA4NjE0OTQ5M30.WYDNPPqRV3GTZH6D6ddc9uPLgSjH3UaKce0UfddIGQo'

function isLocalSupabaseUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)
}

function isLocalDemoKey(key: string): boolean {
  return key.includes('supabase-demo') || key.startsWith('sb_publishable_')
}

export function getSupabasePublicConfig(): { url: string; anonKey: string } {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  let anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

  // Vercel production should never point to local Supabase.
  if (process.env.NODE_ENV === 'production' && (url.length === 0 || isLocalSupabaseUrl(url))) {
    url = PROD_SUPABASE_URL
    if (anonKey.length === 0 || isLocalDemoKey(anonKey)) {
      anonKey = PROD_SUPABASE_ANON_KEY
    }
  }

  if (!url || !anonKey) {
    throw new Error('Supabase public client config is missing.')
  }

  return { url, anonKey }
}
