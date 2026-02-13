import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { hasAdminPermission, normalizePermission } from '@/utils/adminPermissions'

export async function GET(
  _request: Request,
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
  const canManagePermissions = await hasAdminPermission(
    supabase,
    'users.permissions.update',
    targetUserId
  )

  if (!canManagePermissions) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: permissions, error } = await supabase
    .from('admin_permissions')
    .select('permission_key, granted_by, granted_at')
    .eq('user_id', targetUserId)
    .order('permission_key', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to load permissions.' }, { status: 500 })
  }

  return NextResponse.json({ permissions: permissions || [] })
}

export async function POST(
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
  const canManagePermissions = await hasAdminPermission(
    supabase,
    'users.permissions.update',
    targetUserId
  )

  if (!canManagePermissions) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await request.json().catch(() => null)
  const permissionKey = normalizePermission(payload?.permissionKey)
  if (!permissionKey) {
    return NextResponse.json({ error: 'Invalid permission key.' }, { status: 400 })
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, role, is_owner')
    .eq('id', targetUserId)
    .maybeSingle()

  if (!targetProfile) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  if (targetProfile.is_owner) {
    return NextResponse.json({ error: 'Owner permissions cannot be edited.' }, { status: 400 })
  }

  if (targetProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Permissions can only be assigned to admin users.' }, { status: 400 })
  }

  const { error: upsertError } = await supabase
    .from('admin_permissions')
    .upsert({
      user_id: targetUserId,
      permission_key: permissionKey,
      granted_by: user.id,
    })

  if (upsertError) {
    return NextResponse.json({ error: 'Failed to grant permission.' }, { status: 500 })
  }

  await supabase.from('usage_logs').insert({
    user_id: user.id,
    action_type: 'admin_permission_granted',
    details: {
      target_user_id: targetUserId,
      permission_key: permissionKey,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
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
  const canManagePermissions = await hasAdminPermission(
    supabase,
    'users.permissions.update',
    targetUserId
  )

  if (!canManagePermissions) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await request.json().catch(() => null)
  const permissionKey = normalizePermission(payload?.permissionKey)
  if (!permissionKey) {
    return NextResponse.json({ error: 'Invalid permission key.' }, { status: 400 })
  }

  const { error: deleteError } = await supabase
    .from('admin_permissions')
    .delete()
    .eq('user_id', targetUserId)
    .eq('permission_key', permissionKey)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to revoke permission.' }, { status: 500 })
  }

  await supabase.from('usage_logs').insert({
    user_id: user.id,
    action_type: 'admin_permission_revoked',
    details: {
      target_user_id: targetUserId,
      permission_key: permissionKey,
    },
  })

  return NextResponse.json({ ok: true })
}
