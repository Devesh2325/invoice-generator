'use client';

import React, { useEffect, useState } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi } from '@invoice/api';
import { DocumentModel, formatCurrency, PaymentRecord } from '@invoice/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign, Download, CheckCircle2 } from 'lucide-react';

export default function TenantPaymentsPage() {
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
        console.error('Error loading documents for payments:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeTenant]);

  // Flatten all payments across documents
  const allPayments = React.useMemo(() => {
    const list: (PaymentRecord & { docNumber: string; clientName: string; currency: string })[] = [];
    documents.forEach((doc) => {
      doc.payments?.forEach((p) => {
        list.push({
          ...p,
          docNumber: doc.documentNumber,
          clientName: doc.client.name,
          currency: doc.currency,
        });
      });
    });
    return list.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [documents]);

  const totalCollected = allPayments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Payment Receipts & Collections
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Audit log of all settled transactions, bank wires, cheques, and payment receipts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50 border-emerald-200 py-1 px-3">
              Total Recorded: {formatCurrency(totalCollected, 'USD')}
            </Badge>
          </div>
        </div>

        {/* Payments Table */}
        <Card className="border-slate-200 bg-white overflow-hidden shadow-xs">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading payment ledger...</div>
            ) : allPayments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CreditCard className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No payment receipts recorded</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When you record payments against finalized invoices, receipts appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4">Document</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4 text-right">Amount Settled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-600">{p.paymentDate}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.docNumber}</td>
                        <td className="py-3 px-4 text-slate-800">{p.clientName}</td>
                        <td className="py-3 px-4 capitalize text-slate-600">
                          {p.paymentMethod.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {p.reference || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600 tabular-nums text-sm">
                          {formatCurrency(p.amount, p.currency)}
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
