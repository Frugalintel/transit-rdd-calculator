import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { hasAdminPermission } from '@/utils/adminPermissions'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const canViewUsers = await hasAdminPermission(supabase, 'users.view')
  if (!canViewUsers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, role, status, is_owner, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to load users.' }, { status: 500 })
  }

  const [canUpdateStatus, canUpdateRole, canManagePermissions, canOverrideTemplates] = await Promise.all([
    hasAdminPermission(supabase, 'users.status.update'),
    hasAdminPermission(supabase, 'users.role.update'),
    hasAdminPermission(supabase, 'users.permissions.update'),
    hasAdminPermission(supabase, 'templates.override'),
  ])

  return NextResponse.json({
    users: users || [],
    actorPermissions: {
      canUpdateStatus,
      canUpdateRole,
      canManagePermissions,
      canOverrideTemplates,
    },
  })
}
