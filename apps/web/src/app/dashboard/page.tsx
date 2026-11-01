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
import { TrialCounterBadge } from '@/components/ui/trial-counter-badge';
import { UpgradePlanModal } from '@/components/modals/upgrade-plan-modal';
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
  Wallet,
  Sparkles,
  Palette,
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

  // Aggregate financial metrics
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;

    const statusCounts: Record<string, number> = {
      draft: 0,
      pending: 0,
      partially_paid: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    };

    documents.forEach((doc) => {
      const effectiveStatus = computeEffectiveInvoiceStatus(doc);
      statusCounts[effectiveStatus] = (statusCounts[effectiveStatus] || 0) + 1;

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
    });

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      overdueCount,
      statusCounts,
    };
  }, [documents]);

  const activeDocCount = documents.filter(
    (d) => !['draft', 'cancelled'].includes(computeEffectiveInvoiceStatus(d))
  ).length;

  return (
    <TenantLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Modern Workspace Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {activeTenant?.name || 'Workspace Overview'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Financial overview & invoice activity ({tenantCurrency})
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isPaidPlan && (
              <TrialCounterBadge
                invoiceCount={invoiceCount}
                plan={activeTenant?.plan || 'starter'}
                compact
                onUpgradeClick={() => setUpgradeModalOpen(true)}
              />
            )}

            {isLimitReached ? (
              <Button
                size="sm"
                onClick={() => setUpgradeModalOpen(true)}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
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

        {/* 4 Clean Hero Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Invoiced */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Total Invoiced</span>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
                {formatCurrency(metrics.totalInvoiced, tenantCurrency)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {activeDocCount} active invoice{activeDocCount === 1 ? '' : 's'}
              </div>
            </CardContent>
          </Card>

          {/* Collected */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Collected</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(metrics.totalCollected, tenantCurrency)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {metrics.statusCounts.paid || 0} fully settled
              </div>
            </CardContent>
          </Card>

          {/* Outstanding */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Outstanding</span>
                <Wallet className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {formatCurrency(metrics.totalOutstanding, tenantCurrency)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Uncollected balance
              </div>
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Overdue</span>
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                {formatCurrency(metrics.totalOverdue, tenantCurrency)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {metrics.overdueCount} past due
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Recent Invoices List (2 cols) */}
          <Card className="lg:col-span-2 border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground">
                Recent Invoices
              </CardTitle>
              <Link
                href="/dashboard/documents"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View All ({documents.length})</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Loading invoices...
                </div>
              ) : documents.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-xs text-muted-foreground">No invoices created yet.</p>
                  <Link href="/create">
                    <Button size="sm" className="text-xs bg-primary text-white">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Create Your First Invoice
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {documents.slice(0, 6).map((doc) => {
                    const effectiveStatus = computeEffectiveInvoiceStatus(doc);
                    const docCurr = doc.currency || tenantCurrency;
                    return (
                      <div
                        key={doc.id}
                        className="py-3 flex items-center justify-between hover:bg-muted/40 px-2 rounded-lg transition-colors"
                      >
                        <div className="space-y-0.5 min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/edit/${doc.id}`}
                              className="text-xs font-bold text-foreground hover:text-primary transition-colors truncate"
                            >
                              {doc.documentNumber}
                            </Link>
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
                              className="text-[10px] px-1.5 py-0 capitalize"
                            >
                              {formatInvoiceStatusLabel(effectiveStatus)}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {doc.client?.name || 'Customer'} • {doc.issueDate}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-foreground tabular-nums">
                            {formatCurrency(Number(doc.summary?.grandTotal || 0), docCurr)}
                          </div>
                          {Number(doc.summary?.balanceDue || 0) > 0 ? (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium tabular-nums">
                              Due: {formatCurrency(Number(doc.summary?.balanceDue || 0), docCurr)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Paid
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

          {/* Right: Status Breakdown & Shortcuts (1 col) */}
          <div className="space-y-6">
            {/* Status Breakdown */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground">
                  Invoice Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  { key: 'paid', label: 'Paid', count: metrics.statusCounts.paid || 0, color: 'bg-emerald-500' },
                  { key: 'pending', label: 'Pending', count: metrics.statusCounts.pending || 0, color: 'bg-blue-500' },
                  { key: 'overdue', label: 'Overdue', count: metrics.statusCounts.overdue || 0, color: 'bg-rose-500' },
                  { key: 'draft', label: 'Draft', count: metrics.statusCounts.draft || 0, color: 'bg-slate-400' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span className="text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="font-bold text-foreground tabular-nums">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Shortcuts */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground">
                  Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/create"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs font-medium text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>Create Invoice</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>

                <Link
                  href="/dashboard/parties"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs font-medium text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-500" />
                    <span>Customers</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>

                <Link
                  href="/dashboard/products"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs font-medium text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-indigo-500" />
                    <span>Products & Items</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>

                <Link
                  href="/dashboard/brand"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs font-medium text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-amber-500" />
                    <span>Brand Settings</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <UpgradePlanModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        currentCount={invoiceCount}
      />
    </TenantLayout>
  );
}
