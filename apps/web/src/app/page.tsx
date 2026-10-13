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
} from 'lucide-react';
import { TEMPLATES } from '@invoice/theme';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function LandingPage() {
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
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
      q: 'Is BillCraft truly free to use without signing up?',
      a: 'Yes! You can immediately create, customize, and download high-resolution PDF invoices without creating an account. All documents are stored offline in your browser using IndexedDB. When you want cloud sync, team collaboration, and automated numbering, you can create a free account.',
    },
    {
      q: 'How does India GST (CGST, SGST, IGST) calculation work?',
      a: 'BillCraft automatically cross-references the Supplier State against the Customer Place of Supply. If both states match, it automatically applies Intra-State taxation (splitting the tax evenly into CGST and SGST). If the states differ, it automatically applies Inter-State taxation (IGST). State codes and HSN/SAC codes are printed accurately on all PDFs.',
    },
    {
      q: 'Will the generated UPI QR code scan on PhonePe, Google Pay, and Paytm?',
      a: 'Absolutely. BillCraft incorporates a full ISO/IEC 18004 QR encoder that embeds verified NPCI UPI deep-links (upi://pay) with your VPA, legal Payee Name, Invoice Number, and exact Balance Due. Any UPI-compliant app scans it instantly for zero-fee payment settlements.',
    },
    {
      q: 'Can I convert an Estimate or Quote into an Invoice with one click?',
      a: 'Yes! When you or your client approves an Estimate or Quote, click "Convert to Invoice". BillCraft automatically copies all line items, rates, customer details, and taxes to a new Tax Invoice with sequential numbering.',
    },
    {
      q: 'Can I invite accountants or team members with restricted permissions?',
      a: 'Yes. BillCraft supports role-based team management (Owner, Admin, Editor, Viewer). You can invite team members by email and control who can finalize invoices, record payments, issue refunds, or only view reports.',
    },
    {
      q: 'Does BillCraft prevent floating-point calculation errors?',
      a: 'Yes. BillCraft runs on a financial engine built with decimal.js. Every subtotal, line-item discount, tax rate, round-off adjustment, and balance due is calculated with arbitrary decimal precision, eliminating the IEEE 754 floating-point rounding errors typical of spreadsheets.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary transition-colors">
      {/* Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-primary tracking-tight">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span>BillCraft</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a
              href="#features"
              onClick={(e) => handleNavClick(e, '#features')}
              className={`transition-colors ${
                activeSection === 'features' ? 'text-primary font-bold' : 'hover:text-primary'
              }`}
            >
              {t('nav.features', 'Features')}
            </a>
            <a
              href="#templates"
              onClick={(e) => handleNavClick(e, '#templates')}
              className={`transition-colors ${
                activeSection === 'templates' ? 'text-primary font-bold' : 'hover:text-primary'
              }`}
            >
              {t('nav.templates', 'Templates')}
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleNavClick(e, '#pricing')}
              className={`transition-colors ${
                activeSection === 'pricing' ? 'text-primary font-bold' : 'hover:text-primary'
              }`}
            >
              {t('nav.pricing', 'Pricing')}
            </a>
            <Link href="/blog" className="hover:text-primary transition-colors">
              {t('nav.blog', 'Blog')}
            </Link>
            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, '#faq')}
              className={`transition-colors ${
                activeSection === 'faq' ? 'text-primary font-bold' : 'hover:text-primary'
              }`}
            >
              {t('nav.faq', 'FAQ')}
            </a>
            <Link href="/about" className="hover:text-primary transition-colors">
              {t('nav.about', 'About')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Multi-language Selector */}
          <LanguageSwitcher />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link href="/login" className="hidden sm:inline-block">
            <Button variant="ghost" size="sm" className="text-xs font-semibold">
              {t('common.signIn', 'Sign In')}
            </Button>
          </Link>

          <Link href="/create">
            <Button size="sm" className="text-xs font-bold shadow-xs flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              <span>{t('nav.createInvoice', 'Create Invoice')}</span>
            </Button>
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 focus:outline-hidden"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[57px] bg-background border-b border-border shadow-xl z-40 p-4 space-y-3 animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-2 text-xs font-semibold text-muted-foreground">
            <a
              href="#features"
              onClick={(e) => handleNavClick(e, '#features')}
              className="p-2 rounded-md hover:bg-muted/50 hover:text-foreground"
            >
              {t('nav.features', 'Features')}
            </a>
            <a
              href="#templates"
              onClick={(e) => handleNavClick(e, '#templates')}
              className="p-2 rounded-md hover:bg-muted/50 hover:text-foreground"
            >
              {t('nav.templates', 'Templates')}
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleNavClick(e, '#pricing')}
              className="p-2 rounded-md hover:bg-muted/50 hover:text-foreground"
            >
              {t('nav.pricing', 'Pricing & Plans')}
            </a>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md hover:bg-muted/50 hover:text-foreground"
            >
              {t('nav.blog', 'Blog & Tax Guides')}
            </Link>
            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, '#faq')}
              className="p-2 rounded-md hover:bg-muted/50 hover:text-foreground"
            >
              {t('nav.faq', 'Help & FAQ')}
            </a>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md hover:bg-muted/50 hover:text-foreground"
            >
              {t('nav.about', 'About BillCraft')}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-md hover:bg-muted/50 hover:text-foreground"
            >
              {t('nav.contact', 'Contact Support')}
            </Link>
          </nav>
          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <Link href="/login" className="w-1/2">
              <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                {t('common.signIn', 'Sign In')}
              </Button>
            </Link>
            <Link href="/signup" className="w-1/2">
              <Button size="sm" className="w-full text-xs font-semibold">
                {t('common.signUp', 'Get Started')}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide">
          <Sparkles className="h-3.5 w-3.5" />
          <span>India GST Ready (CGST/SGST & IGST) • Verified Scannable UPI QR • Offline-First</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground max-w-5xl mx-auto leading-[1.12]">
          Invoicing Built for Modern Businesses, Agencies & Contractors
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
          Create, customize, and issue high-precision Invoices, Purchase Orders, and Estimates. Full decimal-safe calculation engine, multi-currency support, scannable UPI QR codes, and 8+ designer templates.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Link href="/create">
            <Button size="lg" className="h-12 px-7 text-sm font-bold shadow-md flex items-center gap-2">
              <FileText className="h-4 w-4" /> Create Invoice Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="h-12 px-6 text-sm font-semibold">
              <Building className="h-4 w-4 mr-2 text-muted-foreground" /> Open Workspace Demo
            </Button>
          </Link>
        </div>

        {/* Live Product Teaser Card */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="bg-card rounded-2xl shadow-2xl border border-border p-4 sm:p-6 text-left overflow-hidden relative">
            <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 mb-6 gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center shadow-xs">
                  BC
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Apex Digital Solutions Pvt Ltd</h3>
                  <p className="text-xs text-muted-foreground font-mono">GSTIN: 27AABCU9603R1ZM • State: 27 - Maharashtra</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" className="text-xs px-2.5 py-0.5">
                  Tax Invoice #INV-2026-00101
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Net 15 Days
                </Badge>
              </div>
            </div>

            {/* Teaser Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Client & Items */}
              <div className="md:col-span-2 space-y-4">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Billed To (Place of Supply)
                  </div>
                  <div className="text-xs font-bold text-foreground">Globex Innovations Pvt Ltd</div>
                  <div className="text-[11px] text-muted-foreground font-mono">GSTIN: 29AAACG8492K1Z9 • State: 29 - Karnataka (Inter-State IGST)</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[11px] font-bold text-muted-foreground uppercase">
                        <th className="py-2 px-2">Item Description</th>
                        <th className="py-2 px-2">HSN/SAC</th>
                        <th className="py-2 px-2 text-right">Qty</th>
                        <th className="py-2 px-2 text-right">Rate</th>
                        <th className="py-2 px-2 text-right">IGST (18%)</th>
                        <th className="py-2 px-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="py-2.5 px-2 font-medium">Enterprise UI/UX Design Sprint</td>
                        <td className="py-2.5 px-2 font-mono text-[11px] text-muted-foreground">998314</td>
                        <td className="py-2.5 px-2 text-right">1</td>
                        <td className="py-2.5 px-2 text-right font-mono">₹75,000.00</td>
                        <td className="py-2.5 px-2 text-right font-mono text-indigo-600">₹13,500.00</td>
                        <td className="py-2.5 px-2 text-right font-bold font-mono">₹88,500.00</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-2 font-medium">Cloud Architecture & Security Audit</td>
                        <td className="py-2.5 px-2 font-mono text-[11px] text-muted-foreground">998313</td>
                        <td className="py-2.5 px-2 text-right">2</td>
                        <td className="py-2.5 px-2 text-right font-mono">₹25,000.00</td>
                        <td className="py-2.5 px-2 text-right font-mono text-indigo-600">₹9,000.00</td>
                        <td className="py-2.5 px-2 text-right font-bold font-mono">₹59,000.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Totals & Instant UPI QR */}
              <div className="space-y-4 border-t md:border-t-0 md:border-l border-border md:pl-6">
                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono">₹1,25,000.00</span>
                  </div>
                  <div className="flex justify-between text-indigo-600 font-semibold">
                    <span>IGST (18% Inter-State):</span>
                    <span className="font-mono">₹22,500.00</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Round-Off Adjustment:</span>
                    <span className="font-mono">₹0.00</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-black text-sm text-foreground">
                    <span>Grand Total:</span>
                    <span className="font-mono text-primary">₹1,47,500.00</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card flex items-center gap-3">
                  <div className="h-16 w-16 bg-muted/60 rounded-lg flex items-center justify-center p-1 border shrink-0">
                    <QrCode className="h-12 w-12 text-primary" />
                  </div>
                  <div className="text-[11px]">
                    <div className="font-bold text-foreground">Verified UPI QR Code</div>
                    <div className="text-muted-foreground font-mono text-[10px]">apexdigital@hdfcbank</div>
                    <div className="text-emerald-600 font-semibold text-[10px] mt-0.5">✓ Ready for Instant Pay</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Proof Numbers Strip */}
      <section className="border-y border-border bg-muted/30 py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-primary">10,000+</div>
            <div className="text-xs text-muted-foreground mt-0.5">Businesses & Creators</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-primary">₹50 Cr+</div>
            <div className="text-xs text-muted-foreground mt-0.5">Invoiced Annually</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-primary">100%</div>
            <div className="text-xs text-muted-foreground mt-0.5">GST Intra/Inter Compliant</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-primary">ISO/IEC</div>
            <div className="text-xs text-muted-foreground mt-0.5">18004 Verified UPI QR</div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-xs">
            Core Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Everything You Need for Effortless Financial Invoicing
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            From precision calculations to client directories and instant UPI payments, BillCraft simplifies your entire billing cycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Decimal-Safe Financial Engine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Powered by decimal.js for true mathematical precision. Eliminates JavaScript floating-point errors on multi-tier discounts, tax splits, and round-offs.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <FileCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">GST Intra & Inter-State Automation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatic place of supply validation. Splits tax evenly into CGST + SGST for intra-state transactions and IGST for inter-state transactions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Verified NPCI UPI QR Codes</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generates vector SVG QR codes encoding your VPA, legal Payee Name, Invoice Number, and exact Balance Due for instant customer settlement.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Invoices, POs & Estimates</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unified workspace supporting Tax Invoices, Purchase Orders, and Quotes. Convert an approved Estimate into an Invoice with a single click.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Palette className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">8+ Structural Layout Templates</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Templates that differ in structural layout, not just colors: Classic, Modern, Minimal, Bold Header, Corporate, Creative, Compact, and Elegant.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Multi-Tenant Team Collaboration</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Invite team members, assign granular roles (Owner, Admin, Editor, Viewer), and maintain an immutable audit trail of all financial actions.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works in 3 Steps */}
      <section className="py-16 bg-muted/20 border-y border-border px-4 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="text-xs">Simple Workflow</Badge>
            <h2 className="text-3xl font-black text-foreground">How It Works in 3 Steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center mx-auto shadow-sm">
                1
              </div>
              <h3 className="font-bold text-base text-foreground">Enter or Select Details</h3>
              <p className="text-xs text-muted-foreground">
                Type your items and pricing or pick from your saved customer and product directories with instant autocomplete.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center mx-auto shadow-sm">
                2
              </div>
              <h3 className="font-bold text-base text-foreground">Customize Brand & Payment QR</h3>
              <p className="text-xs text-muted-foreground">
                Upload your company logo, pick your primary brand color, configure bank accounts, and toggle verified UPI QR codes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center mx-auto shadow-sm">
                3
              </div>
              <h3 className="font-bold text-base text-foreground">Download PDF or Share Link</h3>
              <p className="text-xs text-muted-foreground">
                Export pixel-perfect vector PDFs, print on any laser printer, or email a secure payment link directly to your client.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Template Showcase Section */}
      <section id="templates" className="py-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <Badge variant="outline" className="text-xs">Designer Gallery</Badge>
            <h2 className="text-3xl font-black text-foreground mt-1">
              Curated Financial Document Templates
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose from 8+ structurally diverse layout architectures tailored for consulting, enterprise, retail, and tech startups.
            </p>
          </div>
          <Link href="/templates">
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              View All Templates <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(TEMPLATES).slice(0, 8).map((tmpl) => (
            <div
              key={tmpl.id}
              className="group rounded-2xl border border-border bg-card p-4 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div
                  className="h-32 rounded-xl mb-3 flex flex-col justify-between p-3 transition-transform group-hover:scale-[1.02]"
                  style={{
                    backgroundColor: tmpl.defaultTokens.backgroundColor,
                    borderColor: tmpl.defaultTokens.borderColor,
                    borderWidth: '1px',
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div
                      className="h-3 w-16 rounded"
                      style={{ backgroundColor: tmpl.defaultTokens.primaryColor }}
                    />
                    <div className="text-[10px] font-mono text-muted-foreground">#INV-101</div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-muted/60 rounded" />
                    <div className="h-2 w-3/4 bg-muted/40 rounded" />
                  </div>
                </div>

                <div className="font-bold text-sm text-foreground">{tmpl.name}</div>
                <div className="text-[11px] text-primary font-medium">{tmpl.competitorStyle}</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <Link href={`/create?template=${tmpl.id}`} className="mt-4">
                <Button size="sm" variant="outline" className="w-full text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Use Template
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Preview Section with Monthly/Yearly Toggle */}
      <section id="pricing" className="py-20 bg-muted/20 border-y border-border px-4 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="text-xs">Transparent Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">
              Simple, Predictable Plans for Growing Teams
            </h2>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              Start free forever on your local device. Upgrade when you need team seats and custom brand domains.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-card border border-border text-xs font-semibold">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  billingPeriod === 'monthly' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  billingPeriod === 'yearly' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                <span>Yearly</span>
                <span className="rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 text-[10px] font-bold">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <Card className="border-border bg-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Starter / Free</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">For freelancers & solo contractors</p>
                </div>
                <div className="text-3xl font-black text-foreground">
                  ₹0 <span className="text-xs font-normal text-muted-foreground">/ month</span>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground divide-y divide-border/40">
                  <div className="flex items-center gap-2 pt-1">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Offline Documents</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>India GST Auto-Calculation</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Verified Scannable UPI QR</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>3 Standard Templates</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>1 Team Member (Solo)</span>
                  </div>
                </div>
              </div>
              <Link href="/create">
                <Button variant="outline" className="w-full text-xs font-bold">
                  Start Free
                </Button>
              </Link>
            </Card>

            {/* Professional Plan */}
            <Card className="border-primary bg-card p-6 rounded-2xl space-y-4 shadow-xl relative flex flex-col justify-between ring-2 ring-primary">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                  Most Popular
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Professional</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">For growing studios, agencies & SMBs</p>
                </div>
                <div className="text-3xl font-black text-foreground">
                  {billingPeriod === 'monthly' ? '₹799' : '₹639'}{' '}
                  <span className="text-xs font-normal text-muted-foreground">/ month</span>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground divide-y divide-border/40">
                  <div className="flex items-center gap-2 pt-1">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>All Starter Features</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>All 8+ Structural Templates</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Up to 5 Team Members</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Remove BillCraft Watermark</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Payment Reminders & History</span>
                  </div>
                </div>
              </div>
              <Link href="/signup">
                <Button className="w-full text-xs font-bold bg-primary text-primary-foreground shadow-sm">
                  Start 14-Day Free Trial
                </Button>
              </Link>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-border bg-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Enterprise</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">For multi-entity companies & large teams</p>
                </div>
                <div className="text-3xl font-black text-foreground">
                  {billingPeriod === 'monthly' ? '₹2,499' : '₹1,999'}{' '}
                  <span className="text-xs font-normal text-muted-foreground">/ month</span>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground divide-y divide-border/40">
                  <div className="flex items-center gap-2 pt-1">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Team Members</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Custom Domain (billing.yourdomain.com)</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Multi-Currency Exchange API</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Custom Template Engineering</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Priority 24/7 SLA Support</span>
                  </div>
                </div>
              </div>
              <Link href="/contact">
                <Button variant="outline" className="w-full text-xs font-bold">
                  Contact Sales
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-20 px-4 sm:px-8 lg:px-12 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs">Client Love</Badge>
          <h2 className="text-3xl font-black text-foreground">Trusted by Fast-Moving Businesses</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-500" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              "The automatic CGST/SGST vs IGST split is a lifesaver. We used to waste hours checking recipient state codes. Now it just works, and clients pay instantly via the UPI QR code."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <div className="h-9 w-9 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                RK
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Rahul Kulkarni</div>
                <div className="text-[10px] text-muted-foreground">Founder, PixelCraft Studios</div>
              </div>
            </div>
          </Card>

          <Card className="border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-500" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              "Most invoice generators just change font colors. BillCraft has genuinely different layouts. The Corporate layout gives our enterprise clients exactly what their finance departments need."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <div className="h-9 w-9 rounded-full bg-indigo-500/20 text-indigo-600 font-bold text-xs flex items-center justify-center">
                AM
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Ananya Mehta</div>
                <div className="text-[10px] text-muted-foreground">VP Finance, Nexus Cloud</div>
              </div>
            </div>
          </Card>

          <Card className="border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-500" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              "The offline IndexedDB support means I never lose my work when traveling with spotty wifi. Then it syncs seamlessly once I am back online."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-600 font-bold text-xs flex items-center justify-center">
                DT
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Devashish Tiwari</div>
                <div className="text-[10px] text-muted-foreground">Independent Architect & Consultant</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 bg-muted/20 border-t border-border px-4 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <Badge variant="outline" className="text-xs">Got Questions?</Badge>
            <h2 className="text-3xl font-black text-foreground">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex justify-between items-center p-4 text-left font-bold text-sm text-foreground hover:bg-muted/30 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-4 sm:px-8 text-center bg-primary text-white relative overflow-hidden selection:bg-white selection:text-primary">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white select-text">
            Ready to Upgrade Your Invoicing Experience?
          </h2>
          <p className="text-sm sm:text-base text-white/95 max-w-xl mx-auto select-text font-medium leading-relaxed">
            Join thousands of modern businesses using BillCraft for accurate, beautifully branded GST invoices and instant payments.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/create">
              <Button size="lg" className="h-12 px-8 text-sm font-bold shadow-lg bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200 active:text-black focus-visible:ring-2 focus-visible:ring-white transition-all">
                Create Your First Invoice Free
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="h-12 px-6 text-sm font-bold border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white active:bg-white/20 active:text-white focus-visible:ring-2 focus-visible:ring-white transition-all">
                Register Workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Full Footer with Clean Navigation */}
      <footer className="border-t border-border bg-card py-16 px-4 sm:px-8 lg:px-12 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2 font-black text-lg text-primary tracking-tight">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>BillCraft</span>
            </Link>
            <p className="text-xs max-w-xs leading-relaxed">
              Production-ready invoicing engine for freelancers, startups, and enterprises. Built with decimal-safe calculations, verified UPI QR codes, and multi-tenant security.
            </p>
            <div className="text-[11px] font-mono text-muted-foreground/60 pt-2">
              © 2026 BillCraft Invoicing Inc. All rights reserved.
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2">
            <div className="font-bold text-foreground text-xs uppercase tracking-wider">Product</div>
            <div className="flex flex-col space-y-1.5">
              <Link href="/create" className="hover:text-foreground transition-colors">Invoice Generator</Link>
              <Link href="/create?type=estimate" className="hover:text-foreground transition-colors">Estimate Creator</Link>
              <Link href="/create?type=purchase_order" className="hover:text-foreground transition-colors">Purchase Orders</Link>
              <Link href="/templates" className="hover:text-foreground transition-colors">Template Gallery</Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing & Plans</Link>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-2">
            <div className="font-bold text-foreground text-xs uppercase tracking-wider">Resources</div>
            <div className="flex flex-col space-y-1.5">
              <Link href="/blog" className="hover:text-foreground transition-colors">Blog & Tax Guides</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">Help Center & FAQ</Link>
              <Link href="/features" className="hover:text-foreground transition-colors">Feature Documentation</Link>
              <Link href="/templates" className="hover:text-foreground transition-colors">Invoice Layouts</Link>
            </div>
          </div>

          {/* Legal & Company */}
          <div className="space-y-2">
            <div className="font-bold text-foreground text-xs uppercase tracking-wider">Company</div>
            <div className="flex flex-col space-y-1.5">
              <Link href="/about" className="hover:text-foreground transition-colors">About Us</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact Support</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
