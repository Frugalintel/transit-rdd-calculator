import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { getSupabasePublicConfig } from '@/utils/supabase/publicConfig'

type PersistPayload = {
  calculationName?: unknown
  successful?: unknown
  input?: {
    weight?: unknown
    distance?: unknown
    loadDate?: unknown
    packDate?: unknown
  }
  result?: {
    error?: unknown
    transitDays?: unknown
    seasonStatus?: unknown
    rdd?: unknown
    loadSpread?: {
      earliest?: unknown
      latest?: unknown
    }
    rddDisplay?: unknown
  }
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asIsoString(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function trimName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const next = value.trim()
  return next.length > 0 ? next.slice(0, 120) : null
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as PersistPayload | null
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  const weight = asFiniteNumber(payload.input?.weight)
  const distance = asFiniteNumber(payload.input?.distance)
  const loadDateIso = asIsoString(payload.input?.loadDate)
  const packDateIso =
    payload.input?.packDate == null ? null : asIsoString(payload.input.packDate)

  if (weight === null || distance === null || !loadDateIso) {
    return NextResponse.json({ error: 'Missing required calculation input.' }, { status: 400 })
  }
  if (payload.input?.packDate != null && packDateIso === null) {
    return NextResponse.json({ error: 'Invalid pack date.' }, { status: 400 })
  }

  const successful = payload.successful === true
  const calculationName = trimName(payload.calculationName)

  const appClient = await createClient()
  const {
    data: { user },
  } = await appClient.auth.getUser()

  const { url } = getSupabasePublicConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Calculation persistence is not configured on the server.' },
      { status: 500 }
    )
  }

  const admin = createAdminClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const usageDetails = {
    authenticated: Boolean(user),
    user_email: user?.email ?? null,
    successful,
    name: calculationName,
    input_data: {
      weight,
      distance,
      loadDate: loadDateIso,
      packDate: packDateIso,
    },
    result_summary: successful
      ? {
          transitDays:
            typeof payload.result?.transitDays === 'number' ? payload.result.transitDays : null,
          seasonStatus:
            typeof payload.result?.seasonStatus === 'string' ? payload.result.seasonStatus : null,
          rdd: asIsoString(payload.result?.rdd),
        }
      : {
          error: typeof payload.result?.error === 'string' ? payload.result.error : 'calculation_error',
        },
  }

  const { error: usageError } = await admin.from('usage_logs').insert({
    user_id: user?.id ?? null,
    action_type: 'calculation',
    details: usageDetails,
  })

  let calculationSaved = false
  let calculationError: string | null = null

  if (successful) {
    const earliestIso = asIsoString(payload.result?.loadSpread?.earliest)
    const latestIso = asIsoString(payload.result?.loadSpread?.latest)
    const rddIso = asIsoString(payload.result?.rdd)

    const { error } = await admin.from('calculations').insert({
      user_id: user?.id ?? null,
      name: calculationName,
      input_data: {
        weight,
        distance,
        loadDate: loadDateIso,
        packDate: packDateIso,
      },
      result_data: {
        transitDays: typeof payload.result?.transitDays === 'number' ? payload.result.transitDays : null,
        rddDisplay: typeof payload.result?.rddDisplay === 'string' ? payload.result.rddDisplay : null,
        rdd: rddIso,
        seasonStatus: typeof payload.result?.seasonStatus === 'string' ? payload.result.seasonStatus : null,
        loadSpread: {
          earliest: earliestIso,
          latest: latestIso,
        },
      },
    })

    if (error) {
      calculationError = error.message
    } else {
      calculationSaved = true
    }
  }

  return NextResponse.json({
    ok: !usageError && (!successful || calculationSaved),
    usageLogged: !usageError,
    calculationSaved,
    usageError: usageError?.message ?? null,
    calculationError,
  })
}
