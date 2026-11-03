# Invoxa project guide

Invoxa (older name: BillCraft) is an invoicing SaaS for Indian GST and international tax. It is a pnpm and Turborepo monorepo with a Next.js 14 web app and a separate Flutter mobile app.

**Trust the code over `README.md` and `docs/`.** Those files describe a Supabase and Row Level Security architecture that the app mostly does not use. See [Stale documentation](#stale-documentation).

## Commands

Run these from the repository root. Requires Node 20+ and pnpm 9.

| Task | Command |
| --- | --- |
| Start the web app on port 3000 | `pnpm dev` |
| Type-check the web app | `pnpm --filter web typecheck` |
| Run all unit tests | `pnpm -r test` (stops at the first failing package) |
| Test one package | `pnpm --filter @invoice/core test` |
| Run one test file | `pnpm --filter @invoice/core exec vitest run test/calculation.test.ts` |
| Run end-to-end tests | `pnpm --filter web test:e2e` |
| Build the web app | `pnpm --filter web build` |
| Create Appwrite collections | `pnpm setup:appwrite` |
| Run the mobile app | `flutter pub get`, then `flutter run`, in `apps/mobile_flutter` |

- **Always run typecheck separately.** `next.config.js` sets `ignoreBuildErrors` and `ignoreDuringBuilds`, so a passing build does not prove that types or lint are clean.

## Layout

| Path | Purpose |
| --- | --- |
| `apps/web` | Next.js App Router app with Tailwind and Radix UI |
| `apps/mobile_flutter` | Flutter app (MVVM) that calls Appwrite over REST; not in the pnpm build |
| `packages/core` | Calculations, document types and status rules, Zod schemas, numbering, currencies, `APP_CONFIG` |
| `packages/api` | Data access: `TenantApi`, `AdminApi`, `TeamApi`, blog, `AppwriteAdapter` |
| `packages/theme` | Invoice template registries and HTML rendering |
| `packages/ui` | `cn` helper and design tokens |
| `scripts` | Appwrite setup and data cleanup |
| `supabase` | SQL migrations for the older Supabase design |

Packages set `main` to `./src/index.ts` and Next transpiles them, so changes to `src` apply without a build. The `dist` folders are committed build output, so never edit them by hand. Turbo's `build`, `test`, `typecheck` and `lint` tasks rebuild dependencies first, which can leave `dist` changes in your working tree.

## Architecture

### The web app runs in the browser

Only admin sign-in runs on the server: `/api/admin/login` and `/api/admin/logout` issue a signed httpOnly cookie, and `src/middleware.ts` guards `/admin`. They need `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in `apps/web/.env.local`. Everything else, including customer sign-in and plan limits, runs client-side, so **a check there is a UI rule, not a security boundary**.

### Storage

`TenantApi` in `packages/api/src/index.ts` picks a backend per call, and methods do not all behave the same way:

1. **Appwrite**, if `NEXT_PUBLIC_APPWRITE_PROJECT_ID` is set.
2. **Supabase**, if its URL and anon key are set. This path is partial and largely legacy.
3. **`localStorage`**, under `billcraft_*` keys, plus an in-memory store for tests and SSR.

Separately, `apps/web/src/lib/storage/indexed-db.ts` keeps documents in IndexedDB. The document builder saves there first, then calls `TenantApi.saveDocument` when a tenant is active.

| Data or operation | Where it is written |
| --- | --- |
| Create or update tenants, parties, products, brand settings | Appwrite and `localStorage` |
| Documents | Appwrite if configured, plus `localStorage` when Supabase is not configured |
| `recordPayment`, `recordRefund`, `updateDocumentStatus` | `localStorage` only |
| `importPartiesBatch`, `deleteTenant` | `localStorage` only |
| `AdminApi` and `TeamApi` (users, plans, teams, template availability, audit logs) | `localStorage` only, so admin changes only affect the admin's own browser |

Appwrite stores each record as a few indexed attributes plus the full object as a JSON string in `data`. `AppwriteAdapter` catches most errors, logs them and returns `null`, so a failed write can look like a success.

### Auth and tenancy

- `apps/web/src/lib/auth/tenant-context.tsx` provides `useTenant()`. It reads the user from `billcraft_current_user` and the workspace from `billcraft_active_tenant_id`.
- After changing auth state, dispatch the `billcraft-auth-updated` window event. `updateUser` dispatches `billcraft-auth-changed` instead, and nothing listens for that.
- `TenantLayout` redirects dashboard visitors without a user. Customer accounts live in `billcraft_registered_users` with hashed passwords (`src/lib/auth/password.ts`), so an account only exists in the browser that created it.
- Every tenant-owned read or write takes a `tenantId`. Keep that scoping, and throw `TenantAccessDeniedError` for cross-tenant access. `packages/api/test/security.test.ts` covers this.

### Plans

- Limits are enforced in `TenantApi.saveDocument`, which throws `PlanLimitReachedError`. The builder catches it and opens the upgrade modal.
- The trial limit counts every document type, not only invoices.
- Plan data exists in two places: `APP_CONFIG.plans` in `core/src/config/app-config.ts` and `PLANS` in `core/src/types/team.ts`. Update both when plans change.

### Money and document rules

- **All totals come from `calculateDocument`** in `core/src/calculations/financial-engine.ts`, which uses `decimal.js`. Do not recalculate them with floats in the UI.
- **Order:** line gross, line discount, line tax, proportional document discount, tax recalculated per rate, shipping and charges, optional round-off.
- **GST split:** INR only. Different sender and client states give IGST; otherwise tax splits into CGST and SGST.
- **Precision:** comes from the currency config (JPY 0, KWD 3, most others 2) unless `decimalPrecision` overrides it.
- **Balance:** `balanceDue` is `grandTotal - amountPaid`. Refunds are tracked separately and do not raise it.
- **Status:** stored status passes through `computeEffectiveInvoiceStatus`, which turns `finalized` and `sent` into `pending` and derives `paid`, `overdue` and `refunded`. Allowed transitions are in `isValidStatusTransition`.
- **Tax defaults:** `getCurrencyTaxProfile` holds tax labels, default rates and default templates per currency.

### Templates

- `packages/theme/src/templates.ts`: the `TEMPLATES` people can choose, in four categories. Each one must be a different design.
- `packages/theme/src/invoice-templates.ts`: `INVOICE_TEMPLATES`, the designs rendered to print-ready HTML. It also keeps retired designs (`za-vat`, `nz-gst`, `mx-iva`) so saved invoices still render. Don't remove a design that saved invoices may use.
- `core/src/config/app-config.ts`: `FREE_TEMPLATE_IDS`, plus `LEGACY_TEMPLATE_IDS` and `resolveTemplateId`, which map old IDs such as `cleartax_gst` to current ones. Every lookup goes through `resolveTemplateId`.
- `TEMPLATE_DOCUMENT_TYPES` links the special document templates to a document type, so a credit note design can't print on a tax invoice.
- Every currency's default template must be free, or free users can't save in that currency. `packages/theme/test/theme.test.ts` checks this.

### Navigation and backgrounds

- `app/dashboard/layout.tsx` renders `TenantLayout` for every dashboard page, so pages must not wrap themselves in it again. `app/dashboard/loading.tsx` shows while a page loads.
- `NavigationProgress` in the root layout shows a bar on every internal link click.
- The first visit to a page is slow on `pnpm dev` (3 to 5 seconds) because it compiles on demand. Judge speed with `pnpm --filter web build` and `next start`, where menu clicks take about 100 to 400ms.
- The site-wide gradient is `body::before` in `globals.css`. Page roots must not set a solid background, or they hide it.

### Main UI files

The generator is one column with no side panel: `invoice-options-bar.tsx` (currency, template, colour, payment details) above `inline-document-canvas.tsx`, where fields are edited directly on the invoice paper. A Preview button swaps the canvas for `DocumentPreview`. `document-builder.tsx` holds the state, saving and payment dialogs. The `/create` and `/edit/[id]` pages are thin wrappers around `DocumentBuilder`. `simple-invoice-form.tsx` is the previous step-by-step form and is no longer used.

Downloads are PDF and PNG (`lib/pdf/export-pdf.ts`, captured from the hidden print sheet) and Excel and CSV (`lib/export/export-document.ts`, built from `DocumentModel`). Excel holds the engine's values, not formulas.

**Invoice output must use the engine's numbers.** `mapCanonicalDocumentToTemplateInv` passes `calculatedTotals` and per-line `calculated` values to the templates. Never let a template recompute a real document's totals: it once ignored discounts and shipping, so invoices showed the wrong amount. Check print changes by viewing the printed image, because `.print-only-sheet` can be present in the page and still print blank.

### Embedding

Other sites add the editor with `public/embed.js`, which frames `/embed`. The guide is `/dashboard/developers` ("Integration Docs"), shown only on plans where `canUseIntegrationDocs` is true. That check hides the guide but doesn't stop anyone using `/embed`, which needs a server-side key to restrict. `DocumentBuilder` with the `embed` prop ignores the visitor's workspace and doesn't save locally. Invoice data is only posted to the origin that sent `invoxa:init`. The message names and prefill schema are in `core/src/embed`. Prefills can't set totals or unlock paid templates. There are no API keys, so anyone can embed it, and there's no REST API.

## Conventions

- Import shared code from `@invoice/*`, and web app code through the `@/` alias.
- Take the product name from `APP_CONFIG.brandName`; do not hard-code it.
- Keep the `billcraft_` storage keys and event names. Renaming them orphans existing users' browser data.
- Add new domain types and calculations to `packages/core`, and test them there.
- Run Next from `apps/web`, which only loads env files from that folder. A root `.env.local` reaches `pnpm setup:appwrite` but not the web app, so copy values to `apps/web/.env.local`.
- Never put real credentials in code, `.env.example`, or this file.

## Known issues

Found by reading the code. Confirm each one before relying on it or fixing it.

### Security

- A previous super admin password remains in git history and must be treated as public.
- Customer accounts and all business data are browser-only unless Appwrite is configured, and there is still no customer sign-in on the server.
- `dashboard/billing` switches plans with no payment step, so anyone can give themselves a paid plan.
- Admin login lockout is held in memory per server instance, so it resets on restart and isn't shared between instances.
- `scripts/setup-appwrite.ts` gives collections and the storage bucket read and write access for `Role.any()`, so tenant data is not isolated at the server.
- Share links are unsigned base64 of `tenantId:docId`, so anyone who knows the IDs can build one.

### Data correctness

- Payments and refunds are not written to Appwrite. With Appwrite on, they can fail or disappear on reload, because reads come from Appwrite.
- `recordPayment` and `recordRefund` use floats with `toFixed(2)`, which is wrong for KWD and JPY.
- Stock deduction checks for `finalized` or `paid` after status normalization, so in practice only `paid` triggers it. Each later save of a paid document deducts stock again.
- `getBrandSettings` falls back to hard-coded bank details, which could appear on real invoices.

### Mobile

`AppConstants` hard-codes the Appwrite project ID and tenant ID, and requests carry no user session. The app has its own calculation code and document type list, so changes in `packages/core` do not reach it.

## Stale documentation

| The docs say | The code does |
| --- | --- |
| Supabase with Row Level Security is the backend | Appwrite and `localStorage`; Supabase is partial |
| The product is BillCraft | `APP_CONFIG` says Invoxa |
| 8 templates | 18 to choose from in `TEMPLATES`, 21 designs in `INVOICE_TEMPLATES` |
| Native mobile is deferred | `apps/mobile_flutter` exists |
| The env reference is complete | Appwrite and super admin variables are missing from it |
| TanStack Query and react-hook-form are in use | Both are dependencies, but no web source file imports them |
