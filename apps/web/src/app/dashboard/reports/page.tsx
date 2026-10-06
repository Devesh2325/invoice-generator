'use client';

import React, { useEffect, useState } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi } from '@invoice/api';
import { DocumentModel, formatCurrency } from '@invoice/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Calendar, DollarSign } from 'lucide-react';

export default function TenantReportsPage() {
  const { activeTenant } = useTenant();
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!activeTenant) return;
      setLoading(true);
      try {
        const docs = await TenantApi.getDocuments(activeTenant.id);
        setDocuments(docs);
      } catch (err) {
        console.error('Error loading documents for reports:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeTenant]);

  // Financial aggregates
  const stats = React.useMemo(() => {
    let grossSales = 0;
    let netSales = 0;
    let totalTax = 0;
    let totalCollected = 0;
    let totalReceivables = 0;
    const taxByRate: Record<number, number> = {};

    documents.forEach((doc) => {
      if (doc.status === 'draft' || doc.status === 'cancelled') return;

      grossSales += doc.summary.grandTotal;
      netSales += doc.summary.taxableSubtotal;
      totalTax += doc.summary.totalTax;
      totalCollected += doc.summary.amountPaid;
      totalReceivables += doc.summary.balanceDue;

      doc.summary.taxBreakdown.forEach((b) => {
        taxByRate[b.rate] = (taxByRate[b.rate] || 0) + b.taxAmount;
      });
    });

    return {
      grossSales,
      netSales,
      totalTax,
      totalCollected,
      totalReceivables,
      taxByRate,
    };
  }, [documents]);

  const handleExportCsv = () => {
    const rows = [
      ['Document Number', 'Type', 'Client', 'Issue Date', 'Grand Total', 'Tax', 'Paid', 'Balance', 'Status'],
      ...documents.map((d) => [
        d.documentNumber,
        d.type,
        d.client.name,
        d.issueDate,
        d.summary.grandTotal,
        d.summary.totalTax,
        d.summary.amountPaid,
        d.summary.balanceDue,
        d.status,
      ]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((x) => `"${x}"`).join(',')).join('\n');
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
              Financial Reports & Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Sales volume, tax filings breakdown, collected revenue, and aged receivables.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export Financial CSV
          </Button>
        </div>

        {/* 4 Report Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Invoiced Sales</span>
              <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.grossSales, 'USD')}</div>
              <div className="text-[11px] text-slate-400">Total volume invoiced</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Taxable Revenue</span>
              <div className="text-2xl font-black text-blue-600">{formatCurrency(stats.netSales, 'USD')}</div>
              <div className="text-[11px] text-slate-400">Excluding tax & charges</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tax Collected</span>
              <div className="text-2xl font-black text-indigo-600">{formatCurrency(stats.totalTax, 'USD')}</div>
              <div className="text-[11px] text-slate-400">Liabilities across all tax rates</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aged Receivables</span>
              <div className="text-2xl font-black text-amber-600">{formatCurrency(stats.totalReceivables, 'USD')}</div>
              <div className="text-[11px] text-slate-400">Uncollected client balances</div>
            </CardContent>
          </Card>
        </div>

        {/* Tax Summary Table */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Tax Liabilities by Rate Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.taxByRate).length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No tax liabilities recorded.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {Object.entries(stats.taxByRate).map(([rate, taxAmount]) => (
                  <div key={rate} className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Tax Tier {rate}%</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatCurrency(taxAmount, 'USD')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TenantLayout>
  );
}
