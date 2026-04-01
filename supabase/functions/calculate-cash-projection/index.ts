import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DailyProjection {
  date: string
  opening_balance: number
  inflows: number
  outflows: number
  closing_balance: number
  components: {
    pending_settlements: number
    expected_dividends: number
    pending_investments: number
    pending_redemptions: number
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

    const url = new URL(req.url)
    const fundId = url.searchParams.get('fund_id')
    const days = Math.min(parseInt(url.searchParams.get('days') ?? '30'), 365)

    if (!fundId) {
      return new Response(JSON.stringify({ error: 'fund_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify fund access
    const { data: fund } = await supabase
      .from('funds')
      .select('id, name, currency')
      .eq('id', fundId)
      .single()

    if (!fund) {
      return new Response(JSON.stringify({ error: 'Fund not found or access denied' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get current cash position from holdings (cash asset type)
    const { data: cashHoldings } = await supabase
      .from('holdings')
      .select('market_value_nzd, quantity, securities(ticker, asset_types(slug))')
      .eq('fund_id', fundId)

    const currentCash = cashHoldings
      ?.filter((h: any) => h.securities?.asset_types?.slug === 'cash')
      ?.reduce((sum: number, h: any) => sum + (h.market_value_nzd ?? 0), 0) ?? 0

    // Get pending settlements (cash flows from pending trades)
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + days)

    const { data: pendingSettlements } = await supabase
      .from('settlements')
      .select('expected_date, amount, currency, trades(trade_type)')
      .eq('fund_id', fundId)
      .eq('status', 'pending')
      .gte('expected_date', today.toISOString().split('T')[0])
      .lte('expected_date', endDate.toISOString().split('T')[0])

    // Get pending cash movements (investments/redemptions/dividends)
    const { data: pendingMovements } = await supabase
      .from('cash_movements')
      .select('effective_date, amount, movement_type, currency')
      .eq('fund_id', fundId)
      .eq('status', 'pending')
      .gte('effective_date', today.toISOString().split('T')[0])
      .lte('effective_date', endDate.toISOString().split('T')[0])

    // Build daily projection map
    const projectionMap = new Map<string, {
      settlements: number
      dividends: number
      investments: number
      redemptions: number
    }>()

    for (let d = 0; d < days; d++) {
      const date = new Date(today)
      date.setDate(today.getDate() + d)
      const dateStr = date.toISOString().split('T')[0]
      projectionMap.set(dateStr, {
        settlements: 0,
        dividends: 0,
        investments: 0,
        redemptions: 0,
      })
    }

    // Map settlement cash flows
    for (const s of pendingSettlements ?? []) {
      const dateStr = s.expected_date as string
      if (!projectionMap.has(dateStr)) continue
      const day = projectionMap.get(dateStr)!
      // Buy = cash out, Sell = cash in
      const tradeType = (s as any).trades?.trade_type
      const amount = s.amount as number
      day.settlements += tradeType === 'sell' ? amount : -amount
    }

    // Map cash movements
    for (const m of pendingMovements ?? []) {
      const dateStr = m.effective_date as string
      if (!projectionMap.has(dateStr)) continue
      const day = projectionMap.get(dateStr)!
      const amount = m.amount as number
      const type = m.movement_type as string

      if (type === 'investment') day.investments += amount
      else if (type === 'redemption') day.redemptions -= amount
      else if (type === 'dividend' || type === 'interest') day.dividends += amount
    }

    // Build projection array
    const projections: DailyProjection[] = []
    let runningBalance = currentCash

    for (let d = 0; d < days; d++) {
      const date = new Date(today)
      date.setDate(today.getDate() + d)
      const dateStr = date.toISOString().split('T')[0]

      const dayData = projectionMap.get(dateStr) ?? { settlements: 0, dividends: 0, investments: 0, redemptions: 0 }
      const inflows = Math.max(0, dayData.settlements) + dayData.dividends + dayData.investments
      const outflows = Math.abs(Math.min(0, dayData.settlements)) + Math.abs(dayData.redemptions)

      projections.push({
        date: dateStr,
        opening_balance: runningBalance,
        inflows,
        outflows,
        closing_balance: runningBalance + inflows - outflows,
        components: {
          pending_settlements: dayData.settlements,
          expected_dividends: dayData.dividends,
          pending_investments: dayData.investments,
          pending_redemptions: dayData.redemptions,
        },
      })

      runningBalance = runningBalance + inflows - outflows
    }

    return new Response(
      JSON.stringify({
        fund_id: fundId,
        fund_name: fund.name,
        currency: fund.currency,
        current_cash_position: currentCash,
        projection_days: days,
        projections,
        summary: {
          min_cash: Math.min(...projections.map(p => p.closing_balance)),
          max_cash: Math.max(...projections.map(p => p.closing_balance)),
          end_cash: projections[projections.length - 1]?.closing_balance ?? currentCash,
        },
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
