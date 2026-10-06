'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi } from '@invoice/api';
import { DocumentModel, formatCurrency } from '@invoice/core';
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
} from 'lucide-react';

export default function TenantDashboardPage() {
  const { activeTenant } = useTenant();
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!activeTenant) return;
      setLoading(true);
      try {
        const docs = await TenantApi.getDocuments(activeTenant.id);
        setDocuments(docs);
      } catch (err) {
        console.error('Failed to load dashboard documents:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeTenant]);

  // Aggregate metrics dynamically
  const metrics = React.useMemo(() => {
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let draftCount = 0;
    let paidCount = 0;

    const now = new Date();

    documents.forEach((doc) => {
      if (doc.status === 'draft') {
        draftCount++;
        return;
      }

      totalInvoiced += doc.summary.grandTotal;
      totalCollected += doc.summary.amountPaid;
      totalOutstanding += doc.summary.balanceDue;

      if (doc.status === 'paid') {
        paidCount++;
      }

      if (doc.dueDate && new Date(doc.dueDate) < now && doc.summary.balanceDue > 0) {
        totalOverdue += doc.summary.balanceDue;
      }
    });

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      draftCount,
      paidCount,
    };
  }, [documents]);

  const currency = documents[0]?.currency || 'USD';

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
        {/* Workspace Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeTenant?.name || 'Workspace Dashboard'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time financial performance, document health, and collections ledger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/create">
              <Button size="sm" className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Create Document
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Financial KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Invoiced</span>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(metrics.totalInvoiced, currency)}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>{documents.length - metrics.draftCount} finalized documents</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Collected</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">
                {formatCurrency(metrics.totalCollected, currency)}
              </div>
              <div className="text-[11px] text-emerald-700 flex items-center gap-1">
                <span>{metrics.paidCount} fully settled invoices</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Outstanding</span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-600">
                {formatCurrency(metrics.totalOutstanding, currency)}
              </div>
              <div className="text-[11px] text-slate-500">
                Awaiting payment settlement
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="text-2xl font-black text-red-600">
                {formatCurrency(metrics.totalOverdue, currency)}
              </div>
              <div className="text-[11px] text-red-700">
                Past scheduled due dates
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Launch & Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions Panel */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">
                Workspace Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/create"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-primary/40 hover:bg-blue-50/30 transition-all text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div>New Invoice or Quote</div>
                    <div className="text-[10px] text-slate-400 font-normal">Generate document with live preview</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/parties"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-primary/40 hover:bg-blue-50/30 transition-all text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div>Manage Customers</div>
                    <div className="text-[10px] text-slate-400 font-normal">Add clients, tax IDs & addresses</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/products"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-primary/40 hover:bg-blue-50/30 transition-all text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <div>Services Catalog</div>
                    <div className="text-[10px] text-slate-400 font-normal">Define reusable rates & SKUs</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </CardContent>
          </Card>

          {/* Recent Documents Table */}
          <Card className="lg:col-span-2 border-slate-200 bg-white">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">
                Recent Tenant Documents
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
                <div className="py-8 text-center text-xs text-slate-400">
                  Loading workspace records...
                </div>
              ) : documents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No documents found for this tenant yet.{' '}
                  <Link href="/create" className="text-primary font-bold">
                    Create the first one
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {documents.slice(0, 5).map((doc) => (
                    <div
                      key={doc.id}
                      className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-md transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{doc.documentNumber}</span>
                          <Badge
                            variant={
                              doc.status === 'paid'
                                ? 'success'
                                : doc.status === 'finalized'
                                ? 'info'
                                : 'secondary'
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {doc.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {doc.client.name} • Issued {doc.issueDate}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-slate-900">
                          {formatCurrency(doc.summary.grandTotal, doc.currency)}
                        </div>
                        {doc.summary.balanceDue > 0 ? (
                          <div className="text-[10px] text-amber-600 font-semibold">
                            Due: {formatCurrency(doc.summary.balanceDue, doc.currency)}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Settled
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TenantLayout>
  );
}
