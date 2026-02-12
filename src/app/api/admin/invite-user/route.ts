import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
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

    if (!isValidEmail(email)) {
        return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
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
        return NextResponse.json({ error: inviteError.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
}
