# Production Deployment Guide

## Production Build

To generate the optimized production build of BillCraft:

```bash
pnpm --filter web build
```

This compiles all TypeScript code, validates types, generates static routes, and produces optimized bundles in `apps/web/.next`.

## Deployment Targets

### 1. Vercel (Recommended)
- Root Directory: `apps/web` or Monorepo Root with `pnpm` enabled.
- Build Command: `pnpm --filter web build`
- Output Directory: `apps/web/.next`

### 2. Docker / Node.js Container
A production container can run:
```bash
node apps/web/.next/standalone/server.js
```
or standard Next.js production server:
```bash
pnpm --filter web start
```

## Production Verification Checklist

- [x] Strict TypeScript type checks passing (`tsc --noEmit`).
- [x] Zero build errors or missing dynamic chunks.
- [x] RLS policies applied to Supabase database.
- [x] Resend API key configured for production email dispatch.
- [x] Custom domain DNS CNAME records pointing to production host.
