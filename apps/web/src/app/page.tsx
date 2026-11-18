'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  APP_CONFIG,
  CURRENCIES,
  PLANS,
  calculateDocument,
  detectCurrency,
  getCurrencyTaxProfile,
  formatCurrency,
  isTemplateAllowedForPlan,
} from '@invoice/core';
import { TEMPLATES } from '@invoice/theme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { useTenant } from '@/lib/auth/tenant-context';
import { usePlatformPlans } from '@/lib/platform/platform-provider';
import {
  ArrowRight,
  Calculator,
  Check,
  ChevronDown,
  CreditCard,
  Download,
  Globe,
  QrCode,
  Users,
  Sparkles,
  Zap,
  ShieldCheck,
  Building2,
  FileText,
  CheckCircle2,
  Share2,
} from 'lucide-react';

const SAMPLE_COUNTRIES = [
  { currency: 'INR', label: 'India (GST)', taxRate: 18, unit: 50 },
  { currency: 'USD', label: 'USA (Sales Tax)', taxRate: 8, unit: 1 },
  { currency: 'GBP', label: 'UK (VAT)', taxRate: 20, unit: 1 },
  { currency: 'SGD', label: 'Singapore (GST)', taxRate: 9, unit: 1 },
];

const HIGHLIGHTED_FEATURES = [
  {
    icon: Zap,
    badge: 'Zero Sign-Up Required',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    title: 'Instant Generator — Use Without Account',
    body: 'Create and download print-ready tax invoices in 30 seconds. No credit card, no password, no email verification needed to get started.',
    cta: 'Create invoice now',
    href: '/create',
  },
  {
    icon: Calculator,
    badge: 'Indian GST & Global Tax',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    title: 'Automatic Dual-State Tax Intelligence',
    body: 'Automatically calculates CGST + SGST (intra-state) or IGST (inter-state) based on client states, with HSN/SAC codes and reverse charge rules.',
    cta: 'Test GST calculation',
    href: '/create',
  },
  {
    icon: QrCode,
    badge: 'UPI & Instant Pay',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    title: 'Scan-To-Pay UPI QR Codes',
    body: 'Adds dynamic UPI QR codes directly onto your invoice. Customers scan using Google Pay, PhonePe, Paytm, or BHIM to pay instantly.',
    cta: 'Add UPI details',
    href: '/create',
  },
  {
    icon: Download,
    badge: 'Mobile & Print Perfect',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    title: 'Crisp Vector PDFs & Mobile Share Links',
    body: 'Download pixel-perfect A4 PDFs, share securely via WhatsApp with native Web Share on mobile, or export to Excel and CSV.',
    cta: 'Preview invoice',
    href: '/create',
  },
  {
    icon: Globe,
    badge: '150+ Currencies',
    badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    title: 'Multi-Currency & Exact Decimals',
    body: 'Supports INR, USD, EUR, GBP, AED, SGD and 150+ currencies with exact financial rounding and deterministic arithmetic.',
    cta: 'Select currency',
    href: '/create',
  },
  {
    icon: Building2,
    badge: 'Company Growth',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    title: 'Customer Ledger & Company Onboarding',
    body: 'Sign up to unlock your business profile, customer address book, product catalog, payment tracking, and automated sequential numbering.',
    cta: 'Set up company profile',
    href: '/signup',
  },
];

