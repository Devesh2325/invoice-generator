# BillCraft — Production-Ready Multi-Tenant Invoice Generator

A complete, production-ready, multi-tenant, white-label Invoice Generator web application built with Next.js App Router, TypeScript, Tailwind CSS, Decimal.js, IndexedDB, and Supabase.

---

## Key Features

- **Anonymous Mode (100% Offline-First):** Create invoices, estimates, purchase orders, receipts, credit notes, and pro forma documents instantly without an account. Stored securely in your browser's IndexedDB.
- **8 Working Document Templates:** Modern Fintech, Minimal Monochrome, Professional Navy, Classic Serif, Executive Corporate, Service & Trades, Consulting Advisory, and Retail POS.
- **Decimal-Safe Financial Engine:** Precision arbitrary decimal arithmetic via `decimal.js`. Multi-currency precision, line & document discounts, tax-inclusive & tax-exclusive rate breakdown, deterministic rounding.
- **Client-Side PDF & Print:** Pixel-perfect PDF generation and print stylesheets with automatic page margins and breaks.
- **Multi-Tenant Cloud Mode:** Workspace isolation with Row Level Security (RLS) on PostgreSQL. Role-based access control (`owner`, `admin`, `accountant`, `staff`, `viewer`).
- **Financial Dashboard & Ledgers:** Real-time KPI summaries, aged receivables, payment recording, and CSV exports.
- **Brand Studio & White-Label:** Custom company color schemes, typography, logos, standard terms, and custom domain foundations.
- **Local-to-Cloud Migration Wizard:** Selective import of anonymous documents into newly created cloud workspaces with duplicate detection.

---

## Monorepo Architecture

```
├── apps/
│   └── web/                   # Next.js 14 App Router, Tailwind CSS, shadcn/ui
├── packages/
│   ├── core/                  # Financial calculation engine, Zod schemas, numbering rules
│   ├── theme/                 # 8 Document templates, brand tokens, PDF stylesheets
│   ├── api/                   # Supabase data access layer & in-memory dev adapter
│   └── ui/                    # Design system components & utilities
├── supabase/
│   ├── migrations/            # Normalized SQL migrations with non-recursive RLS
│   └── seed.sql               # Multi-tenant development fixtures
└── docs/                      # Full technical documentation
```

---

## Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run All Unit & Package Tests
```bash
pnpm -r test
```

### 3. Run Strict Type Checking
```bash
pnpm --filter web typecheck
```

### 4. Build Production Bundle
```bash
pnpm --filter web build
```

### 5. Start Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Documentation

- [Architecture Overview](docs/architecture.md)
- [Setup & Installation](docs/setup.md)
- [Environment Variables](docs/environment-variables.md)
- [Database Schema & Models](docs/database.md)
- [Security & Row Level Security](docs/security.md)
- [Testing Strategy](docs/testing.md)
- [Production Deployment](docs/deployment.md)
- [Known Limitations](docs/known-limitations.md)
