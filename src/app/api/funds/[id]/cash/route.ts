import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse, hasRole } from '@/lib/api/helpers'

// GET /api/funds/[id]/cash — list cash movements
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx
  const { searchParams } = new URL(req.url)
  const movementType = searchParams.get('movement_type')
  const status = searchParams.get('status')
  const fromDate = searchParams.get('from_date')
  const toDate = searchParams.get('to_date')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  // Verify fund access
  const { data: fund } = await supabase
    .from('funds')
    .select('id, currency')
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (!fund) return errorResponse('Fund not found', 404)

  let query = supabase
    .from('cash_movements')
    .select('*', { count: 'exact' })
    .eq('fund_id', params.id)
    .order('effective_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (movementType) query = query.eq('movement_type', movementType)
  if (status) query = query.eq('status', status)
  if (fromDate) query = query.gte('effective_date', fromDate)
  if (toDate) query = query.lte('effective_date', toDate)

  const { data, error, count } = await query
  if (error) return errorResponse('Failed to fetch cash movements', 500, error.message)

  // Compute totals
  const inflows = (data ?? [])
    .filter(m => ['investment', 'dividend', 'interest'].includes(m.movement_type))
    .reduce((sum, m) => sum + (m.amount ?? 0), 0)

  const outflows = (data ?? [])
    .filter(m => ['redemption', 'fee'].includes(m.movement_type))
    .reduce((sum, m) => sum + Math.abs(m.amount ?? 0), 0)

  return NextResponse.json({
    fund_id: params.id,
    total: count ?? 0,
    limit,
    offset,
    summary: { inflows, outflows, net: inflows - outflows },
    movements: data ?? [],
  })
}

// POST /api/funds/[id]/cash — record a new cash movement
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx

  if (!hasRole(profile, 'master', 'portfolio-manager', 'operations')) {
    return errorResponse('Forbidden: insufficient permissions', 403)
  }

  // Verify fund access
  const { data: fund } = await supabase
    .from('funds')
    .select('id, currency')
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (!fund) return errorResponse('Fund not found', 404)

  const body = await req.json()
  const { movement_type, amount, currency, counterparty, effective_date, description } = body

  const validTypes = ['investment', 'redemption', 'dividend', 'interest', 'fee', 'settlement', 'fx', 'other']
  if (!movement_type || !validTypes.includes(movement_type)) {
    return errorResponse(`movement_type must be one of: ${validTypes.join(', ')}`, 400)
  }
  if (!amount || isNaN(Number(amount))) return errorResponse('amount must be a number', 400)
  if (!effective_date) return errorResponse('effective_date is required', 400)

  const { data: movement, error } = await supabase
    .from('cash_movements')
    .insert({
      fund_id: params.id,
      movement_type,
      amount: Number(amount),
      currency: currency ?? fund.currency ?? 'NZD',
      counterparty: counterparty ?? null,
      effective_date,
      description: description ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error || !movement) return errorResponse('Failed to create cash movement', 500, error?.message)

  return NextResponse.json({ movement }, { status: 201 })
}
