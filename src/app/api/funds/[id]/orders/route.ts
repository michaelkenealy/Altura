import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse, hasRole } from '@/lib/api/helpers'

// GET /api/funds/[id]/orders — list orders for a fund
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  // Verify fund access
  const { data: fund } = await supabase
    .from('funds')
    .select('id')
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (!fund) return errorResponse('Fund not found', 404)

  let query = supabase
    .from('orders')
    .select(`
      *,
      securities(ticker, name, currency, asset_types(name, slug)),
      created_by_profile:user_profiles!orders_created_by_fkey(full_name),
      approved_by_profile:user_profiles!orders_approved_by_fkey(full_name)
    `, { count: 'exact' })
    .eq('fund_id', params.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return errorResponse('Failed to fetch orders', 500, error.message)

  return NextResponse.json({ orders: data ?? [], total: count ?? 0, limit, offset })
}

// POST /api/funds/[id]/orders — create a new order
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, user, profile } = ctx

  if (!hasRole(profile, 'master', 'portfolio-manager')) {
    return errorResponse('Forbidden: insufficient permissions', 403)
  }

  // Verify fund access
  const { data: fund } = await supabase
    .from('funds')
    .select('id, org_id')
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (!fund) return errorResponse('Fund not found', 404)

  const body = await req.json()
  const { security_id, order_type, quantity, limit_price, broker, notes } = body

  if (!security_id || !order_type) {
    return errorResponse('security_id and order_type are required', 400)
  }
  if (!['buy', 'sell'].includes(order_type)) {
    return errorResponse('order_type must be buy or sell', 400)
  }
  if (quantity !== undefined && Number(quantity) <= 0) {
    return errorResponse('quantity must be positive', 400)
  }

  // Verify security exists
  const { data: security } = await supabase
    .from('securities')
    .select('id, ticker')
    .eq('id', security_id)
    .single()

  if (!security) return errorResponse('Security not found', 404)

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      fund_id: params.id,
      security_id,
      order_type,
      quantity: quantity ? Number(quantity) : null,
      limit_price: limit_price ? Number(limit_price) : null,
      status: 'draft',
      broker: broker ?? null,
      notes: notes ?? null,
      created_by: user.id,
    })
    .select(`
      *,
      securities(ticker, name, currency)
    `)
    .single()

  if (error || !order) return errorResponse('Failed to create order', 500, error?.message)

  await supabase.from('audit_logs').insert({
    org_id: profile.org_id,
    user_id: user.id,
    action: 'CREATE',
    entity_type: 'order',
    entity_id: order.id,
    new_data: order,
  })

  return NextResponse.json({ order }, { status: 201 })
}
