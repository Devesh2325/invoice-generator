'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DocumentModel,
  DocumentType,
  DocumentStatus,
  calculateDocument,
  DEFAULT_NUMBERING_RULES,
  formatDocumentNumber,
  formatCurrency,
  CURRENCIES,
  INDIAN_STATES,
  isValidStatusTransition,
} from '@invoice/core';
import { getTemplate, getTemplatesByCategory } from '@invoice/theme';
import { saveDocument } from '@/lib/storage/indexed-db';
import { exportDocumentToPdf, triggerPrint } from '@/lib/pdf/export-pdf';
import { DocumentPreview } from './document-preview';
import { InlineDocumentCanvas } from './inline-document-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Printer,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  Palette,
  Eye,
  ArrowRight,
  Sparkles,
  Upload,
  X,
  Edit3,
  Columns,
  RotateCcw,
} from 'lucide-react';

interface DocumentBuilderProps {
  initialDocument?: DocumentModel;
  onSaved?: (doc: DocumentModel) => void;
}

const THEME_COLOR_SWATCHES = [
  { name: 'Royal Blue', hex: '#1D4ED8' },
  { name: 'Fintech Indigo', hex: '#4F46E5' },
  { name: 'Executive Slate', hex: '#0F172A' },
  { name: 'Corporate Emerald', hex: '#0F766E' },
  { name: 'QuickBooks Green', hex: '#15803D' },
  { name: 'Vyapar Orange', hex: '#EA580C' },
  { name: 'Studio Purple', hex: '#9333EA' },
  { name: 'Crimson Red', hex: '#DC2626' },
];

