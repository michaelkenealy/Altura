import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse, hasRole } from '@/lib/api/helpers'

// GET /api/funds/[id] — fund detail with holdings summary
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx

  const { data: fund, error } = await supabase
    .from('funds')
    .select(`
      *,
      created_by_profile:user_profiles!funds_created_by_fkey(full_name, email)
    `)
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (error || !fund) return errorResponse('Fund not found', 404)

  // Get AUM breakdown by asset type
  const { data: aumBreakdown } = await supabase.rpc('fund_aum_by_asset_type', { p_fund_id: params.id })

  return NextResponse.json({ fund, aum_breakdown: aumBreakdown ?? [] })
}

// PATCH /api/funds/[id] — update fund
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, user, profile } = ctx

  if (!hasRole(profile, 'master', 'portfolio-manager')) {
    return errorResponse('Forbidden: insufficient permissions', 403)
  }

  // Verify fund belongs to org
  const { data: existing } = await supabase
    .from('funds')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (!existing) return errorResponse('Fund not found', 404)

  const body = await req.json()

  // Disallow changing org_id or code via PATCH
  const { org_id: _org, code: _code, created_by: _cb, id: _id, ...updates } = body

  const { data: fund, error } = await supabase
    .from('funds')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return errorResponse('Failed to update fund', 500, error.message)

  await supabase.from('audit_logs').insert({
    org_id: profile.org_id,
    user_id: user.id,
    action: 'UPDATE',
    entity_type: 'fund',
    entity_id: params.id,
    old_data: existing,
    new_data: fund,
  })

  return NextResponse.json({ fund })
}

// DELETE /api/funds/[id] — soft-close a fund (Master only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, user, profile } = ctx

  if (!hasRole(profile, 'master')) {
    return errorResponse('Forbidden: Master role required', 403)
  }

  const { data: existing } = await supabase
    .from('funds')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (!existing) return errorResponse('Fund not found', 404)

  // Soft close — set status to 'closed'
  const { error } = await supabase
    .from('funds')
    .update({ status: 'closed' })
    .eq('id', params.id)

  if (error) return errorResponse('Failed to close fund', 500, error.message)

  await supabase.from('audit_logs').insert({
    org_id: profile.org_id,
    user_id: user.id,
    action: 'DELETE',
    entity_type: 'fund',
    entity_id: params.id,
    old_data: existing,
    new_data: { status: 'closed' },
  })

  return NextResponse.json({ message: 'Fund closed successfully' })
}
