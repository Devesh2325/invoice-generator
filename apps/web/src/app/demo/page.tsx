'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  APP_CONFIG,
  formatCurrency,
  computeEffectiveInvoiceStatus,
} from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Share2,
  FileText,
  Printer,
  Download,
  QrCode,
  Users,
  Eye,
  Check,
  Zap,
  Info,
  RotateCcw,
  BarChart3,
  Building2,
  Send,
  Lock,
} from 'lucide-react';

// Isolated mock data strictly for Sandbox Demo mode
const DEMO_SAMPLE_INVOICES = [
  {
    id: 'demo_inv_101',
    number: 'INV-2026-00101',
    client: 'Nexus Global Media Ltd',
    amount: 148500,
    status: 'paid' as const,
    date: '2026-10-12',
    dueDate: '2026-10-27',
    items: 'Q4 Brand Identity & UI Design System',
  },
  {
    id: 'demo_inv_102',
    number: 'INV-2026-00102',
    client: 'Starlight Retailers Pvt Ltd',
    amount: 94200,
    status: 'pending' as const,
    date: '2026-10-15',
    dueDate: '2026-10-30',
    items: 'E-commerce POS Integration & 200 Barcode Labels',
  },
  {
    id: 'demo_inv_103',
    number: 'INV-2026-00103',
    client: 'Apex Capital Advisors',
    amount: 215000,
    status: 'paid' as const,
    date: '2026-10-05',
    dueDate: '2026-10-20',
    items: 'Financial Modeling & Tax Compliance Module',
  },
  {
    id: 'demo_inv_104',
    number: 'INV-2026-00104',
    client: 'Vanguard Logistics Corp',
    amount: 68400,
    status: 'overdue' as const,
    date: '2026-09-28',
    dueDate: '2026-10-13',
    items: 'Fleet GPS Sensor Invoicing & Waybills',
  },
];

const TOUR_STEPS = [
  {
    step: 1,
    title: 'Financial KPIs & Real-time Metrics',
    description: 'Monitor billed revenue, cleared funds, and outstanding balances with precision.',
  },
  {
    step: 2,
    title: 'Products & Inventory Tracking',
    description: 'Catalog items with SKUs, auto barcodes, and automatic stock deduction upon invoice payment.',
  },
  {
    step: 3,
    title: 'Multi-Channel Instant Sharing',
    description: 'Dispatch invoices via WhatsApp, prefilled email, or unguessable tokenized client links.',
  },
  {
    step: 4,
    title: 'Zero-Fee UPI & Bank Wire Settlements',
    description: 'Collect payments directly into your account with verified NPCI QR codes and bank wire instructions.',
  },
];

