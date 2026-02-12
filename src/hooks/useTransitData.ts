"use client"

import { useEffect, useState } from 'react'
import { TransitGuideData } from '@/types'

const REQUEST_TIMEOUT_MS = 12000

// Use raw fetch for data queries - more reliable than @supabase/ssr client
async function fetchFromSupabase(table: string, options?: { order?: string }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase client config is missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).')
  }

  let url = `${supabaseUrl}/rest/v1/${table}?select=*`
  if (options?.order) {
    url += `&order=${options.order}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      signal: controller.signal,
    })
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`Timed out fetching ${table} after ${REQUEST_TIMEOUT_MS}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${table}: ${response.status}`)
  }
  
  return response.json()
}

export function useTransitData() {
  const [data, setData] = useState<TransitGuideData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true
    
    async function fetchData(retryCount = 0): Promise<void> {
      if (!mounted) return
      
      try {
        const [weights, distances, times, holidays, peakSeasons] = await Promise.all([
          fetchFromSupabase('transit_weights', { order: 'min_weight' }),
          fetchFromSupabase('transit_distances', { order: 'min_dist' }),
          fetchFromSupabase('transit_times'),
          fetchFromSupabase('federal_holidays'),
          fetchFromSupabase('peak_seasons')
        ])

        if (!mounted) return

        setData({
          weights: weights || [],
          distances: distances || [],
          times: times || [],
          holidays: holidays || [],
          peakSeasons: peakSeasons || []
        })
        setLoading(false)
      } catch (err: any) {
        if (!mounted) return
        
        // Retry on error up to 3 times
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 300 * (retryCount + 1)))
          return fetchData(retryCount + 1)
        }
        
        console.error("[useTransitData] Error fetching transit data after retries:", err)
        setError(err as Error)
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [])

  return { data, loading, error }
}

