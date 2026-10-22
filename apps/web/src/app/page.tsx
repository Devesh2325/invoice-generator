'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/lib/theme/theme-provider';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Download,
  Palette,
  Layers,
  ArrowRight,
  Check,
  Globe,
  Printer,
  QrCode,
  Users,
  CreditCard,
  Calculator,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Star,
  CheckCircle2,
  FileText,
  FileCheck,
  Building,
  PlayCircle,
  Eye,
  ExternalLink,
  Laptop,
  CheckSquare,
} from 'lucide-react';
import { TEMPLATES } from '@invoice/theme';
import { APP_CONFIG } from '@invoice/core';
import { useTenant } from '@/lib/auth/tenant-context';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function LandingPage() {
  const { brandSettings, user } = useTenant();
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroTemplate, setHeroTemplate] = useState<'cleartax' | 'stripe' | 'vyapar' | 'mercury'>('cleartax');
  const [heroTaxMode, setHeroTaxMode] = useState<'inter' | 'intra'>('inter');

  const heroAccentColor =
    heroTemplate === 'cleartax'
      ? '#1D4ED8'
      : heroTemplate === 'stripe'
      ? '#6366F1'
      : heroTemplate === 'vyapar'
      ? '#EA580C'
      : '#0D9488';

  const brandName =
    brandSettings?.whiteLabelEnabled && brandSettings?.businessName
      ? brandSettings.businessName
      : APP_CONFIG.brandName;
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'templates', 'pricing', 'faq'];
      const scrollPos = window.scrollY + 200;
      let current = '';
      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            current = sec;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (hash.startsWith('#')) {
      e.preventDefault();
      const targetId = hash.slice(1);
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(targetId);
        window.history.pushState(null, '', hash);
      }
    }
    setMobileMenuOpen(false);
  };

  const faqs = [
    {
      q: `Is ${APP_CONFIG.brandName} truly free to try without payment info?`,
      a: `Yes! You can immediately create, customize, and download high-resolution PDF invoices without submitting payment details. Free accounts receive a trial allowance of ${APP_CONFIG.trialInvoiceLimit} complete invoices with India GST calculation, verified UPI QR codes, and multi-channel sharing.`,
    },
    {
      q: 'How does India GST (CGST, SGST, IGST) calculation work?',
      a: `${APP_CONFIG.brandName} automatically cross-references the Supplier State against the Customer Place of Supply. If both states match, it automatically applies Intra-State taxation (splitting the tax evenly into CGST and SGST). If the states differ, it automatically applies Inter-State taxation (IGST). State codes and HSN/SAC codes are printed accurately on all PDFs.`,
    },
    {
      q: 'Will the generated UPI QR code scan on PhonePe, Google Pay, and Paytm?',
      a: `Absolutely. ${APP_CONFIG.brandName} incorporates a full ISO/IEC 18004 QR encoder that embeds verified NPCI UPI deep-links (upi://pay) with your VPA, legal Payee Name, Invoice Number, and exact Balance Due. Any UPI-compliant app scans it instantly for zero-fee payment settlements.`,
    },
    {
      q: 'Can I convert an Estimate or Quote into an Invoice with one click?',
      a: `Yes! When you or your client approves an Estimate or Quote, click "Convert to Invoice". ${APP_CONFIG.brandName} automatically copies all line items, rates, customer details, and taxes to a new Tax Invoice with sequential numbering.`,
    },
    {
      q: 'Can I invite accountants or team members with restricted permissions?',
      a: `Yes. ${APP_CONFIG.brandName} supports role-based team management (Owner, Admin, Accountant, Staff, Viewer). You can invite team members by email and control who can finalize invoices, record payments, issue refunds, or only view reports.`,
    },
    {
      q: `Does ${APP_CONFIG.brandName} prevent floating-point calculation errors?`,
      a: `Yes. ${APP_CONFIG.brandName} runs on a financial engine built with decimal.js. Every subtotal, line-item discount, tax rate, round-off adjustment, and balance due is calculated with arbitrary decimal precision, eliminating the IEEE 754 floating-point rounding errors typical of spreadsheets.`,
    },
  ];

  const templateHighlights = [
    { id: 'cleartax_gst', name: 'ClearTax Pro GST', category: 'India GST Compliant', accent: '#1D4ED8', font: 'Inter' },
    { id: 'tally_prime', name: 'Tally Prime Tax Grid', category: 'India Accounting Standard', accent: '#0F172A', font: 'Inter' },
    { id: 'vyapar_classic', name: 'Vyapar Business GST', category: 'Wholesale & Retail', accent: '#EA580C', font: 'Inter' },
    { id: 'stripe_fintech', name: 'Stripe Indigo Modern', category: 'SaaS & Fintech', accent: '#6366F1', font: 'Inter' },
    { id: 'brex_modern', name: 'Brex Tech Slate', category: 'Enterprise Tech', accent: '#059669', font: 'Inter' },
    { id: 'mercury_teal', name: 'Mercury Minimal Teal', category: 'Startup Banking', accent: '#0D9488', font: 'Inter' },
    { id: 'quickbooks_enterprise', name: 'QuickBooks Enterprise', category: 'Corporate Ledger', accent: '#15803D', font: 'Inter' },
    { id: 'canva_studio', name: 'Canva Creative Studio', category: 'Creative Agency', accent: '#7C3AED', font: 'Inter' },
    { id: 'apple_clean', name: 'Apple Cupertino Clean', category: 'Minimalist Clean', accent: '#1E293B', font: 'Inter' },
    { id: 'notion_minimal', name: 'Notion Mono Document', category: 'Monospaced Financial', accent: '#334155', font: 'Mono' },
    { id: 'medical_rx', name: 'Clinical Healthcare Rx', category: 'Medical & Pharma', accent: '#0891B2', font: 'Inter' },
    { id: 'logistics_waybill', name: 'Supply Chain Waybill', category: 'Freight & Logistics', accent: '#D97706', font: 'Inter' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary transition-colors">
      {/* 1. Ultra-Modern Floating Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60 px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between transition-all">
        <div className="flex items-center gap-8">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 font-black text-xl text-foreground tracking-tight group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-foreground">
              {brandName}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a
              href="#features"
              onClick={(e) => handleNavClick(e, '#features')}
              className={`transition-colors ${
                activeSection === 'features' ? 'text-primary font-bold' : 'hover:text-foreground'
              }`}
            >
              {t('nav.features', 'Features')}
            </a>
            <a
              href="#templates"
              onClick={(e) => handleNavClick(e, '#templates')}
              className={`transition-colors ${
                activeSection === 'templates' ? 'text-primary font-bold' : 'hover:text-foreground'
              }`}
            >
              {t('nav.templates', 'Templates (18+)')}
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleNavClick(e, '#pricing')}
              className={`transition-colors ${
                activeSection === 'pricing' ? 'text-primary font-bold' : 'hover:text-foreground'
              }`}
            >
              {t('nav.pricing', 'Pricing')}
            </a>
            <Link href="/blog" className="hover:text-foreground transition-colors">
              {t('nav.blog', 'Blog')}
            </Link>
            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, '#faq')}
              className={`transition-colors ${
                activeSection === 'faq' ? 'text-primary font-bold' : 'hover:text-foreground'
              }`}
            >
              {t('nav.faq', 'FAQ')}
            </a>
            <Link href="/about" className="hover:text-foreground transition-colors">
              {t('nav.about', 'About')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <Link href="/dashboard">
              <Button size="sm" className="text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-xs flex items-center gap-2 px-3.5">
                <Laptop className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                  {t('common.signIn', 'Sign In')}
                </Button>
              </Link>

              <Link href="/create">
                <Button size="sm" className="text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/25 flex items-center gap-1.5 px-3.5">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{t('nav.createInvoice', 'Create Invoice')}</span>
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 text-xs font-medium"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[57px] bg-background border-b border-border shadow-2xl z-40 p-5 space-y-4 animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-2 text-xs font-semibold text-muted-foreground">
            <a
              href="#features"
              onClick={(e) => handleNavClick(e, '#features')}
              className="p-2.5 rounded-lg hover:bg-muted/50 hover:text-foreground"
            >
              Features & Architecture
            </a>
            <a
              href="#templates"
              onClick={(e) => handleNavClick(e, '#templates')}
              className="p-2.5 rounded-lg hover:bg-muted/50 hover:text-foreground"
            >
              18+ Professional Templates
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleNavClick(e, '#pricing')}
              className="p-2.5 rounded-lg hover:bg-muted/50 hover:text-foreground"
            >
              Pricing & Plans
            </a>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg hover:bg-muted/50 hover:text-foreground"
            >
              Blog & Tax Guides
            </Link>
            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, '#faq')}
              className="p-2.5 rounded-lg hover:bg-muted/50 hover:text-foreground"
            >
              FAQ & Help
            </a>
          </nav>
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
            {user ? (
              <Link href="/dashboard" className="w-full">
                <Button size="sm" className="w-full text-xs font-bold">
                  Open Tenant Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="w-1/2">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" className="w-1/2">
                  <Button size="sm" className="w-full text-xs font-bold">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Hero Section with Radial Glow & Interactive Live Mockup */}
      <section className="relative pt-16 sm:pt-24 pb-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto text-center space-y-8 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-primary/20 via-indigo-500/15 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide shadow-2xs">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-Gen Invoicing Engine • 18+ Designer Layouts • India GST & ISO/IEC UPI QR Ready</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground max-w-5xl mx-auto leading-[1.12]">
          Invoicing Designed for{' '}
          <span className="bg-gradient-to-r from-primary via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Precision, Speed & Elegance
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
          Create, customize, and issue high-precision Invoices, Estimates, and Receipts. Zero floating-point calculation drift, automated India GST (CGST/SGST vs IGST), scannable UPI QR payments, and instant client sharing.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/create">
            <Button size="lg" className="h-12 px-7 text-sm font-bold bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25 flex items-center gap-2 group">
              <Zap className="h-4 w-4" />
              <span>Create Invoice Free</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <a href="#templates">
            <Button variant="outline" size="lg" className="h-12 px-6 text-sm font-semibold border-border bg-card/60 backdrop-blur-md hover:bg-accent text-foreground">
              <Layers className="h-4 w-4 mr-2 text-primary" />
              Explore 18+ Templates
            </Button>
          </a>
        </div>

        {/* 3. Interactive Hero Invoice Studio Teaser */}
        <div className="pt-8 max-w-5xl mx-auto">
          {/* Template Switcher Bar above Teaser */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-2 text-xs">
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
              <span className="text-[11px] font-bold text-muted-foreground px-2">Interactive Template:</span>
              {[
                { id: 'cleartax', label: 'ClearTax GST (India)' },
                { id: 'stripe', label: 'Stripe Indigo (Fintech)' },
                { id: 'vyapar', label: 'Vyapar Commercial' },
                { id: 'mercury', label: 'Mercury Minimal' },
              ].map((tItem) => (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setHeroTemplate(tItem.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    heroTemplate === tItem.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tItem.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
              <span className="text-[11px] font-bold text-muted-foreground px-2">Supply Type:</span>
              <button
                type="button"
                onClick={() => setHeroTaxMode('inter')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  heroTaxMode === 'inter'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Inter-State (IGST 18%)
              </button>
              <button
                type="button"
                onClick={() => setHeroTaxMode('intra')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  heroTaxMode === 'intra'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Intra-State (CGST 9% + SGST 9%)
              </button>
            </div>
          </div>

          {/* Interactive Card */}
          <div className="bg-card/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-border p-6 sm:p-8 text-left relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-border pb-5 mb-6 gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="h-11 w-11 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md"
                  style={{ backgroundColor: heroAccentColor }}
                >
                  IX
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground">Apex Digital Solutions Technologies Pvt Ltd</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    GSTIN: 27AABCU9603R1ZM • State: 27 - Maharashtra • support@invoxa.io
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-bold py-1 px-3"
                  style={{ color: heroAccentColor }}
                >
                  TAX INVOICE #INV-2026-0042
                </Badge>
                <Badge variant="success" className="text-xs py-1 px-2.5">
                  Net 30 Days
                </Badge>
              </div>
            </div>

            {/* Content Columns */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Client & Line Items */}
              <div className="md:col-span-8 space-y-4">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Billed To (Place of Supply)
                  </div>
                  <div className="text-xs font-bold text-foreground">Globex Innovations International Ltd</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {heroTaxMode === 'inter'
                      ? 'GSTIN: 29AAACG8492K1Z9 • State: 29 - Karnataka (Inter-State IGST Applies)'
                      : 'GSTIN: 27AABCU9603R1ZM • State: 27 - Maharashtra (Intra-State CGST+SGST Applies)'}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead
                      className="text-white text-[11px] font-bold"
                      style={{ backgroundColor: heroAccentColor }}
                    >
                      <tr>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3">HSN/SAC</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">Tax</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-foreground">Enterprise UI/UX Design System Retainer</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">998314</td>
                        <td className="py-2.5 px-3 text-center">1</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹75,000.00</td>
                        <td className="py-2.5 px-3 text-right font-mono text-primary">18%</td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono">₹88,500.00</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-foreground">Cloud Architecture & Security Audit Sprint</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">998313</td>
                        <td className="py-2.5 px-3 text-center">2</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹25,000.00</td>
                        <td className="py-2.5 px-3 text-right font-mono text-primary">18%</td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono">₹59,000.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Calculation Summary & QR */}
              <div className="md:col-span-4 space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxable Value:</span>
                    <span className="font-mono text-foreground font-semibold">₹1,25,000.00</span>
                  </div>

                  {heroTaxMode === 'inter' ? (
                    <div className="flex justify-between text-primary font-semibold">
                      <span>IGST (18% Inter-State):</span>
                      <span className="font-mono">₹22,500.00</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-primary font-semibold">
                        <span>CGST (9% Central):</span>
                        <span className="font-mono">₹11,250.00</span>
                      </div>
                      <div className="flex justify-between text-primary font-semibold">
                        <span>SGST (9% State):</span>
                        <span className="font-mono">₹11,250.00</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>Round-Off Adjustment:</span>
                    <span className="font-mono">₹0.00</span>
                  </div>

                  <div
                    className="flex justify-between items-center p-2.5 rounded-lg text-white font-extrabold text-xs shadow-xs mt-2"
                    style={{ backgroundColor: heroAccentColor }}
                  >
                    <span>Total Payable:</span>
                    <span className="font-mono text-sm">₹1,47,500.00</span>
                  </div>
                </div>

                {/* Scannable Verified QR Block */}
                <div className="p-3 rounded-xl border border-border bg-card flex items-center gap-3">
                  <div className="h-16 w-16 bg-white rounded-lg flex items-center justify-center p-1 border border-border shrink-0">
                    <QrCode className="h-12 w-12 text-slate-900" />
                  </div>
                  <div className="text-[11px]">
                    <div className="font-bold text-foreground">Verified UPI QR Code</div>
                    <div className="text-muted-foreground font-mono text-[10px]">apexdigital@hdfcbank</div>
                    <div className="text-emerald-600 font-semibold text-[10px] mt-0.5">✓ Ready for Instant UPI Pay</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Social Proof & Trust Stats Bar */}
      <section className="border-y border-border/80 bg-muted/20 py-10 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">10,000+</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">Businesses & Modern Teams</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">₹50 Cr+</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">Invoiced Annually</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-primary tracking-tight">100%</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">GST Intra / Inter Compliant</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">ISO/IEC</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">18004 Verified UPI QR Codes</div>
          </div>
        </div>
      </section>

      {/* 5. Bento Grid of Core Capabilities (Modern SaaS Style) */}
      <section id="features" className="py-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="outline" className="text-xs font-bold text-primary">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            Everything Required for Effortless Financial Invoicing
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            From precision calculations and automated India GST rules to multi-currency settlements and client portals, Invoxa simplifies your entire invoicing journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Card className="border-border bg-card/60 backdrop-blur-xs hover:border-primary/50 transition-all rounded-2xl shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Arbitrary Decimal Safety</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Powered by decimal.js for true mathematical precision. Eliminates JavaScript IEEE-754 floating-point drift on multi-tier discounts, tax splits, and round-offs.
              </p>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="border-border bg-card/60 backdrop-blur-xs hover:border-primary/50 transition-all rounded-2xl shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                <FileCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">GST Intra & Inter-State Automation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatic place of supply validation. Splits tax evenly into CGST + SGST for intra-state transactions and IGST for inter-state transactions with official state codes.
              </p>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="border-border bg-card/60 backdrop-blur-xs hover:border-primary/50 transition-all rounded-2xl shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Verified NPCI UPI QR Codes</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Embeds scannable vector SVG QR codes encoding your legal UPI VPA, Payee Name, Invoice Number, and exact Balance Due for PhonePe, GPay, and Paytm instant settlement.
              </p>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="border-border bg-card/60 backdrop-blur-xs hover:border-primary/50 transition-all rounded-2xl shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">White-Label & Verified Custom Domains</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Serve client invoices under your own domain (e.g. <code>billing.yourdomain.com</code>) with automated SSL certificates, custom logos, palettes, and typography.
              </p>
            </CardContent>
          </Card>

          {/* Card 5 */}
          <Card className="border-border bg-card/60 backdrop-blur-xs hover:border-primary/50 transition-all rounded-2xl shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Role-Based Team Workspaces</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Invite accountants, billing managers, and auditors with granular permissions (Owner, Admin, Accountant, Staff, Viewer) and complete audit histories.
              </p>
            </CardContent>
          </Card>

          {/* Card 6 */}
          <Card className="border-border bg-card/60 backdrop-blur-xs hover:border-primary/50 transition-all rounded-2xl shadow-xs">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center font-bold">
                <Printer className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Vector PDF & Multi-Channel Sharing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate crisp A4 print-ready PDFs or share directly through tokenized public links, WhatsApp, Email, Telegram, and native mobile share drawers.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 6. Interactive 18-Template Showcase Section */}
      <section id="templates" className="py-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs font-bold text-primary">
            Layout Architectures
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            18+ Designer Templates for Every Industry
          </h2>
          <p className="text-sm text-muted-foreground">
            Whether you run an agency, distributor, retail store, medical clinic, or freelance consultancy, there's a pixel-perfect template ready.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templateHighlights.map((tItem) => (
            <div
              key={tItem.id}
              className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tItem.accent }} />
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {tItem.font}
                  </Badge>
                </div>
                <div className="font-bold text-sm text-foreground">{tItem.name}</div>
                <div className="text-[11px] text-muted-foreground">{tItem.category}</div>
              </div>

              <Link href={`/create?template=${tItem.id}`}>
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold mt-2">
                  Use Template
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link href="/templates">
            <Button variant="outline" size="lg" className="text-xs font-bold">
              View All 18+ Templates & Specifications <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 7. Modern Pricing Section with Monthly/Annual Toggle */}
      <section id="pricing" className="py-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs font-bold text-primary">
            Simple Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            Predictable Plans for Growing Teams
          </h2>
          <p className="text-sm text-muted-foreground">
            Start free without a credit card. Upgrade whenever your transaction volume or team demands it.
          </p>

          {/* Period Toggle */}
          <div className="inline-flex items-center gap-1.5 bg-muted p-1 rounded-xl border border-border mt-4">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billingPeriod === 'monthly' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('yearly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingPeriod === 'yearly' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Starter Plan */}
          <Card className="border-border bg-card rounded-2xl flex flex-col justify-between p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-foreground">Starter Free</h3>
                <p className="text-xs text-muted-foreground mt-1">For freelancers & solo businesses getting started.</p>
              </div>

              <div className="font-mono text-3xl font-black text-foreground">
                $0 <span className="text-xs font-normal text-muted-foreground">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground pt-3 border-t border-border">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{APP_CONFIG.trialInvoiceLimit} free trial invoices included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>India GST Intra & Inter-state calculations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Verified NPCI UPI QR code generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Core Starter Template library</span>
                </li>
              </ul>
            </div>

            <Link href="/create" className="pt-6">
              <Button variant="outline" className="w-full text-xs font-bold">
                Start Creating Free
              </Button>
            </Link>
          </Card>

          {/* Professional Plan */}
          <Card className="border-2 border-primary bg-card rounded-2xl flex flex-col justify-between p-6 relative shadow-xl shadow-primary/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider py-0.5 px-3">
                Most Popular
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-foreground">Professional</h3>
                <p className="text-xs text-muted-foreground mt-1">For growing consultancies, agencies, and distributors.</p>
              </div>

              <div className="font-mono text-3xl font-black text-foreground">
                {billingPeriod === 'monthly' ? '$19' : '$15'}{' '}
                <span className="text-xs font-normal text-muted-foreground">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground pt-3 border-t border-border">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <strong className="text-foreground">Unlimited</strong> invoices & estimates
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>All 18+ Pro & Designer templates unlocked</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>No Invoxa branding on generated documents</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>Full payment tracking & partial payment receipts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>Up to 5 team members with role controls</span>
                </li>
              </ul>
            </div>

            <Link href="/signup" className="pt-6">
              <Button className="w-full text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-md">
                Upgrade to Professional
              </Button>
            </Link>
          </Card>

          {/* Enterprise Plan */}
          <Card className="border-border bg-card rounded-2xl flex flex-col justify-between p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-foreground">Enterprise White-Label</h3>
                <p className="text-xs text-muted-foreground mt-1">For corporations needing white-labeling & custom domains.</p>
              </div>

              <div className="font-mono text-3xl font-black text-foreground">
                {billingPeriod === 'monthly' ? '$49' : '$39'}{' '}
                <span className="text-xs font-normal text-muted-foreground">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground pt-3 border-t border-border">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <strong className="text-foreground">Verified Custom Domains</strong> (e.g. billing.yourbrand.com)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Full white-label branding & custom domain portal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Unlimited team seats & accountant logins</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Dedicated cloud backups & priority phone support</span>
                </li>
              </ul>
            </div>

            <Link href="/signup" className="pt-6">
              <Button variant="outline" className="w-full text-xs font-bold">
                Get Enterprise Access
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* 8. FAQ Accordion Section */}
      <section id="faq" className="py-20 px-4 sm:px-8 lg:px-12 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-xs font-bold text-primary">
            Got Questions?
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to know about compliance, pricing, and system capabilities.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-border rounded-xl bg-card overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-sm text-foreground flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                    openFaqIndex === idx ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>
              {openFaqIndex === idx && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. Sleek Modern SaaS Footer */}
      <footer className="border-t border-border bg-card/40 mt-auto py-12 px-4 sm:px-8 lg:px-12 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2 font-black text-lg text-foreground">
              <div className="h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs">
                IX
              </div>
              <span>{brandName}</span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              The modern financial standard for high-precision invoicing, multi-currency accounting, automated India GST, and verified UPI QR payments.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational (99.99% Uptime)</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-foreground text-xs uppercase tracking-wider">Product</div>
            <ul className="space-y-1.5">
              <li><Link href="/create" className="hover:text-foreground">Invoice Generator</Link></li>
              <li><Link href="/templates" className="hover:text-foreground">18+ Templates</Link></li>
              <li><a href="#features" className="hover:text-foreground">GST Engine</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing Plans</a></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-foreground text-xs uppercase tracking-wider">Resources</div>
            <ul className="space-y-1.5">
              <li><Link href="/blog" className="hover:text-foreground">Tax & Invoicing Blog</Link></li>
              <li><a href="#faq" className="hover:text-foreground">FAQ & Help</a></li>
              <li><Link href="/login" className="hover:text-foreground">Admin Portal</Link></li>
              <li><Link href="/dashboard/brand" className="hover:text-foreground">Brand Studio</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-foreground text-xs uppercase tracking-wider">Company</div>
            <ul className="space-y-1.5">
              <li><Link href="/about" className="hover:text-foreground">About Invoxa</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact Support</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © {new Date().getFullYear()} {brandName}. All rights reserved. Built with precision for modern commerce.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/security" className="hover:underline">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