const FAQS = [
  {
    q: 'Can I create an invoice without signing up or creating an account?',
    a: 'Yes, absolutely! You can immediately use Invoxa without signing in. Simply enter your bill-to details, line items, and taxes, and click Download PDF or Print. Create a free account only when you want to save customer profiles, product catalogs, and invoice history.',
  },
  {
    q: 'How does Indian GST calculation work in Invoxa?',
    a: 'When billing in INR, Invoxa checks the supplier state and customer state. If both states match, it splits the tax into 50% CGST and 50% SGST. If they differ, it applies IGST. You can also customize HSN codes, discount modes, and round-offs.',
  },
  {
    q: 'What happens after I sign up for an account?',
    a: 'After signing up, you are guided through a simple 3-step company onboarding flow: set your legal trading name and currency, add your GSTIN / Tax ID and address, and choose your invoice prefix rules. Once complete, your dashboard is ready with customer management and payment tracking.',
  },
  {
    q: 'Can customers pay me via UPI through the invoice?',
    a: 'Yes! When you input your UPI ID or VPA (e.g. yourname@upi), Invoxa generates an interactive, compliant UPI QR code embedded directly onto the PDF. Customers on mobile or paper can scan it with GPay, PhonePe, Paytm, or BHIM to pay immediately.',
  },
  {
    q: 'Can I remove the Invoxa watermark from my invoices?',
    a: 'Free invoices include a discreet watermark. When you upgrade to our Professional or Enterprise plan, watermarks are completely removed from all generated PDFs and shared links.',
  },
];

