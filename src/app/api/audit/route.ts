import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse, hasRole } from '@/lib/api/helpers'

// GET /api/audit — fetch audit logs with filtering
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx

  // Only master and compliance roles can access audit logs
  if (!hasRole(profile, 'master', 'compliance')) {
    return errorResponse('Forbidden: Master or Compliance role required', 403)
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  const entityType = searchParams.get('entity_type')
  const entityId = searchParams.get('entity_id')
  const action = searchParams.get('action')
  const fromDate = searchParams.get('from_date')
  const toDate = searchParams.get('to_date')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 500)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      user_profiles(full_name, email)
    `, { count: 'exact' })
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (userId) query = query.eq('user_id', userId)
  if (entityType) query = query.eq('entity_type', entityType)
  if (entityId) query = query.eq('entity_id', entityId)
  if (action) query = query.eq('action', action)
  if (fromDate) query = query.gte('created_at', fromDate)
  if (toDate) query = query.lte('created_at', toDate + 'T23:59:59')

  const { data, error, count } = await query
  if (error) return errorResponse('Failed to fetch audit logs', 500, error.message)

  return NextResponse.json({
    logs: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  })
}
