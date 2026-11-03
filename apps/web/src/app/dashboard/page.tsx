'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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
import { TrialCounterBadge } from '@/components/ui/trial-counter-badge';
import { UpgradePlanModal } from '@/components/modals/upgrade-plan-modal';
import {
  Plus,
  Users,
  Package,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function TenantDashboardPage() {
  const { activeTenant, tenantCurrency } = useTenant();
  const [documents, setDocuments] = useState<CanonicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const isPaidPlan = Boolean(activeTenant?.plan && activeTenant.plan !== 'starter');
  const invoiceCount = documents.length;
  const isLimitReached = !isPaidPlan && invoiceCount >= 7;

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
    <>
      <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
        {/* Workspace Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {activeTenant?.name || 'Workspace Overview'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your invoices and payments at a glance, shown in {tenantCurrency}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <TrialCounterBadge
              invoiceCount={invoiceCount}
              plan={activeTenant?.plan || 'starter'}
              compact
              onUpgradeClick={() => setUpgradeModalOpen(true)}
            />

            {isLimitReached ? (
              <Button
                size="sm"
                onClick={() => setUpgradeModalOpen(true)}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Invoice
              </Button>
            ) : (
              <Link href="/create">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Create Invoice
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Free Trial Progress Card (visible only for free starter tenants) */}
        {!isPaidPlan && (
          <TrialCounterBadge
            invoiceCount={invoiceCount}
            plan={activeTenant?.plan || 'starter'}
            onUpgradeClick={() => setUpgradeModalOpen(true)}
          />
        )}


        {/* Key figures */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: 'Invoiced',
              value: metrics.totalInvoiced,
              hint: `${documents.length - metrics.statusCounts.draft - metrics.statusCounts.cancelled} active invoices`,
              alert: false,
            },
            {
              label: 'Collected',
              value: metrics.totalCollected,
              hint: metrics.totalRefunds > 0
                ? `${formatCurrency(metrics.totalRefunds, tenantCurrency)} refunded`
                : `${metrics.statusCounts.paid} paid in full`,
              alert: false,
            },
            {
              label: 'Outstanding',
              value: metrics.totalOutstanding,
              hint: `${metrics.pendingPaymentsCount + metrics.overdueCount} awaiting payment`,
              alert: false,
            },
            {
              label: 'Overdue',
              value: metrics.totalOverdue,
              hint: `${metrics.overdueCount} past due date`,
              alert: metrics.overdueCount > 0,
            },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-4 sm:p-5">
                <div className="text-sm text-slate-500 dark:text-slate-400">{kpi.label}</div>
                <div
                  className={`mt-1.5 text-xl sm:text-2xl font-semibold tabular-nums break-words ${
                    kpi.alert ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {formatCurrency(kpi.value, tenantCurrency)}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{kpi.hint}</div>
              </CardContent>
            </Card>
          ))}
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
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {[
                  { key: 'draft', label: 'Draft' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'partially_paid', label: 'Partially paid' },
                  { key: 'paid', label: 'Paid' },
                  { key: 'overdue', label: 'Overdue' },
                  { key: 'refunded', label: 'Refunded' },
                  { key: 'cancelled', label: 'Cancelled' },
                ].map((st) => (
                  <li key={st.key} className="flex items-center justify-between py-2">
                    <span className="text-slate-600 dark:text-slate-300">{st.label}</span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {metrics.statusCounts[st.key] || 0}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Monthly Revenue Trend */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Monthly Revenue Trend ({tenantCurrency})
              </CardTitle>
              <div className="flex items-center gap-3 text-xs">
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
                Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">


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
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-normal">Add or import customers via CSV/Excel</div>
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
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-normal">Define reusable items and tax rates</div>
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
                              className="text-xs px-1.5 py-0"
                            >
                              {formatInvoiceStatusLabel(effectiveStatus)}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {doc.client?.name || 'Customer'} • Issued {doc.issueDate}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                            {formatCurrency(Number(doc.summary?.grandTotal || 0), docCurr)}
                          </div>
                          {Number(doc.summary?.balanceDue || 0) > 0 ? (
                            <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                              Due: {formatCurrency(Number(doc.summary?.balanceDue || 0), docCurr)}
                            </div>
                          ) : (
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
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

      <UpgradePlanModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        currentCount={invoiceCount}
      />
    </>
  );
}
