import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ComplianceRule {
  id: string
  name: string
  rule_type: string
  parameters: Record<string, any>
  severity: string
  fund_id: string | null
}

interface HoldingWithMeta {
  fund_id: string
  security_id: string
  weight_pct: number
  market_value_nzd: number
  securities: {
    ticker: string
    asset_types: { slug: string; name: string } | null
  }
}

interface CheckResult {
  rule_id: string
  rule_name: string
  fund_id: string
  status: 'pass' | 'warning' | 'breach'
  details: Record<string, any>
}

async function evaluateConcentrationRule(
  rule: ComplianceRule,
  holdings: HoldingWithMeta[],
  fundId: string
): Promise<CheckResult> {
  const params = rule.parameters
  const fundHoldings = holdings.filter(h => h.fund_id === fundId)
  const totalAum = fundHoldings.reduce((sum, h) => sum + h.market_value_nzd, 0)

  if (params.scope === 'security') {
    // No single security > max_weight_pct
    const maxHolding = fundHoldings.reduce(
      (max, h) => h.weight_pct > max.weight ? { weight: h.weight_pct, ticker: h.securities.ticker } : max,
      { weight: 0, ticker: '' }
    )

    const exceeded = maxHolding.weight > params.max_weight_pct
    return {
      rule_id: rule.id,
      rule_name: rule.name,
      fund_id: fundId,
      status: exceeded ? (rule.severity as 'warning' | 'breach') : 'pass',
      details: {
        max_allowed_pct: params.max_weight_pct,
        current_max_pct: maxHolding.weight,
        worst_offender: maxHolding.ticker,
        total_aum_nzd: totalAum,
      },
    }
  }

  if (params.scope === 'foreign_equity') {
    const foreignEquityWeight = fundHoldings
      .filter(h => h.securities?.asset_types?.slug === 'stocks' && h.securities.ticker)
      .reduce((sum, h) => sum + h.weight_pct, 0)

    // Approximate: foreign = AUD-denominated stocks
    const foreignWeight = fundHoldings
      .filter(h => h.securities?.asset_types?.slug === 'stocks')
      .reduce((sum, h) => sum + h.weight_pct, 0) - fundHoldings
      .filter(h => h.securities?.asset_types?.slug === 'stocks')
      .slice(0, 4) // rough NZ equity proxy
      .reduce((sum, h) => sum + h.weight_pct, 0)

    const exceeded = foreignEquityWeight > params.max_weight_pct
    return {
      rule_id: rule.id,
      rule_name: rule.name,
      fund_id: fundId,
      status: exceeded ? (rule.severity as 'warning' | 'breach') : 'pass',
      details: {
        max_allowed_pct: params.max_weight_pct,
        current_pct: foreignEquityWeight,
      },
    }
  }

  return {
    rule_id: rule.id,
    rule_name: rule.name,
    fund_id: fundId,
    status: 'pass',
    details: { message: 'Unknown concentration scope' },
  }
}

async function evaluateAssetClassRule(
  rule: ComplianceRule,
  holdings: HoldingWithMeta[],
  fundId: string
): Promise<CheckResult> {
  const params = rule.parameters
  const fundHoldings = holdings.filter(h => h.fund_id === fundId)

  const assetClassWeight = fundHoldings
    .filter(h => h.securities?.asset_types?.slug === params.asset_type_slug)
    .reduce((sum, h) => sum + h.weight_pct, 0)

  let status: 'pass' | 'warning' | 'breach' = 'pass'
  const details: Record<string, any> = {
    asset_type: params.asset_type_slug,
    current_weight_pct: assetClassWeight,
  }

  if (params.max_weight_pct !== undefined && assetClassWeight > params.max_weight_pct) {
    status = rule.severity as 'warning' | 'breach'
    details.max_allowed_pct = params.max_weight_pct
    details.exceeded_by_pct = assetClassWeight - params.max_weight_pct
  }

  if (params.min_weight_pct !== undefined && assetClassWeight < params.min_weight_pct) {
    status = rule.severity as 'warning' | 'breach'
    details.min_required_pct = params.min_weight_pct
    details.shortfall_pct = params.min_weight_pct - assetClassWeight
  }

  return {
    rule_id: rule.id,
    rule_name: rule.name,
    fund_id: fundId,
    status,
    details,
  }
}