export const DocumentBuilder: React.FC<DocumentBuilderProps> = ({
  initialDocument,
  onSaved,
}) => {
  const categorizedTemplates = useMemo(() => getTemplatesByCategory(), []);

  // Document state
  const [docType, setDocType] = useState<DocumentType>(initialDocument?.type || 'invoice');
  const [status, setStatus] = useState<DocumentStatus>(initialDocument?.status || 'draft');
  const [docNumber, setDocNumber] = useState<string>(
    initialDocument?.documentNumber ||
      formatDocumentNumber(DEFAULT_NUMBERING_RULES['invoice'], 1, new Date())
  );
  const [referenceNumber, setReferenceNumber] = useState<string>(
    initialDocument?.referenceNumber || 'PO-2026-8841'
  );
  const [issueDate, setIssueDate] = useState<string>(
    initialDocument?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    initialDocument?.dueDate ||
      new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState<string>(initialDocument?.currency || 'INR');

  // Sender details (India GST defaults)
  const [senderLogo, setSenderLogo] = useState<string>(
    initialDocument?.sender.logoUrl || ''
  );
  const [senderName, setSenderName] = useState(
    initialDocument?.sender.name || 'Apex Digital Solutions Pvt Ltd'
  );
  const [senderEmail, setSenderEmail] = useState(
    initialDocument?.sender.email || 'billing@apexdigital.in'
  );
  const [senderPhone, setSenderPhone] = useState(
    initialDocument?.sender.phone || '+91 22 4890 2100'
  );
  const [senderTaxId, setSenderTaxId] = useState(
    initialDocument?.sender.taxId || '27AABCA9603R1ZM'
  );
  const [senderStreet, setSenderStreet] = useState(
    initialDocument?.sender.address?.street1 || 'Level 9, Platina Tower, BKC'
  );
  const [senderCity, setSenderCity] = useState(
    initialDocument?.sender.address?.city || 'Mumbai'
  );
  const [senderState, setSenderState] = useState(
    initialDocument?.sender.address?.state || '27 - Maharashtra'
  );
  const [senderPostalCode, setSenderPostalCode] = useState(
    initialDocument?.sender.address?.postalCode || '400051'
  );
  const [senderCountry, setSenderCountry] = useState(
    initialDocument?.sender.address?.country || 'India'
  );

  // Client details (India GST defaults)
  const [clientName, setClientName] = useState(
    initialDocument?.client.name || 'Reliance Retail Ventures Ltd'
  );
  const [clientEmail, setClientEmail] = useState(
    initialDocument?.client.email || 'accounts@relianceretail.in'
  );
  const [clientPhone, setClientPhone] = useState(
    initialDocument?.client.phone || '+91 22 6767 3800'
  );
  const [clientTaxId, setClientTaxId] = useState(
    initialDocument?.client.taxId || '27AAACR5055K1Z7'
  );
  const [clientStreet, setClientStreet] = useState(
    initialDocument?.client.billingAddress?.street1 || '4th Floor, Court House, L.T. Marg'
  );
  const [clientCity, setClientCity] = useState(
    initialDocument?.client.billingAddress?.city || 'Mumbai'
  );
  const [clientState, setClientState] = useState(
    initialDocument?.client.billingAddress?.state || '27 - Maharashtra'
  );
  const [clientPostalCode, setClientPostalCode] = useState(
    initialDocument?.client.billingAddress?.postalCode || '400002'
  );
  const [clientCountry, setClientCountry] = useState(
    initialDocument?.client.billingAddress?.country || 'India'
  );

  // Line Items with HSN/SAC & GST %
  const [items, setItems] = useState<any[]>(
    initialDocument?.items || [
      {
        id: '1',
        description: 'Cloud Infrastructure & Enterprise API Architecture',
        hsnCode: '998315',
        quantity: 1,
        unitPrice: 45000,
        taxRate: 18,
        taxInclusive: false,
        discountType: 'percentage',
        discountValue: 0,
      },
      {
        id: '2',
        description: 'Next.js Full-Stack Web Application Engineering',
        hsnCode: '998314',
        quantity: 10,
        unitPrice: 3500,
        taxRate: 18,
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

  // Template & Custom Theme Overrides
  const [templateId, setTemplateId] = useState<string>(
    initialDocument?.templateId || 'cleartax_gst'
  );
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string | undefined>(
    initialDocument?.customTheme?.primaryColor
  );
  const [customFontFamily, setCustomFontFamily] = useState<'sans' | 'serif' | 'mono' | undefined>(
    initialDocument?.customTheme?.fontFamily
  );

  const [notes, setNotes] = useState<string>(
    initialDocument?.notes ||
      '1. Payment is due within 15 days of invoice date.\n2. Goods/services once billed are subject to Mumbai jurisdiction.'
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialDocument?.paymentTerms || 'Net 15 Days'
  );
  const [paymentInstructions, setPaymentInstructions] = useState<string>(
    initialDocument?.paymentInstructions ||
      'Bank: HDFC Bank Ltd\nA/C No: 50200049182731\nIFSC: HDFC0000124\nUPI ID: apexdigital@hdfcbank'
  );
  const [signatoryName, setSignatoryName] = useState<string>(
    initialDocument?.signatoryName || 'Authorized Director'
  );

  // UI state
  const [viewMode, setViewMode] = useState<'sheet' | 'split' | 'pdf_preview'>('sheet');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const activeTemplateMeta = useMemo(() => getTemplate(templateId), [templateId]);
  const effectivePrimaryColor =
    customPrimaryColor || activeTemplateMeta.defaultTokens.primaryColor;
  const effectiveFontFamily =
    customFontFamily || activeTemplateMeta.defaultTokens.fontFamily;

  // Recalculate document model reactively using core financial & GST engine
  const calculated = useMemo(() => {
    return calculateDocument({
      currency,
      senderState,
      clientState,
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
    senderState,
    clientState,
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
      placeOfSupply: clientState,
      sender: {
        name: senderName,
        email: senderEmail,
        phone: senderPhone,
        taxId: senderTaxId,
        logoUrl: senderLogo,
        address: {
          street1: senderStreet,
          city: senderCity,
          state: senderState,
          postalCode: senderPostalCode,
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
          state: clientState,
          postalCode: clientPostalCode,
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
      customTheme: {
        primaryColor: customPrimaryColor,
        fontFamily: customFontFamily,
      },
      notes,
      paymentTerms,
      paymentInstructions,
      signatoryName,
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
    senderLogo,
    senderStreet,
    senderCity,
    senderState,
    senderPostalCode,
    senderCountry,
    clientName,
    clientEmail,
    clientPhone,
    clientTaxId,
    clientStreet,
    clientCity,
    clientState,
    clientPostalCode,
    clientCountry,
    calculated,
    docDiscountType,
    docDiscountValue,
    shippingFee,
    extraCharges,
    templateId,
    customPrimaryColor,
    customFontFamily,
    notes,
    paymentTerms,
    paymentInstructions,
    signatoryName,
  ]);

  // Autosave to user-scoped IndexedDB with debounce
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
    }, 1000);

    return () => clearTimeout(timer);
  }, [documentModel]);

  // Line item manipulation helpers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        description: 'New Product / Service Line Item',
        hsnCode: '9983',
        quantity: 1,
        unitPrice: 1000,
        taxRate: 18,
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

  // Inline sheet update handlers
  const handleUpdateSender = (field: string, value: any) => {
    if (field === 'name') setSenderName(value);
    else if (field === 'email') setSenderEmail(value);
    else if (field === 'phone') setSenderPhone(value);
    else if (field === 'taxId') setSenderTaxId(value);
  };

  const handleUpdateSenderAddress = (field: string, value: any) => {
    if (field === 'street1') setSenderStreet(value);
    else if (field === 'city') setSenderCity(value);
    else if (field === 'state') setSenderState(value);
    else if (field === 'postalCode') setSenderPostalCode(value);
    else if (field === 'country') setSenderCountry(value);
  };

  const handleUpdateClient = (field: string, value: any) => {
    if (field === 'name') setClientName(value);
    else if (field === 'email') setClientEmail(value);
    else if (field === 'phone') setClientPhone(value);
    else if (field === 'taxId') setClientTaxId(value);
  };

  const handleUpdateClientAddress = (field: string, value: any) => {
    if (field === 'street1') setClientStreet(value);
    else if (field === 'city') setClientCity(value);
    else if (field === 'state') setClientState(value);
    else if (field === 'postalCode') setClientPostalCode(value);
    else if (field === 'country') setClientCountry(value);
  };

  const handleUpdateDoc = (field: string, value: any) => {
    if (field === 'type') {
      const newType = value as DocumentType;
      setDocType(newType);
      setDocNumber(formatDocumentNumber(DEFAULT_NUMBERING_RULES[newType], 1, new Date()));
    } else if (field === 'documentNumber') setDocNumber(value);
    else if (field === 'referenceNumber') setReferenceNumber(value);
    else if (field === 'issueDate') setIssueDate(value);
    else if (field === 'dueDate') setDueDate(value);
    else if (field === 'currency') setCurrency(value);
    else if (field === 'templateId') setTemplateId(value);
    else if (field === 'notes') setNotes(value);
    else if (field === 'paymentTerms') setPaymentTerms(value);
    else if (field === 'paymentInstructions') setPaymentInstructions(value);
    else if (field === 'signatoryName') setSignatoryName(value);
  };

  // Actions
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportDocumentToPdf(
        'invoice-pdf-export-sheet',
        `${docNumber || 'tax-invoice'}`
      );
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Unable to generate PDF. You can also use Print to save as PDF.');
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Notice Banner */}
      {!bannerDismissed && (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-900 px-4 py-2 text-xs flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>
              <strong>GST & Multi-Currency Invoice Studio:</strong> Automatic CGST + SGST (Intra-State) & IGST (Inter-State) calculation based on State selection.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/signup"
              className="font-semibold underline hover:text-blue-700 flex items-center gap-1"
            >
              Create Workspace <ArrowRight className="h-3 w-3" />
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
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 no-print shadow-xs">
        <div className="flex items-center gap-3">
          <a href="/" className="font-black text-lg text-primary tracking-tight flex items-center gap-1.5">
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
            <option value="invoice">Tax Invoice</option>
            <option value="estimate">Estimate / Quote</option>
            <option value="pro_forma">Pro Forma Invoice</option>
            <option value="purchase_order">Purchase Order</option>
            <option value="receipt">Payment Receipt</option>
            <option value="credit_note">Credit Note</option>
            <option value="debit_note">Debit Note</option>
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
          <div className="hidden md:flex items-center gap-1 text-xs text-slate-500">
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Saved</span>
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
                <span>Editing</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons & Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* 3-Way View Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-1">
            <button
              onClick={() => setViewMode('sheet')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'sheet'
                  ? 'bg-white text-primary shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Inline Editor</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'split'
                  ? 'bg-white text-primary shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Split Form</span>
            </button>
            <button
              onClick={() => setViewMode('pdf_preview')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                viewMode === 'pdf_preview'
                  ? 'bg-white text-primary shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Print / PDF View</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerPrint}
            className="flex items-center gap-1.5 font-semibold"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print A4</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 font-semibold shadow-xs"
          >
            <Download className="h-4 w-4" />
            <span>{isExportingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicateDoc}
            className="hidden lg:flex items-center gap-1.5"
          >
            <Copy className="h-4 w-4" />
            <span>Duplicate</span>
          </Button>

          {status === 'draft' ? (
            <Button
              size="sm"
              onClick={handleFinalize}
              className="bg-primary hover:bg-primary-hover text-white flex items-center gap-1.5 shadow-xs"
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

      {/* ==================================================================== */}
      {/* DESIGN & TEMPLATE STUDIO BAR (Category Dropdown + Live Theme Picker) */}
      {/* ==================================================================== */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 no-print shadow-xs sticky top-[53px] z-30">
        {/* Left: Category-Wise Template Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Palette className="h-3.5 w-3.5 text-primary" /> Template:
            </label>
            <select
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value);
                setCustomPrimaryColor(undefined);
              }}
              className="text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 cursor-pointer min-w-[240px] shadow-2xs"
            >
              {categorizedTemplates.map((group) => (
                <optgroup key={group.category} label={group.label}>
                  {group.templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name} — ({tmpl.competitorStyle})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Theme Color Picker & Swatches */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Theme Color:</span>
            {THEME_COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => setCustomPrimaryColor(swatch.hex)}
                title={swatch.name}
                className={`w-5 h-5 rounded-full border transition-transform ${
                  effectivePrimaryColor.toLowerCase() === swatch.hex.toLowerCase()
                    ? 'scale-125 ring-2 ring-offset-1 ring-slate-900 border-white'
                    : 'border-slate-300 hover:scale-110'
                }`}
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
            <input
              type="color"
              value={effectivePrimaryColor}
              onChange={(e) => setCustomPrimaryColor(e.target.value)}
              title="Custom Brand Color"
              className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0 bg-transparent ml-1"
            />
            {(customPrimaryColor || customFontFamily) && (
              <button
                type="button"
                onClick={() => {
                  setCustomPrimaryColor(undefined);
                  setCustomFontFamily(undefined);
                }}
                title="Reset to template default theme"
                className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded bg-slate-100"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>

          {/* Typography Selector */}
          <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500">Font:</span>
            <select
              value={effectiveFontFamily}
              onChange={(e) => setCustomFontFamily(e.target.value as 'sans' | 'serif' | 'mono')}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800"
            >
              <option value="sans">Modern Sans</option>
              <option value="serif">Executive Serif</option>
              <option value="mono">Technical Mono</option>
            </select>
          </div>
        </div>

        {/* Right: Currency & GST Supply Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Currency:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-slate-900 cursor-pointer"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW MODE 1: INLINE SHEET EDITOR (Default) */}
      {/* ==================================================================== */}
      {viewMode === 'sheet' && (
        <div className="flex-1 bg-slate-200/70 p-4 md:p-8 flex justify-center items-start overflow-y-auto no-print">
          <div className="w-full max-w-4xl">
            <InlineDocumentCanvas
              document={documentModel}
              onUpdateSender={handleUpdateSender}
              onUpdateSenderAddress={handleUpdateSenderAddress}
              onUpdateClient={handleUpdateClient}
              onUpdateClientAddress={handleUpdateClientAddress}
              onUpdateDoc={handleUpdateDoc}
              onUpdateItem={handleUpdateItem}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onDuplicateItem={handleDuplicateItem}
              onLogoUpload={(dataUrl) => setSenderLogo(dataUrl)}
              onRemoveLogo={() => setSenderLogo('')}
              onUpdateDiscount={(type, val) => {
                setDocDiscountType(type);
                setDocDiscountValue(val);
              }}
              onUpdateShipping={(val) => setShippingFee(val)}
              onUpdateExtra={(val) => setExtraCharges(val)}
              onUpdatePaid={(val) => setAmountPaid(val)}
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW MODE 2: PRINT / PDF CLEAN PREVIEW */}
      {/* ==================================================================== */}
      {viewMode === 'pdf_preview' && (
        <div className="flex-1 bg-slate-300/70 p-4 md:p-8 flex flex-col items-center overflow-y-auto no-print">
          <div className="mb-4 flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700">
              A4 Print & PDF Output Preview ({activeTemplateMeta.name})
            </span>
            <Button
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={triggerPrint} className="h-7 text-xs">
              <Printer className="h-3.5 w-3.5 mr-1" /> Print Now
            </Button>
          </div>
          <div className="w-full max-w-4xl">
            <DocumentPreview
              document={documentModel}
              onLogoUpload={(dataUrl) => setSenderLogo(dataUrl)}
              onRemoveLogo={() => setSenderLogo('')}
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW MODE 3: 2-COLUMN SPLIT FORM & LIVE PREVIEW */}
      {/* ==================================================================== */}
      {viewMode === 'split' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden no-print">
          {/* LEFT COLUMN: Structured Editing Form */}
          <div
            className={`w-full lg:w-1/2 p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-110px)] ${
              mobileTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Document Metadata Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Document & Date Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Invoice / Document No.
                    </label>
                    <Input
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      PO / Reference No.
                    </label>
                    <Input
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Payment Terms
                    </label>
                    <Input
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
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
                      Due Date
                    </label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Authorized Signatory
                    </label>
                    <Input
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sender & Client Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sender Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold">
                      From (Your Business & GSTIN)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <div className="p-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 flex items-center justify-between gap-2">
                      {senderLogo ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={senderLogo}
                            alt="Logo"
                            className="h-9 max-w-[100px] object-contain bg-white p-1 rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => setSenderLogo('')}
                            className="text-xs text-red-600 font-semibold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Company Logo</span>
                      )}
                      <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        <Upload className="h-3 w-3" /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) =>
                              setSenderLogo(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>

                    <Input
                      placeholder="Business Name"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                    />
                    <Input
                      placeholder="GSTIN (e.g. 27AABCU9603R1ZM)"
                      value={senderTaxId}
                      onChange={(e) => setSenderTaxId(e.target.value.toUpperCase())}
                    />
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                        Supplier GST State
                      </label>
                      <select
                        value={senderState}
                        onChange={(e) => setSenderState(e.target.value)}
                        className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st.code} value={st.label}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>
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
                      placeholder="Street Address"
                      value={senderStreet}
                      onChange={(e) => setSenderStreet(e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="City"
                        value={senderCity}
                        onChange={(e) => setSenderCity(e.target.value)}
                      />
                      <Input
                        placeholder="PIN Code"
                        value={senderPostalCode}
                        onChange={(e) => setSenderPostalCode(e.target.value)}
                      />
                      <Input
                        placeholder="Country"
                        value={senderCountry}
                        onChange={(e) => setSenderCountry(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Client Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold">
                      Bill To (Customer & Place of Supply)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <Input
                      placeholder="Customer / Company Name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                    <Input
                      placeholder="Customer GSTIN (e.g. 27AAACR5055K1Z7)"
                      value={clientTaxId}
                      onChange={(e) => setClientTaxId(e.target.value.toUpperCase())}
                    />
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                        Place of Supply (Customer State)
                      </label>
                      <select
                        value={clientState}
                        onChange={(e) => setClientState(e.target.value)}
                        className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st.code} value={st.label}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      placeholder="Client Email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                    <Input
                      placeholder="Client Phone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                    />
                    <Input
                      placeholder="Billing Street"
                      value={clientStreet}
                      onChange={(e) => setClientStreet(e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="City"
                        value={clientCity}
                        onChange={(e) => setClientCity(e.target.value)}
                      />
                      <Input
                        placeholder="PIN Code"
                        value={clientPostalCode}
                        onChange={(e) => setClientPostalCode(e.target.value)}
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

              {/* Line Items Card */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold">
                    Line Items (HSN/SAC & GST)
                  </CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddItem}
                    className="h-8 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-500">
                          Item #{index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateItem(index)}
                            className="text-xs text-slate-500 hover:text-primary px-1.5 py-0.5"
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length <= 1}
                            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 px-1.5 py-0.5"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div className="md:col-span-3">
                          <label className="text-[10px] font-semibold text-slate-500 block">
                            Description
                          </label>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateItem(index, 'description', e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block">
                            HSN / SAC
                          </label>
                          <Input
                            value={item.hsnCode || ''}
                            onChange={(e) =>
                              handleUpdateItem(index, 'hsnCode', e.target.value)
                            }
                            placeholder="998314"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block">
                            Qty
                          </label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(index, 'quantity', Number(e.target.value))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block">
                            Rate ({currency})
                          </label>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleUpdateItem(index, 'unitPrice', Number(e.target.value))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block">
                            Discount (%)
                          </label>
                          <Input
                            type="number"
                            value={item.discountValue}
                            onChange={(e) =>
                              handleUpdateItem(
                                index,
                                'discountValue',
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block">
                            GST Rate (%)
                          </label>
                          <select
                            value={item.taxRate}
                            onChange={(e) =>
                              handleUpdateItem(index, 'taxRate', Number(e.target.value))
                            }
                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold"
                          >
                            <option value={0}>0% (Exempt)</option>
                            <option value={5}>5% GST</option>
                            <option value={12}>12% GST</option>
                            <option value={18}>18% GST</option>
                            <option value={28}>28% GST</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Notes & Bank Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold">
                    Bank Details, Notes & Adjustments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Shipping Fee
                      </label>
                      <Input
                        type="number"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Extra Charges
                      </label>
                      <Input
                        type="number"
                        value={extraCharges}
                        onChange={(e) => setExtraCharges(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Advance / Paid
                      </label>
                      <Input
                        type="number"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Bank / NEFT / UPI Payment Instructions
                    </label>
                    <Textarea
                      rows={3}
                      value={paymentInstructions}
                      onChange={(e) => setPaymentInstructions(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Terms & Conditions / Notes
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
            className={`w-full lg:w-1/2 bg-slate-200/70 p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-110px)] flex justify-center items-start ${
              mobileTab === 'editor' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="w-full max-w-3xl">
              <DocumentPreview
                document={documentModel}
                onLogoUpload={(dataUrl) => setSenderLogo(dataUrl)}
                onRemoveLogo={() => setSenderLogo('')}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DEDICATED CLEAN A4 PRINT & PDF CAPTURE SHEET (Always Rendered Cleanly) */}
      {/* ==================================================================== */}
      <div
        className="print-only-sheet fixed -left-[9999px] top-0 w-[860px] bg-white z-[-1]"
        aria-hidden="true"
      >
        <DocumentPreview
          document={documentModel}
          captureId="invoice-pdf-export-sheet"
          isPrintOnly
        />
      </div>
    </div>
  );
};
