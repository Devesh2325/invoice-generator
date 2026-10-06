'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi } from '@invoice/api';
import { DocumentModel, formatCurrency, DocumentType, DocumentStatus } from '@invoice/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Copy,
  Edit,
  DollarSign,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';
import { exportDocumentToPdf, triggerPrint } from '@/lib/pdf/export-pdf';

export default function TenantDocumentsPage() {
  const { activeTenant } = useTenant();
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Payment Recording modal state
  const [selectedDocForPayment, setSelectedDocForPayment] = useState<DocumentModel | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'cheque' | 'card'>('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');

  const loadDocuments = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const docs = await TenantApi.getDocuments(activeTenant.id);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeTenant]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch =
        search === '' ||
        doc.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
        doc.client.name.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'all' || doc.type === typeFilter;
      const matchStatus = statusFilter === 'all' || doc.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [documents, search, typeFilter, statusFilter]);

  const handleConvertEstimateToInvoice = async (estimate: DocumentModel) => {
    if (!activeTenant) return;
    const invoiceDoc: DocumentModel = {
      ...estimate,
      id: `doc_${Date.now()}`,
      type: 'invoice',
      documentNumber: `INV-${Date.now().toString().slice(-5)}`,
      referenceNumber: `Converted from ${estimate.documentNumber}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await TenantApi.saveDocument(activeTenant.id, invoiceDoc);
    alert(`Successfully converted ${estimate.documentNumber} into invoice ${invoiceDoc.documentNumber}!`);
    await loadDocuments();
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !selectedDocForPayment || paymentAmount <= 0) return;

    await TenantApi.recordPayment(
      activeTenant.id,
      selectedDocForPayment.id,
      paymentAmount,
      paymentMethod,
      paymentRef
    );

    setSelectedDocForPayment(null);
    setPaymentAmount(0);
    setPaymentRef('');
    await loadDocuments();
  };

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Documents & Invoicing
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage all tenant invoices, quotes, receipts, and payment records.
            </p>
          </div>

          <Link href="/create">
            <Button size="sm" className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> New Document
            </Button>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by number, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Types</option>
              <option value="invoice">Invoices</option>
              <option value="estimate">Estimates / Quotes</option>
              <option value="purchase_order">Purchase Orders</option>
              <option value="receipt">Receipts</option>
              <option value="credit_note">Credit Notes</option>
              <option value="pro_forma">Pro Forma</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Document Table */}
        <Card className="border-slate-200 bg-white overflow-hidden shadow-xs">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Loading tenant documents...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No documents found</h3>
                <p className="text-xs text-slate-400">
                  Try adjusting your search criteria or create a new invoice.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Document</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {doc.documentNumber}
                        </td>
                        <td className="py-3.5 px-4 uppercase text-[10px] font-semibold text-slate-500">
                          {doc.type.replace('_', ' ')}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {doc.client.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{doc.issueDate}</td>
                        <td className="py-3.5 px-4 text-slate-600">{doc.dueDate || '—'}</td>
                        <td className="py-3.5 px-4 font-black text-slate-900 tabular-nums">
                          {formatCurrency(doc.summary.grandTotal, doc.currency)}
                        </td>
                        <td className="py-3.5 px-4 tabular-nums font-semibold">
                          {doc.summary.balanceDue > 0 ? (
                            <span className="text-amber-600">
                              {formatCurrency(doc.summary.balanceDue, doc.currency)}
                            </span>
                          ) : (
                            <span className="text-emerald-600">Paid</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              doc.status === 'paid'
                                ? 'success'
                                : doc.status === 'finalized'
                                ? 'info'
                                : 'secondary'
                            }
                            className="text-[10px]"
                          >
                            {doc.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {doc.type === 'estimate' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConvertEstimateToInvoice(doc)}
                                className="h-7 px-2 text-[11px]"
                                title="Convert Quote to Invoice"
                              >
                                <ArrowRightLeft className="h-3 w-3 mr-1" /> To Invoice
                              </Button>
                            )}

                            {doc.summary.balanceDue > 0 && doc.status !== 'draft' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDocForPayment(doc);
                                  setPaymentAmount(doc.summary.balanceDue);
                                }}
                                className="h-7 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50"
                              >
                                <DollarSign className="h-3 w-3 mr-0.5" /> Pay
                              </Button>
                            )}

                            <Link href={`/edit/${doc.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Edit">
                                <Edit className="h-3.5 w-3.5 text-slate-500" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Record Payment Modal */}
        {selectedDocForPayment && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
              <form onSubmit={handleRecordPaymentSubmit}>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-bold text-base text-slate-900">
                      Record Payment for #{selectedDocForPayment.documentNumber}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelectedDocForPayment(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Payment Amount ({selectedDocForPayment.currency})
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      max={selectedDocForPayment.summary.balanceDue}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      required
                    />
                    <div className="text-[11px] text-slate-500 mt-1">
                      Outstanding balance:{' '}
                      {formatCurrency(
                        selectedDocForPayment.summary.balanceDue,
                        selectedDocForPayment.currency
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
                    >
                      <option value="bank_transfer">Bank Transfer / Wire</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="card">Credit / Debit Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Transaction Reference / Notes
                    </label>
                    <Input
                      placeholder="e.g. WIRE-89412 or Cheque #492"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDocForPayment(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-primary hover:bg-primary-hover text-white font-semibold"
                    >
                      Record Payment
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
