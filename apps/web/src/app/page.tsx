import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  Download,
  Palette,
  Layers,
  Database,
  ArrowRight,
  Check,
  Globe,
  Clock,
  Printer,
} from 'lucide-react';
import { TEMPLATES } from '@invoice/theme';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-black text-xl text-primary tracking-tight">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>BillCraft</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#templates" className="hover:text-primary transition-colors">
              Templates
            </Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">
              Pricing
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex font-semibold">
              Sign Up
            </Button>
          </Link>
          <Link href="/create">
            <Button size="sm" className="bg-primary hover:bg-primary-hover text-white shadow-sm font-semibold">
              Create Invoice
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 lg:px-12 max-w-7xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-primary text-xs font-semibold">
          <Zap className="h-3.5 w-3.5" /> India GST Ready (CGST, SGST, IGST) & Multi-Currency Billing
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
          Generate Professional GST & Business Invoices{' '}
          <span className="text-primary underline decoration-primary/30 decoration-wavy">
            In Seconds
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal">
          Create, customize, preview, and download high-precision GST tax invoices, estimates, purchase orders, and receipts with automatic CGST/SGST & IGST calculation.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/create">
            <Button size="lg" className="bg-primary hover:bg-primary-hover text-white shadow-md text-base px-8 h-12 font-bold flex items-center gap-2">
              <FileText className="h-5 w-5" /> Create Invoice Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#templates">
            <Button variant="outline" size="lg" className="h-12 px-6 text-base font-semibold">
              <Palette className="h-5 w-5 mr-2 text-slate-500" /> Explore 17 Templates
            </Button>
          </Link>
        </div>

        {/* Live Mockup Teaser */}
        <div className="pt-12 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 sm:p-6 text-left relative overflow-hidden group">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono text-slate-400 ml-2">BillCraft Live Financial Engine</span>
              </div>
              <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
                Decimal-Safe Calculations
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="text-xs text-slate-500 font-semibold uppercase">Document Number</div>
                <div className="text-lg font-black text-slate-900">INV-2026-00042</div>
                <div className="text-xs text-emerald-600 font-medium">✓ Collision-safe sequential counter</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="text-xs text-slate-500 font-semibold uppercase">Total Amount</div>
                <div className="text-lg font-black text-slate-900">$14,850.00 USD</div>
                <div className="text-xs text-blue-600 font-medium">Includes 10% tax breakdown</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="text-xs text-slate-500 font-semibold uppercase">Storage Architecture</div>
                <div className="text-lg font-black text-slate-900">Browser IndexedDB</div>
                <div className="text-xs text-slate-600 font-medium">100% Offline, Zero data leakage</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Link href="/create">
                <Button size="sm" variant="outline" className="text-xs">
                  Launch Interactive Builder →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" className="py-20 bg-white border-y border-slate-200 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Engineered for Speed, Precision, & Privacy
            </h2>
            <p className="text-slate-600">
              Unlike ordinary invoice makers that push paywalls after 1 document, BillCraft provides enterprise capabilities for free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Offline-First IndexedDB</h3>
                <p className="text-sm text-slate-600">
                  Every invoice, draft, customer, and catalog item is preserved safely in your browser's IndexedDB. Work completely offline with zero latency.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Arbitrary Decimal Safety</h3>
                <p className="text-sm text-slate-600">
                  Built using decimal-safe arithmetic. No floating-point rounding errors. Supports multi-rate taxes, line discounts, fixed fees, and global currencies.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Printer className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Pixel-Perfect PDF & Print</h3>
                <p className="text-sm text-slate-600">
                  One-click client-side PDF downloads and print styles with automatic multi-page breaks, page margins, and crisp vector typography.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Templates Showcase */}
      <section id="templates" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
            Document Design Studio
          </Badge>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            8 Curated Financial Document Templates
          </h2>
          <p className="text-slate-600">
            Real dynamic templates that adapt to your brand identity, colors, and document types.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(TEMPLATES).map((tmpl) => (
            <Card key={tmpl.id} className="border-slate-200 hover:border-primary/50 transition-all flex flex-col justify-between">
              <CardContent className="p-5 space-y-3">
                <div
                  className="h-28 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-inner"
                  style={{ backgroundColor: tmpl.defaultTokens.primaryColor }}
                >
                  {tmpl.name}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{tmpl.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tmpl.description}</p>
                </div>
              </CardContent>
              <div className="p-5 pt-0">
                <Link href={`/create?template=${tmpl.id}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Use This Template
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-100 border-t border-slate-200 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600">
              Start completely free with unlimited local documents. Upgrade when you need team collaboration and cloud backup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Anonymous Tier */}
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Anonymous Mode</h3>
                  <p className="text-xs text-slate-500 mt-1">For freelancers & immediate invoicing</p>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  $0 <span className="text-sm font-normal text-slate-500">/ forever</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-3">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Unlimited invoices & quotes</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Local IndexedDB persistence</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> 8 Document templates</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> PDF download & Print</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> JSON backup export/import</li>
                </ul>
                <Link href="/create" className="block">
                  <Button variant="outline" className="w-full font-semibold">Start Building Free</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Cloud Pro */}
            <Card className="border-primary ring-2 ring-primary/20 bg-white shadow-xl relative">
              <div className="absolute -top-3 right-6 bg-primary text-white text-[11px] font-bold px-3 py-0.5 rounded-full">
                RECOMMENDED
              </div>
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Cloud Business</h3>
                  <p className="text-xs text-slate-500 mt-1">For growing teams & multi-tenancy</p>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  $19 <span className="text-sm font-normal text-slate-500">/ month</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-3">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Everything in Anonymous</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Cloud database synchronization</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Multi-tenant workspace switcher</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Team roles (Admin, Accountant, Staff)</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Automated Resend email delivery</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Financial reporting & CSV exports</li>
                </ul>
                <Link href="/signup" className="block">
                  <Button className="w-full bg-primary hover:bg-primary-hover text-white font-semibold">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            {/* White-Label Enterprise */}
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="font-bold text-xl text-slate-900">White-Label Enterprise</h3>
                  <p className="text-xs text-slate-500 mt-1">For SaaS resellers & agencies</p>
                </div>
                <div className="text-3xl font-black text-slate-900">
                  $89 <span className="text-sm font-normal text-slate-500">/ month</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-3">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Everything in Cloud Business</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Custom domain provisioning</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Complete white-label branding & logo</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Custom SMTP / Resend routing</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Audit logs & security posture</li>
                </ul>
                <Link href="/signup" className="block">
                  <Button variant="outline" className="w-full font-semibold">Contact Enterprise</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 px-6 lg:px-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>BillCraft Invoice Generator</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/create" className="hover:text-white">Create Invoice</Link>
            <Link href="/history" className="hover:text-white">Local History</Link>
            <Link href="/login" className="hover:text-white">Sign In</Link>
            <Link href="/signup" className="hover:text-white">Sign Up</Link>
          </div>
          <div className="text-slate-500">
            © {new Date().getFullYear()} BillCraft Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
