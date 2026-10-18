'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi } from '@invoice/api';
import {
  CanonicalDocument,
  formatCurrency,
  computeEffectiveInvoiceStatus,
  formatInvoiceStatusLabel,
} from '@invoice/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Plus,
  Users,
  Package,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Wallet,
  Sparkles,
  X,
} from 'lucide-react';

export default function TenantDashboardPage() {
  const { activeTenant, tenantCurrency } = useTenant();
  const [documents, setDocuments] = useState<CanonicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isPaidPlan = Boolean(activeTenant?.plan && activeTenant.plan !== 'starter');

  useEffect(() => {
    async function loadData() {
      if (!activeTenant) return;
      setLoading(true);
      try {
        const docs = await TenantApi.getDocuments(activeTenant.id);
        setDocuments(docs);
      } catch (err) {
        console.error('Failed to load dashboard invoices:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTenant]);

  // Aggregate financial & status metrics dynamically from persisted data
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;
    let pendingPaymentsAmount = 0;
    let pendingPaymentsCount = 0;
    let totalRefunds = 0;
    let refundCount = 0;

    const statusCounts: Record<string, number> = {
      draft: 0,
      pending: 0,
      partially_paid: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
      refunded: 0,
    };

    const monthlyMap: Record<string, { label: string; invoiced: number; collected: number }> = {};

    documents.forEach((doc) => {
      const effectiveStatus = computeEffectiveInvoiceStatus(doc);

      statusCounts[effectiveStatus] = (statusCounts[effectiveStatus] || 0) + 1;

      const refunded = Number(doc.summary?.refundedAmount || 0);
      if (refunded > 0) {
        totalRefunds += refunded;
        refundCount += (doc.refunds?.length || 1);
      }

      if (effectiveStatus === 'draft' || effectiveStatus === 'cancelled') {
        return;
      }

      const grandTotal = Number(doc.summary?.grandTotal || 0);
      const amountPaid = Number(doc.summary?.amountPaid || 0);
      const balanceDue = Number(doc.summary?.balanceDue || 0);

      totalInvoiced += grandTotal;
      totalCollected += amountPaid;
      totalOutstanding += balanceDue;

      if (effectiveStatus === 'overdue') {
        totalOverdue += balanceDue;
        overdueCount += 1;
      }

      if (effectiveStatus === 'pending' || effectiveStatus === 'partially_paid') {
        pendingPaymentsAmount += balanceDue;
        pendingPaymentsCount += 1;
      }

      // Monthly bucket (YYYY-MM)
      const dateStr = doc.issueDate || new Date().toISOString().split('T')[0];
      const monthKey = dateStr.slice(0, 7);
      const [yr, mo] = monthKey.split('-');
      const monthLabel = new Date(Number(yr), Number(mo || 1) - 1, 1).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { label: monthLabel, invoiced: 0, collected: 0 };
      }
      monthlyMap[monthKey].invoiced += grandTotal;
      monthlyMap[monthKey].collected += amountPaid;
    });

    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, val]) => val);

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      overdueCount,
      pendingPaymentsAmount,
      pendingPaymentsCount,
      totalRefunds,
      refundCount,
      statusCounts,
      monthlyTrend,
    };
  }, [documents]);

  const maxMonthlyVal = Math.max(
    1,
    ...metrics.monthlyTrend.map((m) => Math.max(m.invoiced, m.collected))
  );

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
        {/* Workspace Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {activeTenant?.name || 'Workspace Overview'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time invoice performance, cash collection, overdue balances, and revenue trends ({tenantCurrency}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/create">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* Upgraded Plan Celebration Banner */}
        {isPaidPlan && !bannerDismissed && (
          <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-amber-50/50 p-5 dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 shadow-sm transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base">
                      {activeTenant?.plan?.toUpperCase()} Plan Active
                    </h3>
                    <Badge variant="outline" className="border-indigo-300 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold tracking-wider">
                      Premium Features Unlocked
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                    You have unlocked unlimited invoices, custom branding, UPI QR codes, multi-currency support, and priority email dispatch.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                <Link href="/settings">
                  <Button size="sm" variant="outline" className="text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-100/60 dark:border-indigo-800 dark:text-indigo-300">
                    Brand Settings
                  </Button>
                </Link>
                <Link href="/create">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm">
                    New Invoice
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg ml-1"
                  aria-label="Dismiss banner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6 Financial KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-5 space-y-1.5">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Invoiced</span>
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
                {formatCurrency(metrics.totalInvoiced, tenantCurrency)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {documents.length - metrics.statusCounts.draft - metrics.statusCounts.cancelled} active invoices
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-5 space-y-1.5">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Collected</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(metrics.totalCollected, tenantCurrency)}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                {metrics.statusCounts.paid} fully paid invoices
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-5 space-y-1.5">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Balance</span>
                <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {formatCurrency(metrics.totalOutstanding, tenantCurrency)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Total uncollected receivables
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-5 space-y-1.5">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Overdue Invoices</span>
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-2xl font-black text-red-600 dark:text-red-400 tabular-nums">
                {formatCurrency(metrics.totalOverdue, tenantCurrency)}
              </div>
              <div className="text-[11px] text-red-700 dark:text-red-400">
                {metrics.overdueCount} {metrics.overdueCount === 1 ? 'invoice' : 'invoices'} past due date
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-5 space-y-1.5">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Pending Payments</span>
                <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatCurrency(metrics.pendingPaymentsAmount, tenantCurrency)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {metrics.pendingPaymentsCount} pending / partially paid invoices
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-5 space-y-1.5">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Refunds</span>
                <RotateCcw className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                {formatCurrency(metrics.totalRefunds, tenantCurrency)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {metrics.refundCount} {metrics.refundCount === 1 ? 'refund transaction' : 'refund transactions'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Count by Status & Monthly Revenue Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Count by Status */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Invoice Count by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'draft', label: 'Draft', color: 'bg-slate-100 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700' },
                  { key: 'pending', label: 'Pending', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60' },
                  { key: 'partially_paid', label: 'Partially Paid', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60' },
                  { key: 'paid', label: 'Paid', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60' },
                  { key: 'overdue', label: 'Overdue', color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60' },
                  { key: 'refunded', label: 'Refunded', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60' },
                  { key: 'cancelled', label: 'Cancelled', color: 'bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800' },
                ].map((st) => (
                  <div
                    key={st.key}
                    className={`p-3 rounded-xl border ${st.color} flex flex-col justify-between`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {st.label}
                    </span>
                    <span className="text-xl font-black mt-1 tabular-nums">
                      {metrics.statusCounts[st.key] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue Trend */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Monthly Revenue Trend ({tenantCurrency})
              </CardTitle>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-xs bg-indigo-600 inline-block" /> Invoiced
                </span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500 inline-block" /> Collected
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {metrics.monthlyTrend.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
                  Create and finalize invoices to see monthly revenue trends.
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.monthlyTrend.map((m) => (
                    <div key={m.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{m.label}</span>
                        <span className="text-slate-600 dark:text-slate-300 tabular-nums">
                          Invoiced: <strong>{formatCurrency(m.invoiced, tenantCurrency)}</strong> • Collected:{' '}
                          <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(m.collected, tenantCurrency)}</strong>
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                        <div
                          className="h-full bg-indigo-600 rounded-l-full"
                          style={{ width: `${Math.min(100, (m.invoiced / maxMonthlyVal) * 100)}%` }}
                        />
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, (m.collected / maxMonthlyVal) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Launch & Recent Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions Panel */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Workspace Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/create"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-primary/40 hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-primary flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div>Create Invoice</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Generate invoice with live preview & QR</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </Link>

              <Link
                href="/dashboard/parties"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-primary/40 hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div>Customers</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Add or import customers via CSV/Excel</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </Link>

              <Link
                href="/dashboard/products"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-primary/40 hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <div>Items</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Define reusable items, HSN & tax rates</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </Link>
            </CardContent>
          </Card>

          {/* Recent Invoices Table */}
          <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recent Invoices
              </CardTitle>
              <Link
                href="/dashboard/documents"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all ({documents.length})
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  Loading workspace invoices...
                </div>
              ) : documents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No invoices created yet.{' '}
                  <Link href="/create" className="text-primary font-bold">
                    Create your first invoice
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {documents.slice(0, 6).map((doc) => {
                    const effectiveStatus = computeEffectiveInvoiceStatus(doc);
                    const docCurr = doc.currency || tenantCurrency;
                    return (
                      <div
                        key={doc.id}
                        className="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-md transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Link href={`/edit/${doc.id}`} className="hover:text-primary hover:underline">
                              {doc.documentNumber}
                            </Link>
                            {doc.invoiceName && (
                              <span className="text-slate-400 dark:text-slate-500 font-normal">({doc.invoiceName})</span>
                            )}
                            <Badge
                              variant={
                                effectiveStatus === 'paid'
                                  ? 'success'
                                  : effectiveStatus === 'overdue'
                                  ? 'destructive'
                                  : effectiveStatus === 'partially_paid'
                                  ? 'warning'
                                  : 'secondary'
                              }
                              className="text-[10px] px-1.5 py-0"
                            >
                              {formatInvoiceStatusLabel(effectiveStatus)}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {doc.client?.name || 'Customer'} • Issued {doc.issueDate}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black text-slate-900 dark:text-slate-100 tabular-nums">
                            {formatCurrency(Number(doc.summary?.grandTotal || 0), docCurr)}
                          </div>
                          {Number(doc.summary?.balanceDue || 0) > 0 ? (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                              Due: {formatCurrency(Number(doc.summary?.balanceDue || 0), docCurr)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Settled
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TenantLayout>
  );
}
