import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { hasAdminPermission } from '@/utils/adminPermissions'

interface RegionPatchPayload {
    id?: unknown
    user_1_id?: unknown
    user_2_id?: unknown
}

const MANAGED_SEAT_EMAIL_PATTERN = /^region\d+\.user[12]@regions\.local$/i

function isManagedSeatEmail(email: unknown): boolean {
    return typeof email === 'string' && MANAGED_SEAT_EMAIL_PATTERN.test(email)
}

export async function GET() {
    const supabase = await createClient()
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManageData = await hasAdminPermission(supabase, 'data.manage')
    if (!canManageData) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch regions with assigned user details
    const { data: regions, error } = await supabase
        .from('regions')
        .select(`
            *,
            user1:profiles!regions_user_1_id_fkey ( id, email ),
            user2:profiles!regions_user_2_id_fkey ( id, email )
        `)
        .order('name', { ascending: true })

    if (error) {
        return NextResponse.json({ error: 'Failed to load regions.' }, { status: 500 })
    }

    return NextResponse.json({ regions: regions || [] })
}

export async function PATCH(request: Request) {
    const supabase = await createClient()
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManageData = await hasAdminPermission(supabase, 'data.manage')
    if (!canManageData) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payload = (await request.json().catch(() => null)) as RegionPatchPayload | null
    if (!payload?.id || typeof payload.id !== 'string') {
        return NextResponse.json({ error: 'Region ID required.' }, { status: 400 })
    }

    const updates: { user_1_id?: string | null; user_2_id?: string | null } = {}
    
    // Explicitly check for undefined to allow setting to null (clearing the user)
    if (payload.user_1_id !== undefined) {
        updates.user_1_id = typeof payload.user_1_id === 'string' ? payload.user_1_id : null
    }
    if (payload.user_2_id !== undefined) {
        updates.user_2_id = typeof payload.user_2_id === 'string' ? payload.user_2_id : null
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ ok: true })
    }

    const seatIds = [updates.user_1_id, updates.user_2_id].filter((value): value is string => Boolean(value))
    if (seatIds.length > 0) {
        const { data: seatProfiles, error: seatError } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', seatIds)

        if (seatError) {
            return NextResponse.json({ error: 'Failed to validate seat accounts.' }, { status: 500 })
        }

        const profileById = new Map((seatProfiles || []).map((profile) => [profile.id, profile.email]))
        for (const seatId of seatIds) {
            const seatEmail = profileById.get(seatId)
            if (!isManagedSeatEmail(seatEmail)) {
                return NextResponse.json(
                    { error: 'Only managed region seat accounts can be assigned.' },
                    { status: 400 }
                )
            }
        }
    }

    const { error: updateError } = await supabase
        .from('regions')
        .update(updates)
        .eq('id', payload.id)

    if (updateError) {
        return NextResponse.json({ error: 'Failed to update region.' }, { status: 500 })
    }

    // Audit log
    await supabase.from('usage_logs').insert({
        user_id: user.id,
        action_type: 'admin_region_updated',
        details: {
            region_id: payload.id,
            updates
        },
    })

    return NextResponse.json({ ok: true })
}
