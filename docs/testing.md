# Testing Strategy & Execution

BillCraft uses a layered testing strategy consisting of unit tests, integration tests, and end-to-end browser specifications.

## 1. Unit & Calculation Tests (Vitest)

Unit tests verify:
- Decimal-safe arbitrary arithmetic using `decimal.js`.
- Deterministic half-up rounding across various currencies (USD, JPY 0dp, KWD 3dp).
- Line-item and document-level discount calculations (both percentage and fixed fees).
- Tax-inclusive and tax-exclusive rate breakdown formulas.
- Document lifecycle state transitions (e.g. `draft` -> `finalized` -> `paid`).
- Monotonic sequential numbering rules and collision mitigation.
- Zod schema validation rules.

Run all unit tests:
```bash
pnpm -r test
```

## 2. End-to-End Tests (Playwright)

Located in `apps/web/e2e/invoice-workflows.spec.ts`.
Covers 14 end-to-end user journeys:
1. Anonymous user creates an invoice.
2. User adds multiple line items.
3. User applies a discount and tax.
4. User previews the invoice in real-time.
5. User downloads and prints the document.
6. User duplicates a document.
7. Local history persists across page reloads.
8. User signs up and completes onboarding.
9. Tenant creates and views customers.
10. Tenant creates and finalizes an invoice.
11. Tenant records a partial payment.
12. Tenant customizes document templates in Brand Studio.
13. Multi-tenant workspace switcher properly switches context.
14. Responsive mobile layouts and drawer navigation.

Run Playwright tests:
```bash
pnpm --filter web test:e2e
```
