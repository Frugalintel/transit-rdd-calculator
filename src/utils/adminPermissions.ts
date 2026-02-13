import type { SupabaseClient } from '@supabase/supabase-js'

export const ADMIN_PERMISSION_KEYS = [
  'admin.panel.access',
  'users.view',
  'users.create',
  'users.status.update',
  'users.permissions.update',
  'users.role.update',
  'templates.override',
  'data.manage',
  'training.manage',
  'logs.view',
] as const

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[number]

export type AccountStatus = 'invited' | 'active' | 'suspended' | 'disabled'
export type UserRole = 'user' | 'admin'

interface ProfileSummary {
  id: string
  role: string | null
  status?: string | null
  is_owner?: boolean | null
}

const DEFAULT_DELEGATED_ADMIN_PERMISSIONS: AdminPermissionKey[] = [
  'admin.panel.access',
  'users.view',
  'users.create',
  'users.status.update',
  'templates.override',
  'data.manage',
  'training.manage',
  'logs.view',
]

function isValidPermissionKey(permission: string): permission is AdminPermissionKey {
  return (ADMIN_PERMISSION_KEYS as readonly string[]).includes(permission)
}

function hasDefaultDelegatedPermission(permission: AdminPermissionKey): boolean {
  return DEFAULT_DELEGATED_ADMIN_PERMISSIONS.includes(permission)
}

export async function getCurrentUserId(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user.id
}

export async function getProfileSummary(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileSummary | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, role, status, is_owner')
    .eq('id', userId)
    .maybeSingle()

  if (!data) return null
  return data as ProfileSummary
}

export async function hasAdminPermission(
  supabase: SupabaseClient,
  permission: AdminPermissionKey,
  targetUserId?: string | null
): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_permission', {
    permission_key: permission,
    target_user_id: targetUserId ?? null,
  })

  if (!error) {
    return data === true
  }

  // Backward-compatible fallback if the migration has not been applied yet.
  const currentUserId = await getCurrentUserId(supabase)
  if (!currentUserId) return false
  const profile = await getProfileSummary(supabase, currentUserId)
  if (!profile) return false
  if (profile.status && profile.status !== 'active') return false
  if (profile.role !== 'admin') return false
  if (permission === 'users.permissions.update' || permission === 'users.role.update') {
    return false
  }
  return hasDefaultDelegatedPermission(permission)
}

export function normalizeRole(value: unknown): UserRole | null {
  if (value === 'user' || value === 'admin') return value
  return null
}

export function normalizeStatus(value: unknown): AccountStatus | null {
  if (value === 'invited' || value === 'active' || value === 'suspended' || value === 'disabled') {
    return value
  }
  return null
}

export function normalizePermission(value: unknown): AdminPermissionKey | null {
  if (typeof value !== 'string') return null
  if (!isValidPermissionKey(value)) return null
  return value
}
