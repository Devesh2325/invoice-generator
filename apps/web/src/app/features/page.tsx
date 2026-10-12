import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';

export const metadata = {
  title: 'Features — BillCraft Invoicing & Payment Studio',
  description:
    'Explore the deep feature set of BillCraft: decimal-safe financial calculations, GST intra/inter-state automation, verified UPI QR codes, multi-currency, and 8+ templates.',
};

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
      title: 'Automated India GST (CGST/SGST vs. IGST)',
      description:
        'Zero manual state code checks. Place of Supply is cross-checked against Supplier State. Same state automatically splits tax into CGST and SGST; different state automatically levies IGST.',
      badge: 'Tax Compliance',
    },
    {
      icon: QrCode,
      title: 'Verified NPCI UPI QR Codes',
      description:
        'Generates real vector SVG QR codes encoding NPCI-compliant UPI deep links with your VPA, verified payee name, invoice number, and exact balance due for zero-fee instant customer settlements.',
      badge: 'Fintech',
    },
    {
      icon: Palette,
      title: '8+ Structurally Diverse Layouts',
      description:
        'Not just color palette swaps. Templates vary in fundamental layout structure: Classic, Modern, Minimal, Bold Header, Corporate, Creative, Compact, and Elegant.',
      badge: 'Design System',
    },
    {
      icon: Layers,
      title: 'Unified Invoices, POs & Estimates',
      description:
        'Create Tax Invoices (INV-), Purchase Orders (PO-), and Estimates / Quotes (EST-). Convert an approved Estimate into an Invoice with a single click, transferring all line items and customer records.',
      badge: 'Workflow',
    },
    {
      icon: Users,
      title: 'Multi-Tenant Teams & Role Hierarchy',
      description:
        'Collaborate with team members across Owner, Admin, Editor, and Viewer roles. Grant access to accountants or staff while protecting sensitive settings and preserving an immutable audit trail.',
      badge: 'Collaboration',
    },
    {
      icon: Database,
      title: 'Offline-First IndexedDB Persistence',
      description:
        'Work uninterrupted with zero connectivity. Documents are persisted locally in browser IndexedDB storage and seamlessly synchronized with cloud workspaces when online.',
      badge: 'Reliability',
    },
    {
      icon: Globe,
      title: 'Multi-Currency & International Locales',
      description:
        'Native formatting for INR (₹), USD ($), EUR (€), GBP (£), AED, SGD, and more with locale-sensitive number grouping (e.g., Indian lakhs/crores or Western millions).',
      badge: 'Global Commerce',
    },
    {
      icon: RotateCcw,
      title: 'Round-Off & Precision Controls',
      description:
        'Configure configurable round-off adjustment (nearest whole unit, banker’s rounding, floor, ceiling) and decimal precision from 0 to 4 places.',
      badge: 'Accounting',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-xl text-primary tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>BillCraft</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="text-xs font-semibold">Pricing</Button>
          </Link>
          <Link href="/create">
            <Button size="sm" className="text-xs font-bold">Create Invoice</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-16 space-y-16">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-xs">Feature Deep-Dive</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Built for Modern Commerce & Financial Precision
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every feature in BillCraft is designed to eliminate manual data entry, prevent accounting discrepancies, and accelerate customer payments.
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

        <div className="p-8 sm:p-12 rounded-3xl bg-muted/30 border border-border text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            Experience the Invoicing Difference
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            Test the live generator in your browser. No sign-up required to create and download your first invoice.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/create">
              <Button size="lg" className="text-xs font-bold px-6">
                Open Invoice Studio <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 BillCraft Invoicing. Built for high-reliability financial workflows.
      </footer>
    </div>
  );
}
