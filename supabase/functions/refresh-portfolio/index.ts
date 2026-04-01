import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Only master and operations roles can trigger refresh
    const roleSlug = (profile as any).roles?.slug
    if (!['master', 'operations', 'portfolio-manager'].includes(roleSlug)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const steps: string[] = []
    const errors: string[] = []

    // Step 1: Recalculate holding weights for all active funds
    const { data: funds } = await supabase
      .from('funds')
      .select('id, name')
      .eq('org_id', profile.org_id)
      .eq('status', 'active')

    for (const fund of funds ?? []) {
      // Recalculate total AUM for the fund
      const { data: holdings } = await supabase
        .from('holdings')
        .select('id, market_value_nzd')
        .eq('fund_id', fund.id)

      const totalAum = (holdings ?? []).reduce((sum: number, h: any) => sum + (h.market_value_nzd ?? 0), 0)

      if (totalAum > 0) {
        // Update weight_pct for each holding
        for (const holding of holdings ?? []) {
          const weight = ((holding.market_value_nzd ?? 0) / totalAum) * 100
          await supabase
            .from('holdings')
            .update({ weight_pct: weight })
            .eq('id', holding.id)
        }
        steps.push(`Recalculated weights for fund ${fund.name} (${(holdings ?? []).length} holdings, AUM: ${totalAum.toFixed(2)})`)
      }
    }

    // Step 2: Snapshot current holdings to holdings_history
    const { error: snapshotError } = await supabase.rpc('snapshot_holdings_to_history')
    if (snapshotError) {
      errors.push(`Holdings snapshot failed: ${snapshotError.message}`)
    } else {
      steps.push('Snapshotted holdings to holdings_history')
    }

    // Step 3: Refresh the portfolio_view materialized view
    const { error: refreshError } = await supabase.rpc('refresh_portfolio_view')
    if (refreshError) {
      errors.push(`Materialized view refresh failed: ${refreshError.message}`)
    } else {
      steps.push('Refreshed portfolio_view materialized view')
    }

    // Step 4: Log audit entry
    await supabase.from('audit_logs').insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: 'REFRESH',
      entity_type: 'portfolio',
      entity_id: null,
      new_data: { steps, errors, triggered_at: new Date().toISOString() },
    })

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        steps,
        errors,
        refreshed_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
