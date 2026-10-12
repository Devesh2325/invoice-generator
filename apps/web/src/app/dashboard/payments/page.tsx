'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi } from '@invoice/api';
import {
  CanonicalDocument,
  formatCurrency,
  PaymentRecord,
  RefundRecord,
} from '@invoice/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Download,
  Search,
  RotateCcw,
  ArrowDownLeft,
  Wallet,
} from 'lucide-react';

interface LedgerEntry {
  id: string;
  entryType: 'payment' | 'refund';
  date: string;
  docId: string;
  docNumber: string;
  invoiceName: string;
  customerName: string;
  method: string;
  reference: string;
  notes: string;
  amount: number;
  currency: string;
}

export default function TenantPaymentsPage() {
  const { activeTenant, tenantCurrency } = useTenant();
  const [documents, setDocuments] = useState<CanonicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'payment' | 'refund'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      if (!activeTenant) return;
      setLoading(true);
      try {
        const docs = await TenantApi.getDocuments(activeTenant.id);
        setDocuments(docs);
      } catch (err) {
        console.error('Error loading invoices for payments:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeTenant]);

  // Flatten all payments and refunds across invoices
  const ledgerEntries = useMemo(() => {
    const list: LedgerEntry[] = [];
    documents.forEach((doc) => {
      const docCurrency = doc.currency || tenantCurrency;
      const customerName = doc.client?.name || 'Customer';
      const invoiceName = doc.invoiceName || 'Invoice';

      (doc.payments || []).forEach((p: PaymentRecord) => {
        list.push({
          id: p.id,
          entryType: 'payment',
          date: p.paymentDate,
          docId: doc.id,
          docNumber: doc.documentNumber,
          invoiceName,
          customerName,
          method: p.paymentMethod || 'bank_transfer',
          reference: p.reference || '',
          notes: p.notes || '',
          amount: Number(p.amount || 0),
          currency: docCurrency,
        });
      });

      (doc.refunds || []).forEach((r: RefundRecord) => {
        list.push({
          id: r.id,
          entryType: 'refund',
          date: r.refundDate,
          docId: doc.id,
          docNumber: doc.documentNumber,
          invoiceName,
          customerName,
          method: r.refundMethod || 'bank_transfer',
          reference: r.reference || '',
          notes: r.reason || r.notes || '',
          amount: Number(r.amount || 0),
          currency: docCurrency,
        });
      });
    });

    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [documents, tenantCurrency]);

  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter((entry) => {
      const matchTab = activeTab === 'all' || entry.entryType === activeTab;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        entry.docNumber.toLowerCase().includes(q) ||
        entry.invoiceName.toLowerCase().includes(q) ||
        entry.customerName.toLowerCase().includes(q) ||
        entry.reference.toLowerCase().includes(q) ||
        entry.method.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [ledgerEntries, activeTab, search]);

  const summary = useMemo(() => {
    let totalCollected = 0;
    let totalRefunded = 0;
    let pendingBalance = 0;

    documents.forEach((doc) => {
      if (doc.status === 'draft' || doc.status === 'cancelled') return;
      totalCollected += Number(doc.summary?.amountPaid || 0);
      totalRefunded += Number(doc.summary?.refundedAmount || 0);
      pendingBalance += Number(doc.summary?.balanceDue || 0);
    });

    return {
      totalCollected,
      totalRefunded,
      netCollections: Math.max(0, totalCollected - totalRefunded),
      pendingBalance,
    };
  }, [documents]);

  const handleExportCsv = () => {
    const rows = [
      ['Date', 'Type', 'Invoice Number', 'Invoice Name', 'Customer', 'Method', 'Reference', 'Notes / Reason', 'Currency', 'Amount'],
      ...filteredEntries.map((e) => [
        e.date,
        e.entryType.toUpperCase(),
        e.docNumber,
        e.invoiceName,
        e.customerName,
        e.method.replace('_', ' '),
        e.reference,
        e.notes,
        e.currency,
        e.entryType === 'refund' ? `-${e.amount}` : String(e.amount),
      ]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `payments-ledger-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Payments
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Complete transaction ledger of collected invoice payments, partial settlements, and issued refunds ({tenantCurrency}).
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export Payments CSV
          </Button>
        </div>

        {/* Summary KPI Cards in Selected Workspace Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Collected</span>
                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 tabular-nums">
                {formatCurrency(summary.totalCollected, tenantCurrency)}
              </div>
              <div className="text-[11px] text-slate-400">
                Gross payments received
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Refunds</span>
                <RotateCcw className="h-4 w-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-600 tabular-nums">
                {formatCurrency(summary.totalRefunded, tenantCurrency)}
              </div>
              <div className="text-[11px] text-slate-400">
                Partial & full refunds issued
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Net Collections</span>
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {formatCurrency(summary.netCollections, tenantCurrency)}
              </div>
              <div className="text-[11px] text-slate-400">
                Collected minus refunds
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Pending Payments</span>
                <CreditCard className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-600 tabular-nums">
                {formatCurrency(summary.pendingBalance, tenantCurrency)}
              </div>
              <div className="text-[11px] text-slate-400">
                Remaining balance across open invoices
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              All ({ledgerEntries.length})
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-3.5 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'payment'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Payments ({ledgerEntries.filter((e) => e.entryType === 'payment').length})
            </button>
            <button
              onClick={() => setActiveTab('refund')}
              className={`px-3.5 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'refund'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Refunds ({ledgerEntries.filter((e) => e.entryType === 'refund').length})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by invoice #, customer, reference, or method..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* Payments & Refunds Table */}
        <Card className="border-slate-200 bg-white overflow-hidden shadow-xs">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading payment history...</div>
            ) : filteredEntries.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CreditCard className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No payment transactions found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When you record full or partial payments or issue refunds on invoices, every transaction appears here with its reference and notes.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Invoice</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Transaction Ref</th>
                      <th className="py-3 px-4">Notes / Reason</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{entry.date}</td>
                        <td className="py-3 px-4">
                          {entry.entryType === 'payment' ? (
                            <Badge variant="success" className="text-[10px]">
                              Payment
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">
                              Refund
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{entry.docNumber}</div>
                          <div className="text-[10px] text-slate-400">{entry.invoiceName}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{entry.customerName}</td>
                        <td className="py-3 px-4 capitalize text-slate-600">
                          {entry.method.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {entry.reference || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {entry.notes || '—'}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-black tabular-nums text-sm whitespace-nowrap ${
                            entry.entryType === 'refund' ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {entry.entryType === 'refund' ? '-' : '+'}
                          {formatCurrency(entry.amount, entry.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TenantLayout>
  );
}
