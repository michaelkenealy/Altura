import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse, hasRole } from '@/lib/api/helpers'

// GET /api/securities — search/list securities
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase } = ctx
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') // search by ticker or name
  const assetTypeSlug = searchParams.get('asset_type')
  const exchange = searchParams.get('exchange')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  let query = supabase
    .from('securities')
    .select(`
      id, ticker, name, exchange, currency, isin, sedol, created_at,
      asset_types(id, name, slug)
    `, { count: 'exact' })
    .order('ticker')
    .range(offset, offset + limit - 1)

  if (q) {
    query = query.or(`ticker.ilike.%${q}%,name.ilike.%${q}%,isin.ilike.%${q}%`)
  }
  if (exchange) query = query.eq('exchange', exchange)

  const { data, error, count } = await query
  if (error) return errorResponse('Failed to fetch securities', 500, error.message)

  // Filter by asset_type in JS (avoiding a join filter issue)
  let filtered = data ?? []
  if (assetTypeSlug) {
    filtered = filtered.filter((s: any) => s.asset_types?.slug === assetTypeSlug)
  }

  return NextResponse.json({ securities: filtered, total: count ?? 0, limit, offset })
}

// POST /api/securities — create a new security
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx

  if (!hasRole(profile, 'master', 'portfolio-manager', 'analyst')) {
    return errorResponse('Forbidden: insufficient permissions', 403)
  }

  const body = await req.json()
  const { ticker, name, asset_type_id, exchange, currency, isin, sedol, metadata } = body

  if (!ticker || !name) return errorResponse('ticker and name are required', 400)
  if (!asset_type_id) return errorResponse('asset_type_id is required', 400)

  // Validate asset type exists
  const { data: assetType } = await supabase
    .from('asset_types')
    .select('id, name')
    .eq('id', asset_type_id)
    .single()

  if (!assetType) return errorResponse('Invalid asset_type_id', 400)

  const normalizedTicker = String(ticker).toUpperCase()

  const { data: security, error } = await supabase
    .from('securities')
    .insert({
      ticker: normalizedTicker,
      name,
      asset_type_id,
      exchange: exchange ?? null,
      currency: currency ?? 'NZD',
      isin: isin ?? null,
      sedol: sedol ?? null,
      metadata: metadata ?? {},
    })
    .select(`
      *, asset_types(name, slug)
    `)
    .single()

  if (error) {
    if (error.code === '23505') {
      return errorResponse(`Security ${normalizedTicker} on ${exchange ?? 'no exchange'} already exists`, 409)
    }
    return errorResponse('Failed to create security', 500, error.message)
  }

  return NextResponse.json({ security }, { status: 201 })
}
