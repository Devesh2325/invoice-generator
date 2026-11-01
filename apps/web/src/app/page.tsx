'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/lib/theme/theme-provider';
import {
  Sparkles,
  Zap,
  Download,
  Palette,
  Layers,
  ArrowRight,
  Check,
  Globe,
  Printer,
  QrCode,
  CreditCard,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { APP_CONFIG } from '@invoice/core';
import { useTenant } from '@/lib/auth/tenant-context';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function LandingPage() {
  const { brandSettings, user } = useTenant();
  const { toggleTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [previewStyle, setPreviewStyle] = useState<'modern' | 'minimal' | 'bold' | 'classic'>('modern');

  const brandName =
    brandSettings?.whiteLabelEnabled && brandSettings?.businessName
      ? brandSettings.businessName
      : APP_CONFIG.brandName;

  const styleColors = {
    modern: '#2563EB',
    minimal: '#0F172A',
    bold: '#7C3AED',
    classic: '#0D9488',
  };

  const activeColor = styleColors[previewStyle];

  const faqs = [
    {
      q: `Is ${brandName} free to use?`,
      a: `Yes! You can create, preview, and download professional PDF invoices immediately without any account or credit card required. Free accounts receive a generous trial allowance of ${APP_CONFIG.trialInvoiceLimit} complete invoices.`,
    },
    {
      q: 'Can I add my own logo and custom colors?',
      a: 'Absolutely. You can upload your company logo, choose custom brand colors, customize headers and footers, and pick from 18+ professionally designed invoice templates.',
    },
    {
      q: 'Does it support multi-currency and regional tax?',
      a: 'Yes. It supports over 150 global currencies (USD, EUR, GBP, INR, AED, CAD, AUD, etc.) and regional tax standards including India GST (with automatic CGST/SGST and IGST split), VAT, and custom sales tax.',
    },
    {
      q: 'Can I add UPI QR codes or payment links to invoices?',
      a: 'Yes! You can embed scannable UPI QR codes (PhonePe, GPay, Paytm), bank account transfer details, or payment links directly onto the invoice PDF so clients can pay you instantly.',
    },
    {
      q: 'How do I download or share my invoices?',
      a: 'You can download high-resolution vector PDF invoices with one click, print directly, or share a secure client viewing link via WhatsApp or email.',
    },
  ];

  const templateList = [
    { id: 'cleartax_gst', name: 'Modern GST Tax', category: 'General & Tax', accent: '#2563EB' },
    { id: 'stripe_fintech', name: 'Stripe Indigo', category: 'Tech & SaaS', accent: '#6366F1' },
    { id: 'mercury_teal', name: 'Mercury Clean', category: 'Startup & Banking', accent: '#0D9488' },
    { id: 'apple_clean', name: 'Cupertino Minimal', category: 'Design & Creative', accent: '#1E293B' },
    { id: 'canva_studio', name: 'Creative Studio', category: 'Freelance & Agency', accent: '#7C3AED' },
    { id: 'tally_prime', name: 'Commercial Grid', category: 'Retail & Wholesale', accent: '#D97706' },
    { id: 'brex_modern', name: 'Executive Slate', category: 'Corporate & Finance', accent: '#059669' },
    { id: 'medical_rx', name: 'Clinical Standard', category: 'Healthcare & Pharma', accent: '#0891B2' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors">
      {/* 1. Clean, Modern Header */}
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border/70 px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 font-bold text-lg text-foreground tracking-tight group">
            <div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-foreground">{brandName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#templates" className="hover:text-foreground transition-colors">Templates</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <LanguageSwitcher />

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Toggle Theme"
            aria-label="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <Link href="/dashboard">
              <Button size="sm" className="text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-sm flex items-center gap-1.5 px-3.5">
                <Laptop className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>

              <Link href="/create">
                <Button size="sm" className="text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm flex items-center gap-1.5 px-4">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Create Invoice</span>
                </Button>
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg border border-border text-muted-foreground"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card p-4 space-y-3">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-semibold py-1.5 text-foreground">Features</a>
          <a href="#templates" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-semibold py-1.5 text-foreground">Templates</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-semibold py-1.5 text-foreground">Pricing</a>
          <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-semibold py-1.5 text-foreground">Blog</Link>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-semibold py-1.5 text-foreground">FAQ</a>
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" size="sm" className="w-full text-xs">Sign In</Button>
            </Link>
            <Link href="/create" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full text-xs font-bold bg-primary text-white">Create Invoice Free</Button>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Hero Section - Clean, Focused, High Impact */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Simple, Fast & Beautiful Invoicing</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
          Invoicing Made{' '}
          <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">
            Effortless
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
          Create, customize, and send stunning invoices in under a minute. Automatic tax calculations, instant PDF export, QR code payments, and zero setup required.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/create">
            <Button size="lg" className="h-12 px-7 text-sm font-bold bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 flex items-center gap-2 group">
              <Zap className="h-4 w-4" />
              <span>Create Free Invoice</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <a href="#templates">
            <Button variant="outline" size="lg" className="h-12 px-6 text-sm font-semibold border-border bg-card/60 hover:bg-muted text-foreground">
              <Layers className="h-4 w-4 mr-2 text-primary" />
              Explore Templates
            </Button>
          </a>
        </div>

        {/* 3. Sleek, Minimalist Live Invoice Preview */}
        <div className="pt-8 max-w-4xl mx-auto">
          {/* Template Style Switcher */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <span className="text-xs text-muted-foreground mr-2 font-medium">Style:</span>
            {(['modern', 'minimal', 'bold', 'classic'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setPreviewStyle(st)}
                className={`text-xs px-3 py-1 rounded-full capitalize font-semibold transition-all ${
                  previewStyle === st
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Clean Invoice Card Preview */}
          <div className="bg-card rounded-2xl shadow-xl border border-border p-6 sm:p-8 text-left transition-all">
            {/* Invoice Top Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-border pb-5 mb-5 gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm transition-colors"
                  style={{ backgroundColor: activeColor }}
                >
                  IX
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Acme Design Studio Ltd</h3>
                  <p className="text-xs text-muted-foreground">hello@acmedesign.co • New York, NY</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold px-3 py-1 font-mono">
                  #INV-2026-0042
                </Badge>
                <Badge className="text-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5">
                  ✓ Paid
                </Badge>
              </div>
            </div>

            {/* Billed To & Dates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px] mb-0.5">Billed To</span>
                <span className="font-semibold text-foreground">Globex Corporation</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] mb-0.5">Issue Date</span>
                <span className="font-semibold text-foreground">Nov 1, 2026</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] mb-0.5">Due Date</span>
                <span className="font-semibold text-foreground">Net 30 Days</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] mb-0.5">Currency</span>
                <span className="font-semibold text-foreground">USD ($)</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto rounded-xl border border-border mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead
                  className="text-white text-xs font-semibold transition-colors"
                  style={{ backgroundColor: activeColor }}
                >
                  <tr>
                    <th className="py-2.5 px-3.5">Item & Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  <tr>
                    <td className="py-2.5 px-3.5">
                      <div className="font-semibold text-foreground">Product Branding & Identity</div>
                      <div className="text-[11px] text-muted-foreground">Complete visual styleguide and brand assets</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">1</td>
                    <td className="py-2.5 px-3 text-right font-mono">$1,800.00</td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold">$1,800.00</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5">
                      <div className="font-semibold text-foreground">Frontend Application Development</div>
                      <div className="text-[11px] text-muted-foreground">Next.js responsive web application</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">20 hrs</td>
                    <td className="py-2.5 px-3 text-right font-mono">$75.00</td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold">$1,500.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary & QR Code */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center p-1 border border-border shadow-xs shrink-0">
                  <QrCode className="h-10 w-10 text-slate-900" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-foreground">Instant Payment QR</div>
                  <div className="text-muted-foreground text-[11px]">Scan to pay directly</div>
                </div>
              </div>

              <div className="space-y-1 text-right text-xs ml-auto">
                <div className="text-muted-foreground">
                  Subtotal: <span className="font-mono text-foreground font-medium">$3,300.00</span>
                </div>
                <div className="text-muted-foreground">
                  Tax (10%): <span className="font-mono text-foreground font-medium">$330.00</span>
                </div>
                <div className="text-base font-black text-foreground pt-1 border-t border-border flex items-center justify-end gap-2">
                  <span>Total:</span>
                  <span className="font-mono text-primary">$3,630.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Trust Stats */}
      <section className="border-y border-border bg-muted/30 py-8 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">10,000+</div>
            <div className="text-xs text-muted-foreground mt-0.5">Active Invoices Issued</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">150+</div>
            <div className="text-xs text-muted-foreground mt-0.5">Currencies Supported</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-primary">18+</div>
            <div className="text-xs text-muted-foreground mt-0.5">Designer Templates</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">100%</div>
            <div className="text-xs text-muted-foreground mt-0.5">Free to Try</div>
          </div>
        </div>
      </section>

      {/* 5. Clean 4-Feature Highlights */}
      <section id="features" className="py-20 px-4 sm:px-8 lg:px-12 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs font-semibold text-primary">
            Key Features
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Everything You Need, Nothing You Don't
          </h2>
          <p className="text-sm text-muted-foreground">
            Built from the ground up to be intuitive, clean, and blazingly fast.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-border bg-card hover:border-primary/50 transition-all rounded-xl shadow-xs">
            <CardContent className="p-5 space-y-2.5">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-primary flex items-center justify-center font-bold">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Instant Creation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate clean invoices in under 60 seconds with live preview and real-time auto-calculation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-primary/50 transition-all rounded-xl shadow-xs">
            <CardContent className="p-5 space-y-2.5">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                <Palette className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">18+ Templates</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose from minimal, tech, corporate, or creative layouts. Customize colors, fonts, and columns.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-primary/50 transition-all rounded-xl shadow-xs">
            <CardContent className="p-5 space-y-2.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Fast Payments</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Embed scannable UPI QR codes, bank account details, or Stripe/PayPal payment links right on the invoice.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:border-primary/50 transition-all rounded-xl shadow-xs">
            <CardContent className="p-5 space-y-2.5">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">1-Click PDF Export</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Download crisp, print-ready vector PDFs or share a live link directly with clients via WhatsApp or email.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 6. Template Showcase */}
      <section id="templates" className="py-16 px-4 sm:px-8 lg:px-12 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <Badge variant="outline" className="text-xs font-semibold text-primary">
            Curated Styles
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tailored For Every Industry
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a template, customize your colors, and generate invoices with confidence.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {templateList.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">{item.category}</span>
                </div>
                <div className="font-bold text-xs text-foreground">{item.name}</div>
              </div>

              <Link href={`/create?template=${item.id}`}>
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold mt-2 h-8">
                  Use Style
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link href="/templates">
            <Button variant="outline" size="sm" className="text-xs font-bold">
              View All 18+ Templates <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 7. Simple Transparent Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-8 lg:px-12 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <Badge variant="outline" className="text-xs font-semibold text-primary">
            Simple Pricing
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Clear, Transparent Plans
          </h2>
          <p className="text-sm text-muted-foreground">
            Start completely free. Upgrade only when your business expands.
          </p>

          <div className="inline-flex items-center gap-1.5 bg-muted p-1 rounded-xl border border-border mt-3">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                billingPeriod === 'monthly' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('yearly')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingPeriod === 'yearly' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Starter Plan */}
          <Card className="border-border bg-card rounded-2xl flex flex-col justify-between p-6">
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">Starter Free</h3>
                <p className="text-xs text-muted-foreground">For solo freelancers and testing.</p>
              </div>

              <div className="font-mono text-3xl font-black text-foreground">
                $0 <span className="text-xs font-normal text-muted-foreground">/ month</span>
              </div>

              <ul className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>{APP_CONFIG.trialInvoiceLimit} free trial invoices</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Instant PDF download & print</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>UPI QR code generation</span>
                </li>
              </ul>
            </div>

            <Link href="/create" className="pt-6">
              <Button variant="outline" className="w-full text-xs font-bold h-9">
                Start Creating Free
              </Button>
            </Link>
          </Card>

          {/* Professional Plan */}
          <Card className="border-2 border-primary bg-card rounded-2xl flex flex-col justify-between p-6 relative shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider py-0.5 px-3">
                Most Popular
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">Professional</h3>
                <p className="text-xs text-muted-foreground">For agencies, consultants, and teams.</p>
              </div>

              <div className="font-mono text-3xl font-black text-foreground">
                {billingPeriod === 'monthly' ? '$19' : '$15'}{' '}
                <span className="text-xs font-normal text-muted-foreground">/ month</span>
              </div>

              <ul className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <strong className="text-foreground">Unlimited</strong> invoices & estimates
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>All 18+ templates unlocked</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Custom brand logo & colors</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Customer & items directory</span>
                </li>
              </ul>
            </div>

            <Link href="/signup" className="pt-6">
              <Button className="w-full text-xs font-bold bg-primary hover:bg-primary-hover text-white h-9 shadow-sm">
                Get Started
              </Button>
            </Link>
          </Card>

          {/* Enterprise Plan */}
          <Card className="border-border bg-card rounded-2xl flex flex-col justify-between p-6">
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">Enterprise</h3>
                <p className="text-xs text-muted-foreground">For organizations needing white-labeling.</p>
              </div>

              <div className="font-mono text-3xl font-black text-foreground">
                {billingPeriod === 'monthly' ? '$49' : '$39'}{' '}
                <span className="text-xs font-normal text-muted-foreground">/ month</span>
              </div>

              <ul className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Custom domain support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Full white-label branding</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Unlimited team seats</span>
                </li>
              </ul>
            </div>

            <Link href="/signup" className="pt-6">
              <Button variant="outline" className="w-full text-xs font-bold h-9">
                Contact Enterprise
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* 8. FAQ Accordion */}
      <section id="faq" className="py-16 px-4 sm:px-8 lg:px-12 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs font-semibold text-primary">
            FAQ
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-border rounded-xl bg-card overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-4 text-left font-semibold text-xs sm:text-sm text-foreground flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                    openFaqIndex === idx ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>
              {openFaqIndex === idx && (
                <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-2.5">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. Minimalist Modern Footer */}
      <footer className="border-t border-border bg-card/50 mt-auto py-10 px-4 sm:px-8 lg:px-12 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <div className="h-6 w-6 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs">
              IX
            </div>
            <span>{brandName}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <Link href="/create" className="hover:text-foreground">Invoice Generator</Link>
            <Link href="/templates" className="hover:text-foreground">Templates</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/blog" className="hover:text-foreground">Blog</Link>
            <Link href="/login" className="hover:text-foreground">Sign In</Link>
          </div>

          <div className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} {brandName}. Simple & Modern Invoicing.
          </div>
        </div>
      </footer>
    </div>
  );
}
