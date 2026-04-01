import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse } from '@/lib/api/helpers'

// GET /api/funds/[id]/holdings — get all holdings for a fund
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx
  const { searchParams } = new URL(req.url)
  const asOfDate = searchParams.get('as_of_date')

  // Verify fund belongs to org
  const { data: fund } = await supabase
    .from('funds')
    .select('id')
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (!fund) return errorResponse('Fund not found', 404)

  let query = supabase
    .from('holdings')
    .select(`
      *,
      securities(
        id, ticker, name, currency, exchange, isin,
        asset_types(name, slug)
      )
    `)
    .eq('fund_id', params.id)
    .order('weight_pct', { ascending: false })

  if (asOfDate) {
    query = query.eq('as_of_date', asOfDate)
  }

  const { data, error } = await query
  if (error) return errorResponse('Failed to fetch holdings', 500, error.message)

  const totalAum = data?.reduce((sum, h) => sum + (h.market_value_nzd ?? 0), 0) ?? 0

  return NextResponse.json({
    fund_id: params.id,
    total_aum_nzd: totalAum,
    holdings_count: data?.length ?? 0,
    holdings: data ?? [],
  })
}
