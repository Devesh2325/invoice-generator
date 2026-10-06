# Local Setup & Installation Guide

## Prerequisites

- **Node.js:** v20.x or higher
- **pnpm:** v9.x or higher
- **Git**

## Quick Start

1. **Clone the repository and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run tests across all monorepo packages:**
   ```bash
   pnpm -r test
   ```

3. **Verify strict TypeScript type checking:**
   ```bash
   pnpm --filter web typecheck
   ```

4. **Launch the development server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database & Supabase Setup (Optional for Cloud Mode)

The application includes an instant in-memory development adapter that requires zero credentials to prototype. If you wish to connect to a live Supabase instance:

1. Copy `.env.example` to `apps/web/.env.local`:
   ```bash
   cp .env.example apps/web/.env.local
   ```
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Apply SQL migrations:
   ```bash
   npx supabase db push
   ```
   or run `supabase/migrations/20261007000000_multi_tenant_schema.sql` and `supabase/seed.sql` in the Supabase SQL editor.
