import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse } from '@/lib/api/helpers'

// GET /api/funds/[id]/compliance — get compliance status for a fund
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx
  const { searchParams } = new URL(req.url)
  const latestOnly = searchParams.get('latest') !== 'false'

  // Verify fund access
  const { data: fund } = await supabase
    .from('funds')
    .select('id, name')
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single()

  if (!fund) return errorResponse('Fund not found', 404)

  // Get applicable rules
  const { data: rules } = await supabase
    .from('compliance_rules')
    .select('*')
    .eq('org_id', profile.org_id)
    .eq('is_active', true)
    .or(`fund_id.is.null,fund_id.eq.${params.id}`)

  const ruleIds = (rules ?? []).map((r: any) => r.id)

  let checksQuery = supabase
    .from('compliance_checks')
    .select(`
      *,
      compliance_rules(name, rule_type, severity)
    `)
    .eq('fund_id', params.id)
    .order('checked_at', { ascending: false })

  if (ruleIds.length > 0) {
    checksQuery = checksQuery.in('rule_id', ruleIds)
  }

  if (latestOnly) {
    // Get only the latest check per rule
    checksQuery = checksQuery.limit(ruleIds.length * 2)
  } else {
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)
    checksQuery = checksQuery.limit(limit)
  }

  const { data: checks, error } = await checksQuery
  if (error) return errorResponse('Failed to fetch compliance checks', 500, error.message)

  // If latestOnly, deduplicate by rule_id
  let resultChecks = checks ?? []
  if (latestOnly) {
    const seen = new Set<string>()
    resultChecks = resultChecks.filter((c: any) => {
      if (seen.has(c.rule_id)) return false
      seen.add(c.rule_id)
      return true
    })
  }

  const summary = {
    total: resultChecks.length,
    pass: resultChecks.filter((c: any) => c.status === 'pass').length,
    warning: resultChecks.filter((c: any) => c.status === 'warning').length,
    breach: resultChecks.filter((c: any) => c.status === 'breach').length,
    last_checked: resultChecks[0]?.checked_at ?? null,
  }

  const overallStatus = summary.breach > 0 ? 'breach' : summary.warning > 0 ? 'warning' : 'pass'

  return NextResponse.json({
    fund_id: params.id,
    fund_name: fund.name,
    overall_status: overallStatus,
    summary,
    checks: resultChecks,
    rules_applied: rules?.length ?? 0,
  })
}