function formatPrice(price: number) {
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function LandingPage() {
  const { user } = useTenant();
  usePlatformPlans();
  const [sample, setSample] = useState(SAMPLE_COUNTRIES[0]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const local = detectCurrency(Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.language);
    const match = SAMPLE_COUNTRIES.find((country) => country.currency === local);
    if (match) setSample(match);
  }, []);

  const sampleItems = useMemo(
    () => [
      { id: 'a', description: 'Enterprise Web Application Consulting', quantity: 1, unitPrice: 1500 * sample.unit, taxRate: sample.taxRate },
      { id: 'b', description: 'Cloud Infrastructure & Security Setup', quantity: 2, unitPrice: 500 * sample.unit, taxRate: sample.taxRate },
    ],
    [sample]
  );

  const { summary } = useMemo(
    () => calculateDocument({ currency: sample.currency, items: sampleItems }),
    [sample, sampleItems]
  );
  const sampleProfile = getCurrencyTaxProfile(sample.currency);

  const featuredTemplates = useMemo(
    () =>
      Object.values(TEMPLATES)
        .sort(
          (a, b) =>
            Number(isTemplateAllowedForPlan('starter', b.id)) -
            Number(isTemplateAllowedForPlan('starter', a.id))
        )
        .slice(0, 8),
    []
  );

  const plans = [
    {
      name: 'Free Starter',
      price: formatPrice(0),
      note: 'Ideal for instant invoicing without signing in',
      badge: '100% Free',
      features: [
        `${APP_CONFIG.trialInvoiceLimit} documents per workspace`,
        'Instant PDF generation & browser printing',
        'Automatic GST (CGST/SGST/IGST) math',
        'UPI QR code scan-and-pay support',
        'Standard Invoxa watermark',
        '1 Workspace user',
      ],
      cta: 'Start Free — No Card Needed',
      href: '/create',
      featured: false,
    },
    {
      name: 'Professional',
      price: formatPrice(APP_CONFIG.plans.pro.price),
      note: 'For freelancers, agencies & growing businesses',
      badge: 'Most Popular',
      features: [
        'Unlimited invoices, estimates & credit notes',
        'All 8+ premium template layouts',
        'No watermark on exported PDFs',
        'Product & inventory barcode tracking',
        'Customer address book & balance tracking',
        'Priority email & WhatsApp support',
        `Up to ${PLANS.pro.maxMembers} team members`,
      ],
      cta: 'Choose Professional',
      href: '/signup',
      featured: true,
    },
    {
      name: 'Enterprise',
      price: formatPrice(APP_CONFIG.plans.enterprise.price),
      note: 'For high-volume companies & established businesses',
      badge: 'Maximum Scale',
      features: [
        'Everything included in Professional',
        'Custom brand styling & accent themes',
        'High-volume bulk invoice processing',
        'Full financial audit trails & reporting',
        'Dedicated account manager',
        'Unlimited workspace members',
      ],
      cta: 'Choose Enterprise',
      href: '/signup',
      featured: false,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <PublicHeader />

      <main className="flex-1">
        {/* ==================================================================== */}
        {/* HERO SECTION WITH MODERN 3D PERSPECTIVE PREVIEW */}
        {/* ==================================================================== */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
          {/* Ambient Lighting & Mesh Gradients */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-indigo-500/25 via-purple-500/20 to-pink-500/15 blur-[120px] pointer-events-none rounded-full" />
          <div className="absolute top-1/2 -right-40 w-[450px] h-[450px] bg-primary/15 blur-[100px] pointer-events-none rounded-full" />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
              
              {/* Left Column: Hero Copy & Actions */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-xs backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  <span>Start Free Without Signing In &bull; Instant PDF & UPI QR</span>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
                  Professional Invoices in Seconds,{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Without Any Hassle
                  </span>
                </h1>

                <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-xl mx-auto lg:mx-0">
                  Generate beautiful GST and international tax invoices on the fly. Download high-definition PDFs, accept UPI payments directly, and calculate exact tax splits — completely free to start.
                </p>

                {/* Primary Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                  <Link href="/create" className="w-full sm:w-auto">
                    <Button size="lg" className="h-13 w-full sm:w-auto px-7 text-base font-bold text-white brand-gradient shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all rounded-xl gap-2">
                      <Zap className="h-5 w-5 fill-current" />
                      <span>Create Free Invoice</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>

                  <Link href={user ? '/dashboard' : '/signup'} className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="h-13 w-full sm:w-auto px-6 text-base font-semibold border-slate-300 dark:border-slate-700 hover:bg-accent rounded-xl gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>{user ? 'Open Dashboard' : 'Company Sign Up'}</span>
                    </Button>
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>No sign-in required to start</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Auto CGST / SGST / IGST</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Instant UPI QR</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3D Floating Interactive Invoice Card */}
              <div className="lg:col-span-6 relative flex justify-center">
                {/* Decorative 3D Floating Pills */}
                <div className="absolute -top-5 right-2 z-20 hidden sm:flex items-center gap-2 rounded-xl border border-border/80 bg-background/90 px-3.5 py-2 text-xs font-semibold shadow-xl backdrop-blur-md animate-bounce duration-1000">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-foreground">⚡ Instant PDF Ready</span>
                </div>

                <div className="absolute -bottom-4 left-0 z-20 hidden sm:flex items-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/95 dark:bg-slate-900/95 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-xl backdrop-blur-md">
                  <QrCode className="h-4 w-4 text-indigo-600" />
                  <span>UPI Scan-To-Pay Active</span>
                </div>

                {/* 3D Perspective Card Container */}
                <div
                  className="w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 sm:p-7 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-indigo-500/10"
                  style={{
                    transform: 'perspective(1000px) rotateY(-2.5deg) rotateX(1.5deg)',
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
                    <div>
                      <div className="text-xs font-bold text-primary uppercase tracking-wider">Live Preview</div>
                      <h3 className="text-base font-bold text-foreground">Tax Invoice #INV-2026-00042</h3>
                    </div>

                    {/* Country Selector */}
                    <div className="inline-flex rounded-lg bg-muted p-1 text-xs" role="group" aria-label="Sample country">
                      {SAMPLE_COUNTRIES.map((option) => (
                        <button
                          key={option.currency}
                          type="button"
                          aria-pressed={sample.currency === option.currency}
                          onClick={() => setSample(option)}
                          className={`rounded-md px-2 py-1 font-semibold transition-all ${
                            sample.currency === option.currency
                              ? 'bg-background text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Parties Details */}
                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-400 block uppercase text-[10px]">Billed By (Seller)</span>
                      <span className="font-bold text-foreground block text-sm">Shivam Logistics Ltd.</span>
                      <span className="text-muted-foreground">GSTIN: 09AAACS1429B1ZB</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-400 block uppercase text-[10px]">Billed To (Client)</span>
                      <span className="font-bold text-foreground block text-sm">Suchi Tech Pvt Ltd</span>
                      <span className="text-muted-foreground">State: 09 - Uttar Pradesh</span>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="mt-4 overflow-hidden rounded-lg border border-border/60">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 text-left text-muted-foreground">
                        <tr>
                          <th className="py-2 px-3 font-semibold">Description</th>
                          <th className="py-2 px-2 text-right font-semibold">Qty</th>
                          <th className="py-2 px-3 text-right font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {sampleItems.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 px-3 font-medium text-foreground">{item.description}</td>
                            <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">{item.quantity}</td>
                            <td className="py-2 px-3 text-right tabular-nums font-semibold text-foreground">
                              {formatCurrency(item.quantity * item.unitPrice, sample.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Math Breakdown */}
                  <dl className="mt-4 ml-auto space-y-1.5 text-xs max-w-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <dt>Taxable Amount</dt>
                      <dd className="tabular-nums font-medium">{formatCurrency(summary.taxableSubtotal, sample.currency)}</dd>
                    </div>
                    {sample.currency === 'INR' ? (
                      <>
                        <div className="flex justify-between text-muted-foreground">
                          <dt>CGST (9%)</dt>
                          <dd className="tabular-nums font-medium">{formatCurrency(summary.totalTax / 2, sample.currency)}</dd>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <dt>SGST (9%)</dt>
                          <dd className="tabular-nums font-medium">{formatCurrency(summary.totalTax / 2, sample.currency)}</dd>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-muted-foreground">
                        <dt>{sampleProfile.taxLabel} ({sample.taxRate}%)</dt>
                        <dd className="tabular-nums font-medium">{formatCurrency(summary.totalTax, sample.currency)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border/80 pt-2 text-sm font-bold text-foreground">
                      <dt>Final Payable</dt>
                      <dd className="tabular-nums text-primary">{formatCurrency(summary.grandTotal, sample.currency)}</dd>
                    </div>
                  </dl>

                  {/* Bottom Action inside card */}
                  <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> 100% Tax Compliant
                    </span>
                    <Link href="/create">
                      <Button size="sm" className="h-8 text-xs font-semibold brand-gradient text-white">
                        Generate This Invoice →
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* HIGHLIGHTED KEY FEATURES SECTION (3D CARDS) */}
        {/* ==================================================================== */}
        <section id="features" className="py-20 border-y border-border/80 bg-muted/20 relative">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <Badge variant="outline" className="text-xs uppercase font-bold tracking-wider px-3 py-1 text-primary border-primary/30">
                Core Capabilities
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Engineered for Modern Businesses
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Everything you need to create, customize, bill, and get paid with zero frictional setup.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {HIGHLIGHTED_FEATURES.map(({ icon: Icon, badge, badgeColor, title, body, cta, href }) => (
                <div
                  key={title}
                  className="group relative flex flex-col justify-between p-6 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {body}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-border/50">
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:gap-2 transition-all"
                    >
                      <span>{cta}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* INSTANT INVOICING BANNER (NO SIGN UP BARRIER) */}
        {/* ==================================================================== */}
        <section className="py-16 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl brand-gradient p-8 sm:p-12 text-white shadow-2xl">
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold tracking-wide">
                <Zap className="h-3.5 w-3.5 fill-current" /> Zero Friction
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Need an invoice right this second? No account needed.
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-white/90">
                Jump straight into our interactive invoice studio. Select your tax rules, add items, preview your A4 sheet, and download your verified PDF immediately.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link href="/create">
                  <Button size="lg" className="h-12 bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 shadow-md rounded-xl">
                    Launch Invoice Studio Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="h-12 border-white/40 text-white hover:bg-white/10 font-semibold px-6 rounded-xl">
                    Create Company Account
                  </Button>
                </Link>
              </div>
            </div>

            {/* Decorative background circle */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          </div>
        </section>

        {/* ==================================================================== */}
        {/* POPULAR A4 INVOICE TEMPLATES SHOWCASE */}
        {/* ==================================================================== */}
        <section id="templates" className="py-16 border-t border-border/80 bg-muted/10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <Badge variant="outline" className="text-xs font-semibold mb-2">Print Ready A4</Badge>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Templates Designed to Get Paid Faster
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Click any template to start generating with that design immediately.
                </p>
              </div>
              <Link href="/templates" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View all templates <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredTemplates.map((template) => {
                const accent = template.defaultTokens.primaryColor;
                const free = isTemplateAllowedForPlan('starter', template.id);
                return (
                  <Link
                    key={template.id}
                    href={`/create?template=${template.id}`}
                    className="group rounded-xl border border-border/80 bg-card overflow-hidden hover:border-primary hover:shadow-lg transition-all"
                  >
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-4 border-b border-border/50">
                      <div className="h-2 w-1/2 rounded-full" style={{ backgroundColor: accent }} />
                      <div className="h-1.5 w-3/4 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="h-4 rounded-md opacity-85" style={{ backgroundColor: accent }} />
                      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="ml-auto h-2 w-1/3 rounded-full" style={{ backgroundColor: accent }} />
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {template.name}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${free ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                        {free ? 'Free' : 'Pro'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* TRANSPARENT PRICING SECTION */}
        {/* ==================================================================== */}
        <section id="pricing" className="py-20 border-t border-border/80">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <Badge variant="outline" className="text-xs uppercase font-bold tracking-wider px-3 py-1 text-primary">
                Transparent Plans
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Simple Pricing for Every Stage
              </h2>
              <p className="text-sm text-muted-foreground">
                Start 100% free with no credit card, upgrade as your business scales.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col justify-between rounded-2xl border p-6 bg-card transition-all ${
                    plan.featured
                      ? 'border-2 border-primary shadow-xl ring-2 ring-primary/20 relative'
                      : 'border-border/80 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{plan.note}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        plan.featured ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {plan.badge}
                      </span>
                    </div>

                    <div className="text-3xl font-extrabold text-foreground tabular-nums pt-2">
                      {plan.price}
                      <span className="text-xs font-normal text-muted-foreground"> / month</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border/60">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6">
                    <Link href={plan.href}>
                      <Button
                        className={`w-full font-bold text-xs h-10 rounded-xl ${
                          plan.featured
                            ? 'bg-primary hover:bg-primary-hover text-white shadow-md'
                            : 'variant-outline border-border'
                        }`}
                        variant={plan.featured ? 'default' : 'outline'}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* INTERACTIVE FAQ ACCORDION */}
        {/* ==================================================================== */}
        <section id="faq" className="py-20 border-t border-border/80 bg-muted/20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-muted-foreground">
                Common questions regarding free usage, GST math, and account capabilities.
              </p>
            </div>

            <div className="divide-y divide-border border-y border-border rounded-xl bg-card overflow-hidden">
              {FAQS.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div key={faq.q} className="p-4 sm:p-5">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="flex w-full items-center justify-between gap-4 text-left font-semibold text-sm sm:text-base text-foreground"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                      <p className="pt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed animate-in fade-in duration-200">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* FINAL CALL TO ACTION */}
        {/* ==================================================================== */}
        <section className="py-20 text-center mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Ready to generate your first invoice?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Zero sign-up required. Choose your template, add your items, and download a tax-compliant PDF in seconds.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/create">
              <Button size="lg" className="h-12 brand-gradient text-white font-bold px-8 rounded-xl shadow-lg shadow-indigo-500/20">
                Create Free Invoice Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="h-12 border-border font-semibold px-6 rounded-xl">
                Create Company Workspace
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
