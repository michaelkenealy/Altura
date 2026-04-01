import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse, hasRole } from '@/lib/api/helpers'

// POST /api/import — upload a CSV file for processing
// Delegates to the Supabase Edge Function for actual processing
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, user, profile } = ctx

  if (!hasRole(profile, 'master', 'portfolio-manager', 'operations')) {
    return errorResponse('Forbidden: insufficient permissions', 403)
  }

  const contentType = req.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return errorResponse('Request must be multipart/form-data', 400)
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const mappingJson = formData.get('mapping') as string | null

  if (!file) return errorResponse('No file provided', 400)
  if (!mappingJson) return errorResponse('Column mapping configuration is required', 400)

  let mapping: any
  try {
    mapping = JSON.parse(mappingJson)
  } catch {
    return errorResponse('Invalid mapping JSON', 400)
  }

  if (!mapping.import_type) return errorResponse('mapping.import_type is required', 400)
  if (!['holdings', 'trades', 'securities'].includes(mapping.import_type)) {
    return errorResponse('import_type must be one of: holdings, trades, securities', 400)
  }

  // For holdings/trades, fund_id is required
  if (['holdings', 'trades'].includes(mapping.import_type) && !mapping.fund_id) {
    return errorResponse('mapping.fund_id is required for holdings and trades imports', 400)
  }

  // If fund_id provided, verify access
  if (mapping.fund_id) {
    const { data: fund } = await supabase
      .from('funds')
      .select('id')
      .eq('id', mapping.fund_id)
      .eq('org_id', profile.org_id)
      .single()

    if (!fund) return errorResponse('Fund not found or access denied', 404)
  }

  // Forward to edge function
  const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-csv-import`

  const edgeFormData = new FormData()
  edgeFormData.append('file', file)
  edgeFormData.append('mapping', JSON.stringify(mapping))

  const authHeader = req.headers.get('Authorization') ?? ''

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: edgeFormData,
  })

  const result = await response.json()

  if (!response.ok) {
    return NextResponse.json(result, { status: response.status })
  }

  return NextResponse.json(result, { status: 200 })
}

// GET /api/import — list recent import batches
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const status = searchParams.get('status')

  let query = supabase
    .from('import_batches')
    .select(`
      *,
      imported_by_profile:user_profiles!import_batches_imported_by_fkey(full_name, email)
    `, { count: 'exact' })
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return errorResponse('Failed to fetch import batches', 500, error.message)

  return NextResponse.json({ batches: data ?? [], total: count ?? 0, limit, offset })
}
