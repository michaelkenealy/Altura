import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse, hasRole } from '@/lib/api/helpers'

// GET /api/funds — list all funds for the authenticated user's org
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('fund_summary_view')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('name')

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return errorResponse('Failed to fetch funds', 500, error.message)

  return NextResponse.json({ funds: data })
}

// POST /api/funds — create a new fund (Master role only)
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, user, profile } = ctx

  if (!hasRole(profile, 'master')) {
    return errorResponse('Forbidden: Master role required', 403)
  }

  const body = await req.json()
  const { name, code, description, currency, inception_date, metadata } = body

  if (!name || !code) return errorResponse('name and code are required', 400)

  const normalizedCode = String(code).toUpperCase()
  if (!/^[A-Z0-9]{1,10}$/.test(normalizedCode)) {
    return errorResponse('Fund code must be 1-10 uppercase alphanumeric characters', 400)
  }

  // Check uniqueness
  const { data: existing } = await supabase
    .from('funds')
    .select('id')
    .eq('org_id', profile.org_id)
    .eq('code', normalizedCode)
    .maybeSingle()

  if (existing) return errorResponse(`Fund code '${normalizedCode}' already exists`, 409)

  const { data: fund, error } = await supabase
    .from('funds')
    .insert({
      org_id: profile.org_id,
      name,
      code: normalizedCode,
      description: description ?? null,
      currency: currency ?? 'NZD',
      inception_date: inception_date ?? null,
      status: 'active',
      metadata: metadata ?? {},
      created_by: user.id,
    })
    .select()
    .single()

  if (error || !fund) return errorResponse('Failed to create fund', 500, error?.message)

  // Default compliance rules
  await supabase.from('compliance_rules').insert([
    {
      org_id: profile.org_id,
      fund_id: fund.id,
      name: `${normalizedCode}: Single Security Concentration Limit`,
      rule_type: 'concentration',
      parameters: { max_weight_pct: 35, scope: 'security' },
      severity: 'breach',
    },
    {
      org_id: profile.org_id,
      fund_id: fund.id,
      name: `${normalizedCode}: Minimum Cash Holding`,
      rule_type: 'asset_class',
      parameters: { asset_type_slug: 'cash', min_weight_pct: 5 },
      severity: 'warning',
    },
  ])

  await supabase.from('audit_logs').insert({
    org_id: profile.org_id,
    user_id: user.id,
    action: 'CREATE',
    entity_type: 'fund',
    entity_id: fund.id,
    new_data: fund,
  })

  return NextResponse.json({ fund }, { status: 201 })
}
