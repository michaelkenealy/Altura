import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ColumnMapping {
  [sourceColumn: string]: string // maps to target field name
}

interface ImportMapping {
  fund_id?: string
  import_type: 'holdings' | 'trades' | 'securities'
  column_mapping: ColumnMapping
}

interface ValidationError {
  row: number
  field: string
  message: string
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line => {
    // Handle quoted fields with commas inside
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes
      } else if (line[i] === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += line[i]
      }
    }
    values.push(current.trim())

    return headers.reduce((acc, header, idx) => {
      acc[header] = values[idx] ?? ''
      return acc
    }, {} as Record<string, string>)
  })

  return { headers, rows }
}

function applyMapping(row: Record<string, string>, mapping: ColumnMapping): Record<string, string> {
  const mapped: Record<string, string> = {}
  for (const [source, target] of Object.entries(mapping)) {
    if (row[source] !== undefined) {
      mapped[target] = row[source]
    }
  }
  // Also include unmapped columns as-is
  for (const [key, value] of Object.entries(row)) {
    if (!mapping[key]) {
      mapped[key] = value
    }
  }
  return mapped
}

function validateHoldingRow(row: Record<string, string>, rowNum: number): ValidationError[] {
  const errors: ValidationError[] = []
  const required = ['ticker', 'quantity', 'last_price']
  for (const field of required) {
    if (!row[field]) {
      errors.push({ row: rowNum, field, message: `${field} is required` })
    }
  }
  if (row.quantity && isNaN(Number(row.quantity))) {
    errors.push({ row: rowNum, field: 'quantity', message: 'quantity must be a number' })
  }
  if (row.last_price && isNaN(Number(row.last_price))) {
    errors.push({ row: rowNum, field: 'last_price', message: 'last_price must be a number' })
  }
  return errors
}

function validateTradeRow(row: Record<string, string>, rowNum: number): ValidationError[] {
  const errors: ValidationError[] = []
  const required = ['ticker', 'trade_type', 'quantity', 'price', 'trade_date']
  for (const field of required) {
    if (!row[field]) {
      errors.push({ row: rowNum, field, message: `${field} is required` })
    }
  }
  if (row.trade_type && !['buy', 'sell'].includes(row.trade_type.toLowerCase())) {
    errors.push({ row: rowNum, field: 'trade_type', message: 'trade_type must be buy or sell' })
  }
  if (row.quantity && isNaN(Number(row.quantity))) {
    errors.push({ row: rowNum, field: 'quantity', message: 'quantity must be a number' })
  }
  if (row.price && isNaN(Number(row.price))) {
    errors.push({ row: rowNum, field: 'price', message: 'price must be a number' })
  }
  return errors
}

