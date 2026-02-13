#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const CANONICAL_REGIONS = [
  { name: 'Region 1', slug: 'region1' },
  { name: 'Region 2', slug: 'region2' },
  { name: 'Region 3', slug: 'region3' },
  { name: 'Region 4', slug: 'region4' },
  { name: 'Region 5', slug: 'region5' },
]

const REGION_SEATS = CANONICAL_REGIONS.flatMap((region) => [
  {
    regionSlug: region.slug,
    seatLabel: 'User 1',
    column: 'user_1_id',
    email: `${region.slug}.user1@regions.local`,
  },
  {
    regionSlug: region.slug,
    seatLabel: 'User 2',
    column: 'user_2_id',
    email: `${region.slug}.user2@regions.local`,
  },
])

function parseEnvLines(text) {
  const env = {}
  for (const line of text.split('\n')) {
    const idx = line.indexOf('=')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

function resolveLocalSupabaseEnv() {
  try {
    const output = execSync('supabase status -o env', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return parseEnvLines(output)
  } catch {
    return {}
  }
}

function generatePassword() {
  return `Seat-${randomBytes(6).toString('hex')}-${randomBytes(3).toString('base64url')}`
}

async function listAllUsers(adminClient) {
  const allUsers = []
  let page = 1
  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const users = data?.users || []
    allUsers.push(...users)
    if (users.length < 200) break
    page += 1
  }
  return allUsers
}

function lowerEmail(value) {
  return String(value || '').trim().toLowerCase()
}

async function ensureCanonicalRegions(adminClient) {
  const { error: upsertError } = await adminClient
    .from('regions')
    .upsert(CANONICAL_REGIONS, { onConflict: 'slug' })

  if (upsertError) throw upsertError

  const { data: regions, error } = await adminClient
    .from('regions')
    .select('id, slug')
    .in('slug', CANONICAL_REGIONS.map((row) => row.slug))

  if (error) throw error
  return new Map((regions || []).map((r) => [r.slug, r.id]))
}

async function main() {
  const localEnv = resolveLocalSupabaseEnv()
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    localEnv.API_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    localEnv.SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or run with local Supabase running.'
    )
  }

  const resetPasswords = String(process.env.REGION_SEAT_RESET_PASSWORD || 'false').toLowerCase() === 'true'

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const regionIdBySlug = await ensureCanonicalRegions(admin)
  const users = await listAllUsers(admin)
  const userByEmail = new Map(users.map((u) => [lowerEmail(u.email), u]))
  const credentialOutput = []

  for (const seat of REGION_SEATS) {
    const seatEmail = lowerEmail(seat.email)
    let user = userByEmail.get(seatEmail) || null
    let seatPassword = null
    let credentialAction = null

    if (!user) {
      seatPassword = generatePassword()
      const { data, error } = await admin.auth.admin.createUser({
        email: seatEmail,
        password: seatPassword,
        email_confirm: true,
        user_metadata: {
          managed_region_seat: true,
          region_slug: seat.regionSlug,
          seat: seat.seatLabel,
        },
      })
      if (error) throw error
      user = data?.user || null
      if (!user) throw new Error(`Failed creating seat account ${seatEmail}`)
      userByEmail.set(seatEmail, user)
      credentialAction = 'created'
    } else if (resetPasswords) {
      seatPassword = generatePassword()
      const { error } = await admin.auth.admin.updateUserById(user.id, {
        password: seatPassword,
        email_confirm: true,
      })
      if (error) throw error
      credentialAction = 'password_reset'
    }

    const { error: profileError } = await admin.from('profiles').upsert({
      id: user.id,
      email: seatEmail,
      role: 'user',
      status: 'active',
      is_owner: false,
    })
    if (profileError) throw profileError

    const regionId = regionIdBySlug.get(seat.regionSlug)
    if (!regionId) throw new Error(`Region ${seat.regionSlug} not found`)

    const { error: assignError } = await admin
      .from('regions')
      .update({ [seat.column]: user.id })
      .eq('id', regionId)
    if (assignError) throw assignError

    if (credentialAction && seatPassword) {
      credentialOutput.push({
        action: credentialAction,
        region: seat.regionSlug,
        seat: seat.seatLabel,
        email: seatEmail,
        password: seatPassword,
      })
    }
  }

  console.log('Region seat provisioning complete.')
  console.log(`Configured ${REGION_SEATS.length} managed seat accounts.`)
  if (credentialOutput.length === 0) {
    console.log('No new credentials were generated (accounts already existed).')
    return
  }

  console.log('\nStore these credentials securely:')
  for (const row of credentialOutput) {
    console.log(
      `${row.action.toUpperCase()} | ${row.region} ${row.seat} | ${row.email} | ${row.password}`
    )
  }
}

main().catch((error) => {
  const message = error && error.message ? error.message : String(error)
  console.error(`Provisioning failed: ${message}`)
  process.exit(1)
})
