-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role Enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'accountant', 'staff', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE doc_type AS ENUM ('invoice', 'estimate', 'purchase_order', 'receipt', 'credit_note', 'debit_note', 'pro_forma');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE doc_status AS ENUM ('draft', 'finalized', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'cheque', 'card', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Profiles (mirrors auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tenants (Workspaces)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  custom_domain TEXT UNIQUE,
  is_domain_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tenant Members
CREATE TABLE IF NOT EXISTS tenant_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- 4. Brand & Document Settings
CREATE TABLE IF NOT EXISTS brand_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#3157D5',
  secondary_color TEXT NOT NULL DEFAULT '#0F172A',
  font_family TEXT NOT NULL DEFAULT 'sans',
  default_terms TEXT,
  default_instructions TEXT,
  footer_text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  default_currency TEXT NOT NULL DEFAULT 'USD',
  tax_id TEXT,
  address JSONB,
  numbering_rules JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Parties (Customers & Vendors)
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('customer', 'vendor')),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  billing_address JSONB,
  shipping_address JSONB,
  notes TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Products Catalog
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  unit_price NUMERIC(15, 4) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'item',
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type doc_type NOT NULL DEFAULT 'invoice',
  status doc_status NOT NULL DEFAULT 'draft',
  document_number TEXT NOT NULL,
  reference_number TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  currency TEXT NOT NULL DEFAULT 'USD',
  client_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  client_snapshot JSONB NOT NULL,
  sender_snapshot JSONB NOT NULL,
  summary JSONB NOT NULL,
  template_id TEXT NOT NULL DEFAULT 'modern',
  notes TEXT,
  payment_terms TEXT,
  payment_instructions TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  UNIQUE(tenant_id, document_number)
);

-- 8. Document Items
CREATE TABLE IF NOT EXISTS document_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(15, 4) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15, 4) NOT NULL DEFAULT 0,
  discount_type TEXT,
  discount_value NUMERIC(15, 4) DEFAULT 0,
  tax_rate NUMERIC(5, 2) DEFAULT 0,
  tax_inclusive BOOLEAN NOT NULL DEFAULT FALSE,
  line_total NUMERIC(15, 4) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

-- 9. Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  amount NUMERIC(15, 4) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
  reference TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance & tenant isolation
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parties_tenant ON parties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_status ON documents(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_type ON documents(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_payments_document ON payments(document_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & AUTHORIZATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION is_member(check_tenant_id UUID, min_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_id = check_tenant_id
      AND user_id = auth.uid()
      AND (
        CASE min_role
          WHEN 'viewer' THEN role IN ('owner', 'admin', 'accountant', 'staff', 'viewer')
          WHEN 'staff' THEN role IN ('owner', 'admin', 'accountant', 'staff')
          WHEN 'accountant' THEN role IN ('owner', 'admin', 'accountant')
          WHEN 'admin' THEN role IN ('owner', 'admin')
          WHEN 'owner' THEN role = 'owner'
          ELSE FALSE
        END
      )
  );
$$;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own profile
CREATE POLICY profiles_read ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (id = auth.uid());

-- Tenants: Members can read tenant info
CREATE POLICY tenants_read ON tenants FOR SELECT USING (is_member(id, 'viewer'));
CREATE POLICY tenants_update ON tenants FOR UPDATE USING (is_member(id, 'admin'));

-- Tenant Members: Members can see teammates; Admins/Owners can manage
CREATE POLICY tenant_members_read ON tenant_members FOR SELECT USING (is_member(tenant_id, 'viewer'));
CREATE POLICY tenant_members_write ON tenant_members FOR ALL USING (is_member(tenant_id, 'admin'));

-- Settings
CREATE POLICY brand_settings_read ON brand_settings FOR SELECT USING (is_member(tenant_id, 'viewer'));
CREATE POLICY brand_settings_write ON brand_settings FOR ALL USING (is_member(tenant_id, 'admin'));

CREATE POLICY document_settings_read ON document_settings FOR SELECT USING (is_member(tenant_id, 'viewer'));
CREATE POLICY document_settings_write ON document_settings FOR ALL USING (is_member(tenant_id, 'admin'));

-- Parties (Customers & Vendors)
CREATE POLICY parties_read ON parties FOR SELECT USING (is_member(tenant_id, 'viewer'));
CREATE POLICY parties_write ON parties FOR ALL USING (is_member(tenant_id, 'staff'));

-- Products
CREATE POLICY products_read ON products FOR SELECT USING (is_member(tenant_id, 'viewer'));
CREATE POLICY products_write ON products FOR ALL USING (is_member(tenant_id, 'staff'));

-- Documents & Items
CREATE POLICY documents_read ON documents FOR SELECT USING (is_member(tenant_id, 'viewer'));
CREATE POLICY documents_write ON documents FOR ALL USING (is_member(tenant_id, 'staff'));

CREATE POLICY document_items_read ON document_items FOR SELECT USING (is_member(tenant_id, 'viewer'));
CREATE POLICY document_items_write ON document_items FOR ALL USING (is_member(tenant_id, 'staff'));

-- Payments
CREATE POLICY payments_read ON payments FOR SELECT USING (is_member(tenant_id, 'viewer'));
CREATE POLICY payments_write ON payments FOR ALL USING (is_member(tenant_id, 'accountant'));

-- Audit Logs
CREATE POLICY audit_logs_read ON audit_logs FOR SELECT USING (is_member(tenant_id, 'admin'));
