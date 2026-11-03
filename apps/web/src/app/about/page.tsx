'use client';

import React from 'react';
import Link from 'next/link';
import { APP_CONFIG } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <PublicHeader />

      <main className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Invoicing should be the easy part</h1>
        <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
          <p>
            We built {APP_CONFIG.brandName} so small businesses and freelancers can send a correct, professional invoice without
            wrestling with spreadsheets or complicated accounting software.
          </p>
          <p>
            You add the details and we handle the rest: tax, totals, rounding and a layout that reflects well on your business, in whichever country and currency you work.
          </p>
        </div>

        <Link href="/create" className="mt-8 inline-block">
          <Button size="lg" className="h-12 bg-primary px-6 text-base font-medium text-white hover:bg-primary-hover">
            Create an invoice <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </main>

      <PublicFooter />
    </div>
  );
}
