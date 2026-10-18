'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, Check, X, ArrowRight, HelpCircle, FilePlus, ShieldCheck } from 'lucide-react';
import { APP_CONFIG } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';

export default function PricingPage() {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Starter / Free Trial',
      description: 'Ideal for solo freelancers and contractors evaluating the platform.',
      price: period === 'monthly' ? '₹0' : '₹0',
      periodText: 'up to 7 invoices',
      cta: 'Start Free Trial',
      ctaHref: '/create',
      ctaVariant: 'outline' as const,
      popular: false,
      highlights: [
        `${APP_CONFIG.trialInvoiceLimit} Invoices trial allowance`,
        'India GST auto-split (CGST/SGST/IGST)',
        'Verified scannable UPI QR codes',
        '3 Core clean templates',
        'PDF export & direct print',
        'Multi-channel sharing (Email, WhatsApp, SMS)',
      ],
    },
    {
      name: 'Professional',
      description: 'For growing studios, consulting firms, and agencies requiring full power.',
      price: period === 'monthly' ? '₹799' : '₹639',
      periodText: period === 'monthly' ? 'per month, billed monthly' : 'per month, billed annually',
      cta: 'Upgrade to Pro',
      ctaHref: '/signup',
      ctaVariant: 'default' as const,
      popular: true,
      highlights: [
        'Unlimited Invoices & Estimates',
        'All 8+ premium designer templates',
        'Products & Inventory Module (Stock, SKU, Barcodes)',
        'Customer Profile & Financial Ledger views',
        'Cloud synchronization & auto-backup',
        'Remove watermark from PDFs',
        'Up to 5 team members (Roles & Permissions)',
      ],
    },
    {
      name: 'Enterprise / White-Label',
      description: 'For multi-entity businesses and agencies wanting complete white-label software.',
      price: period === 'monthly' ? '₹2,499' : '₹1,999',
      periodText: period === 'monthly' ? 'per month, billed monthly' : 'per month, billed annually',
      cta: 'Launch White-Label Workspace',
      ctaHref: '/contact',
      ctaVariant: 'outline' as const,
      popular: false,
      highlights: [
        'Everything in Professional',
        'Complete White-Label multi-tenant isolation',
        'Custom domain (e.g. billing.yourdomain.com)',
        'Custom branding, logo & client portal',
        'Unlimited team members & workspaces',
        'Priority 24/7 dedicated support & SLA',
      ],
    },
  ];

  const comparisonRows = [
    { feature: 'Trial Allowance', starter: '7 Invoices', pro: 'Unlimited', enterprise: 'Unlimited' },
    { feature: 'Cloud Workspaces & Sync', starter: false, pro: true, enterprise: true },
    { feature: 'India GST & State Code Engine', starter: true, pro: true, enterprise: true },
    { feature: 'Verified UPI QR Codes', starter: true, pro: true, enterprise: true },
    { feature: 'Included Designer Templates', starter: '3 Templates', pro: 'All 8+ Templates', enterprise: 'All + Custom' },
    { feature: 'Products & Inventory Module', starter: false, pro: true, enterprise: true },
    { feature: 'Customer Detail & Activity Ledgers', starter: false, pro: true, enterprise: true },
    { feature: 'White-Label Multi-Tenant Isolation', starter: false, pro: false, enterprise: true },
    { feature: 'Custom Domain (CNAME)', starter: false, pro: false, enterprise: true },
    { feature: 'Remove Watermark', starter: false, pro: true, enterprise: true },
    { feature: 'Support Level', starter: 'Community', pro: 'Priority Email', enterprise: 'Dedicated 24/7' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-16 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-xs">Pricing & Plans</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Predictable Pricing for High-Performance Invoicing
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose the plan that fits your business scale. No surprise fees. Upgrade or cancel anytime.
          </p>

          <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-muted/50 border border-border text-xs font-semibold mt-4">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                period === 'monthly' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                period === 'yearly' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              <span>Annual Billing</span>
              <span className="rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[10px] font-bold">
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
              className={`border p-6 rounded-2xl flex flex-col justify-between space-y-6 bg-card relative ${
                p.popular ? 'border-primary ring-2 ring-primary shadow-xl' : 'border-border'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-normal">{p.description}</p>
                </div>

                <div>
                  <div className="text-3xl font-black text-foreground">{p.price}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{p.periodText}</div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border text-xs">
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
                  className={`w-full text-xs font-bold ${
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
            <h2 className="text-2xl font-bold text-foreground">Detailed Feature Comparison</h2>
            <p className="text-xs text-muted-foreground">Compare all capabilities across plans</p>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-bold text-foreground">
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4 text-center w-36">Starter</th>
                  <th className="py-3 px-4 text-center w-36 text-primary">Professional</th>
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
        <div className="p-8 sm:p-10 rounded-3xl bg-muted/30 border border-border text-center space-y-4">
          <h2 className="text-2xl font-black text-foreground">Start with 7 free invoices today</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            No credit card required. Generate tax invoices, track inventory, or test the interactive demo right now.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/create">
              <Button size="sm" className="font-bold text-xs bg-primary text-primary-foreground">
                <FilePlus className="w-3.5 h-3.5 mr-1.5" /> Start Free Invoicing
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="sm" className="font-bold text-xs text-indigo-600 border-indigo-200 dark:border-indigo-800">
                Launch Sandbox Demo
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 {APP_CONFIG.brandName} Cloud Technologies. Simple transparent billing with zero hidden charges.
      </footer>
    </div>
  );
}
