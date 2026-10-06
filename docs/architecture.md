# Architecture Overview

BillCraft is an enterprise-grade, multi-tenant, white-label Invoice Generator web application built on modern, resilient web architecture.

## Monorepo Layout

```
├── apps/
│   └── web/                   # Next.js 14 App Router (Tailwind CSS, shadcn/ui, TanStack Query)
├── packages/
│   ├── core/                  # Financial calculation engine (decimal.js), Zod schemas, lifecycle
│   ├── theme/                 # 8 Document templates, brand tokens, PDF print stylesheets
│   ├── api/                   # Typed Supabase client, queries, mutations, and offline mock adapters
│   └── ui/                    # Shared design system primitives & utilities (cn, twMerge)
├── supabase/
│   ├── migrations/            # PostgreSQL migrations, non-recursive RLS policies, role-based checks
│   └── seed.sql               # Multi-tenant development seed fixtures
└── docs/                      # Comprehensive engineering & operations documentation
```

## Two Modes of Operation

### 1. Anonymous Mode (Offline-First)
- **Zero Registration Needed:** Anyone can create Invoices, Estimates, Purchase Orders, Receipts, Credit Notes, Debit Notes, and Pro Forma documents instantly.
- **Storage:** Client-side IndexedDB persistence using `idb` with an in-memory cache fallback.
- **Privacy:** Data is stored locally on the user's device and is never uploaded without explicit user confirmation.
- **Exports:** High-fidelity client-side PDF export via `html2canvas` + `jspdf`, browser print styling (`@media print`), and full JSON backup/restore.

### 2. Signed-In Tenant Mode
- **Multi-Tenancy:** Isolated tenant workspaces. Users can belong to multiple workspaces with roles: `owner`, `admin`, `accountant`, `staff`, `viewer`.
- **Row Level Security:** Non-recursive `is_member(tenant_id, min_role)` function enforcing data boundaries at the PostgreSQL layer.
- **Financial Lifecycle:** Sequential numbering with collision avoidance, partial payment recording, tax liability summaries, aged receivables reports, and customer/vendor transaction ledgers.
- **Brand Studio:** White-label customization of primary/secondary colors, font families, document terms, and verified custom domain CNAME foundations.

## Calculation Engine Order of Operations

1. **Line Gross:** `Quantity × Unit Price` (arbitrary decimal precision via `decimal.js`).
2. **Line Discount:** Percentage (`Gross × Rate%`) or Fixed (`Min(Gross, Fixed)`).
3. **Line Net:** `Gross - Line Discount`.
4. **Line Tax:**
   - Tax-exclusive: `Tax = Line Net × Tax Rate%`.
   - Tax-inclusive: `Tax = Line Net - (Line Net / (1 + Tax Rate%))`.
5. **Document-Level Discounts:** Applied proportionally to taxable bases.
6. **Charges:** Shipping fee + extra charges added to grand total.
7. **Settlement:** `Balance Due = Max(0, Grand Total - Amount Paid)`. Deterministic half-up rounding to currency precision (e.g. JPY=0, USD=2, KWD=3).
