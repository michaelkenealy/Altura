import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse, hasRole } from '@/lib/api/helpers'

// GET /api/users/[id] — get user detail
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, user, profile } = ctx

  // Users can view themselves; Masters can view anyone in the org
  const isSelf = params.id === user.id
  if (!isSelf && !hasRole(profile, 'master')) {
    return errorResponse('Forbidden', 403)
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id, full_name, email, is_active, is_superadmin, persona_config, created_at, updated_at,
      roles(id, name, slug, permissions)
    `)
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (error || !data) return errorResponse('User not found', 404)

  return NextResponse.json({ user: data })
}

// PATCH /api/users/[id] — update user profile or role
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, user, profile } = ctx

  const isSelf = params.id === user.id
  const isMaster = hasRole(profile, 'master')

  if (!isSelf && !isMaster) {
    return errorResponse('Forbidden', 403)
  }

  const body = await req.json()
  const updates: Record<string, any> = {}

  // Self can update: full_name, persona_config
  if (body.full_name !== undefined) updates.full_name = body.full_name
  if (body.persona_config !== undefined) updates.persona_config = body.persona_config

  // Master can also update: role_id, is_active
  if (isMaster) {
    if (body.role_id !== undefined) {
      // Validate role belongs to org
      const { data: role } = await supabase
        .from('roles')
        .select('id')
        .eq('id', body.role_id)
        .eq('org_id', profile.org_id)
        .single()

      if (!role) return errorResponse('Role not found in this organization', 404)
      updates.role_id = body.role_id
    }
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse('No valid fields to update', 400)
  }

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (!existing) return errorResponse('User not found', 404)

  const { data: updated, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', params.id)
    .select(`id, full_name, email, is_active, persona_config, roles(name, slug)`)
    .single()

  if (error) return errorResponse('Failed to update user', 500, error.message)

  await supabase.from('audit_logs').insert({
    org_id: profile.org_id,
    user_id: user.id,
    action: 'UPDATE',
    entity_type: 'user_profile',
    entity_id: params.id,
    old_data: existing,
    new_data: updated,
  })

  return NextResponse.json({ user: updated })
}

// DELETE /api/users/[id] — deactivate user (Master only; cannot delete self)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, user, profile } = ctx

  if (!hasRole(profile, 'master')) {
    return errorResponse('Forbidden: Master role required', 403)
  }

  if (params.id === user.id) {
    return errorResponse('Cannot deactivate your own account', 400)
  }

  const { data: target } = await supabase
    .from('user_profiles')
    .select('id, full_name, email')
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (!target) return errorResponse('User not found', 404)

  // Soft delete — deactivate rather than hard delete
  await supabase
    .from('user_profiles')
    .update({ is_active: false })
    .eq('id', params.id)

  await supabase.from('audit_logs').insert({
    org_id: profile.org_id,
    user_id: user.id,
    action: 'DEACTIVATE',
    entity_type: 'user_profile',
    entity_id: params.id,
    old_data: target,
  })

  return NextResponse.json({ message: `User ${target.email} has been deactivated` })
}
