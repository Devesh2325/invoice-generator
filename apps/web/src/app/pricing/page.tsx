'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, Check, X, ArrowRight, HelpCircle, FilePlus, ShieldCheck } from 'lucide-react';
import { APP_CONFIG, PLANS } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

export default function PricingPage() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Free',
      description: `For trying ${APP_CONFIG.brandName} and occasional invoicing.`,
      price: '₹0',
      periodText: `up to ${APP_CONFIG.trialInvoiceLimit} documents`,
      cta: 'Start free',
      ctaHref: '/signup',
      ctaVariant: 'outline' as const,
      popular: false,
      highlights: [
        `${APP_CONFIG.trialInvoiceLimit} documents`,
        'Automatic GST',
        'UPI QR codes',
        'Starter templates',
        'PDF download and print',
      ],
    },
    {
      name: 'Pro',
      description: 'For growing businesses that invoice regularly.',
      price: `₹${(period === 'monthly' ? PLANS.pro.priceMonthly : PLANS.pro.priceYearly).toLocaleString('en-IN')}`,
      periodText: period === 'monthly' ? 'per month, billed monthly' : 'per month, billed yearly',
      cta: 'Choose Pro',
      ctaHref: '/signup',
      ctaVariant: 'default' as const,
      popular: true,
      highlights: [
        'Unlimited documents',
        'All templates',
        'Products and stock tracking',
      'Integration Docs',
        `Up to ${PLANS.pro.maxMembers} users`,
      ],
    },
    {
      name: 'Enterprise',
      description: 'For businesses that want invoicing under their own brand.',
      price: `₹${(period === 'monthly' ? PLANS.enterprise.priceMonthly : PLANS.enterprise.priceYearly).toLocaleString('en-IN')}`,
      periodText: period === 'monthly' ? 'per month, billed monthly' : 'per month, billed yearly',
      cta: 'Contact us',
      ctaHref: '/contact',
      ctaVariant: 'outline' as const,
      popular: false,
      highlights: ['Everything in Pro', 'White-label branding', 'Unlimited users'],
    },
  ];

  const comparisonRows = [
    { feature: 'Documents', starter: String(APP_CONFIG.trialInvoiceLimit), pro: 'Unlimited', enterprise: 'Unlimited' },
    { feature: 'Automatic GST', starter: true, pro: true, enterprise: true },
    { feature: 'UPI QR codes', starter: true, pro: true, enterprise: true },
    { feature: 'Templates', starter: 'Starter set', pro: 'All', enterprise: 'All' },
    { feature: 'Products and stock', starter: false, pro: true, enterprise: true },
    { feature: 'Users', starter: String(PLANS.starter.maxMembers), pro: `Up to ${PLANS.pro.maxMembers}`, enterprise: 'Unlimited' },
    { feature: 'White-label branding', starter: false, pro: false, enterprise: true },
  ];

  return (
    <div className="min-h-screen text-foreground flex flex-col font-sans">
      <PublicHeader />

      <main className="w-full min-w-0 max-w-6xl mx-auto px-4 sm:px-8 py-16 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-sm">Pricing</Badge>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
            Simple pricing
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Start free and upgrade when you need more.
          </p>

          <div className="inline-flex flex-wrap items-center justify-center gap-2 p-1 rounded-xl bg-muted/50 border border-border text-sm font-semibold mt-4">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                period === 'monthly' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                period === 'yearly' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              <span>Yearly</span>
              <span className="rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-sm font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p, idx) => (
            <Card
              key={idx}
              className={`border p-6 rounded-xl flex flex-col justify-between space-y-6 bg-card relative ${
                p.popular ? 'border-primary ring-2 ring-primary shadow-xl' : 'border-border'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="space-y-4 !mt-0">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-normal">{p.description}</p>
                </div>

                <div>
                  <div className="text-3xl font-semibold text-foreground">{p.price}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{p.periodText}</div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border text-sm">
                  {p.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link href={p.ctaHref}>
                <Button
                  variant={p.ctaVariant}
                  className={`w-full text-sm font-bold ${
                    p.popular ? 'bg-primary text-primary-foreground shadow-sm' : ''
                  }`}
                >
                  {p.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Matrix */}
        <div className="space-y-6 pt-8">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Compare plans</h2>
            <p className="text-sm text-muted-foreground">See what each plan includes.</p>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-xs">
            <table className="w-full min-w-[560px] text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-bold text-foreground">
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4 text-center w-36">Free</th>
                  <th className="py-3 px-4 text-center w-36 text-primary">Pro</th>
                  <th className="py-3 px-4 text-center w-36">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium text-foreground">{row.feature}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      {typeof row.starter === 'boolean' ? (
                        row.starter ? (
                          <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )
                      ) : (
                        row.starter
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-primary">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? (
                          <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )
                      ) : (
                        row.pro
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-foreground">
                      {typeof row.enterprise === 'boolean' ? (
                        row.enterprise ? (
                          <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        )
                      ) : (
                        row.enterprise
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clear Next-Step Action Banner */}
        <div className="p-8 sm:p-10 rounded-xl bg-muted/30 border border-border text-center space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Start with the free plan</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Create your first invoice in a few minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/create">
              <Button size="sm" className="font-bold text-sm bg-primary text-primary-foreground">
                <FilePlus className="w-3.5 h-3.5 mr-1.5" /> Start Free Invoicing
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="outline" size="sm" className="font-bold text-sm">
                Browse Templates
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