function validateSecurityRow(row: Record<string, string>, rowNum: number): ValidationError[] {
  const errors: ValidationError[] = []
  if (!row.ticker) errors.push({ row: rowNum, field: 'ticker', message: 'ticker is required' })
  if (!row.name) errors.push({ row: rowNum, field: 'name', message: 'name is required' })
  return errors
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

    // Auth check
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

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('org_id, role_id, roles(slug)')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const mappingJson = formData.get('mapping') as string | null

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!mappingJson) {
      return new Response(JSON.stringify({ error: 'No mapping configuration provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const mapping: ImportMapping = JSON.parse(mappingJson)
    const csvText = await file.text()
    const { rows } = parseCSV(csvText)

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'CSV file is empty' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create import batch
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        org_id: profile.org_id,
        source: 'csv_email',
        file_name: file.name,
        status: 'processing',
        total_rows: rows.length,
        imported_by: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (batchError || !batch) {
      return new Response(JSON.stringify({ error: 'Failed to create import batch', details: batchError }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Insert raw rows
    const importRows = rows.map((row, idx) => ({
      batch_id: batch.id,
      row_number: idx + 1,
      raw_data: row,
      status: 'pending',
    }))

    await supabase.from('import_rows').insert(importRows)

    // Process rows
    let processedCount = 0
    let errorCount = 0
    const allErrors: ValidationError[] = []

    for (let i = 0; i < rows.length; i++) {
      const mappedRow = applyMapping(rows[i], mapping.column_mapping)
      const rowNum = i + 1
      let rowErrors: ValidationError[] = []

      if (mapping.import_type === 'holdings') {
        rowErrors = validateHoldingRow(mappedRow, rowNum)
      } else if (mapping.import_type === 'trades') {
        rowErrors = validateTradeRow(mappedRow, rowNum)
      } else if (mapping.import_type === 'securities') {
        rowErrors = validateSecurityRow(mappedRow, rowNum)
      }

      if (rowErrors.length > 0) {
        allErrors.push(...rowErrors)
        errorCount++
        await supabase
          .from('import_rows')
          .update({ status: 'error', error_message: rowErrors.map(e => e.message).join('; ') })
          .eq('batch_id', batch.id)
          .eq('row_number', rowNum)
        continue
      }

      try {
        if (mapping.import_type === 'securities') {
          // Upsert security
          const { data: assetType } = await supabase
            .from('asset_types')
            .select('id')
            .eq('slug', mappedRow.asset_type_slug ?? 'stocks')
            .single()

          await supabase.from('securities').upsert({
            ticker: mappedRow.ticker.toUpperCase(),
            name: mappedRow.name,
            asset_type_id: assetType?.id,
            exchange: mappedRow.exchange ?? null,
            currency: mappedRow.currency ?? 'NZD',
            isin: mappedRow.isin ?? null,
            sedol: mappedRow.sedol ?? null,
          }, { onConflict: 'ticker,exchange', ignoreDuplicates: false })

        } else if (mapping.import_type === 'holdings' && mapping.fund_id) {
          // Look up security by ticker
          const { data: security } = await supabase
            .from('securities')
            .select('id')
            .ilike('ticker', mappedRow.ticker)
            .maybeSingle()

          if (!security) {
            throw new Error(`Security not found: ${mappedRow.ticker}`)
          }

          const qty = Number(mappedRow.quantity)
          const price = Number(mappedRow.last_price)
          const fxRate = Number(mappedRow.fx_rate ?? '1')
          const marketValueLocal = qty * price
          const marketValueNzd = marketValueLocal / fxRate

          await supabase.from('holdings').upsert({
            fund_id: mapping.fund_id,
            security_id: security.id,
            quantity: qty,
            last_price: price,
            market_value_local: marketValueLocal,
            market_value_nzd: marketValueNzd,
            fx_rate: fxRate,
            avg_cost_local: Number(mappedRow.avg_cost ?? mappedRow.last_price ?? '0'),
            avg_cost_nzd: Number(mappedRow.avg_cost_nzd ?? mappedRow.last_price ?? '0'),
            as_of_date: mappedRow.as_of_date ?? new Date().toISOString().split('T')[0],
          }, { onConflict: 'fund_id,security_id,as_of_date' })

        } else if (mapping.import_type === 'trades' && mapping.fund_id) {
          const { data: security } = await supabase
            .from('securities')
            .select('id')
            .ilike('ticker', mappedRow.ticker)
            .maybeSingle()

          if (!security) {
            throw new Error(`Security not found: ${mappedRow.ticker}`)
          }

          const qty = Number(mappedRow.quantity)
          const price = Number(mappedRow.price)
          const commission = Number(mappedRow.commission ?? '0')
          const grossAmount = qty * price
          const netAmount = grossAmount + commission

          await supabase.from('trades').insert({
            fund_id: mapping.fund_id,
            security_id: security.id,
            trade_type: mappedRow.trade_type.toLowerCase(),
            quantity: qty,
            price: price,
            currency: mappedRow.currency ?? 'NZD',
            fx_rate: Number(mappedRow.fx_rate ?? '1'),
            gross_amount: grossAmount,
            net_amount: netAmount,
            commission: commission,
            trade_date: mappedRow.trade_date,
            settlement_date: mappedRow.settlement_date ?? null,
            broker: mappedRow.broker ?? null,
            external_ref: mappedRow.external_ref ?? null,
            status: 'pending',
          })
        }

        await supabase
          .from('import_rows')
          .update({ status: 'processed' })
          .eq('batch_id', batch.id)
          .eq('row_number', rowNum)

        processedCount++
      } catch (err) {
        errorCount++
        const msg = err instanceof Error ? err.message : 'Unknown error'
        await supabase
          .from('import_rows')
          .update({ status: 'error', error_message: msg })
          .eq('batch_id', batch.id)
          .eq('row_number', rowNum)
        allErrors.push({ row: rowNum, field: 'general', message: msg })
      }
    }

    // Update batch status
    const finalStatus = errorCount === 0 ? 'completed' : processedCount === 0 ? 'failed' : 'partial'
    await supabase
      .from('import_batches')
      .update({
        status: finalStatus,
        processed_rows: processedCount,
        error_rows: errorCount,
        errors: allErrors,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batch.id)

    return new Response(
      JSON.stringify({
        batch_id: batch.id,
        status: finalStatus,
        total_rows: rows.length,
        processed_rows: processedCount,
        error_rows: errorCount,
        errors: allErrors,
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
