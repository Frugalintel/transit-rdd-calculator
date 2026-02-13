import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { getSupabasePublicConfig } from '@/utils/supabase/publicConfig'

const USER_WINDOW_MINUTES = 10
const USER_INVITE_LIMIT = 10
const TARGET_WINDOW_MINUTES = 60
const TARGET_INVITE_LIMIT = 3

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getClientIp(request: Request): string | null {
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
        const first = forwardedFor.split(',')[0]?.trim()
        if (first) return first
    }
    const realIp = request.headers.get('x-real-ip')?.trim()
    return realIp || null
}

export async function POST(request: Request) {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let isAdmin = false
    const { data: isAdminFn, error: isAdminFnError } = await supabase.rpc('is_admin')
    if (!isAdminFnError) {
        isAdmin = isAdminFn === true
    } else {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
        isAdmin = profile?.role === 'admin'
    }

    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payload = await request.json().catch(() => null)
    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : ''
    const clientIp = getClientIp(request)

    const now = Date.now()
    const userWindowStart = new Date(now - USER_WINDOW_MINUTES * 60_000).toISOString()
    const targetWindowStart = new Date(now - TARGET_WINDOW_MINUTES * 60_000).toISOString()

    if (!isValidEmail(email)) {
        await supabase.from('usage_logs').insert({
            user_id: user.id,
            action_type: 'admin_invite_blocked',
            details: {
                reason: 'invalid_email',
                target_email: email || null,
                ip: clientIp,
            },
        })
        return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    // Rate limit by admin user to prevent endpoint abuse.
    const { count: recentInviteCount, error: recentInviteCountError } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action_type', 'admin_invite_sent')
        .eq('user_id', user.id)
        .gte('created_at', userWindowStart)

    if (!recentInviteCountError && (recentInviteCount || 0) >= USER_INVITE_LIMIT) {
        await supabase.from('usage_logs').insert({
            user_id: user.id,
            action_type: 'admin_invite_blocked',
            details: {
                reason: 'rate_limit_user',
                target_email: email,
                ip: clientIp,
                window_minutes: USER_WINDOW_MINUTES,
                limit: USER_INVITE_LIMIT,
            },
        })
        return NextResponse.json(
            { error: 'Invite limit reached. Please wait before sending more invites.' },
            { status: 429 }
        )
    }

    // Rate limit repeated invites to the same target email.
    const { data: recentTargetInvites } = await supabase
        .from('usage_logs')
        .select('details')
        .eq('action_type', 'admin_invite_sent')
        .gte('created_at', targetWindowStart)
        .limit(200)

    const recentTargetCount = (recentTargetInvites || []).filter((row: any) => {
        const details = row?.details && typeof row.details === 'object' ? row.details as Record<string, unknown> : {}
        return String(details.target_email || '').toLowerCase() === email
    }).length

    if (recentTargetCount >= TARGET_INVITE_LIMIT) {
        await supabase.from('usage_logs').insert({
            user_id: user.id,
            action_type: 'admin_invite_blocked',
            details: {
                reason: 'rate_limit_target',
                target_email: email,
                ip: clientIp,
                window_minutes: TARGET_WINDOW_MINUTES,
                limit: TARGET_INVITE_LIMIT,
            },
        })
        return NextResponse.json(
            { error: 'This address has been invited recently. Try again later.' },
            { status: 429 }
        )
    }

    const { url } = getSupabasePublicConfig()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
        return NextResponse.json(
            { error: 'Invite service is not configured on the server.' },
            { status: 500 }
        )
    }

    const admin = createAdminClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })

    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { invited_by: user.id },
        ...(redirectTo ? { redirectTo } : {}),
    })

    if (inviteError) {
        await supabase.from('usage_logs').insert({
            user_id: user.id,
            action_type: 'admin_invite_blocked',
            details: {
                reason: 'invite_failed',
                target_email: email,
                ip: clientIp,
                invite_error_code: inviteError.code || null,
            },
        })
        return NextResponse.json({ error: 'Unable to send invite. Please try again later.' }, { status: 400 })
    }

    await supabase.from('usage_logs').insert({
        user_id: user.id,
        action_type: 'admin_invite_sent',
        details: {
            target_email: email,
            ip: clientIp,
        },
    })

    return NextResponse.json({ ok: true })
}
