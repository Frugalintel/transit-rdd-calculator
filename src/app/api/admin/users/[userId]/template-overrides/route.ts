import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { hasAdminPermission } from '@/utils/adminPermissions'

const VALID_FORMATS = ['simple', 'osnp', 'osp', 'isp', 'isnp', 'dpsr'] as const
type CopyFormat = (typeof VALID_FORMATS)[number]

function normalizeFormat(value: unknown): CopyFormat | null {
  if (typeof value !== 'string') return null
  if (!VALID_FORMATS.includes(value as CopyFormat)) return null
  return value as CopyFormat
}

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
  const canOverrideTemplates = await hasAdminPermission(
    supabase,
    'templates.override',
    targetUserId
  )

  if (!canOverrideTemplates) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('user_template_overrides')
    .select('format_key, template_text, updated_at, updated_by')
    .eq('target_user_id', targetUserId)
    .order('format_key', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to load template overrides.' }, { status: 500 })
  }

  return NextResponse.json({ overrides: data || [] })
}

export async function PUT(
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
  const canOverrideTemplates = await hasAdminPermission(
    supabase,
    'templates.override',
    targetUserId
  )

  if (!canOverrideTemplates) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await request.json().catch(() => null)
  const formatKey = normalizeFormat(payload?.formatKey)
  const templateText = typeof payload?.templateText === 'string' ? payload.templateText.trim() : ''

  if (!formatKey) {
    return NextResponse.json({ error: 'Invalid format key.' }, { status: 400 })
  }
  if (!templateText) {
    return NextResponse.json({ error: 'Template text is required.' }, { status: 400 })
  }

  const { error: upsertError } = await supabase
    .from('user_template_overrides')
    .upsert({
      target_user_id: targetUserId,
      format_key: formatKey,
      template_text: templateText,
      updated_by: user.id,
    })

  if (upsertError) {
    return NextResponse.json({ error: 'Failed to save template override.' }, { status: 500 })
  }

  await supabase.from('usage_logs').insert({
    user_id: user.id,
    action_type: 'admin_template_override_upserted',
    details: {
      target_user_id: targetUserId,
      format_key: formatKey,
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
  const canOverrideTemplates = await hasAdminPermission(
    supabase,
    'templates.override',
    targetUserId
  )

  if (!canOverrideTemplates) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await request.json().catch(() => null)
  const formatKey = normalizeFormat(payload?.formatKey)
  if (!formatKey) {
    return NextResponse.json({ error: 'Invalid format key.' }, { status: 400 })
  }

  const { error: deleteError } = await supabase
    .from('user_template_overrides')
    .delete()
    .eq('target_user_id', targetUserId)
    .eq('format_key', formatKey)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete template override.' }, { status: 500 })
  }

  await supabase.from('usage_logs').insert({
    user_id: user.id,
    action_type: 'admin_template_override_deleted',
    details: {
      target_user_id: targetUserId,
      format_key: formatKey,
    },
  })

  return NextResponse.json({ ok: true })
}
