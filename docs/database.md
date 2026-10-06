# Database Schema & Data Models

The database schema is defined in `supabase/migrations/20261007000000_multi_tenant_schema.sql`.

## Core Tables

- `tenants`: Workspaces representing organizations/businesses. Supports `custom_domain` and verification flags.
- `profiles`: User profile data referencing `auth.users(id)`.
- `tenant_members`: Pivot table defining workspace membership and roles (`owner`, `admin`, `accountant`, `staff`, `viewer`).
- `brand_settings`: Custom logo URLs, brand colors, fonts, default payment terms, and footer text per tenant.
- `document_settings`: Default currency, legal tax identifiers, registered addresses, and numbering sequences.
- `parties`: Customers and vendors directory with billing and shipping JSON structures.
- `products`: Reusable services and products catalog with SKU, default tax rates, and prices.
- `documents`: Master financial document records (type, status, number, currency, client/sender snapshots, calculation summaries).
- `document_items`: Line items cascade-linked to documents.
- `payments`: Transaction ledger records representing payment allocations against documents.
- `audit_logs`: Immutable audit trails recording critical tenant actions.
