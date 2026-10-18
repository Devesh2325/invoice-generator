'use client';

import React from 'react';
import Link from 'next/link';
import { APP_CONFIG } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Calculator,
  QrCode,
  ShieldCheck,
  Palette,
  FileCheck,
  Users,
  Database,
  ArrowRight,
  Zap,
  Globe,
  Printer,
  RotateCcw,
  Layers,
  Package,
  Building2,
  FilePlus,
  Share2,
} from 'lucide-react';

export default function FeaturesPage() {
  const featureList = [
    {
      icon: Calculator,
      title: 'Arbitrary-Precision Financial Math',
      description:
        'Powered by decimal.js to avoid IEEE 754 floating-point errors. Multi-tier percentage or fixed discounts, compounding tax rules, shipping, and extra charges calculate down to the exact paisa/cent.',
      badge: 'Core Engine',
    },
    {
      icon: FileCheck,
      title: 'Automated India GST & HSN Codes',
      description:
        'Zero manual state code checks. Place of Supply is cross-checked against Supplier State. Same state automatically splits tax into CGST and SGST; different state automatically levies IGST.',
      badge: 'Tax Compliance',
    },
    {
      icon: Package,
      title: 'Products & Inventory Management',
      description:
        'Manage product catalogs, SKU codes, and auto-generated barcodes. Automatically deducts inventory when invoices are finalized, with real-time stock movement history and low-stock alerts.',
      badge: 'Inventory Control',
    },
    {
      icon: Building2,
      title: 'Multi-Tenant White-Label Isolation',
      description:
        'Each tenant gets their own brand logo, company name, custom colors, domain, admin panel, and customers. Strict database-level isolation guarantees zero cross-tenant data leaks.',
      badge: 'White-Label Multi-Tenant',
    },
    {
      icon: QrCode,
      title: 'Verified NPCI UPI QR Codes',
      description:
        'Generates real vector SVG QR codes encoding NPCI-compliant UPI deep links with your VPA, verified payee name, invoice number, and exact balance due for zero-fee instant customer settlements.',
      badge: 'Fintech Rail',
    },
    {
      icon: Share2,
      title: 'Multi-Channel Instant Sharing',
      description:
        'One-click sharing via prefilled WhatsApp (wa.me), prefilled email, Telegram, SMS, and secure tokenized unguessable public invoice links with print and payment support.',
      badge: 'Omni-Share',
    },
    {
      icon: Palette,
      title: '8+ Structurally Diverse Layouts',
      description:
        'Not just color swaps. Choose between Classic Tax, Modern Tech, ClearTax GST, Tally Prime, Zoho Minimal, and Executive templates designed for pixel-perfect PDF rendering.',
      badge: 'Design System',
    },
    {
      icon: Users,
      title: 'Customer Financial Ledger & Activity',
      description:
        'Dedicated customer profiles featuring total invoiced, total collected, outstanding balance, invoice status filters, payment history, and quotes with one-click statements.',
      badge: 'CRM & Accounting',
    },
    {
      icon: ShieldCheck,
      title: 'Server-Enforced Plans & Limits',
      description:
        'Free trial 7-invoice allowance with real-time live usage counters and soft warnings. Upgrade to Pro or Enterprise unlocks unlimited generation and premium template access.',
      badge: 'Cloud Architecture',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-16 space-y-16">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-xs">Feature Deep-Dive</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Built for Modern Commerce & Financial Precision
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every feature in {APP_CONFIG.brandName} is designed to eliminate manual data entry, prevent accounting discrepancies, and accelerate customer payments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureList.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} className="border-border bg-card p-6 rounded-2xl hover:shadow-lg transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {f.badge}
                  </span>
                </div>
                <h3 className="font-bold text-base text-foreground pt-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Clear Next-Step Action Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-muted/30 border border-border text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            Experience the {APP_CONFIG.brandName} Difference
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            Test the live generator in your browser or explore the interactive sandbox demo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/create">
              <Button size="lg" className="text-xs font-bold px-6 bg-primary text-primary-foreground shadow-sm">
                <FilePlus className="w-4 h-4 mr-1.5" /> Open Invoice Studio Free
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="text-xs font-bold px-6 text-indigo-600 border-indigo-200 dark:border-indigo-800">
                Explore Interactive Demo
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="ghost" className="text-xs font-bold px-6">
                Compare Plans
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 {APP_CONFIG.brandName} Cloud Technologies. Built for high-reliability financial workflows.
      </footer>
    </div>
  );
}