async function evaluateLiquidityRule(
  rule: ComplianceRule,
  holdings: HoldingWithMeta[],
  fundId: string
): Promise<CheckResult> {
  const params = rule.parameters
  const fundHoldings = holdings.filter(h => h.fund_id === fundId)

  const liquidAssets = fundHoldings
    .filter(h => ['cash', 'stocks'].includes(h.securities?.asset_types?.slug ?? ''))
    .reduce((sum, h) => sum + h.weight_pct, 0)

  const exceeded = liquidAssets < (params.min_liquid_pct ?? 10)

  return {
    rule_id: rule.id,
    rule_name: rule.name,
    fund_id: fundId,
    status: exceeded ? (rule.severity as 'warning' | 'breach') : 'pass',
    details: {
      min_required_pct: params.min_liquid_pct,
      current_liquid_pct: liquidAssets,
    },
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('org_id, roles(slug)')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const specificFundId = url.searchParams.get('fund_id')

    // Get funds to check
    const fundsQuery = supabase.from('funds').select('id, name').eq('org_id', profile.org_id).eq('status', 'active')
    if (specificFundId) fundsQuery.eq('id', specificFundId)
    const { data: funds } = await fundsQuery

    if (!funds || funds.length === 0) {
      return new Response(JSON.stringify({ error: 'No active funds found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const fundIds = funds.map((f: any) => f.id)

    // Get active compliance rules for this org
    const { data: rules } = await supabase
      .from('compliance_rules')
      .select('*')
      .eq('org_id', profile.org_id)
      .eq('is_active', true)

    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ message: 'No active compliance rules found', results: [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get holdings for all relevant funds
    const { data: holdings } = await supabase
      .from('holdings')
      .select('fund_id, security_id, weight_pct, market_value_nzd, securities(ticker, asset_types(slug, name))')
      .in('fund_id', fundIds)

    const typedHoldings = (holdings ?? []) as unknown as HoldingWithMeta[]

    // Evaluate each rule for each relevant fund
    const checkResults: CheckResult[] = []

    for (const fund of funds) {
      const fundRules = (rules as ComplianceRule[]).filter(
        r => r.fund_id === null || r.fund_id === fund.id
      )

      for (const rule of fundRules) {
        let result: CheckResult

        if (rule.rule_type === 'concentration') {
          result = await evaluateConcentrationRule(rule, typedHoldings, fund.id)
        } else if (rule.rule_type === 'asset_class') {
          result = await evaluateAssetClassRule(rule, typedHoldings, fund.id)
        } else if (rule.rule_type === 'liquidity') {
          result = await evaluateLiquidityRule(rule, typedHoldings, fund.id)
        } else {
          // Unknown rule type — skip
          continue
        }

        checkResults.push(result)
      }
    }

    // Persist compliance_check records using service role (bypasses RLS restriction on inserts)
    const checksToInsert = checkResults.map(r => ({
      rule_id: r.rule_id,
      fund_id: r.fund_id,
      status: r.status,
      details: r.details,
      checked_at: new Date().toISOString(),
    }))

    if (checksToInsert.length > 0) {
      await supabase.from('compliance_checks').insert(checksToInsert)
    }

    const summary = {
      total_checks: checkResults.length,
      pass: checkResults.filter(r => r.status === 'pass').length,
      warning: checkResults.filter(r => r.status === 'warning').length,
      breach: checkResults.filter(r => r.status === 'breach').length,
    }

    return new Response(
      JSON.stringify({ summary, results: checkResults }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
