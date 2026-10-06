-- Demo Seed Data for Local Development & Testing

-- 1. Tenants
INSERT INTO tenants (id, name, slug, custom_domain, is_domain_verified)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Acme Design Agency', 'acme-design', 'billing.acmedesign.io', true),
  ('a0000000-0000-0000-0000-000000000002', 'Nexus Cloud Solutions', 'nexus-cloud', null, false)
ON CONFLICT (id) DO NOTHING;

-- 2. Brand Settings
INSERT INTO brand_settings (tenant_id, logo_url, primary_color, secondary_color, font_family, default_terms, default_instructions)
VALUES
  ('a0000000-0000-0000-0000-000000000001', null, '#3157D5', '#0F172A', 'sans', 'Net 30 days', 'Bank: J.P. Morgan Chase | Acct: 123456789 | Routing: 987654321'),
  ('a0000000-0000-0000-0000-000000000002', null, '#0F766E', '#134E4A', 'sans', 'Due upon receipt', 'Stripe checkout or ACH transfer')
ON CONFLICT (tenant_id) DO NOTHING;

-- 3. Document Settings
INSERT INTO document_settings (tenant_id, default_currency, tax_id, address, numbering_rules)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'USD', 'US-849201948', '{"street1": "100 Market St", "city": "San Francisco", "country": "United States"}', '{"prefix": "INV", "padLength": 5, "includeYear": true, "nextNumber": 105}'),
  ('a0000000-0000-0000-0000-000000000002', 'EUR', 'EU-992019482', '{"street1": "Schönhauser Allee 8", "city": "Berlin", "country": "Germany"}', '{"prefix": "NEX", "padLength": 4, "includeYear": true, "nextNumber": 42}')
ON CONFLICT (tenant_id) DO NOTHING;

-- 4. Parties (Customers)
INSERT INTO parties (id, tenant_id, type, name, email, phone, tax_id, billing_address)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'customer', 'Globex Corporation', 'accounts@globex.com', '+1 (555) 019-2831', 'VAT-99281', '{"street1": "742 Evergreen Terrace", "city": "Springfield", "country": "United States"}'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'customer', 'Initech LLC', 'finance@initech.com', '+1 (555) 849-1122', 'US-102948', '{"street1": "4120 Freemont Blvd", "city": "Austin", "country": "United States"}'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'customer', 'Vandelay Industries', 'george@vandelay.com', '+1 (555) 777-8899', 'VAT-88491', '{"street1": "129 W 81st St", "city": "New York", "country": "United States"}')
ON CONFLICT (id) DO NOTHING;

-- 5. Products Catalog
INSERT INTO products (id, tenant_id, name, sku, description, unit_price, unit, tax_rate)
VALUES
  ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'UI/UX Design Sprint', 'SRV-DSGN-01', '5-day interactive product design sprint', 4500.00, 'sprint', 10.00),
  ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Full-Stack Engineering Hour', 'SRV-ENG-01', 'Senior React/Node software development', 150.00, 'hour', 10.00),
  ('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Cloud Kubernetes Audit', 'CLD-AUD-01', 'Security and cluster topology evaluation', 3200.00, 'audit', 19.00)
ON CONFLICT (id) DO NOTHING;
