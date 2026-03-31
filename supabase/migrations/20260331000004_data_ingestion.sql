-- Migration 004: Data ingestion tables
-- Import batches, raw rows, and column mappings for CSV/Excel uploads

-- import_batches (top-level import job)
CREATE TABLE import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id), -- NULL if batch covers multiple funds
  import_type TEXT NOT NULL CHECK (
    import_type IN ('holdings', 'trades', 'cash_movements', 'securities', 'prices', 'other')
  ),
  source_filename TEXT,
  source_format TEXT CHECK (source_format IN ('csv', 'xlsx', 'json', 'api', 'other')),
  row_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'completed_with_errors', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES user_profiles(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}',  -- raw header row, detected delimiter, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE import_batches IS 'Tracks each file/API import job. Parent record for all raw rows.';
COMMENT ON COLUMN import_batches.fund_id IS 'Optional: set when the entire batch belongs to one fund.';
COMMENT ON COLUMN import_batches.metadata IS 'May include raw_headers, delimiter, encoding, sheet_name, etc.';

-- import_rows (one record per source row)
CREATE TABLE import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  row_number INT NOT NULL,       -- 1-based row index within the source file
  raw_data JSONB NOT NULL,       -- original key/value pairs from the source
  mapped_data JSONB DEFAULT '{}', -- transformed data after applying import_mappings
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'mapped', 'validated', 'imported', 'skipped', 'error')),
  error_message TEXT,            -- first error encountered during processing
  target_table TEXT,             -- which table this row imports into
  target_id UUID,                -- PK of the created/updated record (after import)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE import_rows IS 'Raw rows from an import batch. Preserves original data alongside mapped/validated state.';
COMMENT ON COLUMN import_rows.raw_data IS 'Verbatim key→value from the source file/API, keyed by column header.';
COMMENT ON COLUMN import_rows.mapped_data IS 'Output of applying import_mappings to raw_data; ready for validation.';
COMMENT ON COLUMN import_rows.target_id IS 'Populated after successful upsert into the target table.';

-- import_mappings (reusable column-mapping templates per org + import_type)
CREATE TABLE import_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  import_type TEXT NOT NULL CHECK (
    import_type IN ('holdings', 'trades', 'cash_movements', 'securities', 'prices', 'other')
  ),
  name TEXT NOT NULL,            -- human-readable mapping name, e.g. "Bloomberg Holdings Export"
  description TEXT,
  is_default BOOLEAN DEFAULT false, -- one default per (org_id, import_type)
  column_map JSONB NOT NULL DEFAULT '{}',
  -- column_map structure:
  -- { "source_col_name": { "target_field": "quantity", "transform": "to_decimal" }, ... }
  -- transforms: to_decimal, to_date, to_upper, strip_whitespace, nzd_to_local, etc.
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, import_type, name)
);

COMMENT ON TABLE import_mappings IS 'Saved column-mapping templates so orgs don''t remap the same file format twice.';
COMMENT ON COLUMN import_mappings.column_map IS 'JSON map from source header names to target field names plus optional transform hints.';
COMMENT ON COLUMN import_mappings.is_default IS 'If true, auto-applied when a new batch of this import_type is created for the org.';
