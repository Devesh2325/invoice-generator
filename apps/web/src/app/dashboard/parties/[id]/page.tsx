'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi } from '@invoice/api';
import {
  Party,
  DocumentModel,
  PaymentRecord,
  formatCurrency,
  computeEffectiveInvoiceStatus,
  formatInvoiceStatusLabel,
} from '@invoice/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  Building,
  MapPin,
  FileText,
  CreditCard,
  Send,
  Plus,
  Edit3,
  Share2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileClock,
  X,
  History,
  TrendingUp,
} from 'lucide-react';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;
  const { activeTenant, tenantCurrency } = useTenant();

  const [customer, setCustomer] = useState<Party | null>(null);
  const [invoices, setInvoices] = useState<DocumentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'quotes' | 'timeline'>('invoices');
  const [invoiceFilter, setInvoiceFilter] = useState<string>('all');

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [statementModalOpen, setStatementModalOpen] = useState(false);

  // Edit Customer Form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTaxId, setEditTaxId] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'bank_transfer' | 'upi' | 'cash' | 'card'>('bank_transfer');
  const [payRef, setPayRef] = useState('');
  const [payTargetDocId, setPayTargetDocId] = useState<string>('');

  const loadData = async () => {
    if (!activeTenant || !customerId) return;
    setLoading(true);
    try {
      const party = await TenantApi.getPartyById(activeTenant.id, customerId);
      if (!party) {
        setNotFound(true);
        return;
      }
      setCustomer(party);
      setEditName(party.name);
      setEditEmail(party.email || '');
      setEditPhone(party.phone || '');
      setEditTaxId(party.taxId || '');
      setEditStreet(party.billingAddress?.street1 || '');
      setEditCity(party.billingAddress?.city || '');
      setEditState(party.billingAddress?.state || '');
      setEditPostalCode(party.billingAddress?.postalCode || '');
      setEditNotes(party.notes || '');

      // Load all tenant documents and filter by this customer
      const docs = await TenantApi.getDocuments(activeTenant.id);
      const customerDocs = docs.filter(
        (d) =>
          d.client?.id === party.id ||
          (d.client?.name && d.client.name.trim().toLowerCase() === party.name.trim().toLowerCase())
      );
      setInvoices(customerDocs);
    } catch (err) {
      console.error('Failed to load customer details:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenant, customerId]);

  // Aggregate financial metrics
  const financialSummary = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    invoices.forEach((doc) => {
      if (doc.type === 'invoice' || doc.type === 'pro_forma') {
        const grandTotal = Number(doc.summary?.grandTotal || 0);
        const amountPaid = Number(doc.summary?.amountPaid || 0);
        const balanceDue = Number(doc.summary?.balanceDue || 0);

        totalBilled += grandTotal;
        totalPaid += amountPaid;
        totalOutstanding += balanceDue;
      }
    });

    return { totalBilled, totalPaid, totalOutstanding };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((doc) => {
      if (doc.type !== 'invoice' && doc.type !== 'pro_forma') return false;
      if (invoiceFilter === 'all') return true;
      const status = computeEffectiveInvoiceStatus(doc);
      return status === invoiceFilter;
    });
  }, [invoices, invoiceFilter]);

  // Quotes and credit notes
  const quotesAndAdjustments = useMemo(() => {
    return invoices.filter((doc) => doc.type === 'estimate' || doc.type === 'credit_note' || doc.type === 'debit_note');
  }, [invoices]);

  // All payments
  const allPayments = useMemo(() => {
    const list: { doc: DocumentModel; payment: PaymentRecord }[] = [];
    invoices.forEach((doc) => {
      (doc.payments || []).forEach((p) => {
        list.push({ doc, payment: p });
      });
    });
    return list.sort((a, b) => new Date(b.payment.paymentDate).getTime() - new Date(a.payment.paymentDate).getTime());
  }, [invoices]);

  // Handle Edit Save
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !customer) return;

    const updated: Party = {
      ...customer,
      name: editName,
      email: editEmail || undefined,
      phone: editPhone || undefined,
      taxId: editTaxId || undefined,
      notes: editNotes || undefined,
      billingAddress: {
        street1: editStreet,
        city: editCity,
        state: editState,
        postalCode: editPostalCode,
        country: customer.billingAddress?.country || 'India',
      },
    };

    await TenantApi.saveParty(activeTenant.id, updated);
    setCustomer(updated);
    setEditModalOpen(false);
  };

  // Handle Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !payTargetDocId || payAmount <= 0) return;

    const targetDoc = invoices.find((d) => d.id === payTargetDocId);
    if (!targetDoc) return;

    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      documentId: targetDoc.id,
      amount: Number(payAmount),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: payMethod,
      reference: payRef,
      createdAt: new Date().toISOString(),
    };

    const updatedPayments = [...(targetDoc.payments || []), newPayment];
    const newPaidAmount = (Number(targetDoc.summary.amountPaid) || 0) + Number(payAmount);
    const newBalance = Math.max(0, (Number(targetDoc.summary.grandTotal) || 0) - newPaidAmount);

    const updatedDoc: DocumentModel = {
      ...targetDoc,
      payments: updatedPayments,
      summary: {
        ...targetDoc.summary,
        amountPaid: newPaidAmount,
        balanceDue: newBalance,
      },
      status: newBalance <= 0 ? 'paid' : 'partially_paid',
      updatedAt: new Date().toISOString(),
    };

    await TenantApi.saveDocument(activeTenant.id, updatedDoc);
    setRecordPaymentModalOpen(false);
    setPayAmount(0);
    setPayRef('');
    await loadData();
  };

  if (loading) {
    return (
      <TenantLayout>
        <div className="p-10 text-center text-slate-500">Loading customer profile...</div>
      </TenantLayout>
    );
  }

  if (notFound || !customer) {
    return (
      <TenantLayout>
        <div className="p-10 text-center space-y-4">
          <div className="text-xl font-black text-slate-800 dark:text-slate-100">Customer Not Found</div>
          <p className="text-xs text-slate-500">The customer profile you requested does not exist or belongs to another workspace.</p>
          <Link href="/dashboard/parties">
            <Button size="sm" variant="outline" className="text-xs">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Customers
            </Button>
          </Link>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/parties"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Customers
          </Link>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditModalOpen(true)}
              className="text-xs font-semibold h-8"
            >
              <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit Profile
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatementModalOpen(true)}
              className="text-xs font-semibold h-8"
            >
              <FileText className="h-3.5 w-3.5 mr-1" /> Statement
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReminderModalOpen(true)}
              className="text-xs font-semibold h-8 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-50"
            >
              <Send className="h-3.5 w-3.5 mr-1" /> Send Reminder
            </Button>
            <Link href={`/create?customerName=${encodeURIComponent(customer.name)}`}>
              <Button size="sm" className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold h-8 shadow-sm">
                <Plus className="h-4 w-4 mr-1" /> Create Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* Customer Header Card */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                  {customer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {customer.name}
                    </h1>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider capitalize">
                      {customer.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    ID: {customer.id} • Added on {new Date(customer.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                {customer.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.taxId && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    <span>GSTIN / Tax ID: {customer.taxId}</span>
                  </div>
                )}
                {customer.billingAddress?.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {[customer.billingAddress.street1, customer.billingAddress.city, customer.billingAddress.state]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Balance Pill */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-right min-w-[180px] shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Outstanding Balance
              </span>
              <div
                className={`text-xl font-black mt-0.5 tabular-nums ${
                  financialSummary.totalOutstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(financialSummary.totalOutstanding, tenantCurrency)}
              </div>
              {financialSummary.totalOutstanding > 0 && (
                <button
                  type="button"
                  onClick={() => setRecordPaymentModalOpen(true)}
                  className="text-[11px] font-bold text-primary hover:underline mt-1 block w-full text-right cursor-pointer"
                >
                  + Record Payment
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Total Invoiced ({invoices.length})
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              {formatCurrency(financialSummary.totalBilled, tenantCurrency)}
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Total Payments Received
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {formatCurrency(financialSummary.totalPaid, tenantCurrency)}
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Outstanding Balance
            </span>
            <div
              className={`text-2xl font-black mt-1 tabular-nums ${
                financialSummary.totalOutstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'
              }`}
            >
              {formatCurrency(financialSummary.totalOutstanding, tenantCurrency)}
            </div>
          </Card>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'invoices'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Invoices ({invoices.filter((d) => d.type === 'invoice' || d.type === 'pro_forma').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Payment History ({allPayments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quotes')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'quotes'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Quotes & Notes ({quotesAndAdjustments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Activity Timeline
          </button>
        </div>

        {/* TAB 1: INVOICES */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
              {['all', 'pending', 'paid', 'overdue', 'draft'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setInvoiceFilter(st)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold capitalize transition-all cursor-pointer ${
                    invoiceFilter === st
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 uppercase tracking-wider text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-3">Issue Date</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        No invoices found for this customer.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((doc) => {
                      const effStatus = computeEffectiveInvoiceStatus(doc);
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                            #{doc.documentNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {doc.issueDate}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {doc.dueDate || 'On Receipt'}
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                effStatus === 'paid'
                                  ? 'success'
                                  : effStatus === 'overdue'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="text-[10px] uppercase font-bold"
                            >
                              {formatInvoiceStatusLabel(effStatus)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(doc.summary.grandTotal, doc.currency)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span
                              className={
                                Number(doc.summary.balanceDue) > 0
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600'
                              }
                            >
                              {formatCurrency(doc.summary.balanceDue, doc.currency)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link href={`/edit/${doc.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                                View / Edit
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENT HISTORY */}
        {activeTab === 'payments' && (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 uppercase tracking-wider text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Against Invoice</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      No payments recorded yet for this customer.
                    </td>
                  </tr>
                ) : (
                  allPayments.map(({ doc, payment }) => (
                    <tr key={payment.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {payment.paymentDate}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        <Link href={`/edit/${doc.id}`} className="hover:underline text-primary">
                          #{doc.documentNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-3 capitalize text-slate-700 dark:text-slate-300">
                        {payment.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {payment.reference || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        +{formatCurrency(payment.amount, doc.currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: QUOTES & ADJUSTMENTS */}
        {activeTab === 'quotes' && (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 uppercase tracking-wider text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-3">Number</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quotesAndAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      No estimates or credit notes found for this customer.
                    </td>
                  </tr>
                ) : (
                  quotesAndAdjustments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 capitalize font-semibold text-slate-800 dark:text-slate-200">
                        {doc.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        #{doc.documentNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {doc.issueDate}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(doc.summary.grandTotal, doc.currency)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/edit/${doc.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                            View / Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Customer Activity Ledger
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              <div className="relative">
                <span className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-white dark:ring-slate-900" />
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Profile Initialized</div>
                <div className="text-[11px] text-slate-500">Customer registered in workspace ledger.</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  {new Date(customer.createdAt || Date.now()).toLocaleString()}
                </div>
              </div>

              {invoices.map((doc) => (
                <div key={doc.id} className="relative">
                  <span className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Invoice #{doc.documentNumber} Generated
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Billed for {formatCurrency(doc.summary.grandTotal, doc.currency)} (Due: {doc.dueDate || 'Receipt'})
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{doc.issueDate}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL 1: EDIT CUSTOMER */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Edit Customer Profile</h3>
                <button type="button" onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Customer Name *</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
                    <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone</label>
                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">GSTIN / Tax ID</label>
                  <Input value={editTaxId} onChange={(e) => setEditTaxId(e.target.value)} />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Billing Street</label>
                  <Input value={editStreet} onChange={(e) => setEditStreet(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">City</label>
                    <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">State</label>
                    <Input value={editState} onChange={(e) => setEditState(e.target.value)} />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Postal Code</label>
                    <Input value={editPostalCode} onChange={(e) => setEditPostalCode(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-white font-bold">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: RECORD PAYMENT */}
        {recordPaymentModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Record Customer Payment</h3>
                <button type="button" onClick={() => setRecordPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Apply to Invoice *</label>
                  <select
                    value={payTargetDocId}
                    onChange={(e) => {
                      setPayTargetDocId(e.target.value);
                      const doc = invoices.find((d) => d.id === e.target.value);
                      if (doc) setPayAmount(Number(doc.summary.balanceDue) || 0);
                    }}
                    className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-mono"
                    required
                  >
                    <option value="">Select Invoice...</option>
                    {invoices
                      .filter((d) => Number(d.summary?.balanceDue || 0) > 0)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          #{d.documentNumber} — Balance Due: {formatCurrency(d.summary.balanceDue, d.currency)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Payment Amount *</label>
                  <Input
                    type="number"
                    step="any"
                    min="1"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="upi">UPI / Instant Pay</option>
                    <option value="cash">Cash Payment</option>
                    <option value="card">Credit / Debit Card</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Transaction Reference / UTR</label>
                  <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="e.g. UTR-9821898129" />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setRecordPaymentModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    Record Payment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: SEND REMINDER */}
        {reminderModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-amber-500" /> Payment Reminder Message
                </h3>
                <button type="button" onClick={() => setReminderModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-500">
                  Send a friendly payment reminder for outstanding balance of{' '}
                  <strong className="text-amber-600 font-mono">
                    {formatCurrency(financialSummary.totalOutstanding, tenantCurrency)}
                  </strong>
                  .
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Prefilled Reminder Text:</div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                    Hi {customer.name}, friendly reminder that you have an outstanding balance of{' '}
                    {formatCurrency(financialSummary.totalOutstanding, tenantCurrency)} with {activeTenant?.name}.
                    Kindly remit at your earliest convenience. Thank you!
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {customer.phone && (
                    <a
                      href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hi ${customer.name}, friendly reminder that you have an outstanding balance of ${formatCurrency(
                          financialSummary.totalOutstanding,
                          tenantCurrency
                        )} with ${activeTenant?.name}. Kindly remit at your earliest convenience. Thank you!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                        Send via WhatsApp
                      </Button>
                    </a>
                  )}

                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}?subject=${encodeURIComponent(
                        `Payment Reminder — ${activeTenant?.name}`
                      )}&body=${encodeURIComponent(
                        `Dear ${customer.name},\n\nThis is a friendly reminder that you have an outstanding balance of ${formatCurrency(
                          financialSummary.totalOutstanding,
                          tenantCurrency
                        )} with ${activeTenant?.name}.\n\nPlease find your statement attached or reach out with any questions.\n\nWarm regards,\n${activeTenant?.name}`
                      )}`}
                    >
                      <Button variant="outline" className="w-full text-xs font-semibold">
                        Send via Email
                      </Button>
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `Hi ${customer.name}, friendly reminder that you have an outstanding balance of ${formatCurrency(
                          financialSummary.totalOutstanding,
                          tenantCurrency
                        )} with ${activeTenant?.name}.`
                      );
                      alert('Reminder copied to clipboard!');
                    }}
                    className="text-xs"
                  >
                    Copy Reminder to Clipboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: STATEMENT OF ACCOUNT */}
        {statementModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Statement of Accounts</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{customer.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => window.print()} className="h-7 text-xs bg-primary text-white font-bold">
                    Print / PDF Statement
                  </Button>
                  <button type="button" onClick={() => setStatementModalOpen(false)} className="text-slate-400 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <h4 className="font-black text-base text-slate-900 dark:text-slate-100">{activeTenant?.name}</h4>
                    <p className="text-[11px] text-slate-500">Client Ledger Statement</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{customer.name}</div>
                    <div className="text-[11px] text-slate-400">{customer.email || customer.phone}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Total Billed</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(financialSummary.totalBilled, tenantCurrency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Total Received</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(financialSummary.totalPaid, tenantCurrency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Outstanding</span>
                    <span className="font-bold text-amber-600">
                      {formatCurrency(financialSummary.totalOutstanding, tenantCurrency)}
                    </span>
                  </div>
                </div>

                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="border-b text-slate-400">
                      <th className="py-2">Date</th>
                      <th className="py-2">Reference</th>
                      <th className="py-2 text-right">Invoiced</th>
                      <th className="py-2 text-right">Paid</th>
                      <th className="py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoices.map((d) => (
                      <tr key={d.id}>
                        <td className="py-2 text-slate-600">{d.issueDate}</td>
                        <td className="py-2 font-bold text-slate-800 dark:text-slate-200">Invoice #{d.documentNumber}</td>
                        <td className="py-2 text-right">{formatCurrency(d.summary.grandTotal, d.currency)}</td>
                        <td className="py-2 text-right text-emerald-600">{formatCurrency(d.summary.amountPaid || 0, d.currency)}</td>
                        <td className="py-2 text-right font-bold text-amber-600">{formatCurrency(d.summary.balanceDue, d.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
