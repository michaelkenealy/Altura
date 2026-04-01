import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse } from '@/lib/api/helpers'

// GET /api/portfolio — get portfolio view (materialized) for the org
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx
  const { searchParams } = new URL(req.url)
  const fundId = searchParams.get('fund_id')
  const assetType = searchParams.get('asset_type')
  const asOfDate = searchParams.get('as_of_date')

  let query = supabase
    .from('portfolio_view')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('fund_name')
    .order('weight_pct', { ascending: false })

  if (fundId) query = query.eq('fund_id', fundId)
  if (assetType) query = query.eq('asset_type_slug', assetType)
  if (asOfDate) query = query.eq('as_of_date', asOfDate)

  const { data, error } = await query
  if (error) return errorResponse('Failed to fetch portfolio view', 500, error.message)

  // Aggregate by asset type across all funds
  const byAssetType = (data ?? []).reduce((acc: Record<string, any>, row) => {
    const slug = row.asset_type_slug
    if (!acc[slug]) {
      acc[slug] = { asset_type: row.asset_type, asset_type_slug: slug, total_nzd: 0, count: 0 }
    }
    acc[slug].total_nzd += row.market_value_nzd ?? 0
    acc[slug].count += 1
    return acc
  }, {})

  const totalAum = Object.values(byAssetType).reduce((sum: number, a: any) => sum + a.total_nzd, 0)

  return NextResponse.json({
    total_aum_nzd: totalAum,
    holdings_count: data?.length ?? 0,
    asset_allocation: Object.values(byAssetType).map((a: any) => ({
      ...a,
      weight_pct: totalAum > 0 ? (a.total_nzd / totalAum) * 100 : 0,
    })),
    positions: data ?? [],
  })
}
