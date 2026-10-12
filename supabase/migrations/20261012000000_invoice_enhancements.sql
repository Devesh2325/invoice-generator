-- =========================================================================
-- Migration: 20261012000000_invoice_enhancements.sql
-- Purpose: Add structured Payment Settings (Bank Accounts, UPI, QR, Display Toggles),
--          Rounding & Round-Off columns, Refunds ledger, Invoice Name, and Currency config.
-- =========================================================================

BEGIN;

-- 1. Extend document_status enum with 'pending' and 'refunded'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
    ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'pending';
    ALTER TYPE document_status ADD VALUE IF NOT EXISTS 'refunded';
  END IF;
END$$;

-- 2. Extend documents table with invoice_name, rounding, refund summary, and payment_config
ALTER TABLE IF EXISTS public.documents
  ADD COLUMN IF NOT EXISTS invoice_name TEXT,
  ADD COLUMN IF NOT EXISTS enable_round_off BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rounding_mode TEXT NOT NULL DEFAULT 'nearest_integer',
  ADD COLUMN IF NOT EXISTS decimal_precision SMALLINT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS total_before_round_off NUMERIC(18, 4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS round_off_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS audit_history JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 3. Create document_refunds table for tracking partial and full refunds separately from payments
CREATE TABLE IF NOT EXISTS public.document_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  amount NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
  refund_date DATE NOT NULL DEFAULT CURRENT_DATE,
  refund_method TEXT NOT NULL DEFAULT 'bank_transfer',
  reason TEXT,
  reference TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_refunds_tenant_id ON public.document_refunds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_refunds_document_id ON public.document_refunds(document_id);

ALTER TABLE public.document_refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can view refunds" ON public.document_refunds;
CREATE POLICY "Tenant members can view refunds"
  ON public.document_refunds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = document_refunds.tenant_id
        AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant members can insert refunds" ON public.document_refunds;
CREATE POLICY "Tenant members can insert refunds"
  ON public.document_refunds
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = document_refunds.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin', 'accountant', 'staff')
    )
  );

-- 4. Create tenant_invoice_configs table for unified Invoice, Currency, Rounding & Payment Settings
CREATE TABLE IF NOT EXISTS public.tenant_invoice_configs (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  default_currency TEXT NOT NULL DEFAULT 'INR',
  default_locale TEXT NOT NULL DEFAULT 'en-IN',
  decimal_precision SMALLINT NOT NULL DEFAULT 2 CHECK (decimal_precision BETWEEN 0 AND 4),
  enable_round_off BOOLEAN NOT NULL DEFAULT FALSE,
  rounding_mode TEXT NOT NULL DEFAULT 'nearest_integer',
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  next_invoice_number INTEGER NOT NULL DEFAULT 1 CHECK (next_invoice_number >= 1),
  default_due_days INTEGER NOT NULL DEFAULT 15 CHECK (default_due_days >= 0),
  default_tax_rate NUMERIC(6, 2) NOT NULL DEFAULT 18,
  default_template_id TEXT NOT NULL DEFAULT 'cleartax_gst',
  bank_accounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_bank_account_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  upi_id TEXT,
  upi_payee_name TEXT,
  qr_code_data_url TEXT,
  auto_generate_upi_qr BOOLEAN NOT NULL DEFAULT TRUE,
  display_controls JSONB NOT NULL DEFAULT '{
    "showBankDetails": true,
    "showUpiId": true,
    "showQrCode": false,
    "showPaymentInstructions": true,
    "showPaymentTerms": true
  }'::jsonb,
  default_payment_terms TEXT,
  default_payment_instructions TEXT,
  signatory_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tenant_invoice_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can read invoice configs" ON public.tenant_invoice_configs;
CREATE POLICY "Tenant members can read invoice configs"
  ON public.tenant_invoice_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = tenant_invoice_configs.tenant_id
        AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant admins can update invoice configs" ON public.tenant_invoice_configs;
CREATE POLICY "Tenant admins can update invoice configs"
  ON public.tenant_invoice_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = tenant_invoice_configs.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin', 'accountant')
    )
  );

COMMIT;
