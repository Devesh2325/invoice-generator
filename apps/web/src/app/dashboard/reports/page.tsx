'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi } from '@invoice/api';
import {
  DocumentModel,
  formatCurrency,
  computeEffectiveInvoiceStatus,
  formatInvoiceStatusLabel,
} from '@invoice/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Filter, RotateCcw } from 'lucide-react';

export default function TenantReportsPage() {
  const { activeTenant, tenantCurrency } = useTenant();
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');

  useEffect(() => {
    async function load() {
      if (!activeTenant) return;
      setLoading(true);
      try {
        const docs = await TenantApi.getDocuments(activeTenant.id);
        setDocuments(docs);
      } catch (err) {
        console.error('Error loading invoices for reports:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeTenant]);

  // Unique customers and currencies for filter dropdowns
  const uniqueCustomers = useMemo(() => {
    const names = new Set<string>();
    documents.forEach((d) => {
      if (d.client?.name) names.add(d.client.name.trim());
    });
    return Array.from(names).sort();
  }, [documents]);

  const uniqueCurrencies = useMemo(() => {
    const codes = new Set<string>([tenantCurrency]);
    documents.forEach((d) => {
      if (d.currency) codes.add(d.currency);
    });
    return Array.from(codes);
  }, [documents, tenantCurrency]);

  // Apply all filters
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const effectiveStatus = computeEffectiveInvoiceStatus(doc);

      if (statusFilter !== 'all' && effectiveStatus !== statusFilter) return false;
      if (customerFilter !== 'all' && (doc.client?.name || '').trim() !== customerFilter) return false;
      if (currencyFilter !== 'all' && (doc.currency || tenantCurrency) !== currencyFilter) return false;

      if (dateFrom && doc.issueDate < dateFrom) return false;
      if (dateTo && doc.issueDate > dateTo) return false;

      if (paymentMethodFilter !== 'all') {
        const hasMethodInPayments = (doc.payments || []).some(
          (p) => p.paymentMethod === paymentMethodFilter
        );
        const hasMethodInRefunds = (doc.refunds || []).some(
          (r) => r.refundMethod === paymentMethodFilter
        );
        if (!hasMethodInPayments && !hasMethodInRefunds) return false;
      }

      return true;
    });
  }, [
    documents,
    statusFilter,
    customerFilter,
    currencyFilter,
    dateFrom,
    dateTo,
    paymentMethodFilter,
    tenantCurrency,
  ]);

  const displayCurrency = currencyFilter !== 'all' ? currencyFilter : tenantCurrency;

  // Financial aggregates (distinguishing invoiced amounts, cash collected, refunds, round-off, tax)
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let netTaxableRevenue = 0;
    let totalTax = 0;
    let totalCashCollected = 0;
    let totalRefunded = 0;
    let netCashRetained = 0;
    let totalRoundOff = 0;
    let outstandingReceivables = 0;
    const taxByRate: Record<string, number> = {};

    filteredDocs.forEach((doc) => {
      const effectiveStatus = computeEffectiveInvoiceStatus(doc);

      const refunded = Number(doc.summary?.refundedAmount || 0);
      totalRefunded += refunded;

      if (effectiveStatus === 'draft' || effectiveStatus === 'cancelled') return;

      const grandTotal = Number(doc.summary?.grandTotal || 0);
      const subtotal = Number(doc.summary?.taxableSubtotal || 0);
      const tax = Number(doc.summary?.totalTax || 0);
      const paid = Number(doc.summary?.amountPaid || 0);
      const balance = Number(doc.summary?.balanceDue || 0);
      const roundOff = Number(doc.summary?.roundOffAmount || 0);

      totalInvoiced += grandTotal;
      netTaxableRevenue += subtotal;
      totalTax += tax;
      totalCashCollected += paid;
      outstandingReceivables += balance;
      totalRoundOff += roundOff;

      (doc.summary?.taxBreakdown || []).forEach((b) => {
        const key = `Tax Tier (${b.rate}%)`;
        taxByRate[key] = (taxByRate[key] || 0) + Number(b.taxAmount || 0);
      });
    });

    netCashRetained = Math.max(0, totalCashCollected - totalRefunded);

    return {
      totalInvoiced,
      netTaxableRevenue,
      totalTax,
      totalCashCollected,
      totalRefunded,
      netCashRetained,
      totalRoundOff,
      outstandingReceivables,
      taxByRate,
    };
  }, [filteredDocs]);

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setCustomerFilter('all');
    setStatusFilter('all');
    setPaymentMethodFilter('all');
    setCurrencyFilter('all');
  };

  const handleExportCsv = () => {
    const rows = [
      [
        'Invoice Number',
        'Invoice Name',
        'Customer',
        'Issue Date',
        'Due Date',
        'Currency',
        'Subtotal',
        'Tax',
        'Round-Off',
        'Final Payable',
        'Cash Collected',
        'Refunded',
        'Outstanding Balance',
        'Status',
      ],
      ...filteredDocs.map((d) => {
        const eff = computeEffectiveInvoiceStatus(d);
        return [
          d.documentNumber,
          d.invoiceName || 'Invoice',
          d.client?.name || '',
          d.issueDate,
          d.dueDate || '',
          d.currency || tenantCurrency,
          Number(d.summary?.subtotal || 0),
          Number(d.summary?.totalTax || 0),
          Number(d.summary?.roundOffAmount || 0),
          Number(d.summary?.grandTotal || 0),
          Number(d.summary?.amountPaid || 0),
          Number(d.summary?.refundedAmount || 0),
          Number(d.summary?.balanceDue || 0),
          formatInvoiceStatusLabel(eff),
        ];
      }),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial-report-${new Date().toISOString().split('T')[0]}.csv`);
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
              Reports
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Accrual vs cash accounting breakdown: invoiced revenue, actual cash collected, refunds, round-off adjustments, and tax liabilities ({displayCurrency}).
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export Filtered CSV ({filteredDocs.length})
          </Button>
        </div>

        {/* Multi-Dimensional Report Filters */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-indigo-600" /> Report Filters
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  From Date
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  To Date
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Customer
                </label>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs"
                >
                  <option value="all">All Customers</option>
                  {uniqueCustomers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Invoice Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Currency
                </label>
                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs"
                >
                  <option value="all">Workspace Default ({tenantCurrency})</option>
                  {uniqueCurrencies.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6 Distinct Financial Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Invoiced (Accrual)
              </span>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {formatCurrency(stats.totalInvoiced, displayCurrency)}
              </div>
              <div className="text-[11px] text-slate-400">
                Net Taxable: {formatCurrency(stats.netTaxableRevenue, displayCurrency)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actual Cash Collected
              </span>
              <div className="text-2xl font-black text-emerald-600 tabular-nums">
                {formatCurrency(stats.totalCashCollected, displayCurrency)}
              </div>
              <div className="text-[11px] text-emerald-700">
                Net after refunds: {formatCurrency(stats.netCashRetained, displayCurrency)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Refunds Issued
              </span>
              <div className="text-2xl font-black text-rose-600 tabular-nums">
                {formatCurrency(stats.totalRefunded, displayCurrency)}
              </div>
              <div className="text-[11px] text-slate-400">
                Tracked separately from collections
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Outstanding Receivables
              </span>
              <div className="text-2xl font-black text-amber-600 tabular-nums">
                {formatCurrency(stats.outstandingReceivables, displayCurrency)}
              </div>
              <div className="text-[11px] text-slate-400">
                Uncollected customer balances
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Tax Liability
              </span>
              <div className="text-2xl font-black text-indigo-600 tabular-nums">
                {formatCurrency(stats.totalTax, displayCurrency)}
              </div>
              <div className="text-[11px] text-slate-400">
                CGST / SGST / IGST / Tax total
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Net Round-Off Adjustments
              </span>
              <div className="text-2xl font-black text-slate-800 tabular-nums">
                {formatCurrency(stats.totalRoundOff, displayCurrency, { showSign: true })}
              </div>
              <div className="text-[11px] text-slate-400">
                Cumulative invoice rounding delta
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tax Summary Table */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Tax Breakdown by Component ({displayCurrency})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.taxByRate).length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No tax liabilities recorded for the selected filters.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {Object.entries(stats.taxByRate).map(([tierName, taxAmount]) => (
                  <div key={tierName} className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-700">{tierName}</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatCurrency(taxAmount, displayCurrency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Filtered Invoices Breakdown Table */}
        <Card className="border-slate-200 bg-white overflow-hidden shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Filtered Invoice Ledger ({filteredDocs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading report records...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No invoices match the current filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Invoiced</th>
                      <th className="py-3 px-4 text-right">Collected</th>
                      <th className="py-3 px-4 text-right">Refunded</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.map((doc) => {
                      const eff = computeEffectiveInvoiceStatus(doc);
                      const curr = doc.currency || tenantCurrency;
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{doc.documentNumber}</div>
                            <div className="text-[10px] text-slate-400">
                              {doc.invoiceName || 'Invoice'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-800">{doc.client?.name || 'Customer'}</td>
                          <td className="py-3 px-4 text-slate-600">{doc.issueDate}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px]">
                              {formatInvoiceStatusLabel(eff)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                            {formatCurrency(Number(doc.summary?.grandTotal || 0), curr)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-600 tabular-nums">
                            {formatCurrency(Number(doc.summary?.amountPaid || 0), curr)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-rose-600 tabular-nums">
                            {formatCurrency(Number(doc.summary?.refundedAmount || 0), curr)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-amber-600 tabular-nums">
                            {formatCurrency(Number(doc.summary?.balanceDue || 0), curr)}
                          </td>
                        </tr>
                      );
                    })}
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