export default function InteractiveDemoPage() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [invoices, setInvoices] = useState(DEMO_SAMPLE_INVOICES);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);

  // Financial KPI calculations
  const totalBilled = useMemo(() => invoices.reduce((acc, inv) => acc + inv.amount, 0), [invoices]);
  const totalCollected = useMemo(
    () => invoices.filter((i) => i.status === 'paid').reduce((acc, inv) => acc + inv.amount, 0),
    [invoices]
  );
  const totalOutstanding = useMemo(
    () => invoices.filter((i) => i.status !== 'paid').reduce((acc, inv) => acc + inv.amount, 0),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    if (selectedStatusFilter === 'all') return invoices;
    return invoices.filter((inv) => inv.status === selectedStatusFilter);
  }, [invoices, selectedStatusFilter]);

  const handleSimulateStatusToggle = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        const nextStatus = inv.status === 'paid' ? 'pending' : 'paid';
        return { ...inv, status: nextStatus };
      })
    );
    setSimulatedNotice('Simulated status updated. In sandbox mode, changes auto-reset.');
    setTimeout(() => setSimulatedNotice(null), 3500);
  };

  const handleSimulateDispatch = (client: string) => {
    setSimulatedNotice(`[Sandbox Simulation] Simulated dispatch message triggered for ${client}. No external email or WhatsApp network traffic occurred.`);
    setTimeout(() => setSimulatedNotice(null), 4500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground flex flex-col font-sans">
      {/* 1. PERSISTENT DEMO SANDBOX BANNER */}
      <div className="sticky top-0 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 font-semibold text-xs shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-400 font-extrabold text-[10px] tracking-wider uppercase">
              DEMO SANDBOX
            </span>
            <span>
              Simulated Read-Only Environment &bull; Real external emails, SMS, and payments disabled.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button size="sm" variant="outline" className="h-7 text-xs bg-slate-950 text-white border-none hover:bg-slate-800">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="h-7 text-xs bg-white text-slate-950 font-bold hover:bg-slate-100 shadow-xs">
                Sign Up Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="sm" className="h-7 text-xs bg-amber-900 text-amber-100 font-bold hover:bg-amber-800">
                Buy a Plan
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-primary tracking-tight">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <span>{APP_CONFIG.brandName}</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Interactive Product Walkthrough
            </span>
            <Link href="/create">
              <Button size="sm" className="font-bold text-xs bg-primary text-primary-foreground">
                Exit to Live Studio
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. GUIDED PRODUCT TOUR BAR */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">Interactive Tour Guide</h2>
              <span className="text-xs text-muted-foreground">Step {activeStep} of 4</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={activeStep <= 1}
                onClick={() => setActiveStep((p) => Math.max(1, p - 1))}
                className="h-7 text-xs"
              >
                Previous
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveStep((p) => (p >= 4 ? 1 : p + 1))}
                className="h-7 text-xs bg-primary text-primary-foreground font-bold"
              >
                {activeStep === 4 ? 'Restart Tour' : 'Next Step'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TOUR_STEPS.map((t) => {
              const isActive = activeStep === t.step;
              return (
                <button
                  key={t.step}
                  onClick={() => setActiveStep(t.step)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {t.step}
                    </span>
                    <h3 className="text-xs font-bold text-foreground line-clamp-1">{t.title}</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Simulated Notice Toast */}
      {simulatedNotice && (
        <div className="bg-indigo-600 text-white px-4 py-2.5 text-xs font-medium text-center shadow-lg transition-all animate-in fade-in">
          {simulatedNotice}
        </div>
      )}

      {/* 3. INTERACTIVE DASHBOARD DEMO MAIN CONTENT */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* KPI Cards Row (Clickable to filter invoices) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            onClick={() => setSelectedStatusFilter('all')}
            className={`border rounded-2xl cursor-pointer transition-all hover:shadow-md ${
              selectedStatusFilter === 'all'
                ? 'ring-2 ring-primary border-primary bg-card'
                : 'border-slate-200 dark:border-slate-800 bg-card'
            }`}
          >
            <CardContent className="p-5 space-y-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                <span>Total Invoiced</span>
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-foreground">
                {formatCurrency(totalBilled, 'INR')}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                &uarr; 18.4% from last quarter
              </p>
            </CardContent>
          </Card>

          <Card
            onClick={() => setSelectedStatusFilter('paid')}
            className={`border rounded-2xl cursor-pointer transition-all hover:shadow-md ${
              selectedStatusFilter === 'paid'
                ? 'ring-2 ring-emerald-500 border-emerald-500 bg-card'
                : 'border-slate-200 dark:border-slate-800 bg-card'
            }`}
          >
            <CardContent className="p-5 space-y-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                <span>Collected in Bank</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalCollected, 'INR')}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {invoices.filter((i) => i.status === 'paid').length} payments cleared
              </p>
            </CardContent>
          </Card>

          <Card
            onClick={() => setSelectedStatusFilter('pending')}
            className={`border rounded-2xl cursor-pointer transition-all hover:shadow-md ${
              selectedStatusFilter === 'pending'
                ? 'ring-2 ring-amber-500 border-amber-500 bg-card'
                : 'border-slate-200 dark:border-slate-800 bg-card'
            }`}
          >
            <CardContent className="p-5 space-y-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                <span>Pending Clearance</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatCurrency(totalOutstanding, 'INR')}
              </div>
              <p className="text-[11px] text-muted-foreground">Within standard credit terms</p>
            </CardContent>
          </Card>

          <Card
            onClick={() => setSelectedStatusFilter('overdue')}
            className={`border rounded-2xl cursor-pointer transition-all hover:shadow-md ${
              selectedStatusFilter === 'overdue'
                ? 'ring-2 ring-rose-500 border-rose-500 bg-card'
                : 'border-slate-200 dark:border-slate-800 bg-card'
            }`}
          >
            <CardContent className="p-5 space-y-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                <span>Overdue Follow-Up</span>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(68400, 'INR')}
              </div>
              <p className="text-[11px] text-rose-500 font-medium">1 invoice past due date</p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights Based on Active Step */}
        {activeStep === 2 && (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
              <Package className="w-5 h-5" />
              <span>Step 2 Spotlight: Products & Inventory Integration</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
              In {APP_CONFIG.brandName}, products carry SKU and auto-generated barcodes (e.g. <code>890123456001</code>). When you finalize an invoice, stock quantities deduct in real time, alerting you when items drop below safety thresholds.
            </p>
          </div>
        )}

        {activeStep === 3 && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
              <Share2 className="w-5 h-5" />
              <span>Step 3 Spotlight: Multi-Channel Instant Sharing</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
              Every invoice generates an unguessable tokenized link (e.g. <code>/share/[token]</code>). Clients view an official read-only copy, scan UPI QR codes directly, and download PDFs without creating an account.
            </p>
          </div>
        )}

        {/* Invoices List with Interactive Simulation */}
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-card overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-foreground">Sample Invoices Sandbox</h3>
              <p className="text-xs text-muted-foreground">
                Click any action to simulate workflow transitions. Filter: <strong>{selectedStatusFilter.toUpperCase()}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInvoices(DEMO_SAMPLE_INVOICES)}
                className="text-xs gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sample Data</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Scope / Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Interactive Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {inv.number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {inv.client}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground max-w-xs truncate">
                      {inv.items}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {formatCurrency(inv.amount, 'INR')}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.status === 'paid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="w-3 h-3" /> Paid
                        </span>
                      )}
                      {inv.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <Clock className="w-3 h-3" /> Due Soon
                        </span>
                      )}
                      {inv.status === 'overdue' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSimulateStatusToggle(inv.id)}
                          className="h-7 text-[11px] font-semibold"
                        >
                          {inv.status === 'paid' ? 'Mark Pending' : 'Mark Paid'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSimulateDispatch(inv.client)}
                          title="Simulate dispatch"
                          className="h-7 text-xs text-primary"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* 4. PERSISTENT BOTTOM SIGNUP CTA */}
      <footer className="sticky bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-foreground">
              Ready to automate your real business invoicing?
            </h4>
            <p className="text-xs text-muted-foreground">
              Free trial includes {APP_CONFIG.trialInvoiceLimit} complete GST invoices &bull; Instant setup &bull; No credit card required.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/create">
              <Button size="sm" variant="outline" className="text-xs font-bold">
                Try Studio Editor
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 shadow-sm">
                <span>Start Free Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
