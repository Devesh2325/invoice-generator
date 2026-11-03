'use client';

import React from 'react';
import Link from 'next/link';
import { APP_CONFIG, PLANS } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { usePlatformPlans } from '@/lib/platform/platform-provider';
import { FRONTEND_STACKS, BACKEND_STACKS } from '@/lib/integration/stacks';
import { ArrowRight, BadgeCheck, Calculator, Code2, FileOutput, Globe, Lock, Server } from 'lucide-react';

const STEPS = [
  { title: 'Add the editor', body: 'Paste one script into your page, or use the sample for your framework.' },
  { title: 'Fill it in for your user', body: 'Pass the customer, items and currency, so your users don’t type them twice.' },
  { title: 'Get the invoice back', body: 'When they save, your app receives the finished invoice as data, ready to store on your server.' },
];

const BENEFITS = [
  { icon: Calculator, title: 'Correct totals', body: 'Tax, discounts and rounding are worked out for you in each currency.' },
  { icon: Globe, title: 'Works across countries', body: 'GST, VAT or sales tax labels and fields follow the invoice’s currency.' },
  { icon: FileOutput, title: 'Ready-made downloads', body: 'Your users can download the invoice as PDF, Excel, CSV or PNG.' },
  { icon: Server, title: 'Your data stays yours', body: 'We don’t store embedded invoices. You save them on your own server.' },
];

export default function IntegrationsPage() {
  usePlatformPlans();
  const includedOn = (['starter', 'pro', 'enterprise'] as const).filter((id) => PLANS[id].hasIntegrationDocs).map((id) => PLANS[id].name);

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-16 px-4 py-14 sm:px-6">
        <section>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Premium feature
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Add invoicing to your own product, <span className="brand-text">in any code stack</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Put the {APP_CONFIG.brandName} invoice editor inside your website or app, so your users create invoices without leaving it.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/pricing">
              <Button size="lg" className="brand-gradient h-12 w-full px-6 text-base font-semibold text-white sm:w-auto">
                See plans <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-12 w-full px-6 text-base font-medium sm:w-auto">
                Talk to us
              </Button>
            </Link>
          </div>
          {includedOn.length > 0 && <p className="mt-4 text-sm text-muted-foreground">Included on: {includedOn.join(', ')}.</p>}
        </section>

        <section>
          <h2 className="text-3xl font-semibold tracking-tight">Guides for the tools you use</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="card-3d">
              <span className="card-3d__icon"><Code2 className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="mt-4 text-lg font-semibold">In the browser</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {FRONTEND_STACKS.map((stack) => (
                  <li key={stack.id} className="rounded-full border border-border bg-background px-3 py-1 text-sm">{stack.name}</li>
                ))}
              </ul>
            </div>
            <div className="card-3d">
              <span className="card-3d__icon"><Server className="h-6 w-6" aria-hidden="true" /></span>
              <h3 className="mt-4 text-lg font-semibold">On your server</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {BACKEND_STACKS.map((stack) => (
                  <li key={stack.id} className="rounded-full border border-border bg-background px-3 py-1 text-sm">{stack.name}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            The editor runs in any web page, so other languages and frameworks work the same way. Native mobile apps can show it in a web view.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <div className="text-sm font-semibold text-primary">Step {index + 1}</div>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-3xl font-semibold tracking-tight">What you get</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-8 text-center sm:p-12">
          <BadgeCheck className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-bold tracking-tight">The full guide comes with your plan</h2>
          <p className="mx-auto mt-2 max-w-xl leading-relaxed text-muted-foreground">
            Paid plans get code samples for every stack above, all the options, and a live demo in the dashboard.
          </p>
          <Link href="/signup" className="mt-6 inline-block">
            <Button size="lg" className="brand-gradient h-12 px-6 text-base font-semibold text-white">
              Get started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
