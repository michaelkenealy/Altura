import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse } from '@/lib/api/helpers'

// GET /api/import/[id] — get import batch status and row details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx
  const { searchParams } = new URL(req.url)
  const includeRows = searchParams.get('include_rows') === 'true'
  const rowStatus = searchParams.get('row_status') // 'error', 'processed', 'pending'

  // Fetch batch (RLS ensures org isolation)
  const { data: batch, error } = await supabase
    .from('import_batches')
    .select(`
      *,
      imported_by_profile:user_profiles!import_batches_imported_by_fkey(full_name, email)
    `)
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (error || !batch) return errorResponse('Import batch not found', 404)

  let rows = null
  if (includeRows) {
    let rowsQuery = supabase
      .from('import_rows')
      .select('*')
      .eq('batch_id', params.id)
      .order('row_number')

    if (rowStatus) rowsQuery = rowsQuery.eq('status', rowStatus)

    const { data: rowData } = await rowsQuery
    rows = rowData
  }

  return NextResponse.json({ batch, rows })
}
