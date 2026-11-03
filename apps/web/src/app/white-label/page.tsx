'use client';

import React from 'react';
import Link from 'next/link';
import { APP_CONFIG, PLANS } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { usePlatformPlans } from '@/lib/platform/platform-provider';
import { ArrowRight, Image as ImageIcon, LayoutDashboard, Link2, Lock, Palette, Type } from 'lucide-react';

const INCLUDED = [
  { icon: Type, title: 'Your name', body: `Your company name replaces ${APP_CONFIG.brandName} in the dashboard and on shared invoices.` },
  { icon: ImageIcon, title: 'Your logo', body: 'Your logo appears in the dashboard and on shared invoices.' },
  { icon: Palette, title: 'Your colours', body: 'Buttons and highlights in the dashboard use your brand colour.' },
  { icon: Link2, title: 'Your contact details', body: 'Customers opening a shared invoice see your support email, website and footer text.' },
  { icon: LayoutDashboard, title: 'Set up for you', body: 'We set your brand up in your workspace, and can update it whenever you need.' },
];

export default function WhiteLabelPage() {
  usePlatformPlans();
  const includedOn = (['starter', 'pro', 'enterprise'] as const).filter((id) => PLANS[id].hasWhiteLabel).map((id) => PLANS[id].name);

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-16 px-4 py-14 sm:px-6">
        <section>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Premium feature
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Invoicing <span className="brand-text">under your own brand</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Your team and your customers see your name, logo and colours, not ours.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact">
              <Button size="lg" className="brand-gradient h-12 w-full px-6 text-base font-semibold text-white sm:w-auto">
                Talk to us <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="h-12 w-full px-6 text-base font-medium sm:w-auto">
                See plans
              </Button>
            </Link>
          </div>
          {includedOn.length > 0 && <p className="mt-4 text-sm text-muted-foreground">Included on: {includedOn.join(', ')}.</p>}
        </section>

        <section>
          <h2 className="text-3xl font-semibold tracking-tight">What changes</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED.map(({ icon: Icon, title, body }) => (
              <article key={title} className="card-3d">
                <span className="card-3d__icon"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
