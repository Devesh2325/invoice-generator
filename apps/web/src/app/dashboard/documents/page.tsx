'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi } from '@invoice/api';
import {
  DocumentModel,
  formatCurrency,
  PaymentMethod,
  computeEffectiveInvoiceStatus,
  formatInvoiceStatusLabel,
} from '@invoice/core';
import { DocumentPreview } from '@/components/document/document-preview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Plus,
  Search,
  Download,
  Printer,
  Edit,
  CreditCard,
  ArrowRightLeft,
  Eye,
  Share2,
  History,
  Undo2,
  Ban,
  Copy,
} from 'lucide-react';
import { exportDocumentToPdf, triggerPrint } from '@/lib/pdf/export-pdf';

export default function TenantInvoicesPage() {
  const { activeTenant, tenantCurrency } = useTenant();
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Preview / PDF / Print Modal
  const [previewDoc, setPreviewDoc] = useState<DocumentModel | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Payment Recording Modal State
  const [selectedDocForPayment, setSelectedDocForPayment] = useState<DocumentModel | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Refund Modal State
  const [selectedDocForRefund, setSelectedDocForRefund] = useState<DocumentModel | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('bank_transfer');
  const [refundDate, setRefundDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [refundReason, setRefundReason] = useState('');
  const [refundRef, setRefundRef] = useState('');
  const [refundNotes, setRefundNotes] = useState('');

  // Payment History Modal State
  const [selectedDocForHistory, setSelectedDocForHistory] = useState<DocumentModel | null>(null);

  // Share Modal State
  const [selectedDocForShare, setSelectedDocForShare] = useState<DocumentModel | null>(null);

  const loadDocuments = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const docs = await TenantApi.getDocuments(activeTenant.id);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeTenant]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const effStatus = computeEffectiveInvoiceStatus(doc);
      const matchSearch =
        search === '' ||
        doc.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
        (doc.invoiceName && doc.invoiceName.toLowerCase().includes(search.toLowerCase())) ||
        doc.client.name.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'all' || doc.type === typeFilter;
      const matchStatus =
        statusFilter === 'all' ||
        effStatus === statusFilter ||
        (statusFilter === 'pending' && (effStatus === 'pending' || effStatus === 'finalized' || effStatus === 'sent'));

      return matchSearch && matchType && matchStatus;
    });
  }, [documents, search, typeFilter, statusFilter]);

  const handleConvertEstimateToInvoice = async (estimate: DocumentModel) => {
    if (!activeTenant) return;
    const invoiceDoc: DocumentModel = {
      ...estimate,
      id: `doc_${Date.now()}`,
      invoiceName: estimate.invoiceName || `Invoice from ${estimate.documentNumber}`,
      type: 'invoice',
      documentNumber: `INV-${Date.now().toString().slice(-5)}`,
      referenceNumber: `Converted from ${estimate.documentNumber}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await TenantApi.saveDocument(activeTenant.id, invoiceDoc);
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
      paymentRef,
      paymentNotes,
      paymentDate
    );

    setSelectedDocForPayment(null);
    setPaymentAmount(0);
    setPaymentRef('');
    setPaymentNotes('');
    await loadDocuments();
  };

  const handleRecordRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !selectedDocForRefund || refundAmount <= 0) return;

    await TenantApi.recordRefund(
      activeTenant.id,
      selectedDocForRefund.id,
      refundAmount,
      refundMethod,
      refundReason,
      refundRef,
      refundNotes,
      refundDate
    );

    setSelectedDocForRefund(null);
    setRefundAmount(0);
    setRefundReason('');
    setRefundRef('');
    setRefundNotes('');
    await loadDocuments();
  };

  const handleCancelInvoice = async (doc: DocumentModel) => {
    if (!activeTenant) return;
    if (!window.confirm(`Cancel invoice #${doc.documentNumber}?`)) return;
    await TenantApi.updateDocumentStatus(activeTenant.id, doc.id, 'cancelled');
    await loadDocuments();
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partially_paid':
      case 'refunded':
        return 'warning';
      case 'overdue':
      case 'cancelled':
        return 'destructive';
      case 'pending':
      case 'finalized':
      case 'sent':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Invoices
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage invoices, track payment collections, issue partial/full refunds, and download PDFs.
            </p>
          </div>

          <Link href="/create">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create Invoice
            </Button>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by invoice name, number, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Invoice Types</option>
              <option value="invoice">Tax Invoices</option>
              <option value="estimate">Estimates / Quotes</option>
              <option value="pro_forma">Pro Forma Invoices</option>
              <option value="purchase_order">Purchase Orders</option>
              <option value="receipt">Receipts</option>
              <option value="credit_note">Credit Notes</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 dark:border-slate-800 rounded-md px-2.5 py-1.5 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Loading workspace invoices...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No invoices found</h3>
                <p className="text-xs text-slate-400">
                  Try adjusting your search filters or create a new invoice.
                </p>
                <Link href="/create" className="inline-block pt-1">
                  <Button size="sm" className="bg-primary text-white text-xs">
                    Create Invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/75 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Invoice Name / No.</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Issue / Due Date</th>
                      <th className="py-3 px-4 text-right">Invoice Total</th>
                      <th className="py-3 px-4 text-right">Collected</th>
                      <th className="py-3 px-4 text-right">Refunded</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredDocs.map((doc) => {
                      const effStatus = computeEffectiveInvoiceStatus(doc);
                      const docCurr = doc.currency || tenantCurrency;
                      const maxRefundable = Math.max(
                        0,
                        Number(doc.summary.amountPaid || 0) -
                          Number(doc.summary.refundedAmount || 0)
                      );
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{doc.documentNumber}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {doc.invoiceName || doc.type.replace('_', ' ').toUpperCase()}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{doc.client.name}</div>
                            {doc.client.taxId && (
                              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                GSTIN: {doc.client.taxId}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            <div>Issued: {doc.issueDate}</div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                              Due: {doc.dueDate || 'On Receipt'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-slate-100 tabular-nums">
                            <div>{formatCurrency(doc.summary.grandTotal, docCurr)}</div>
                            {doc.summary.roundOffAmount !== undefined &&
                              doc.summary.roundOffAmount !== 0 && (
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                                  Round-off:{' '}
                                  {formatCurrency(doc.summary.roundOffAmount, docCurr, {
                                    showSign: true,
                                  })}
                                </div>
                              )}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(doc.summary.amountPaid || 0, docCurr)}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                            {(doc.summary.refundedAmount || 0) > 0
                              ? formatCurrency(doc.summary.refundedAmount || 0, docCurr)
                              : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right tabular-nums font-bold">
                            {doc.summary.balanceDue > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400">
                                {formatCurrency(doc.summary.balanceDue, docCurr)}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">Settled</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={statusBadgeVariant(effStatus) as any}
                              className="text-[10px]"
                            >
                              {formatInvoiceStatusLabel(effStatus)}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              {/* Preview / PDF / Print */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPreviewDoc(doc)}
                                className="h-7 px-2 text-[11px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                title="Preview Invoice, Download PDF or Print"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300 mr-1" /> Preview
                              </Button>

                              {/* Record Payment */}
                              {doc.summary.balanceDue > 0 && effStatus !== 'cancelled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedDocForPayment(doc);
                                    setPaymentAmount(doc.summary.balanceDue);
                                  }}
                                  className="h-7 px-2 text-[11px] text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                  title="Record Full or Partial Payment"
                                >
                                  <CreditCard className="h-3 w-3 mr-1" /> Pay
                                </Button>
                              )}

                              {/* Issue Refund */}
                              {maxRefundable > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedDocForRefund(doc);
                                    setRefundAmount(maxRefundable);
                                  }}
                                  className="h-7 px-2 text-[11px] text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  title="Issue Partial or Full Refund"
                                >
                                  <Undo2 className="h-3 w-3 mr-1" /> Refund
                                </Button>
                              )}

                              {/* Payment History */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedDocForHistory(doc)}
                                className="h-7 w-7 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                title="View Payment & Refund History"
                              >
                                <History className="h-3.5 w-3.5" />
                              </Button>

                              {/* Send / Share */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedDocForShare(doc)}
                                className="h-7 w-7 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                title="Send or Share Invoice"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </Button>

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

                              {/* Edit Invoice */}
                              <Link href={`/edit/${doc.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  title="Edit Invoice"
                                >
                                  <Edit className="h-3.5 w-3.5 text-slate-500" />
                                </Button>
                              </Link>

                              {/* Cancel Invoice */}
                              {effStatus !== 'cancelled' && effStatus !== 'paid' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelInvoice(doc)}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                                  title="Cancel Invoice"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
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

        {/* MODAL 1: PREVIEW INVOICE + DOWNLOAD PDF + PRINT */}
        {previewDoc && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="w-full max-w-4xl bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
              <div className="bg-white dark:bg-slate-900 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {previewDoc.invoiceName || 'Invoice Preview'} — #{previewDoc.documentNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Status: {formatInvoiceStatusLabel(computeEffectiveInvoiceStatus(previewDoc))} •{' '}
                    {formatCurrency(previewDoc.summary.grandTotal, previewDoc.currency)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={triggerPrint}
                    className="h-8 text-xs font-semibold"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" /> Print Invoice
                  </Button>
                  <Button
                    size="sm"
                    disabled={isExportingPdf}
                    onClick={async () => {
                      setIsExportingPdf(true);
                      try {
                        await exportDocumentToPdf(
                          'modal-invoice-preview-capture',
                          previewDoc.documentNumber
                        );
                      } finally {
                        setIsExportingPdf(false);
                      }
                    }}
                    className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    {isExportingPdf ? 'Generating PDF...' : 'Download PDF'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold px-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <DocumentPreview
                  document={previewDoc}
                  captureId="modal-invoice-preview-capture"
                  isPrintOnly
                />
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: RECORD PAYMENT */}
        {selectedDocForPayment && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
              <form onSubmit={handleRecordPaymentSubmit}>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      Record Payment for #{selectedDocForPayment.documentNumber}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelectedDocForPayment(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Original Invoice Amount:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(
                          selectedDocForPayment.summary.grandTotal,
                          selectedDocForPayment.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Collected Payments:</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        {formatCurrency(
                          selectedDocForPayment.summary.amountPaid,
                          selectedDocForPayment.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1 font-bold">
                      <span className="text-slate-800 dark:text-slate-200">Remaining Balance:</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400">
                        {formatCurrency(
                          selectedDocForPayment.summary.balanceDue,
                          selectedDocForPayment.currency
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Payment Amount ({selectedDocForPayment.currency}) *
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      max={selectedDocForPayment.summary.balanceDue}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      required
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full text-xs border border-slate-300 dark:border-slate-800 rounded-md p-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      >
                        <option value="bank_transfer">Bank Transfer / NEFT</option>
                        <option value="upi">UPI</option>
                        <option value="card">Credit / Debit Card</option>
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Payment Date
                      </label>
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Transaction Reference
                    </label>
                    <Input
                      placeholder="e.g. UTR / NEFT-89412 or UPI Ref"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Payment Notes
                    </label>
                    <Input
                      placeholder="Optional note..."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      Record Payment
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* MODAL 3: ISSUE PARTIAL OR FULL REFUND */}
        {selectedDocForRefund && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
              <form onSubmit={handleRecordRefundSubmit}>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      Issue Refund — #{selectedDocForRefund.documentNumber}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelectedDocForRefund(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Collected Payments:</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(
                          selectedDocForRefund.summary.amountPaid,
                          selectedDocForRefund.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Already Refunded:</span>
                      <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                        {formatCurrency(
                          selectedDocForRefund.summary.refundedAmount || 0,
                          selectedDocForRefund.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-rose-200 dark:border-rose-900/40 pt-1 font-bold text-slate-900 dark:text-slate-100">
                      <span>Max Refundable Balance:</span>
                      <span className="font-mono">
                        {formatCurrency(
                          Math.max(
                            0,
                            selectedDocForRefund.summary.amountPaid -
                              (selectedDocForRefund.summary.refundedAmount || 0)
                          ),
                          selectedDocForRefund.currency
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Refund Amount ({selectedDocForRefund.currency}) *
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      max={Math.max(
                        0,
                        selectedDocForRefund.summary.amountPaid -
                          (selectedDocForRefund.summary.refundedAmount || 0)
                      )}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      required
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Note: Partial refunds preserve the invoice status as Paid / Partially Paid. Only full refunds mark the invoice as Refunded.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Refund Method
                      </label>
                      <select
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                        className="w-full text-xs border border-slate-300 dark:border-slate-800 rounded-md p-2.5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      >
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card Reversal</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Refund Date
                      </label>
                      <Input
                        type="date"
                        value={refundDate}
                        onChange={(e) => setRefundDate(e.target.value)}
                        className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Refund Reason
                    </label>
                    <Input
                      placeholder="e.g. Partial scope adjustment / Early termination"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Transaction Reference
                    </label>
                    <Input
                      placeholder="e.g. REF-99012"
                      value={refundRef}
                      onChange={(e) => setRefundRef(e.target.value)}
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDocForRefund(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                    >
                      Confirm Refund
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* MODAL 4: VIEW PAYMENT & REFUND HISTORY */}
        {selectedDocForHistory && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      Payment & Refund History — #{selectedDocForHistory.documentNumber}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedDocForHistory.client.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDocForHistory(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Invoiced</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(
                        selectedDocForHistory.summary.grandTotal,
                        selectedDocForHistory.currency
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">Collected</div>
                    <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(
                        selectedDocForHistory.summary.amountPaid,
                        selectedDocForHistory.currency
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                    <div className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold">Refunded</div>
                    <div className="font-mono font-bold text-rose-700 dark:text-rose-400">
                      {formatCurrency(
                        selectedDocForHistory.summary.refundedAmount || 0,
                        selectedDocForHistory.currency
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold">Balance</div>
                    <div className="font-mono font-bold text-amber-700 dark:text-amber-400">
                      {formatCurrency(
                        selectedDocForHistory.summary.balanceDue,
                        selectedDocForHistory.currency
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <h4 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
                    Payment Records ({(selectedDocForHistory.payments || []).length})
                  </h4>
                  {(selectedDocForHistory.payments || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-lg">
                      No payments recorded yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                      {selectedDocForHistory.payments.map((p) => (
                        <div key={p.id} className="p-3 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 capitalize">
                              {p.paymentMethod.replace('_', ' ')} • {p.paymentDate}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {p.reference ? `Ref: ${p.reference}` : 'No reference'}{' '}
                              {p.notes ? `• ${p.notes}` : ''}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            +{formatCurrency(p.amount, selectedDocForHistory.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {(selectedDocForHistory.refunds || []).length > 0 && (
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 text-[10px]">
                      Refund Records ({(selectedDocForHistory.refunds || []).length})
                    </h4>
                    <div className="divide-y divide-rose-200 dark:divide-rose-900 border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20 rounded-lg">
                      {(selectedDocForHistory.refunds || []).map((r) => (
                        <div key={r.id} className="p-3 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 capitalize">
                              {r.refundMethod.replace('_', ' ')} • {r.refundDate}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {r.reason ? `Reason: ${r.reason}` : ''}{' '}
                              {r.reference ? `• Ref: ${r.reference}` : ''}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            -{formatCurrency(r.amount, selectedDocForHistory.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedDocForHistory.auditHistory || []).length > 0 && (
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-[10px]">
                      Audit Trail
                    </h4>
                    <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                      {(selectedDocForHistory.auditHistory || []).map((a) => (
                        <div key={a.id} className="flex justify-between gap-2 text-slate-600 dark:text-slate-300">
                          <span>{a.description}</span>
                          <span className="text-slate-400 dark:text-slate-500 shrink-0">
                            {new Date(a.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* MODAL 5: SEND OR SHARE INVOICE */}
        {selectedDocForShare && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Share Invoice #{selectedDocForShare.documentNumber}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedDocForShare(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Customer Email
                    </label>
                    <Input defaultValue={selectedDocForShare.client.email || ''} />
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 space-y-1">
                    <div>
                      <strong>Invoice:</strong> {selectedDocForShare.documentNumber}
                    </div>
                    <div>
                      <strong>Customer:</strong> {selectedDocForShare.client.name}
                    </div>
                    <div>
                      <strong>Amount:</strong>{' '}
                      {formatCurrency(
                        selectedDocForShare.summary.grandTotal,
                        selectedDocForShare.currency
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `${window.location.origin}/edit/${selectedDocForShare.id}`
                      );
                      alert('Invoice link copied!');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setSelectedDocForShare(null);
                      alert(`Invoice #${selectedDocForShare.documentNumber} dispatched!`);
                    }}
                    className="bg-primary text-white"
                  >
                    Send Email
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
