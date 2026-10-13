'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DocumentModel,
  DocumentType,
  DocumentStatus,
  Party,
  RoundingMode,
  PaymentMethod,
  BankAccountDetails,
  BankAccountType,
  DocumentPaymentConfig,
  PaymentRecord,
  RefundRecord,
  calculateDocument,
  DEFAULT_NUMBERING_RULES,
  formatDocumentNumber,
  formatCurrency,
  CURRENCIES,
  INDIAN_STATES,
  computeEffectiveInvoiceStatus,
  formatInvoiceStatusLabel,
  validateUpiId,
  validateBankAccount,
  generateVerifiedUpiQrSvgDataUrl,
} from '@invoice/core';
import { getTemplate, getTemplatesByCategory } from '@invoice/theme';
import { TenantApi, ProductCatalogItem } from '@invoice/api';
import { useTenant } from '@/lib/auth/tenant-context';
import { saveDocument } from '@/lib/storage/indexed-db';
import { exportDocumentToPdf, triggerPrint } from '@/lib/pdf/export-pdf';
import { DocumentPreview } from './document-preview';
import { InlineDocumentCanvas } from './inline-document-canvas';
import { DocumentTypeSelector } from './document-type-selector';
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
  CreditCard,
  QrCode,
  Share2,
  History,
  Undo2,
  Building2,
  SlidersHorizontal,
  ArrowLeft,
  Users,
  Package,
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

const DEFAULT_BANK_ACCOUNT: BankAccountDetails = {
  id: 'bank_default_01',
  accountHolderName: 'Apex Digital Solutions Pvt Ltd',
  bankName: 'HDFC Bank Ltd',
  accountNumber: '50200049182731',
  confirmAccountNumber: '50200049182731',
  ifscOrRoutingCode: 'HDFC0000124',
  branchName: 'BKC, Mumbai',
  accountType: 'current',
  swiftBicCode: 'HDFCINBB',
  country: 'India',
  isPrimary: true,
};

const DEFAULT_PAYMENT_CONFIG: DocumentPaymentConfig = {
  bankAccounts: [DEFAULT_BANK_ACCOUNT],
  selectedBankAccountIds: ['bank_default_01'],
  upiId: 'apexdigital@hdfcbank',
  upiPayeeName: 'Apex Digital Solutions Pvt Ltd',
  autoGenerateUpiQr: true,
  display: {
    showBankDetails: true,
    showUpiId: true,
    showQrCode: true,
    showPaymentInstructions: true,
    showPaymentTerms: true,
  },
};

