import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateFundPayload {
  name: string
  code: string
  description?: string
  currency?: string
  inception_date?: string
  metadata?: Record<string, any>
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
      .select('org_id, is_superadmin, roles(slug)')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Only master role or superadmin can create funds
    const roleSlug = (profile as any).roles?.slug
    if (!profile.is_superadmin && roleSlug !== 'master') {
      return new Response(JSON.stringify({ error: 'Only Master role can create funds' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: CreateFundPayload = await req.json()

    // Validate required fields
    if (!body.name || !body.code) {
      return new Response(JSON.stringify({ error: 'name and code are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate fund code format (alphanumeric, uppercase, max 10 chars)
    const codeRegex = /^[A-Z0-9]{1,10}$/
    const normalizedCode = body.code.toUpperCase()
    if (!codeRegex.test(normalizedCode)) {
      return new Response(JSON.stringify({ error: 'Fund code must be 1-10 uppercase alphanumeric characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check code uniqueness within org
    const { data: existing } = await supabase
      .from('funds')
      .select('id')
      .eq('org_id', profile.org_id)
      .eq('code', normalizedCode)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ error: `Fund code '${normalizedCode}' already exists in this organization` }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create the fund
    const { data: fund, error: fundError } = await supabase
      .from('funds')
      .insert({
        org_id: profile.org_id,
        name: body.name,
        code: normalizedCode,
        description: body.description ?? null,
        currency: body.currency ?? 'NZD',
        inception_date: body.inception_date ?? null,
        status: 'active',
        metadata: body.metadata ?? {},
        created_by: user.id,
      })
      .select()
      .single()

    if (fundError || !fund) {
      return new Response(JSON.stringify({ error: 'Failed to create fund', details: fundError?.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Set up default compliance rules for the new fund
    const defaultRules = [
      {
        org_id: profile.org_id,
        fund_id: fund.id,
        name: `${normalizedCode}: Single Security Concentration Limit`,
        rule_type: 'concentration',
        parameters: { max_weight_pct: 35, scope: 'security' },
        severity: 'breach',
        is_active: true,
      },
      {
        org_id: profile.org_id,
        fund_id: fund.id,
        name: `${normalizedCode}: Minimum Cash Holding`,
        rule_type: 'asset_class',
        parameters: { asset_type_slug: 'cash', min_weight_pct: 5 },
        severity: 'warning',
        is_active: true,
      },
    ]

    const { error: rulesError } = await supabase.from('compliance_rules').insert(defaultRules)
    if (rulesError) {
      console.error('Failed to create default compliance rules:', rulesError.message)
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: 'CREATE',
      entity_type: 'fund',
      entity_id: fund.id,
      new_data: fund,
    })

    return new Response(
      JSON.stringify({
        fund,
        compliance_rules_created: !rulesError ? defaultRules.length : 0,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
