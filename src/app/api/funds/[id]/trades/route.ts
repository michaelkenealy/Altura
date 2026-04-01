import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse } from '@/lib/api/helpers'

// GET /api/funds/[id]/trades — list trades for a fund
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const fromDate = searchParams.get('from_date')
  const toDate = searchParams.get('to_date')
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
    .from('trades')
    .select(`
      *,
      securities(ticker, name, currency, exchange, asset_types(name, slug)),
      orders(order_type, broker, notes)
    `, { count: 'exact' })
    .eq('fund_id', params.id)
    .order('trade_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (fromDate) query = query.gte('trade_date', fromDate)
  if (toDate) query = query.lte('trade_date', toDate)

  const { data, error, count } = await query
  if (error) return errorResponse('Failed to fetch trades', 500, error.message)

  return NextResponse.json({ trades: data ?? [], total: count ?? 0, limit, offset })
}