export const DocumentBuilder: React.FC<DocumentBuilderProps> = ({
  initialDocument,
  onSaved,
}) => {
  const { activeTenant, brandSettings, tenantCurrency } = useTenant();
  const categorizedTemplates = useMemo(() => getTemplatesByCategory(), []);

  // Core Invoice Metadata
  const [docId] = useState<string>(initialDocument?.id || `doc_${Date.now()}`);
  const [invoiceName, setInvoiceName] = useState<string>(
    initialDocument?.invoiceName || ''
  );
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
      new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState<string>(
    initialDocument?.currency || tenantCurrency || 'INR'
  );

  // Rounding & Precision
  const [enableRoundOff, setEnableRoundOff] = useState<boolean>(
    initialDocument?.enableRoundOff ?? brandSettings?.enableRoundOff ?? false
  );
  const [roundingMode, setRoundingMode] = useState<RoundingMode>(
    initialDocument?.roundingMode || brandSettings?.roundingMode || 'nearest_integer'
  );
  const [decimalPrecision, setDecimalPrecision] = useState<number>(
    initialDocument?.decimalPrecision ?? brandSettings?.decimalPrecision ?? 2
  );

  // Sender details
  const [senderLogo, setSenderLogo] = useState<string>(
    initialDocument?.sender.logoUrl || brandSettings?.logoUrl || ''
  );
  const [senderName, setSenderName] = useState(
    initialDocument?.sender.name ||
      brandSettings?.businessName ||
      activeTenant?.name ||
      ''
  );
  const [senderEmail, setSenderEmail] = useState(
    initialDocument?.sender.email || brandSettings?.email || ''
  );
  const [senderPhone, setSenderPhone] = useState(
    initialDocument?.sender.phone || brandSettings?.phone || ''
  );
  const [senderTaxId, setSenderTaxId] = useState(
    initialDocument?.sender.taxId || brandSettings?.taxId || ''
  );
  const [senderStreet, setSenderStreet] = useState(
    initialDocument?.sender.address?.street1 ||
      brandSettings?.street ||
      ''
  );
  const [senderCity, setSenderCity] = useState(
    initialDocument?.sender.address?.city || brandSettings?.city || ''
  );
  const [senderState, setSenderState] = useState(
    initialDocument?.sender.address?.state || brandSettings?.gstState || '27 - Maharashtra'
  );
  const [senderPostalCode, setSenderPostalCode] = useState(
    initialDocument?.sender.address?.postalCode || brandSettings?.postalCode || ''
  );
  const [senderCountry, setSenderCountry] = useState(
    initialDocument?.sender.address?.country || brandSettings?.country || 'India'
  );

  // Client details (start blank on new invoices so user can select from Saved Customers dropdown or type manually)
  const [clientName, setClientName] = useState(
    initialDocument?.client.name || ''
  );
  const [clientEmail, setClientEmail] = useState(
    initialDocument?.client.email || ''
  );
  const [clientPhone, setClientPhone] = useState(
    initialDocument?.client.phone || ''
  );
  const [clientTaxId, setClientTaxId] = useState(
    initialDocument?.client.taxId || ''
  );
  const [clientStreet, setClientStreet] = useState(
    initialDocument?.client.billingAddress?.street1 || ''
  );
  const [clientCity, setClientCity] = useState(
    initialDocument?.client.billingAddress?.city || ''
  );
  const [clientState, setClientState] = useState(
    initialDocument?.client.billingAddress?.state || '27 - Maharashtra'
  );
  const [clientPostalCode, setClientPostalCode] = useState(
    initialDocument?.client.billingAddress?.postalCode || ''
  );
  const [clientCountry, setClientCountry] = useState(
    initialDocument?.client.billingAddress?.country || 'India'
  );

  // Line Items (start with 1 blank row on new invoices so user can pick from Saved Items dropdown or type manually)
  const [items, setItems] = useState<any[]>(
    initialDocument?.items || [
      {
        id: '1',
        description: '',
        hsnCode: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
        taxInclusive: false,
        discountType: 'percentage',
        discountValue: 0,
      },
    ]
  );

  // Adjustments & Payments / Refunds state
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
  const [payments, setPayments] = useState<PaymentRecord[]>(
    initialDocument?.payments || []
  );
  const [refunds, setRefunds] = useState<RefundRecord[]>(
    initialDocument?.refunds || []
  );
  const [manualAmountPaid, setManualAmountPaid] = useState<number>(
    initialDocument?.summary?.amountPaid || 0
  );

  // Template & Custom Theme Overrides
  const [templateId, setTemplateId] = useState<string>(
    initialDocument?.templateId || brandSettings?.defaultTemplateId || 'cleartax_gst'
  );
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string | undefined>(
    initialDocument?.customTheme?.primaryColor || brandSettings?.primaryColor
  );
  const [customFontFamily, setCustomFontFamily] = useState<'sans' | 'serif' | 'mono' | undefined>(
    initialDocument?.customTheme?.fontFamily ||
      (brandSettings?.fontFamily as 'sans' | 'serif' | 'mono' | undefined)
  );

  // Payment Configuration (Bank Accounts, UPI, QR Code, Display Toggles)
  const [paymentConfig, setPaymentConfig] = useState<DocumentPaymentConfig>(
    initialDocument?.paymentConfig || brandSettings?.paymentConfig || DEFAULT_PAYMENT_CONFIG
  );

  const [notes, setNotes] = useState<string>(
    initialDocument?.notes ||
      '1. Payment is due within 15 days of invoice date.\n2. Goods/services once billed are subject to Mumbai jurisdiction.'
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialDocument?.paymentTerms || brandSettings?.defaultTerms || 'Net 15 Days'
  );
  const [paymentInstructions, setPaymentInstructions] = useState<string>(
    initialDocument?.paymentInstructions ||
      brandSettings?.defaultInstructions ||
      'NEFT / RTGS / IMPS / UPI accepted. Please mention Invoice No. in payment remarks.'
  );
  const [signatoryName, setSignatoryName] = useState<string>(
    initialDocument?.signatoryName || brandSettings?.signatoryName || 'Authorized Director'
  );

  // Saved Customers & Catalog Items for active workspace
  const [savedCustomers, setSavedCustomers] = useState<Party[]>([]);
  const [savedItems, setSavedItems] = useState<ProductCatalogItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialDocument?.client?.id || ''
  );

  useEffect(() => {
    if (!activeTenant?.id) return;
    let isMounted = true;
    const loadCatalogAndCustomers = async () => {
      try {
        const [partiesList, productsList] = await Promise.all([
          TenantApi.getParties(activeTenant.id),
          TenantApi.getProducts(activeTenant.id),
        ]);
        if (!isMounted) return;
        const customersOnly = partiesList.filter(
          (p) => !p.isArchived && (p.type === 'customer' || !p.type)
        );
        const activeProducts = productsList.filter((p) => !p.isArchived);
        setSavedCustomers(customersOnly);
        setSavedItems(activeProducts);
      } catch (err) {
        console.error('Failed to load workspace customers & items:', err);
      }
    };
    loadCatalogAndCustomers();

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', loadCatalogAndCustomers);
      return () => {
        isMounted = false;
        window.removeEventListener('focus', loadCatalogAndCustomers);
      };
    }
    return () => {
      isMounted = false;
    };
  }, [activeTenant?.id]);

  // Sync workspace defaults when creating a brand-new invoice or when active workspace changes
  const [appliedTenantId, setAppliedTenantId] = useState<string | null>(
    initialDocument ? activeTenant?.id || 'initial' : null
  );
  useEffect(() => {
    if (!initialDocument && activeTenant && brandSettings && appliedTenantId !== activeTenant.id) {
      if (brandSettings.currency || activeTenant.currency) {
        setCurrency(brandSettings.currency || activeTenant.currency || 'INR');
      }
      setSenderName(brandSettings.businessName || activeTenant.name || 'Your Business Name');
      if (brandSettings.email) setSenderEmail(brandSettings.email);
      if (brandSettings.phone) setSenderPhone(brandSettings.phone);
      if (brandSettings.taxId || activeTenant.taxId) {
        setSenderTaxId(brandSettings.taxId || activeTenant.taxId || '');
      }
      if (brandSettings.street || activeTenant.street) {
        setSenderStreet(brandSettings.street || activeTenant.street || '');
      }
      if (brandSettings.city || activeTenant.city) {
        setSenderCity(brandSettings.city || activeTenant.city || '');
      }
      if (brandSettings.gstState || activeTenant.gstState) {
        setSenderState(brandSettings.gstState || activeTenant.gstState || '27 - Maharashtra');
      }
      if (brandSettings.postalCode) setSenderPostalCode(brandSettings.postalCode);
      if (brandSettings.country || activeTenant.country) {
        setSenderCountry(brandSettings.country || activeTenant.country || 'India');
      }
      if (brandSettings.logoUrl !== undefined) setSenderLogo(brandSettings.logoUrl || '');
      if (brandSettings.enableRoundOff !== undefined) setEnableRoundOff(brandSettings.enableRoundOff);
      if (brandSettings.roundingMode) setRoundingMode(brandSettings.roundingMode);
      if (brandSettings.decimalPrecision !== undefined)
        setDecimalPrecision(brandSettings.decimalPrecision);
      if (brandSettings.paymentConfig) setPaymentConfig(brandSettings.paymentConfig);
      if (brandSettings.defaultTerms) setPaymentTerms(brandSettings.defaultTerms);
      if (brandSettings.defaultInstructions)
        setPaymentInstructions(brandSettings.defaultInstructions);
      if (brandSettings.signatoryName) setSignatoryName(brandSettings.signatoryName);
      if (brandSettings.defaultTemplateId) setTemplateId(brandSettings.defaultTemplateId);
      setAppliedTenantId(activeTenant.id);
    }
  }, [initialDocument, activeTenant, brandSettings, appliedTenantId]);

  // UI & Modal state
  const [viewMode, setViewMode] = useState<'sheet' | 'split' | 'pdf_preview'>('sheet');
  const [isPersisted, setIsPersisted] = useState<boolean>(Boolean(initialDocument));
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>(
    initialDocument ? 'saved' : 'unsaved'
  );
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Modals for Payment Settings, Record Payment, Issue Refund, Payment History, Share
  const [paymentSettingsModalOpen, setPaymentSettingsModalOpen] = useState(false);
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // New Bank Account form inside Payment Settings Modal
  const [editingBank, setEditingBank] = useState<BankAccountDetails>({
    id: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscOrRoutingCode: '',
    branchName: '',
    accountType: 'current',
    swiftBicCode: '',
    country: senderCountry || 'India',
  });
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [bankFormErrors, setBankFormErrors] = useState<Record<string, string>>({});

  // Record Payment form state
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [payMethodInput, setPayMethodInput] = useState<PaymentMethod>('bank_transfer');
  const [payDateInput, setPayDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payRefInput, setPayRefInput] = useState<string>('');
  const [payNotesInput, setPayNotesInput] = useState<string>('');

  // Issue Refund form state
  const [refundAmountInput, setRefundAmountInput] = useState<number>(0);
  const [refundMethodInput, setRefundMethodInput] = useState<PaymentMethod>('bank_transfer');
  const [refundDateInput, setRefundDateInput] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [refundReasonInput, setRefundReasonInput] = useState<string>('');
  const [refundRefInput, setRefundRefInput] = useState<string>('');
  const [refundNotesInput, setRefundNotesInput] = useState<string>('');

  const activeTemplateMeta = useMemo(() => getTemplate(templateId), [templateId]);
  const effectivePrimaryColor =
    customPrimaryColor || activeTemplateMeta.defaultTokens.primaryColor;
  const effectiveFontFamily =
    customFontFamily || activeTemplateMeta.defaultTokens.fontFamily;

  const totalPaymentsRecorded = useMemo(() => {
    if (payments.length > 0) {
      return payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    }
    return manualAmountPaid;
  }, [payments, manualAmountPaid]);

  const totalRefundsRecorded = useMemo(() => {
    return refunds.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [refunds]);

  // Recalculate document model reactively using core financial, rounding & GST engine
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
      amountPaid: totalPaymentsRecorded,
      refundedAmount: totalRefundsRecorded,
      enableRoundOff,
      roundingMode,
      decimalPrecision,
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
    totalPaymentsRecorded,
    totalRefundsRecorded,
    enableRoundOff,
    roundingMode,
    decimalPrecision,
  ]);

  const effectiveStatus = useMemo(() => {
    return computeEffectiveInvoiceStatus({
      status,
      dueDate,
      summary: calculated.summary,
    });
  }, [status, dueDate, calculated.summary]);

  const documentModel: DocumentModel = useMemo(() => {
    return {
      id: docId,
      tenantId: activeTenant?.id,
      invoiceName,
      type: docType,
      status: effectiveStatus,
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
        id: selectedCustomerId || initialDocument?.client.id || `client_${docId}`,
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
      enableRoundOff,
      roundingMode,
      decimalPrecision,
      summary: calculated.summary,
      templateId,
      customTheme: {
        primaryColor: customPrimaryColor,
        fontFamily: customFontFamily,
      },
      paymentConfig,
      notes,
      paymentTerms,
      paymentInstructions,
      signatoryName,
      payments,
      refunds,
      auditHistory: initialDocument?.auditHistory || [],
      createdAt: initialDocument?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [
    docId,
    activeTenant?.id,
    selectedCustomerId,
    invoiceName,
    initialDocument,
    docType,
    effectiveStatus,
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
    enableRoundOff,
    roundingMode,
    decimalPrecision,
    templateId,
    customPrimaryColor,
    customFontFamily,
    paymentConfig,
    notes,
    paymentTerms,
    paymentInstructions,
    signatoryName,
    payments,
    refunds,
  ]);

  // Only autosave updates AFTER the invoice has been explicitly saved or finalized
  useEffect(() => {
    if (!isPersisted) {
      setSaveStatus('unsaved');
      return;
    }
    setSaveStatus('unsaved');
    const timer = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await saveDocument(documentModel);
        if (activeTenant?.id) {
          await TenantApi.saveDocument(activeTenant.id, documentModel);
        }
        setSaveStatus('saved');
        if (onSaved) onSaved(documentModel);
      } catch (e) {
        console.error('Failed to autosave invoice:', e);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [documentModel, activeTenant?.id, isPersisted]);

  // Line item manipulation helpers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        description: '',
        hsnCode: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: brandSettings?.defaultTaxRate ?? 18,
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

  // Select a saved customer from workspace directory and populate Bill To fields
  const handleSelectCustomer = (partyId: string) => {
    setSelectedCustomerId(partyId);
    const found = savedCustomers.find((c) => c.id === partyId);
    if (!found) return;
    setClientName(found.name || '');
    setClientEmail(found.email || '');
    setClientPhone(found.phone || '');
    setClientTaxId(found.taxId || '');
    setClientStreet(found.billingAddress?.street1 || '');
    setClientCity(found.billingAddress?.city || '');
    if (found.billingAddress?.state) {
      setClientState(found.billingAddress.state);
    }
    setClientPostalCode(found.billingAddress?.postalCode || '');
    setClientCountry(found.billingAddress?.country || 'India');
  };

  // Select a saved item from workspace catalog for a specific line item row
  const handleSelectCatalogItem = (lineIndex: number, productId: string) => {
    const product = savedItems.find((p) => p.id === productId);
    if (!product) return;
    setItems((prev) => {
      const copy = [...prev];
      const fullDesc = product.description
        ? `${product.name} — ${product.description}`
        : product.name;
      copy[lineIndex] = {
        ...copy[lineIndex],
        productId: product.id,
        description: fullDesc,
        hsnCode: product.hsnCode || product.sku || copy[lineIndex]?.hsnCode || '',
        unitPrice: Number(product.unitPrice) || 0,
        taxRate: product.taxRate ?? (brandSettings?.defaultTaxRate ?? 18),
      };
      return copy;
    });
  };

  // Append a new line item directly from a saved catalog item
  const handleAddCatalogItem = (productId: string) => {
    const product = savedItems.find((p) => p.id === productId);
    if (!product) return;
    const fullDesc = product.description
      ? `${product.name} — ${product.description}`
      : product.name;
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        productId: product.id,
        description: fullDesc,
        hsnCode: product.hsnCode || product.sku || '9983',
        quantity: 1,
        unitPrice: Number(product.unitPrice) || 0,
        taxRate: product.taxRate ?? (brandSettings?.defaultTaxRate ?? 18),
        taxInclusive: false,
        discountType: 'percentage',
        discountValue: 0,
      },
    ]);
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
    } else if (field === 'invoiceName') setInvoiceName(value);
    else if (field === 'documentNumber') setDocNumber(value);
    else if (field === 'referenceNumber') setReferenceNumber(value);
    else if (field === 'issueDate') setIssueDate(value);
    else if (field === 'dueDate') setDueDate(value);
    else if (field === 'currency') setCurrency(value);
    else if (field === 'templateId') setTemplateId(value);
    else if (field === 'notes') setNotes(value);
    else if (field === 'paymentTerms') setPaymentTerms(value);
    else if (field === 'paymentInstructions') setPaymentInstructions(value);
    else if (field === 'signatoryName') setSignatoryName(value);
    else if (field === 'enableRoundOff') setEnableRoundOff(Boolean(value));
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

  const handleSaveDraft = async () => {
    try {
      setSaveStatus('saving');
      await saveDocument(documentModel);
      if (activeTenant?.id) {
        await TenantApi.saveDocument(activeTenant.id, documentModel);
      }
      setIsPersisted(true);
      setSaveStatus('saved');
      if (onSaved) onSaved(documentModel);
    } catch (err) {
      console.error('Failed to save invoice:', err);
    }
  };

  const handleFinalize = async () => {
    try {
      setSaveStatus('saving');
      const nextStatus: DocumentStatus = 'pending';
      setStatus(nextStatus);
      const nextEffectiveStatus = computeEffectiveInvoiceStatus({
        status: nextStatus,
        dueDate,
        summary: calculated.summary,
      });
      const updated: DocumentModel = {
        ...documentModel,
        status: nextEffectiveStatus,
        updatedAt: new Date().toISOString(),
      };
      await saveDocument(updated);
      if (activeTenant?.id) {
        await TenantApi.saveDocument(activeTenant.id, updated);
      }
      setIsPersisted(true);
      setSaveStatus('saved');
      if (onSaved) onSaved(updated);
    } catch (err) {
      console.error('Failed to finalize invoice:', err);
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
      payments: [],
      refunds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveDocument(newDoc);
    if (activeTenant?.id) {
      await TenantApi.saveDocument(activeTenant.id, newDoc);
    }
    alert(`Invoice duplicated as #${newDocNumber}`);
  };

  // Record Payment handler inside Builder
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmountInput);
    if (amt <= 0) return;

    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      documentId: docId,
      amount: Number(amt.toFixed(2)),
      paymentDate: payDateInput || new Date().toISOString().split('T')[0],
      paymentMethod: payMethodInput,
      reference: payRefInput,
      notes: payNotesInput,
      createdAt: new Date().toISOString(),
    };

    const nextPayments = [...payments, newPayment];
    setPayments(nextPayments);
    const nextStatus: DocumentStatus = status === 'draft' ? 'pending' : status;
    if (status === 'draft') {
      setStatus('pending');
    }
    const updatedDoc: DocumentModel = {
      ...documentModel,
      status: nextStatus,
      payments: nextPayments,
      updatedAt: new Date().toISOString(),
    };
    await saveDocument(updatedDoc);
    if (activeTenant?.id) {
      await TenantApi.saveDocument(activeTenant.id, updatedDoc);
    }
    setIsPersisted(true);
    setSaveStatus('saved');
    setRecordPaymentModalOpen(false);
    setPayRefInput('');
    setPayNotesInput('');
  };

  // Issue Refund handler inside Builder
  const handleIssueRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const maxRefundable = Math.max(0, totalPaymentsRecorded - totalRefundsRecorded);
    const amt = Math.min(maxRefundable, Number(refundAmountInput));
    if (amt <= 0) return;

    const newRefund: RefundRecord = {
      id: `ref_${Date.now()}`,
      documentId: docId,
      amount: Number(amt.toFixed(2)),
      refundDate: refundDateInput || new Date().toISOString().split('T')[0],
      refundMethod: refundMethodInput,
      reason: refundReasonInput,
      reference: refundRefInput,
      notes: refundNotesInput,
      createdAt: new Date().toISOString(),
    };

    setRefunds((prev) => [...prev, newRefund]);
    setRefundModalOpen(false);
    setRefundReasonInput('');
    setRefundRefInput('');
    setRefundNotesInput('');
  };

  // Add Bank Account inside Payment Settings modal
  const handleSaveBankAccount = () => {
    const check = validateBankAccount(editingBank);
    if (!check.valid) {
      setBankFormErrors(check.errors);
      return;
    }
    setBankFormErrors({});
    const newId = editingBank.id || `bank_${Date.now()}`;
    const newBank: BankAccountDetails = {
      ...editingBank,
      id: newId,
      ifscOrRoutingCode: editingBank.ifscOrRoutingCode.toUpperCase(),
    };

    setPaymentConfig((prev) => {
      const exists = prev.bankAccounts.some((b) => b.id === newId);
      const updatedBanks = exists
        ? prev.bankAccounts.map((b) => (b.id === newId ? newBank : b))
        : [...prev.bankAccounts, newBank];
      const updatedSelected = prev.selectedBankAccountIds?.includes(newId)
        ? prev.selectedBankAccountIds
        : [...(prev.selectedBankAccountIds || []), newId];
      return {
        ...prev,
        bankAccounts: updatedBanks,
        selectedBankAccountIds: updatedSelected,
      };
    });

    setShowAddBankForm(false);
    setEditingBank({
      id: '',
      accountHolderName: senderName,
      bankName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscOrRoutingCode: '',
      branchName: '',
      accountType: 'current',
      swiftBicCode: '',
      country: senderCountry || 'India',
    });
  };

  const upiValidation = useMemo(() => validateUpiId(paymentConfig.upiId), [paymentConfig.upiId]);
  const liveQrPreviewUrl = useMemo(() => {
    if (!paymentConfig.autoGenerateUpiQr && paymentConfig.qrCodeDataUrl) {
      return paymentConfig.qrCodeDataUrl;
    }
    return generateVerifiedUpiQrSvgDataUrl({
      upiId: paymentConfig.upiId,
      payeeName: paymentConfig.upiPayeeName || senderName,
      amount:
        calculated.summary.balanceDue > 0
          ? calculated.summary.balanceDue
          : calculated.summary.grandTotal,
      currency,
      invoiceNumber: docNumber,
    });
  }, [
    paymentConfig.autoGenerateUpiQr,
    paymentConfig.qrCodeDataUrl,
    paymentConfig.upiId,
    paymentConfig.upiPayeeName,
    senderName,
    calculated.summary.balanceDue,
    calculated.summary.grandTotal,
    currency,
    docNumber,
  ]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveDraft();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        triggerPrint();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAddItem();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [documentModel]);

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleConvertEstimateToInvoice = async () => {
    const newDocNumber = formatDocumentNumber(
      DEFAULT_NUMBERING_RULES['invoice'],
      Math.floor(Math.random() * 9000) + 1000
    );
    setDocType('invoice');
    setDocNumber(newDocNumber);
    setStatus('pending');
    alert(`Estimate converted to Tax Invoice #${newDocNumber}!`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Notice Banner */}
      {!bannerDismissed && (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-900 px-4 py-2 text-xs flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>
              <strong>GST & Multi-Currency Invoice Studio:</strong> Automatic CGST + SGST (Intra-State), IGST (Inter-State), Round-Off, and Verified UPI QR generation.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="font-semibold underline hover:text-blue-700 flex items-center gap-1"
            >
              Go to Workspace <ArrowRight className="h-3 w-3" />
            </Link>
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
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/documents"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            title="Back to Invoices"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link href="/" className="font-black text-lg text-primary tracking-tight flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">BillCraft</span>
          </Link>

          {/* Invoice Name Input */}
          <div className="flex items-center gap-1.5">
            <Input
              value={invoiceName}
              onChange={(e) => setInvoiceName(e.target.value)}
              placeholder="Invoice Name (e.g. Oct Retainer)"
              aria-label="Invoice Name"
              className="h-8 text-xs font-bold w-44 sm:w-56 border-slate-300"
            />
          </div>

          <DocumentTypeSelector
            value={docType}
            onChange={(newType) => {
              setDocType(newType);
              setDocNumber(
                formatDocumentNumber(DEFAULT_NUMBERING_RULES[newType], 1, new Date())
              );
            }}
            primaryColor={effectivePrimaryColor}
            compact
            align="left"
          />

          <Badge
            variant={
              effectiveStatus === 'paid'
                ? 'success'
                : effectiveStatus === 'overdue' || effectiveStatus === 'cancelled'
                ? 'destructive'
                : effectiveStatus === 'partially_paid' || effectiveStatus === 'refunded'
                ? 'warning'
                : 'info'
            }
          >
            {formatInvoiceStatusLabel(effectiveStatus)}
          </Badge>

          {/* Save / Record Status */}
          <div className="hidden xl:flex items-center gap-1 text-xs text-slate-500">
            {isPersisted && saveStatus === 'saved' && (
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
            {(!isPersisted || saveStatus === 'unsaved') && saveStatus !== 'saving' && (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>{isPersisted ? 'Unsaved edits' : 'Not saved yet'}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 3-Way View Switcher */}
          <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-1">
            <button
              onClick={() => setViewMode('sheet')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
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
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
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
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
                viewMode === 'pdf_preview'
                  ? 'bg-white text-primary shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview Invoice</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaymentSettingsModalOpen(true)}
            className="text-xs font-semibold flex items-center gap-1"
            title="Configure Bank Details, UPI ID, QR Code & Display Controls"
          >
            <QrCode className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Payment Settings</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPayAmountInput(
                calculated.summary.balanceDue > 0
                  ? calculated.summary.balanceDue
                  : calculated.summary.grandTotal
              );
              setRecordPaymentModalOpen(true);
            }}
            className="text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 flex items-center gap-1"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Record Payment</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoryModalOpen(true)}
            className="text-xs font-semibold flex items-center gap-1"
            title="View Payment & Refund History"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">
              History ({payments.length + refunds.length})
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareModalOpen(true)}
            className="text-xs font-semibold flex items-center gap-1"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Send / Share</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={triggerPrint}
            className="flex items-center gap-1 font-semibold text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 font-semibold text-xs shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExportingPdf ? 'Exporting...' : 'Download PDF'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            className="text-xs font-semibold border-slate-300 flex items-center gap-1"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{isPersisted ? 'Save' : 'Save Draft'}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleFinalize}
            className="bg-primary hover:bg-primary-hover text-white flex items-center gap-1 text-xs shadow-xs font-semibold"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              {effectiveStatus === 'draft' || !isPersisted
                ? 'Finalize Invoice'
                : 'Update Finalized Invoice'}
            </span>
          </Button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* DESIGN, ROUNDING & CURRENCY STUDIO BAR */}
      {/* ==================================================================== */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3 no-print shadow-xs sticky top-[53px] z-30">
        {/* Left: Category-Wise Template Dropdown + Theme Swatches */}
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
              className="text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 cursor-pointer min-w-[220px]"
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

          {/* Theme Color Swatches */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Theme:</span>
            {THEME_COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => setCustomPrimaryColor(swatch.hex)}
                title={swatch.name}
                className={`w-4 h-4 rounded-full border transition-transform ${
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
              className="w-5 h-5 rounded cursor-pointer border border-slate-300 p-0 bg-transparent ml-0.5"
            />
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

        {/* Right: Round-Off Controls & Currency */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Round-Off Quick Toggle & Precision */}
          <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={enableRoundOff}
                onChange={(e) => setEnableRoundOff(e.target.checked)}
                className="rounded border-slate-300 text-primary h-3.5 w-3.5"
              />
              <span>Round-Off</span>
            </label>
            {enableRoundOff && (
              <select
                value={roundingMode}
                onChange={(e) => setRoundingMode(e.target.value as RoundingMode)}
                className="text-[11px] font-semibold bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-800"
                title="Rounding Mode"
              >
                <option value="nearest_integer">Nearest Whole</option>
                <option value="half_up">Half Up</option>
                <option value="half_even">Half Even (Banker)</option>
                <option value="up">Round Up</option>
                <option value="down">Round Down</option>
              </select>
            )}
            <select
              value={decimalPrecision}
              onChange={(e) => setDecimalPrecision(Number(e.target.value))}
              className="text-[11px] font-mono bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-700"
              title="Decimal Precision"
            >
              <option value={2}>2 Decimals</option>
              <option value={0}>0 Decimals</option>
              <option value={3}>3 Decimals</option>
            </select>
          </div>

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
              savedCustomers={savedCustomers}
              savedItems={savedItems}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={handleSelectCustomer}
              onSelectCatalogItem={handleSelectCatalogItem}
              onAddCatalogItem={handleAddCatalogItem}
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
              onUpdatePaid={(val) => setManualAmountPaid(val)}
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW MODE 2: PRINT / PDF CLEAN PREVIEW */}
      {/* ==================================================================== */}
      {viewMode === 'pdf_preview' && (
        <div className="flex-1 bg-slate-300/70 p-4 md:p-8 flex flex-col items-center overflow-y-auto no-print">
          <div className="mb-4 flex flex-wrap items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-xs">
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
              <Printer className="h-3.5 w-3.5 mr-1" /> Print Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentSettingsModalOpen(true)}
              className="h-7 text-xs"
            >
              <QrCode className="h-3.5 w-3.5 mr-1 text-primary" /> Payment Display Controls
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
              {/* Invoice Metadata Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Invoice Details & Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Invoice Name
                    </label>
                    <Input
                      value={invoiceName}
                      onChange={(e) => setInvoiceName(e.target.value)}
                      placeholder="e.g. Q4 Enterprise Cloud Retainer"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Invoice Number
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
                      Payment Terms
                    </label>
                    <Input
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
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
                    <CardTitle className="text-sm font-bold flex items-center justify-between gap-2">
                      <span>Bill To (Customer & Place of Supply)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-primary flex items-center gap-1 mb-1">
                        <Users className="h-3.5 w-3.5" /> Select Saved Customer
                      </label>
                      <select
                        aria-label="Select Saved Customer"
                        value={selectedCustomerId}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSelectCustomer(e.target.value);
                          }
                        }}
                        className="w-full h-9 rounded-md border border-slate-300 bg-slate-50 hover:bg-white px-2.5 text-xs font-semibold text-slate-800 cursor-pointer"
                      >
                        <option value="">
                          {savedCustomers.length > 0
                            ? `Choose from ${savedCustomers.length} saved customer(s)...`
                            : 'No saved customers yet — enter details below'}
                        </option>
                        {savedCustomers.map((cust) => (
                          <option key={cust.id} value={cust.id}>
                            {cust.name}
                            {cust.taxId ? ` (${cust.taxId})` : cust.billingAddress?.city ? ` — ${cust.billingAddress.city}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

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
                      placeholder="Customer Email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                    <Input
                      placeholder="Customer Phone"
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
                <CardHeader className="pb-3 flex flex-wrap flex-row items-center justify-between gap-2">
                  <CardTitle className="text-sm font-bold">
                    Invoice Items (HSN/SAC & GST)
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {savedItems.length > 0 && (
                      <select
                        aria-label="Quick Add Saved Item"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddCatalogItem(e.target.value);
                          }
                        }}
                        className="h-8 rounded-md border border-slate-300 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 cursor-pointer"
                      >
                        <option value="">+ Add from Saved Items ({savedItems.length})...</option>
                        {savedItems.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name} — {formatCurrency(prod.unitPrice, currency)}
                          </option>
                        ))}
                      </select>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddItem}
                      className="h-8 text-xs font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">
                            Item #{index + 1}
                          </span>
                          <select
                            aria-label={`Select Saved Item for Item ${index + 1}`}
                            value={item.productId || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleSelectCatalogItem(index, e.target.value);
                              }
                            }}
                            className="h-7 rounded border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 cursor-pointer"
                          >
                            <option value="">
                              {savedItems.length > 0
                                ? `📦 Select Saved Item (${savedItems.length})...`
                                : '📦 No saved items yet'}
                            </option>
                            {savedItems.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name} — {formatCurrency(prod.unitPrice, currency)} (GST {prod.taxRate}%)
                              </option>
                            ))}
                          </select>
                        </div>
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
                            Unit Price ({currency})
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

              {/* Payment Settings, Rounding & Notes Card */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold">
                    Payment Settings, Rounding & Notes
                  </CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPaymentSettingsModalOpen(true)}
                    className="h-7 text-xs"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 mr-1" /> Configure Bank / UPI / QR
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.display.showBankDetails}
                        onChange={(e) =>
                          setPaymentConfig((p) => ({
                            ...p,
                            display: { ...p.display, showBankDetails: e.target.checked },
                          }))
                        }
                      />
                      <span>Show Bank Details</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.display.showUpiId}
                        onChange={(e) =>
                          setPaymentConfig((p) => ({
                            ...p,
                            display: { ...p.display, showUpiId: e.target.checked },
                          }))
                        }
                      />
                      <span>Show UPI ID</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.display.showQrCode}
                        onChange={(e) =>
                          setPaymentConfig((p) => ({
                            ...p,
                            display: { ...p.display, showQrCode: e.target.checked },
                          }))
                        }
                      />
                      <span>Show QR Code</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.display.showPaymentInstructions}
                        onChange={(e) =>
                          setPaymentConfig((p) => ({
                            ...p,
                            display: {
                              ...p.display,
                              showPaymentInstructions: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span>Show Instructions</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfig.display.showPaymentTerms}
                        onChange={(e) =>
                          setPaymentConfig((p) => ({
                            ...p,
                            display: { ...p.display, showPaymentTerms: e.target.checked },
                          }))
                        }
                      />
                      <span>Show Payment Terms</span>
                    </label>
                  </div>

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
                        Round-Off Adjustment
                      </label>
                      <div className="h-10 px-3 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-mono">
                        <span>
                          {formatCurrency(calculated.summary.roundOffAmount || 0, currency, {
                            showSign: true,
                          })}
                        </span>
                        <input
                          type="checkbox"
                          checked={enableRoundOff}
                          onChange={(e) => setEnableRoundOff(e.target.checked)}
                          title="Toggle Round-Off"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Payment Instructions
                    </label>
                    <Textarea
                      rows={2}
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

          {/* RIGHT COLUMN: Live Realtime Invoice Preview */}
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
      {/* MODAL 1: PAYMENT SETTINGS (BANK ACCOUNTS, UPI ID, QR CODE & DISPLAY CONTROLS) */}
      {/* ==================================================================== */}
      {paymentSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto no-print">
          <Card className="w-full max-w-3xl bg-white border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Payment Settings & Invoice Display Controls
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure structured Bank Accounts, UPI ID, and Verified QR Code. Only enabled payment methods appear on the invoice.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentSettingsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {/* 1. Independent Visibility Toggles */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  1. Invoice Display Controls (Independent Toggles)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfig.display.showBankDetails}
                      onChange={(e) =>
                        setPaymentConfig((p) => ({
                          ...p,
                          display: { ...p.display, showBankDetails: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded text-primary"
                    />
                    <span>Show Bank Details</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfig.display.showUpiId}
                      onChange={(e) =>
                        setPaymentConfig((p) => ({
                          ...p,
                          display: { ...p.display, showUpiId: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded text-primary"
                    />
                    <span>Show UPI ID</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfig.display.showQrCode}
                      onChange={(e) =>
                        setPaymentConfig((p) => ({
                          ...p,
                          display: { ...p.display, showQrCode: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded text-primary"
                    />
                    <span>Show QR Code</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfig.display.showPaymentInstructions}
                      onChange={(e) =>
                        setPaymentConfig((p) => ({
                          ...p,
                          display: {
                            ...p.display,
                            showPaymentInstructions: e.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded text-primary"
                    />
                    <span>Show Payment Instructions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfig.display.showPaymentTerms}
                      onChange={(e) =>
                        setPaymentConfig((p) => ({
                          ...p,
                          display: { ...p.display, showPaymentTerms: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded text-primary"
                    />
                    <span>Show Payment Terms</span>
                  </label>
                </div>
              </div>

              {/* 2. Structured Bank Accounts */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    2. Bank Accounts ({paymentConfig.bankAccounts.length})
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingBank({
                        id: '',
                        accountHolderName: senderName,
                        bankName: '',
                        accountNumber: '',
                        confirmAccountNumber: '',
                        ifscOrRoutingCode: '',
                        branchName: '',
                        accountType: 'current',
                        swiftBicCode: '',
                        country: senderCountry || 'India',
                      });
                      setBankFormErrors({});
                      setShowAddBankForm(true);
                    }}
                    className="h-7 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Bank Account
                  </Button>
                </div>

                <div className="space-y-2">
                  {paymentConfig.bankAccounts.map((bank) => {
                    const isSelected =
                      !paymentConfig.selectedBankAccountIds?.length ||
                      paymentConfig.selectedBankAccountIds.includes(bank.id);
                    return (
                      <div
                        key={bank.id}
                        className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                      >
                        <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              setPaymentConfig((p) => {
                                const currentIds =
                                  p.selectedBankAccountIds && p.selectedBankAccountIds.length > 0
                                    ? p.selectedBankAccountIds
                                    : p.bankAccounts.map((b) => b.id);
                                const nextIds = e.target.checked
                                  ? [...currentIds, bank.id]
                                  : currentIds.filter((id) => id !== bank.id);
                                return { ...p, selectedBankAccountIds: nextIds };
                              });
                            }}
                            className="mt-1 h-4 w-4 rounded text-primary"
                          />
                          <div>
                            <div className="font-bold text-slate-900">
                              {bank.bankName} — {bank.accountHolderName}
                            </div>
                            <div className="text-slate-600 font-mono text-[11px]">
                              A/C: {bank.accountNumber} • IFSC/Routing: {bank.ifscOrRoutingCode} •{' '}
                              <span className="capitalize">{bank.accountType}</span>
                              {bank.branchName ? ` • ${bank.branchName}` : ''}
                              {bank.swiftBicCode ? ` • SWIFT: ${bank.swiftBicCode}` : ''}
                            </div>
                          </div>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingBank({
                                ...bank,
                                confirmAccountNumber: bank.accountNumber,
                              });
                              setBankFormErrors({});
                              setShowAddBankForm(true);
                            }}
                            className="h-7 text-xs px-2"
                          >
                            Edit
                          </Button>
                          {paymentConfig.bankAccounts.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setPaymentConfig((p) => ({
                                  ...p,
                                  bankAccounts: p.bankAccounts.filter((b) => b.id !== bank.id),
                                  selectedBankAccountIds: (p.selectedBankAccountIds || []).filter(
                                    (id) => id !== bank.id
                                  ),
                                }))
                              }
                              className="h-7 text-xs text-red-600 hover:bg-red-50 px-2"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Individual Input Fields Form for Adding / Editing Bank Account */}
                {showAddBankForm && (
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                    <div className="text-xs font-bold text-slate-800">
                      {editingBank.id ? 'Edit Bank Account Details' : 'New Bank Account Details'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Account Holder Name *
                        </label>
                        <Input
                          value={editingBank.accountHolderName}
                          onChange={(e) =>
                            setEditingBank((b) => ({ ...b, accountHolderName: e.target.value }))
                          }
                          placeholder="e.g. Apex Digital Solutions Pvt Ltd"
                        />
                        {bankFormErrors.accountHolderName && (
                          <p className="text-[11px] text-red-600 mt-0.5">
                            {bankFormErrors.accountHolderName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Bank Name *
                        </label>
                        <Input
                          value={editingBank.bankName}
                          onChange={(e) =>
                            setEditingBank((b) => ({ ...b, bankName: e.target.value }))
                          }
                          placeholder="e.g. HDFC Bank Ltd"
                        />
                        {bankFormErrors.bankName && (
                          <p className="text-[11px] text-red-600 mt-0.5">
                            {bankFormErrors.bankName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Account Number *
                        </label>
                        <Input
                          value={editingBank.accountNumber}
                          onChange={(e) =>
                            setEditingBank((b) => ({ ...b, accountNumber: e.target.value }))
                          }
                          placeholder="50200049182731"
                        />
                        {bankFormErrors.accountNumber && (
                          <p className="text-[11px] text-red-600 mt-0.5">
                            {bankFormErrors.accountNumber}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Confirm Account Number *
                        </label>
                        <Input
                          value={editingBank.confirmAccountNumber || ''}
                          onChange={(e) =>
                            setEditingBank((b) => ({
                              ...b,
                              confirmAccountNumber: e.target.value,
                            }))
                          }
                          placeholder="Re-enter account number"
                        />
                        {bankFormErrors.confirmAccountNumber && (
                          <p className="text-[11px] text-red-600 mt-0.5">
                            {bankFormErrors.confirmAccountNumber}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          IFSC / Routing Code *
                        </label>
                        <Input
                          value={editingBank.ifscOrRoutingCode}
                          onChange={(e) =>
                            setEditingBank((b) => ({
                              ...b,
                              ifscOrRoutingCode: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="HDFC0000124"
                        />
                        {bankFormErrors.ifscOrRoutingCode && (
                          <p className="text-[11px] text-red-600 mt-0.5">
                            {bankFormErrors.ifscOrRoutingCode}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Branch Name
                        </label>
                        <Input
                          value={editingBank.branchName || ''}
                          onChange={(e) =>
                            setEditingBank((b) => ({ ...b, branchName: e.target.value }))
                          }
                          placeholder="Nariman Point, Mumbai"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Account Type
                        </label>
                        <select
                          value={editingBank.accountType}
                          onChange={(e) =>
                            setEditingBank((b) => ({
                              ...b,
                              accountType: e.target.value as BankAccountType,
                            }))
                          }
                          className="w-full h-10 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium"
                        >
                          <option value="current">Current Account</option>
                          <option value="savings">Savings Account</option>
                          <option value="checking">Checking Account</option>
                          <option value="business">Business Corporate</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          SWIFT / BIC Code (Optional)
                        </label>
                        <Input
                          value={editingBank.swiftBicCode || ''}
                          onChange={(e) =>
                            setEditingBank((b) => ({
                              ...b,
                              swiftBicCode: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="HDFCINBB"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddBankForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveBankAccount}
                        className="bg-primary text-white"
                      >
                        Save Bank Account
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. UPI ID & QR Code Configuration */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  3. UPI ID & Verified QR Code
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="md:col-span-2 space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        UPI ID / VPA
                      </label>
                      <Input
                        value={paymentConfig.upiId || ''}
                        onChange={(e) =>
                          setPaymentConfig((p) => ({ ...p, upiId: e.target.value.trim() }))
                        }
                        placeholder="businessname@hdfcbank"
                      />
                      {paymentConfig.upiId && !upiValidation.valid && (
                        <p className="text-[11px] text-amber-600 mt-1">
                          {upiValidation.error}
                        </p>
                      )}
                      {paymentConfig.upiId && upiValidation.valid && (
                        <p className="text-[11px] text-emerald-600 mt-1">
                          ✓ Valid UPI ID format verified.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        UPI Payee Name
                      </label>
                      <Input
                        value={paymentConfig.upiPayeeName || senderName}
                        onChange={(e) =>
                          setPaymentConfig((p) => ({ ...p, upiPayeeName: e.target.value }))
                        }
                        placeholder="Merchant / Business Name"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(paymentConfig.autoGenerateUpiQr)}
                          onChange={(e) =>
                            setPaymentConfig((p) => ({
                              ...p,
                              autoGenerateUpiQr: e.target.checked,
                            }))
                          }
                        />
                        <span>Auto-generate verified UPI QR</span>
                      </label>

                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700">
                        <Upload className="h-3.5 w-3.5" /> Upload Custom QR Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setPaymentConfig((p) => ({
                                ...p,
                                autoGenerateUpiQr: false,
                                qrCodeDataUrl: ev.target?.result as string,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* QR Code Preview Box */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center min-h-[140px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      QR Code Preview
                    </span>
                    {liveQrPreviewUrl ? (
                      <>
                        <img
                          src={liveQrPreviewUrl}
                          alt="Verified QR Preview"
                          className="h-24 w-24 object-contain bg-white p-1.5 rounded border border-slate-200"
                        />
                        <span className="text-[10px] text-emerald-700 font-semibold mt-1.5">
                          ✓ Verified Payment QR Ready
                        </span>
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-400 px-2">
                        Enter a valid UPI ID & Payee Name or upload a QR image to generate preview.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    if (activeTenant?.id) {
                      await TenantApi.updateBrandSettings(activeTenant.id, {
                        paymentConfig,
                      });
                    }
                    setPaymentSettingsModalOpen(false);
                  }}
                  className="bg-primary hover:bg-primary-hover text-white font-semibold"
                >
                  Apply to Invoice & Save Default
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: RECORD PAYMENT (FULL OR PARTIAL) */}
      {/* ==================================================================== */}
      {recordPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-base text-slate-900">
                  Record Payment — #{docNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setRecordPaymentModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Total:</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(calculated.summary.grandTotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collected So Far:</span>
                  <span className="font-mono text-emerald-700 font-semibold">
                    {formatCurrency(calculated.summary.amountPaid, currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold text-slate-900">
                  <span>Outstanding Balance:</span>
                  <span className="font-mono text-amber-600">
                    {formatCurrency(calculated.summary.balanceDue, currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Payment Amount ({currency}) *
                  </label>
                  <Input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={payAmountInput}
                    onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Payment Method
                    </label>
                    <select
                      value={payMethodInput}
                      onChange={(e) => setPayMethodInput(e.target.value as PaymentMethod)}
                      className="w-full h-10 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium"
                    >
                      <option value="bank_transfer">Bank Transfer / NEFT</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Payment Date
                    </label>
                    <Input
                      type="date"
                      value={payDateInput}
                      onChange={(e) => setPayDateInput(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Transaction Reference
                  </label>
                  <Input
                    value={payRefInput}
                    onChange={(e) => setPayRefInput(e.target.value)}
                    placeholder="e.g. UTR / NEFT-994120 / UPI Ref"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Notes
                  </label>
                  <Input
                    value={payNotesInput}
                    onChange={(e) => setPayNotesInput(e.target.value)}
                    placeholder="Optional payment note..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRecordPaymentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Save Payment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: PAYMENT & REFUND HISTORY + ISSUE REFUND */}
      {/* ==================================================================== */}
      {historyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <Card className="w-full max-w-2xl bg-white border-slate-200 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Payment & Refund History — #{docNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Original Invoice Total, Collected Payments, Refunds, and Remaining Balance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Invoice Total</div>
                  <div className="font-mono font-black text-slate-900 text-sm mt-0.5">
                    {formatCurrency(calculated.summary.grandTotal, currency)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] text-emerald-700 uppercase font-bold">Collected</div>
                  <div className="font-mono font-black text-emerald-700 text-sm mt-0.5">
                    {formatCurrency(calculated.summary.amountPaid, currency)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <div className="text-[10px] text-rose-700 uppercase font-bold">Refunded</div>
                  <div className="font-mono font-black text-rose-700 text-sm mt-0.5">
                    {formatCurrency(calculated.summary.refundedAmount || 0, currency)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-[10px] text-amber-700 uppercase font-bold">Balance Due</div>
                  <div className="font-mono font-black text-amber-700 text-sm mt-0.5">
                    {formatCurrency(calculated.summary.balanceDue, currency)}
                  </div>
                </div>
              </div>

              {/* Payments List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Collected Payments ({payments.length})
                  </h4>
                  <div className="flex gap-2">
                    {totalPaymentsRecorded > totalRefundsRecorded && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRefundAmountInput(
                            Number((totalPaymentsRecorded - totalRefundsRecorded).toFixed(2))
                          );
                          setRefundModalOpen(true);
                        }}
                        className="h-7 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        <Undo2 className="h-3 w-3 mr-1" /> Issue Refund
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setPayAmountInput(calculated.summary.balanceDue);
                        setRecordPaymentModalOpen(true);
                      }}
                      className="h-7 text-xs bg-emerald-600 text-white"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Record Payment
                    </Button>
                  </div>
                </div>

                {payments.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 border rounded-lg">
                    No payment transactions recorded yet.
                  </div>
                ) : (
                  <div className="divide-y border rounded-lg text-xs">
                    {payments.map((p) => (
                      <div key={p.id} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900 capitalize">
                            {p.paymentMethod.replace('_', ' ')} • {p.paymentDate}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.reference ? `Ref: ${p.reference}` : 'No reference'}{' '}
                            {p.notes ? `• ${p.notes}` : ''}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-emerald-700">
                          +{formatCurrency(p.amount, currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Refunds List */}
              {refunds.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600">
                    Refunds Issued ({refunds.length})
                  </h4>
                  <div className="divide-y border border-rose-200 bg-rose-50/30 rounded-lg text-xs">
                    {refunds.map((r) => (
                      <div key={r.id} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900 capitalize">
                            Refund via {r.refundMethod.replace('_', ' ')} • {r.refundDate}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {r.reason ? `Reason: ${r.reason}` : ''}{' '}
                            {r.reference ? `• Ref: ${r.reference}` : ''}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-rose-600">
                          -{formatCurrency(r.amount, currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issue Refund Inline Sub-Form */}
              {refundModalOpen && (
                <form
                  onSubmit={handleIssueRefundSubmit}
                  className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3 text-xs"
                >
                  <div className="font-bold text-rose-900">
                    Issue Partial or Full Refund (Max Refundable:{' '}
                    {formatCurrency(totalPaymentsRecorded - totalRefundsRecorded, currency)})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Refund Amount *
                      </label>
                      <Input
                        type="number"
                        step="any"
                        min="0.01"
                        max={totalPaymentsRecorded - totalRefundsRecorded}
                        required
                        value={refundAmountInput}
                        onChange={(e) => setRefundAmountInput(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Refund Method
                      </label>
                      <select
                        value={refundMethodInput}
                        onChange={(e) => setRefundMethodInput(e.target.value as PaymentMethod)}
                        className="w-full h-10 rounded-md border border-slate-300 bg-white px-2 text-xs"
                      >
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card Reversal</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Refund Date
                      </label>
                      <Input
                        type="date"
                        value={refundDateInput}
                        onChange={(e) => setRefundDateInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Refund Reason (e.g. Service scope adjustment)"
                      value={refundReasonInput}
                      onChange={(e) => setRefundReasonInput(e.target.value)}
                    />
                    <Input
                      placeholder="Transaction Reference"
                      value={refundRefInput}
                      onChange={(e) => setRefundRefInput(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setRefundModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Confirm Refund
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: SEND OR SHARE INVOICE */}
      {/* ==================================================================== */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-base text-slate-900">
                  Send or Share Invoice #{docNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Recipient Email
                  </label>
                  <Input defaultValue={clientEmail} placeholder="customer@company.com" />
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] space-y-1">
                  <div>
                    <strong>Invoice:</strong> {invoiceName} (#{docNumber})
                  </div>
                  <div>
                    <strong>Customer:</strong> {clientName}
                  </div>
                  <div>
                    <strong>Payable Amount:</strong>{' '}
                    {formatCurrency(calculated.summary.grandTotal, currency)}
                  </div>
                  <div>
                    <strong>Due Date:</strong> {dueDate || 'On Receipt'}
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `Invoice #${docNumber} (${invoiceName}) for ${formatCurrency(
                        calculated.summary.grandTotal,
                        currency
                      )} — Due ${dueDate}`
                    );
                    alert('Invoice summary copied to clipboard!');
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy Summary
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (status === 'draft') setStatus('pending');
                    setShareModalOpen(false);
                    alert(`Invoice #${docNumber} queued for dispatch to ${clientEmail || clientName}!`);
                  }}
                  className="bg-primary text-white font-semibold"
                >
                  Send Invoice Email
                </Button>
              </div>
            </div>
          </Card>
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
