import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { hasAdminPermission, normalizeRole, normalizeStatus } from '@/utils/adminPermissions'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId: targetUserId } = await context.params
  const payload = await request.json().catch(() => null)
  const nextStatus = normalizeStatus(payload?.status)
  const nextRole = normalizeRole(payload?.role)

  if (!nextStatus && !nextRole) {
    return NextResponse.json({ error: 'No valid update fields provided.' }, { status: 400 })
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, role, status, is_owner')
    .eq('id', targetUserId)
    .maybeSingle()

  if (!targetProfile) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  if (targetProfile.is_owner && (nextStatus || nextRole)) {
    return NextResponse.json({ error: 'Owner account cannot be modified here.' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if (nextStatus && nextStatus !== targetProfile.status) {
    const canUpdateStatus = await hasAdminPermission(
      supabase,
      'users.status.update',
      targetUserId
    )
    if (!canUpdateStatus) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    updates.status = nextStatus
  }

  if (nextRole && nextRole !== targetProfile.role) {
    const canUpdateRole = await hasAdminPermission(
      supabase,
      'users.role.update',
      targetUserId
    )
    if (!canUpdateRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    updates.role = nextRole
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, user: targetProfile })
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', targetUserId)
    .select('id, email, role, status, is_owner, updated_at')
    .single()

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 })
  }

  if (updates.status) {
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action_type: 'admin_user_status_updated',
      details: {
        target_user_id: targetUserId,
        previous_status: targetProfile.status,
        next_status: updates.status,
      },
    })
  }

  if (updates.role) {
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action_type: 'admin_user_role_updated',
      details: {
        target_user_id: targetUserId,
        previous_role: targetProfile.role,
        next_role: updates.role,
      },
    })
  }

  return NextResponse.json({ ok: true, user: updatedProfile })
}
