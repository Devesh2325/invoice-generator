'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DocumentModel,
  DocumentType,
  DocumentStatus,
  calculateDocument,
  DEFAULT_NUMBERING_RULES,
  formatDocumentNumber,
  CURRENCIES,
  isValidStatusTransition,
} from '@invoice/core';
import { TEMPLATES } from '@invoice/theme';
import { saveDocument } from '@/lib/storage/indexed-db';
import { exportDocumentToPdf, triggerPrint } from '@/lib/pdf/export-pdf';
import { DocumentPreview } from './document-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Printer,
  Download,
  Copy,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  Palette,
  Eye,
  SlidersHorizontal,
  CloudUpload,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface DocumentBuilderProps {
  initialDocument?: DocumentModel;
  onSaved?: (doc: DocumentModel) => void;
}

export const DocumentBuilder: React.FC<DocumentBuilderProps> = ({
  initialDocument,
  onSaved,
}) => {
  // Document state
  const [docType, setDocType] = useState<DocumentType>(initialDocument?.type || 'invoice');
  const [status, setStatus] = useState<DocumentStatus>(initialDocument?.status || 'draft');
  const [docNumber, setDocNumber] = useState<string>(
    initialDocument?.documentNumber ||
      formatDocumentNumber(DEFAULT_NUMBERING_RULES['invoice'], 1, new Date())
  );
  const [referenceNumber, setReferenceNumber] = useState<string>(
    initialDocument?.referenceNumber || ''
  );
  const [issueDate, setIssueDate] = useState<string>(
    initialDocument?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    initialDocument?.dueDate ||
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState<string>(initialDocument?.currency || 'USD');

  // Sender details
  const [senderName, setSenderName] = useState(
    initialDocument?.sender.name || 'Acme Digital Studios'
  );
  const [senderEmail, setSenderEmail] = useState(
    initialDocument?.sender.email || 'billing@acmedigital.io'
  );
  const [senderPhone, setSenderPhone] = useState(
    initialDocument?.sender.phone || '+1 (555) 019-2834'
  );
  const [senderTaxId, setSenderTaxId] = useState(
    initialDocument?.sender.taxId || 'US-948123910'
  );
  const [senderStreet, setSenderStreet] = useState(
    initialDocument?.sender.address?.street1 || '100 Innovation Way, Suite 400'
  );
  const [senderCity, setSenderCity] = useState(
    initialDocument?.sender.address?.city || 'San Francisco'
  );
  const [senderCountry, setSenderCountry] = useState(
    initialDocument?.sender.address?.country || 'United States'
  );

  // Client details
  const [clientName, setClientName] = useState(
    initialDocument?.client.name || 'Globex Corporation'
  );
  const [clientEmail, setClientEmail] = useState(
    initialDocument?.client.email || 'accounts@globexcorp.com'
  );
  const [clientPhone, setClientPhone] = useState(
    initialDocument?.client.phone || '+1 (555) 482-9901'
  );
  const [clientTaxId, setClientTaxId] = useState(
    initialDocument?.client.taxId || 'VAT-8827391'
  );
  const [clientStreet, setClientStreet] = useState(
    initialDocument?.client.billingAddress?.street1 || '742 Evergreen Terrace'
  );
  const [clientCity, setClientCity] = useState(
    initialDocument?.client.billingAddress?.city || 'Springfield'
  );
  const [clientCountry, setClientCountry] = useState(
    initialDocument?.client.billingAddress?.country || 'United States'
  );

  // Items
  const [items, setItems] = useState<any[]>(
    initialDocument?.items || [
      {
        id: '1',
        description: 'Cloud Infrastructure & API Architecture',
        quantity: 1,
        unitPrice: 3500,
        taxRate: 10,
        taxInclusive: false,
        discountType: 'percentage',
        discountValue: 0,
      },
      {
        id: '2',
        description: 'Next.js Frontend & UI Engineering',
        quantity: 40,
        unitPrice: 125,
        taxRate: 10,
        taxInclusive: false,
        discountType: 'percentage',
        discountValue: 5,
      },
    ]
  );

  // Document level adjustments
  const [docDiscountType, setDocDiscountType] = useState<'percentage' | 'fixed'>(
    initialDocument?.documentDiscountType || 'percentage'
  );
  const [docDiscountValue, setDocDiscountValue] = useState<number>(
    initialDocument?.documentDiscountValue || 0
  );
  const [shippingFee, setShippingFee] = useState<number>(
    initialDocument?.shippingFee || 0
  );
  const [extraCharges, setExtraCharges] = useState<number>(
    initialDocument?.extraCharges || 0
  );
  const [amountPaid, setAmountPaid] = useState<number>(
    initialDocument?.summary?.amountPaid || 0
  );

  // Styling & Template
  const [templateId, setTemplateId] = useState<string>(
    initialDocument?.templateId || 'modern'
  );
  const [notes, setNotes] = useState<string>(
    initialDocument?.notes || 'Payment is due within 14 days of issue. Thank you for your business!'
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialDocument?.paymentTerms || 'Net 14 Days'
  );
  const [paymentInstructions, setPaymentInstructions] = useState<string>(
    initialDocument?.paymentInstructions ||
      'Wire Transfer:\nBank: Silicon Valley Bank\nAccount: 987654321\nRouting: 121000358'
  );

  // UI state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Recalculate document model reactively using core engine
  const calculated = useMemo(() => {
    return calculateDocument({
      currency,
      items: items.map((i) => ({
        ...i,
        quantity: Number(i.quantity) || 0,
        unitPrice: Number(i.unitPrice) || 0,
        discountValue: Number(i.discountValue) || 0,
        taxRate: Number(i.taxRate) || 0,
      })),
      documentDiscountType: docDiscountType,
      documentDiscountValue: Number(docDiscountValue) || 0,
      shippingFee: Number(shippingFee) || 0,
      extraCharges: Number(extraCharges) || 0,
      amountPaid: Number(amountPaid) || 0,
    });
  }, [
    currency,
    items,
    docDiscountType,
    docDiscountValue,
    shippingFee,
    extraCharges,
    amountPaid,
  ]);

  const documentModel: DocumentModel = useMemo(() => {
    return {
      id: initialDocument?.id || `doc_${Date.now()}`,
      type: docType,
      status,
      documentNumber: docNumber,
      referenceNumber,
      issueDate,
      dueDate,
      currency,
      sender: {
        name: senderName,
        email: senderEmail,
        phone: senderPhone,
        taxId: senderTaxId,
        address: {
          street1: senderStreet,
          city: senderCity,
          postalCode: '10001',
          country: senderCountry,
        },
      },
      client: {
        id: initialDocument?.client.id || `client_${Date.now()}`,
        type: 'customer',
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        taxId: clientTaxId,
        billingAddress: {
          street1: clientStreet,
          city: clientCity,
          postalCode: '90210',
          country: clientCountry,
        },
      },
      items: calculated.items,
      documentDiscountType: docDiscountType,
      documentDiscountValue: docDiscountValue,
      shippingFee,
      extraCharges,
      summary: calculated.summary,
      templateId,
      notes,
      paymentTerms,
      paymentInstructions,
      payments: initialDocument?.payments || [],
      createdAt: initialDocument?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [
    initialDocument,
    docType,
    status,
    docNumber,
    referenceNumber,
    issueDate,
    dueDate,
    currency,
    senderName,
    senderEmail,
    senderPhone,
    senderTaxId,
    senderStreet,
    senderCity,
    senderCountry,
    clientName,
    clientEmail,
    clientPhone,
    clientTaxId,
    clientStreet,
    clientCity,
    clientCountry,
    calculated,
    docDiscountType,
    docDiscountValue,
    shippingFee,
    extraCharges,
    templateId,
    notes,
    paymentTerms,
    paymentInstructions,
  ]);

  // Autosave to IndexedDB with debounce
  useEffect(() => {
    setSaveStatus('unsaved');
    const timer = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await saveDocument(documentModel);
        setSaveStatus('saved');
        if (onSaved) onSaved(documentModel);
      } catch (e) {
        console.error('Failed to autosave document:', e);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [documentModel]);

  // Line item manipulation helpers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        description: 'New service item',
        quantity: 1,
        unitPrice: 100,
        taxRate: 0,
        taxInclusive: false,
        discountType: 'percentage',
        discountValue: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateItem = (index: number) => {
    const item = items[index];
    setItems((prev) => [
      ...prev.slice(0, index + 1),
      { ...item, id: `item_${Date.now()}` },
      ...prev.slice(index + 1),
    ]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Actions
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportDocumentToPdf(
        'invoice-document-capture',
        `${docNumber || 'document'}`
      );
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Unable to generate PDF. You can also use browser Print to save as PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleFinalize = async () => {
    if (isValidStatusTransition(status, 'finalized')) {
      setStatus('finalized');
      await saveDocument({ ...documentModel, status: 'finalized' });
    }
  };

  const handleDuplicateDoc = async () => {
    const newDocNumber = formatDocumentNumber(
      DEFAULT_NUMBERING_RULES[docType],
      Math.floor(Math.random() * 9000) + 1000
    );
    const newDoc: DocumentModel = {
      ...documentModel,
      id: `doc_${Date.now()}`,
      documentNumber: newDocNumber,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveDocument(newDoc);
    alert(`Document duplicated as #${newDocNumber}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Notice Banner */}
      {!bannerDismissed && (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-900 px-4 py-2 text-xs flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>
              <strong>Private Anonymous Mode:</strong> Your documents are safely stored in your browser's IndexedDB. Never uploaded without your explicit approval.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/signup"
              className="font-semibold underline hover:text-blue-700 flex items-center gap-1"
            >
              Sign up for Cloud Sync <ArrowRight className="h-3 w-3" />
            </a>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-blue-500 hover:text-blue-800 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Top Header Controls */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-4 no-print shadow-xs">
        <div className="flex items-center gap-3">
          <a href="/" className="font-black text-xl text-primary tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>BillCraft</span>
          </a>

          <select
            value={docType}
            onChange={(e) => {
              const newType = e.target.value as DocumentType;
              setDocType(newType);
              setDocNumber(
                formatDocumentNumber(DEFAULT_NUMBERING_RULES[newType], 1, new Date())
              );
            }}
            className="text-xs uppercase font-bold tracking-wider bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2.5 py-1.5 cursor-pointer text-slate-800"
          >
            <option value="invoice">Invoice</option>
            <option value="estimate">Estimate / Quote</option>
            <option value="purchase_order">Purchase Order</option>
            <option value="receipt">Receipt</option>
            <option value="credit_note">Credit Note</option>
            <option value="debit_note">Debit Note</option>
            <option value="pro_forma">Pro Forma</option>
          </select>

          <Badge
            variant={
              status === 'paid'
                ? 'success'
                : status === 'finalized'
                ? 'info'
                : 'secondary'
            }
          >
            {status.toUpperCase()}
          </Badge>

          {/* Autosave Status */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Saved locally</span>
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'unsaved' && (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>Unsaved changes</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile toggle */}
          <div className="lg:hidden flex border border-slate-200 rounded-md overflow-hidden mr-2">
            <button
              onClick={() => setMobileTab('editor')}
              className={`px-3 py-1 text-xs font-medium ${
                mobileTab === 'editor'
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-700'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`px-3 py-1 text-xs font-medium ${
                mobileTab === 'preview'
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-700'
              }`}
            >
              Preview
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerPrint}
            className="flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>{isExportingPdf ? 'Generating...' : 'PDF'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicateDoc}
            className="hidden md:flex items-center gap-1.5"
          >
            <Copy className="h-4 w-4" />
            <span>Duplicate</span>
          </Button>

          {status === 'draft' ? (
            <Button
              size="sm"
              onClick={handleFinalize}
              className="bg-primary hover:bg-primary-hover text-white flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Finalize</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled
              className="flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Finalized</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main 2-Column Split Interface */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: Editing Form */}
        <div
          className={`w-full lg:w-1/2 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-60px)] no-print ${
            mobileTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Document Header Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Document Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Document Number
                  </label>
                  <Input
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="INV-2026-00001"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Reference / PO Number
                  </label>
                  <Input
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="PO-88421"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Issue Date
                  </label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Payment Due Date
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-md p-2 bg-white"
                  >
                    {Object.values(CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Template Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" /> Template Style
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(TEMPLATES).map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setTemplateId(tmpl.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        templateId === tmpl.id
                          ? 'border-primary ring-2 ring-primary/20 bg-blue-50/50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className="w-full h-2 rounded mb-2"
                        style={{ backgroundColor: tmpl.defaultTokens.primaryColor }}
                      />
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {tmpl.name}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">
                        {tmpl.category}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sender & Client Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sender Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-slate-800">
                    Your Business (Sender)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Business Name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Phone"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                  />
                  <Input
                    placeholder="Tax ID / VAT"
                    value={senderTaxId}
                    onChange={(e) => setSenderTaxId(e.target.value)}
                  />
                  <Input
                    placeholder="Street Address"
                    value={senderStreet}
                    onChange={(e) => setSenderStreet(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="City"
                      value={senderCity}
                      onChange={(e) => setSenderCity(e.target.value)}
                    />
                    <Input
                      placeholder="Country"
                      value={senderCountry}
                      onChange={(e) => setSenderCountry(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Client Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-slate-800">
                    Client (Bill To)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Client or Company Name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Phone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                  <Input
                    placeholder="Tax ID / VAT"
                    value={clientTaxId}
                    onChange={(e) => setClientTaxId(e.target.value)}
                  />
                  <Input
                    placeholder="Billing Street"
                    value={clientStreet}
                    onChange={(e) => setClientStreet(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="City"
                      value={clientCity}
                      onChange={(e) => setClientCity(e.target.value)}
                    />
                    <Input
                      placeholder="Country"
                      value={clientCountry}
                      onChange={(e) => setClientCountry(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Line Items Manager */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Line Items
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3 relative group"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <Input
                        className="font-medium bg-white"
                        placeholder="Item description / service"
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'description', e.target.value)
                        }
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(idx)}
                          title="Duplicate item"
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() => handleRemoveItem(idx)}
                          title="Remove item"
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-slate-500 block mb-1">Quantity</label>
                        <Input
                          type="number"
                          min="0.01"
                          step="any"
                          className="bg-white"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'quantity', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">Unit Price</label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          className="bg-white"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'unitPrice', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">Tax Rate (%)</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          className="bg-white"
                          value={item.taxRate}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'taxRate', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">Discount (%)</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          className="bg-white"
                          value={item.discountValue}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'discountValue', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Additional Charges & Discounts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">
                  Document Discounts & Charges
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Document Discount (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={docDiscountValue}
                    onChange={(e) => setDocDiscountValue(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Shipping Fee
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Additional Charges
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={extraCharges}
                    onChange={(e) => setExtraCharges(Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes and Instructions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Notes & Payment Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Payment Instructions / Bank Details
                  </label>
                  <Textarea
                    rows={3}
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Notes & Terms
                  </label>
                  <Textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Realtime Document Preview */}
        <div
          className={`w-full lg:w-1/2 bg-slate-200/60 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-60px)] flex justify-center items-start ${
            mobileTab === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="w-full max-w-3xl">
            <DocumentPreview document={documentModel} />
          </div>
        </div>
      </div>
    </div>
  );
};
