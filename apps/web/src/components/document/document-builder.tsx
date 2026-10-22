'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  getCurrencyTaxProfile,
  APP_CONFIG,
  isTemplateAllowedForPlan,
  GeneratorFieldSettings,
  AdminTemplateSetting,
} from '@invoice/core';
import { getTemplate, getTemplatesByCategory, getInvoiceTemplate } from '@invoice/theme';
import { TenantApi, AdminApi, ProductCatalogItem } from '@invoice/api';
import { useTenant } from '@/lib/auth/tenant-context';
import { useTheme } from '@/lib/theme/theme-provider';
import { saveDocument } from '@/lib/storage/indexed-db';
import { exportDocumentToPdf, triggerPrint } from '@/lib/pdf/export-pdf';
import { DocumentPreview } from './document-preview';
import { InlineDocumentCanvas } from './inline-document-canvas';
import { DocumentTypeSelector } from './document-type-selector';
import { ShareInvoiceModal } from '@/components/modals/share-invoice-modal';
import { UpgradePlanModal } from '@/components/modals/upgrade-plan-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  MoreHorizontal,
  Menu,
  Sun,
  Moon,
  Save,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

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
  accountHolderName: 'Acme Design Agency Pvt Ltd',
  bankName: 'Demo Bank Ltd',
  accountNumber: '0000000000',
  confirmAccountNumber: '0000000000',
  ifscOrRoutingCode: 'DEMO0000000',
  branchName: 'Main Branch, Mumbai',
  accountType: 'current',
  swiftBicCode: 'DEMOBANK',
  country: 'India',
  isPrimary: true,
};

const DEFAULT_PAYMENT_CONFIG: DocumentPaymentConfig = {
  bankAccounts: [DEFAULT_BANK_ACCOUNT],
  selectedBankAccountIds: ['bank_default_01'],
  upiId: 'acmedesign@demobank',
  upiPayeeName: 'Acme Design Agency Pvt Ltd',
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
  const { activeTenant, brandSettings, tenantCurrency, user } = useTenant();
  const [generatorSettings, setGeneratorSettings] = useState<GeneratorFieldSettings>(() =>
    AdminApi.getGeneratorSettings()
  );
  const [showSplitAdvanced, setShowSplitAdvanced] = useState(false);

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setGeneratorSettings(AdminApi.getGeneratorSettings());
    };
    window.addEventListener('billcraft-generator-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('billcraft-generator-settings-updated', handleSettingsUpdate);
  }, []);

  const [adminTemplates, setAdminTemplates] = useState<AdminTemplateSetting[]>(() =>
    AdminApi.getTemplates()
  );

  useEffect(() => {
    const handleTplUpdate = () => {
      setAdminTemplates(AdminApi.getTemplates());
    };
    window.addEventListener('invoxa-templates-updated', handleTplUpdate);
    return () => window.removeEventListener('invoxa-templates-updated', handleTplUpdate);
  }, []);

  const disabledTemplateIds = useMemo(() => {
    return new Set(adminTemplates.filter((t) => t.enabled === false).map((t) => t.id));
  }, [adminTemplates]);

  const categorizedTemplates = useMemo(() => {
    const all = getTemplatesByCategory();
    return all
      .map((cat) => ({
        ...cat,
        templates: cat.templates.filter((t) => !disabledTemplateIds.has(t.id)),
      }))
      .filter((cat) => cat.templates.length > 0);
  }, [disabledTemplateIds]);

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
  const initialCurrency = initialDocument?.currency || brandSettings?.currency || tenantCurrency || 'INR';
  const initialTaxProfile = useMemo(() => getCurrencyTaxProfile(initialCurrency), [initialCurrency]);

  const [currency, setCurrency] = useState<string>(initialCurrency);

  // Rounding & Precision
  const [enableRoundOff, setEnableRoundOff] = useState<boolean>(
    initialDocument?.enableRoundOff ?? brandSettings?.enableRoundOff ?? initialTaxProfile.isIndiaGst
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
    initialDocument?.sender.address?.state ||
      brandSettings?.gstState ||
      (initialTaxProfile.isIndiaGst ? '27 - Maharashtra' : initialTaxProfile.defaultState)
  );
  const [senderPostalCode, setSenderPostalCode] = useState(
    initialDocument?.sender.address?.postalCode || brandSettings?.postalCode || ''
  );
  const [senderCountry, setSenderCountry] = useState(
    initialDocument?.sender.address?.country || brandSettings?.country || initialTaxProfile.defaultCountry
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
    initialDocument?.client.billingAddress?.state ||
      (initialTaxProfile.isIndiaGst ? '27 - Maharashtra' : initialTaxProfile.defaultState)
  );
  const [clientPostalCode, setClientPostalCode] = useState(
    initialDocument?.client.billingAddress?.postalCode || ''
  );
  const [clientCountry, setClientCountry] = useState(
    initialDocument?.client.billingAddress?.country || initialTaxProfile.defaultCountry
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
        taxRate: initialTaxProfile.defaultTaxRate,
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
    initialDocument?.templateId ||
      brandSettings?.defaultTemplateId ||
      (initialTaxProfile.isIndiaGst ? 'cleartax_gst' : initialTaxProfile.defaultTemplateId)
  );
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string | undefined>(
    initialDocument?.customTheme?.primaryColor || brandSettings?.primaryColor
  );
  const [customFontFamily, setCustomFontFamily] = useState<'sans' | 'serif' | 'mono' | undefined>(
    initialDocument?.customTheme?.fontFamily ||
      (brandSettings?.fontFamily as 'sans' | 'serif' | 'mono' | undefined)
  );

  // Payment Configuration (Bank Accounts, UPI, QR Code, Display Toggles)
  const [paymentConfig, setPaymentConfig] = useState<DocumentPaymentConfig>(() => {
    if (initialDocument?.paymentConfig) return initialDocument.paymentConfig;
    if (brandSettings?.paymentConfig) return brandSettings.paymentConfig;
    if (!initialTaxProfile.isIndiaGst) {
      return {
        bankAccounts: [
          {
            id: 'bank_default_intl',
            bankName: initialTaxProfile.defaultBankName,
            accountHolderName: brandSettings?.businessName || activeTenant?.name || 'Your Business Name',
            accountNumber: '12345678',
            confirmAccountNumber: '12345678',
            ifscOrRoutingCode: initialTaxProfile.routingLabel === 'Sort code' ? '20-00-00' : '021000021',
            branchName: initialTaxProfile.defaultBankBranch,
            accountType: 'current',
            swiftBicCode: 'INTLGB22',
            country: initialTaxProfile.defaultCountry,
            isPrimary: true,
          },
        ],
        selectedBankAccountIds: ['bank_default_intl'],
        upiId: '',
        upiPayeeName: '',
        autoGenerateUpiQr: false,
        display: {
          showBankDetails: true,
          showUpiId: false,
          showQrCode: false,
          showPaymentInstructions: true,
          showPaymentTerms: true,
        },
      };
    }
    return DEFAULT_PAYMENT_CONFIG;
  });

  const [notes, setNotes] = useState<string>(
    initialDocument?.notes || initialTaxProfile.defaultNotes
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialDocument?.paymentTerms || brandSettings?.defaultTerms || initialTaxProfile.defaultTerms
  );
  const [paymentInstructions, setPaymentInstructions] = useState<string>(
    initialDocument?.paymentInstructions ||
      brandSettings?.defaultInstructions ||
      (initialTaxProfile.isIndiaGst
        ? 'NEFT / RTGS / IMPS / UPI accepted. Please mention Invoice No. in payment remarks.'
        : 'Bank transfer accepted. Please quote Invoice No. in payment remarks.')
  );
  const [signatoryName, setSignatoryName] = useState<string>(
    initialDocument?.signatoryName || brandSettings?.signatoryName || 'Authorized Signatory'
  );

  // Terminology customization state (e.g. Tax Invoice vs Commercial Invoice, Client vs Customer)
  const [customTerminology, setCustomTerminology] = useState<Record<string, string>>(() => {
    if (initialDocument?.customTerminology) {
      return initialDocument.customTerminology;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('invoxa_custom_terminology');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return { ...APP_CONFIG.defaultTerminology };
  });

  const handleUpdateTerminology = (key: string, value: string) => {
    setCustomTerminology((prev) => {
      const updated = { ...prev, [key]: value };
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('invoxa_custom_terminology', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    const newProfile = getCurrencyTaxProfile(newCurrency);
    const prevProfile = getCurrencyTaxProfile(currency);

    // If switching between Indian GST (INR) and International (GBP, USD, EUR, etc.)
    if (prevProfile.isIndiaGst && !newProfile.isIndiaGst) {
      // Switching from INR to foreign currency:
      if (['cleartax_gst', 'tally_prime', 'vyapar_classic', 'in-gst'].includes(templateId)) {
        setTemplateId(newProfile.defaultTemplateId);
      }
      if (senderCountry.toLowerCase() === 'india' || !senderCountry) {
        setSenderCountry(newProfile.defaultCountry);
        setSenderState(newProfile.defaultState);
      }
      if (clientCountry.toLowerCase() === 'india' || !clientCountry) {
        setClientCountry(newProfile.defaultCountry);
        setClientState(newProfile.defaultState);
      }
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          taxRate: it.taxRate === 18 ? newProfile.defaultTaxRate : it.taxRate,
          hsnCode: '',
        }))
      );
      setPaymentConfig((prev) => ({
        ...prev,
        display: {
          ...prev.display,
          showUpiId: false,
          showQrCode: false,
        },
        autoGenerateUpiQr: false,
        bankAccounts: prev.bankAccounts.map((b) =>
          b.country === 'India' || b.ifscOrRoutingCode === 'DEM00000000'
            ? {
                ...b,
                bankName: newProfile.defaultBankName,
                branchName: newProfile.defaultBankBranch,
                ifscOrRoutingCode: newProfile.routingLabel === 'Sort code' ? '20-00-00' : '021000021',
                country: newProfile.defaultCountry,
              }
            : b
        ),
      }));
      if (notes.includes('Mumbai jurisdiction') || notes.includes('15 days')) {
        setNotes(newProfile.defaultNotes);
      }
      if (paymentInstructions.includes('UPI accepted') || paymentInstructions.includes('NEFT / RTGS')) {
        setPaymentInstructions('Bank transfer accepted. Please quote Invoice No. in payment remarks.');
      }
    } else if (!prevProfile.isIndiaGst && newProfile.isIndiaGst) {
      // Switching from foreign currency to INR:
      setTemplateId('cleartax_gst');
      if (['United Kingdom', 'United States', 'Germany', 'Australia', 'Canada'].includes(senderCountry)) {
        setSenderCountry('India');
        setSenderState('27 - Maharashtra');
      }
      if (['United Kingdom', 'United States', 'Germany', 'Australia', 'Canada'].includes(clientCountry)) {
        setClientCountry('India');
        setClientState('27 - Maharashtra');
      }
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          taxRate: it.taxRate === 20 || it.taxRate === 0 ? 18 : it.taxRate,
        }))
      );
      setPaymentConfig((prev) => ({
        ...prev,
        display: {
          ...prev.display,
          showUpiId: true,
          showQrCode: true,
        },
        autoGenerateUpiQr: true,
      }));
      setNotes('1. Payment is due within 15 days of invoice date.\n2. Goods/services once billed are subject to Mumbai jurisdiction.');
      setPaymentInstructions('NEFT / RTGS / IMPS / UPI accepted. Please mention Invoice No. in payment remarks.');
    } else if (!prevProfile.isIndiaGst && !newProfile.isIndiaGst) {
      // Switching between foreign currencies (e.g. USD <-> GBP)
      setTemplateId(newProfile.defaultTemplateId);
      if (senderCountry === prevProfile.defaultCountry) {
        setSenderCountry(newProfile.defaultCountry);
        setSenderState(newProfile.defaultState);
      }
      if (clientCountry === prevProfile.defaultCountry) {
        setClientCountry(newProfile.defaultCountry);
        setClientState(newProfile.defaultState);
      }
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          taxRate: it.taxRate === prevProfile.defaultTaxRate ? newProfile.defaultTaxRate : it.taxRate,
        }))
      );
    }
  };

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
      const targetCurr = brandSettings.currency || activeTenant.currency || 'INR';
      const prof = getCurrencyTaxProfile(targetCurr);
      setCurrency(targetCurr);
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
      setSenderState(
        brandSettings.gstState ||
          activeTenant.gstState ||
          (prof.isIndiaGst ? '27 - Maharashtra' : prof.defaultState)
      );
      if (brandSettings.postalCode) setSenderPostalCode(brandSettings.postalCode);
      setSenderCountry(
        brandSettings.country || activeTenant.country || prof.defaultCountry
      );
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
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [viewMode, setViewMode] = useState<'sheet' | 'split' | 'pdf_preview'>('sheet');
  const [isPersisted, setIsPersisted] = useState<boolean>(Boolean(initialDocument));
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>(
    Boolean(initialDocument) ? 'saved' : 'unsaved'
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Modals for Payment Settings, Record Payment, Issue Refund, Payment History, Share
  const [paymentSettingsModalOpen, setPaymentSettingsModalOpen] = useState(false);
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('');

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
  const activeTemplatePreset = useMemo(() => getInvoiceTemplate(templateId), [templateId]);
  const [splitLeftMode, setSplitLeftMode] = useState<'form' | 'canvas'>('form');
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
        primaryColor: effectivePrimaryColor,
        fontFamily: (effectiveFontFamily as 'sans' | 'serif' | 'mono') || 'sans',
      },
      customTerminology,
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
    customTerminology,
    paymentConfig,
    notes,
    paymentTerms,
    paymentInstructions,
    signatoryName,
    payments,
    refunds,
  ]);

  // Track edits in memory - DO NOT auto-save empty drafts to database
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setSaveStatus('unsaved');
  }, [documentModel]);

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
    else if (field === 'currency') handleCurrencyChange(value);
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
      toast({
        title: 'Draft Saved',
        description: `Invoice #${documentModel.documentNumber} saved as draft.`,
      });
    } catch (err: any) {
      console.error('Failed to save draft:', err);
      setSaveStatus('unsaved');
      if (err?.name === 'PlanLimitReachedError' || err?.message?.includes('Plan Limit') || err?.message?.includes('upgrade')) {
        setUpgradeReason(err.message || 'Free trial limit reached. Upgrade to Pro for unlimited invoices.');
        setUpgradeModalOpen(true);
      } else {
        toast({
          title: 'Error Saving Draft',
          description: err?.message || 'Failed to save draft.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSaveInvoice = async () => {
    try {
      setSaveStatus('saving');
      const nextStatus: DocumentStatus = status === 'draft' ? 'pending' : status;
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
      toast({
        title: 'Invoice Saved',
        description: `Invoice #${updated.documentNumber} saved successfully.`,
      });
    } catch (err: any) {
      console.error('Failed to save invoice:', err);
      setSaveStatus('unsaved');
      if (err?.name === 'PlanLimitReachedError' || err?.message?.includes('Plan Limit') || err?.message?.includes('upgrade')) {
        setUpgradeReason(err.message || 'Free trial limit reached. Upgrade to Pro for unlimited invoices.');
        setUpgradeModalOpen(true);
      } else {
        toast({
          title: 'Error Saving Invoice',
          description: err?.message || 'Failed to save invoice.',
          variant: 'destructive',
        });
      }
    }
  };

  // Backwards compatibility alias
  const handleFinalize = handleSaveInvoice;

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
        handleSaveInvoice();
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col text-foreground">
      {/* Top Notice Banner */}
      {!bannerDismissed && (
        <div className="bg-primary/10 border-b border-primary/20 text-primary px-4 py-1.5 text-xs flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>
              <strong>GST & Multi-Currency Studio:</strong> Intra/Inter-state GST, auto Round-Off & verified UPI QR codes.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="font-bold underline hover:opacity-80 flex items-center gap-1"
            >
              Workspace <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              onClick={() => setBannerDismissed(true)}
              className="opacity-70 hover:opacity-100 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DESKTOP HEADER (Single Row, ~68px high) */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-6 h-[68px] hidden md:flex items-center justify-between gap-3 no-print shadow-xs">
        {/* Left: back button, BillCraft logo, invoice name input, ONE doc-type selector, Draft badge, auto-save status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/dashboard/documents"
            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            title="Back to Invoices"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <Link href="/" className="font-black text-lg text-primary tracking-tight flex items-center gap-1.5 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>{APP_CONFIG.brandName}</span>
          </Link>

          {/* Invoice Name Input */}
          <div className="flex items-center">
            <Input
              value={invoiceName}
              onChange={(e) => setInvoiceName(e.target.value)}
              placeholder="Invoice Name (e.g. Oct Retainer)"
              aria-label="Invoice Name"
              className="h-8 text-xs font-bold w-36 lg:w-48 bg-background border-border"
            />
          </div>

          {/* ONE document-type selector */}
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
            customLabels={customTerminology}
            onUpdateTerminology={handleUpdateTerminology}
          />

          {/* Status Badge */}
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
            className="shrink-0"
          >
            {formatInvoiceStatusLabel(effectiveStatus)}
          </Badge>

          {/* Save Status */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium shrink-0">
            {saveStatus === 'saving' ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="hidden xl:inline">Saving...</span>
              </>
            ) : saveStatus === 'unsaved' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden xl:inline text-amber-600 dark:text-amber-400 font-semibold">Unsaved</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden xl:inline">Saved</span>
              </>
            )}
          </div>
        </div>

        {/* Center: segmented toggle: Editor | Split | Preview */}
        <div className="flex items-center bg-muted/70 p-1 rounded-xl border border-border shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('sheet')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'sheet'
                ? 'bg-background text-foreground shadow-xs font-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'split'
                ? 'bg-background text-foreground shadow-xs font-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Split</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('pdf_preview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              viewMode === 'pdf_preview'
                ? 'bg-background text-foreground shadow-xs font-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview</span>
          </button>
        </div>

        {/* Right: Customize button (opens popover), Download PDF, Finalize Invoice (primary), More dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Customize popover */}
          <Popover open={customizeOpen} onOpenChange={setCustomizeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-bold flex items-center gap-1.5 border-border bg-background hover:bg-accent text-foreground"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                <span>Customize</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 sm:w-96 p-4 bg-popover border-border shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto z-50"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2 font-black text-sm text-foreground">
                  <Palette className="h-4 w-4 text-primary" />
                  <span>Customize Document</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomizeOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Template */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Template</span>
                  <span className="text-[10px] text-primary">{activeTemplatePreset?.region || activeTemplateMeta?.name}</span>
                </label>
                <select
                  value={templateId}
                  onChange={(e) => {
                    const selected = e.target.value;
                    const allowed = isTemplateAllowedForPlan(activeTenant?.plan || 'starter', selected);
                    if (!allowed) {
                      setUpgradeReason(`The "${selected}" template is an exclusive Pro/Enterprise design. Upgrade to unlock all premium templates.`);
                      setUpgradeModalOpen(true);
                      return;
                    }
                    setTemplateId(selected);
                    setCustomPrimaryColor(undefined);
                  }}
                  className="w-full text-xs font-bold bg-muted/60 border border-border rounded-lg px-2.5 py-2 text-foreground cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  {categorizedTemplates.map((group) => (
                    <optgroup key={group.category} label={group.label} className="bg-popover text-foreground">
                      {group.templates.map((tmpl) => {
                        const isAllowed = isTemplateAllowedForPlan(activeTenant?.plan || 'starter', tmpl.id);
                        return (
                          <option key={tmpl.id} value={tmpl.id}>
                            {tmpl.name} ({tmpl.competitorStyle}){isAllowed ? '' : ' 🔒 [PRO]'}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Theme Color Swatches + Custom Picker */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Theme Color
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {THEME_COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => setCustomPrimaryColor(swatch.hex)}
                      title={swatch.name}
                      className={`w-6 h-6 rounded-full border transition-transform ${
                        effectivePrimaryColor.toLowerCase() === swatch.hex.toLowerCase()
                          ? 'scale-120 ring-2 ring-offset-2 ring-primary border-white'
                          : 'border-border/60 hover:scale-110'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    />
                  ))}
                  <div className="flex items-center gap-1.5 pl-1.5 border-l border-border">
                    <input
                      type="color"
                      value={effectivePrimaryColor}
                      onChange={(e) => setCustomPrimaryColor(e.target.value)}
                      title="Custom Hex Color"
                      className="w-7 h-7 rounded-lg cursor-pointer border border-border p-0.5 bg-background"
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">{effectivePrimaryColor}</span>
                  </div>
                </div>
              </div>

              {/* Font & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Font
                  </label>
                  <select
                    value={effectiveFontFamily}
                    onChange={(e) => setCustomFontFamily(e.target.value as 'sans' | 'serif' | 'mono')}
                    className="w-full text-xs font-semibold bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 text-foreground"
                  >
                    <option value="sans">Modern Sans</option>
                    <option value="serif">Executive Serif</option>
                    <option value="mono">Technical Mono</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="w-full text-xs font-bold bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 text-foreground cursor-pointer"
                  >
                    {Object.values(CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Round-off & Decimals */}
              <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableRoundOff}
                      onChange={(e) => setEnableRoundOff(e.target.checked)}
                      className="rounded border-border text-primary h-4 w-4"
                    />
                    <span>Round-Off</span>
                  </label>
                  <select
                    value={decimalPrecision}
                    onChange={(e) => setDecimalPrecision(Number(e.target.value))}
                    className="text-xs font-mono font-bold bg-background border border-border rounded-md px-2 py-1 text-foreground"
                    title="Decimal Precision"
                  >
                    <option value={2}>2 Decimals</option>
                    <option value={0}>0 Decimals</option>
                    <option value={3}>3 Decimals</option>
                  </select>
                </div>

                {enableRoundOff && (
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Mode:</span>
                    <select
                      value={roundingMode}
                      onChange={(e) => setRoundingMode(e.target.value as RoundingMode)}
                      className="text-xs font-semibold bg-background border border-border rounded-md px-2 py-1 text-foreground"
                    >
                      <option value="nearest_integer">Nearest Whole</option>
                      <option value="half_up">Half Up</option>
                      <option value="half_even">Half Even (Banker)</option>
                      <option value="up">Round Up</option>
                      <option value="down">Round Down</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Appearance (Light / Dark / System) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Appearance
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl border border-border text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                      theme === 'light'
                        ? 'bg-background text-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                      theme === 'dark'
                        ? 'bg-background text-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                      theme === 'system'
                        ? 'bg-background text-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>System</span>
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Download PDF */}
          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 font-bold text-xs shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExportingPdf ? 'Exporting...' : 'Download PDF'}</span>
          </Button>

          {/* Save Invoice (primary CTA button) */}
          <Button
            size="sm"
            onClick={handleSaveInvoice}
            disabled={saveStatus === 'saving'}
            className="h-9 bg-primary hover:bg-primary-hover text-primary-foreground flex items-center gap-1.5 text-xs shadow-md font-bold px-4"
            title="Save invoice"
          >
            {saveStatus === 'saving' ? (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>
              {isPersisted ? 'Save Changes' : 'Save Invoice'}
            </span>
          </Button>

          {/* More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 border-border bg-background hover:bg-accent text-foreground flex items-center justify-center"
                title="More Options"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More Options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border p-1.5 shadow-xl z-50">
              <DropdownMenuItem
                onClick={handleSaveDraft}
                className="text-xs flex items-center gap-2.5 py-2 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Save as Draft</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setShareModalOpen(true)}
                className="text-xs flex items-center gap-2.5 py-2 cursor-pointer"
              >
                <Share2 className="h-4 w-4 text-primary" />
                <span>Send / Share</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={triggerPrint}
                className="text-xs flex items-center gap-2.5 py-2 cursor-pointer"
              >
                <Printer className="h-4 w-4 text-muted-foreground" />
                <span>Print Invoice</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setHistoryModalOpen(true)}
                className="text-xs flex items-center gap-2.5 py-2 cursor-pointer"
              >
                <History className="h-4 w-4 text-muted-foreground" />
                <span>History ({payments.length + refunds.length})</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-border" />

              <DropdownMenuItem
                onClick={() => {
                  setPayAmountInput(
                    calculated.summary.balanceDue > 0
                      ? calculated.summary.balanceDue
                      : calculated.summary.grandTotal
                  );
                  setRecordPaymentModalOpen(true);
                }}
                className="text-xs flex items-center gap-2.5 py-2 cursor-pointer text-emerald-600 dark:text-emerald-400 font-semibold"
              >
                <CreditCard className="h-4 w-4" />
                <span>Record Payment</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setPaymentSettingsModalOpen(true)}
                className="text-xs flex items-center gap-2.5 py-2 cursor-pointer"
              >
                <QrCode className="h-4 w-4 text-primary" />
                <span>Payment Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MOBILE TOP BAR (below 768px) */}
      {/* ==================================================================== */}
      <div className="md:hidden sticky top-0 z-40 bg-card border-b border-border px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-xs no-print">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/dashboard/documents"
            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Back to Invoices"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <Input
                value={invoiceName}
                onChange={(e) => setInvoiceName(e.target.value)}
                placeholder="Invoice Name"
                className="h-7 text-xs font-bold w-32 border-border bg-background p-1"
              />
              <Badge
                variant={
                  effectiveStatus === 'paid'
                    ? 'success'
                    : effectiveStatus === 'overdue'
                    ? 'destructive'
                    : 'info'
                }
                className="text-[10px] px-1.5 py-0"
              >
                {formatInvoiceStatusLabel(effectiveStatus)}
              </Badge>
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              {saveStatus === 'saving' ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full border border-primary border-t-transparent animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveStatus === 'unsaved' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">Unsaved</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Saved</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
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
            align="right"
            customLabels={customTerminology}
            onUpdateTerminology={handleUpdateTerminology}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="min-h-[44px] min-w-[44px] p-0 flex items-center justify-center border-border"
            title="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Toggle: Editor | Preview */}
      <div className="md:hidden px-3 py-2 bg-card border-b border-border no-print">
        <div className="grid grid-cols-2 bg-muted p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => {
              setMobileTab('editor');
              if (viewMode === 'pdf_preview') setViewMode('sheet');
            }}
            className={`min-h-[44px] py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              mobileTab === 'editor'
                ? 'bg-background text-foreground shadow-xs font-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit3 className="h-4 w-4" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab('preview');
              setViewMode('pdf_preview');
            }}
            className={`min-h-[44px] py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              mobileTab === 'preview'
                ? 'bg-background text-foreground shadow-xs font-black'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Mobile Hamburger Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end no-print animate-in fade-in-0 duration-150">
          <div className="w-4/5 max-w-sm h-full bg-card border-l border-border p-5 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-black text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Invoice Options
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setCustomizeOpen(true);
                  }}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-xs font-bold flex items-center gap-3 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <span>Customize Template & Theme</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShareModalOpen(true);
                  }}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-xs font-bold flex items-center gap-3 transition-colors"
                >
                  <Share2 className="h-4 w-4 text-primary" />
                  <span>Send / Share Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    triggerPrint();
                  }}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-xs font-bold flex items-center gap-3 transition-colors"
                >
                  <Printer className="h-4 w-4 text-muted-foreground" />
                  <span>Print Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setHistoryModalOpen(true);
                  }}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-xs font-bold flex items-center gap-3 transition-colors"
                >
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span>Payment History ({payments.length + refunds.length})</span>
                </button>

                <div className="pt-2 border-t border-border" />

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setPayAmountInput(
                      calculated.summary.balanceDue > 0
                        ? calculated.summary.balanceDue
                        : calculated.summary.grandTotal
                    );
                    setRecordPaymentModalOpen(true);
                  }}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-3 transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Record Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setPaymentSettingsModalOpen(true);
                  }}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-accent text-foreground text-xs font-bold flex items-center gap-3 transition-colors"
                >
                  <QrCode className="h-4 w-4 text-primary" />
                  <span>Payment Settings (Bank & UPI)</span>
                </button>
              </div>

              {/* Dark mode switcher in mobile drawer */}
              <div className="pt-4 border-t border-border">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Theme Appearance
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl border border-border text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`min-h-[40px] rounded-lg flex items-center justify-center gap-1 transition-all ${
                      theme === 'light'
                        ? 'bg-background text-foreground shadow-xs font-bold'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`min-h-[40px] rounded-lg flex items-center justify-center gap-1 transition-all ${
                      theme === 'dark'
                        ? 'bg-background text-foreground shadow-xs font-bold'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`min-h-[40px] rounded-lg flex items-center justify-center gap-1 transition-all ${
                      theme === 'system'
                        ? 'bg-background text-foreground shadow-xs font-bold'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Auto</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border text-center text-[10px] text-muted-foreground">
              {APP_CONFIG.brandName} Invoice Studio
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar on Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-card/95 backdrop-blur-md border-t border-border flex items-center gap-2.5 shadow-2xl no-print">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownloadPdf}
          disabled={isExportingPdf}
          className="flex-1 min-h-[44px] text-xs font-bold border-border bg-background hover:bg-accent text-foreground flex items-center justify-center gap-1.5"
        >
          <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{isExportingPdf ? 'Exporting...' : 'Download PDF'}</span>
        </Button>
        <Button
          size="sm"
          onClick={handleSaveInvoice}
          disabled={saveStatus === 'saving'}
          className="flex-1 min-h-[44px] text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center gap-1.5 shadow-md"
        >
          {saveStatus === 'saving' ? (
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{isPersisted ? 'Save Changes' : 'Save Invoice'}</span>
        </Button>
      </div>

      {/* ==================================================================== */}
      {/* VIEW MODE 1: INLINE SHEET EDITOR (Default) */}
      {/* ==================================================================== */}
      {viewMode === 'sheet' && (
        <div className="flex-1 bg-slate-200/50 dark:bg-slate-900/60 p-4 md:p-8 flex justify-center items-start overflow-y-auto no-print pb-28 md:pb-8">
          <div className="w-full max-w-4xl">
            <InlineDocumentCanvas
              document={documentModel}
              savedCustomers={savedCustomers}
              savedItems={savedItems}
              selectedCustomerId={selectedCustomerId}
              isAnonymous={!user}
              fieldSettings={generatorSettings}
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
        <div className="flex-1 bg-slate-300/50 dark:bg-slate-900 p-4 md:p-8 flex flex-col items-center overflow-y-auto no-print pb-28 md:pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-3 bg-card px-4 py-2 rounded-full shadow-sm border border-border text-xs text-card-foreground">
            <span className="font-semibold text-foreground">
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
            <Button variant="outline" size="sm" onClick={triggerPrint} className="h-7 text-xs border-border bg-background hover:bg-accent">
              <Printer className="h-3.5 w-3.5 mr-1" /> Print Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentSettingsModalOpen(true)}
              className="h-7 text-xs border-border bg-background hover:bg-accent"
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
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden no-print pb-28 md:pb-0">
          {/* LEFT COLUMN: Structured Editing Form */}
          <div
            className={`w-full lg:w-1/2 p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-110px)] ${
              mobileTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Split Mode Selector (Form vs Inline Canvas) */}
            <div className="max-w-2xl mx-auto mb-4 pb-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setSplitLeftMode('form')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    splitLeftMode === 'form'
                      ? 'bg-background text-foreground shadow-xs font-black'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📝 Structured Form
                </button>
                <button
                  type="button"
                  onClick={() => setSplitLeftMode('canvas')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    splitLeftMode === 'canvas'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  📄 Inline Canvas Editor
                </button>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                Template: <strong className="text-slate-800 dark:text-slate-200">{activeTemplatePreset.name}</strong>
              </span>
            </div>

            {splitLeftMode === 'canvas' ? (
              <div className="w-full">
                <InlineDocumentCanvas
                  document={documentModel}
                  savedCustomers={savedCustomers}
                  savedItems={savedItems}
                  selectedCustomerId={selectedCustomerId}
                  isAnonymous={!user}
                  fieldSettings={generatorSettings}
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
            ) : (
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
                    <div className="p-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/70 flex items-center justify-between gap-2">
                       {senderLogo ? (
                         <div className="flex items-center gap-2">
                           <img
                             src={senderLogo}
                             alt="Logo"
                             className="h-9 max-w-[100px] object-contain bg-white dark:bg-slate-900 p-1 rounded border border-border"
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
                       <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
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
                         className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-2.5 text-xs font-semibold"
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
                      <span>
                        Bill To ({customTerminology.clientLabel || 'Customer'}
                        {currency === 'INR' || (senderCountry || '').toLowerCase() === 'india' ? ' & Place of Supply' : ''})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {user && savedCustomers.length > 0 && (
                      <div>
                        <label className="text-[11px] font-bold text-primary flex items-center gap-1 mb-1">
                          <Users className="h-3.5 w-3.5" /> Select Saved {customTerminology.clientLabel?.split('/')[0]?.trim() || 'Customer'}
                        </label>
                        <select
                          aria-label="Select Saved Customer"
                          value={selectedCustomerId}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSelectCustomer(e.target.value);
                            }
                          }}
                          className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <option value="" className="bg-popover text-foreground">
                            Choose from {savedCustomers.length} saved customer(s)...
                          </option>
                          {savedCustomers.map((cust) => (
                            <option key={cust.id} value={cust.id} className="bg-popover text-foreground">
                              {cust.name}
                              {cust.taxId ? ` (${cust.taxId})` : cust.billingAddress?.city ? ` — ${cust.billingAddress.city}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <Input
                      placeholder="Customer / Company Name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                    <Input
                      placeholder={
                        currency === 'INR' || (senderCountry || '').toLowerCase() === 'india'
                          ? 'Customer GSTIN (e.g. 27AAACR5055K1Z7)'
                          : 'Customer Tax ID / VAT Number'
                      }
                      value={clientTaxId}
                      onChange={(e) => setClientTaxId(e.target.value.toUpperCase())}
                    />
                    {(currency === 'INR' || (senderCountry || '').toLowerCase() === 'india') && (
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                          Place of Supply (Customer State)
                        </label>
                        <select
                          value={clientState}
                          onChange={(e) => setClientState(e.target.value)}
                          className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-2.5 text-xs font-semibold"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st.code} value={st.label}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
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
                    Invoice Items {currency === 'INR' || (senderCountry || '').toLowerCase() === 'india' ? '(HSN/SAC & GST)' : ''}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {user && savedItems.length > 0 && (
                      <select
                        aria-label="Quick Add Saved Item"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddCatalogItem(e.target.value);
                          }
                        }}
                        className="h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <option value="" className="bg-popover text-foreground">+ Add from Saved Items ({savedItems.length})...</option>
                        {savedItems.map((prod) => (
                          <option key={prod.id} value={prod.id} className="bg-popover text-foreground">
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
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Item #{index + 1}
                          </span>
                          {user && savedItems.length > 0 && (
                            <select
                              aria-label={`Select Saved Item for Item ${index + 1}`}
                              value={item.productId || ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleSelectCatalogItem(index, e.target.value);
                                }
                              }}
                              className="h-7 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                            >
                              <option value="">
                                📦 Select Saved Item ({savedItems.length})...
                              </option>
                              {savedItems.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} — {formatCurrency(prod.unitPrice, currency)}
                                </option>
                              ))}
                            </select>
                          )}
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
                        <div className={showSplitAdvanced || generatorSettings.showHsnColumn ? 'md:col-span-3' : 'md:col-span-4'}>
                          <label className="text-[10px] font-semibold text-slate-500 block">
                            Description
                          </label>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateItem(index, 'description', e.target.value)
                            }
                            placeholder="What you sold or did / service description"
                          />
                        </div>
                        {(showSplitAdvanced || generatorSettings.showHsnColumn) && (
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
                        )}
                      </div>

                      <div className={`grid grid-cols-2 ${(showSplitAdvanced || generatorSettings.showDiscountColumn || generatorSettings.showTaxRateColumn) ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-2`}>
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
                        {(showSplitAdvanced || generatorSettings.showDiscountColumn) && (
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
                        )}
                        {(showSplitAdvanced || generatorSettings.showTaxRateColumn) && (
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block">
                              {currency === 'INR' || (senderCountry || '').toLowerCase() === 'india' ? 'GST Rate (%)' : 'Tax Rate (%)'}
                            </label>
                            <select
                              value={item.taxRate}
                              onChange={(e) =>
                                handleUpdateItem(index, 'taxRate', Number(e.target.value))
                              }
                              className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-2 text-xs font-semibold"
                            >
                              <option value={0} className="bg-popover text-foreground">0% (Exempt)</option>
                              <option value={5} className="bg-popover text-foreground">5%</option>
                              <option value={12} className="bg-popover text-foreground">12%</option>
                              <option value={18} className="bg-popover text-foreground">18%</option>
                              <option value={28} className="bg-popover text-foreground">28%</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowSplitAdvanced(!showSplitAdvanced)}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      {showSplitAdvanced ? '— Simplified Form (Hide HSN & Tax)' : '+ Add HSN, Tax Rate & Discount to Form'}
                    </button>
                  </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
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
                      <div className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs font-mono">
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
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Payment Instructions
                    </label>
                    <Textarea
                      rows={2}
                      value={paymentInstructions}
                      onChange={(e) => setPaymentInstructions(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
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
            )}
          </div>

          {/* RIGHT COLUMN: Live Realtime Invoice Preview */}
          <div
            className={`w-full lg:w-1/2 bg-slate-200/70 dark:bg-slate-900/60 p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-110px)] flex justify-center items-start ${
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
          <Card className="w-full max-w-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  1. Invoice Display Controls (Independent Toggles)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
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
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
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
                          className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-2.5 text-xs font-medium"
                        >
                          <option value="current">Current Account</option>
                          <option value="savings">Savings Account</option>
                          <option value="checking">Checking Account</option>
                          <option value="business">Business Corporate</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
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
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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

                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center min-h-[140px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      QR Code Preview
                    </span>
                    {liveQrPreviewUrl ? (
                      <>
                        <img
                          src={liveQrPreviewUrl}
                          alt="Verified QR Preview"
                          className="h-24 w-24 object-contain bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800"
                        />
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1.5">
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

              <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
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
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Record Payment — #{docNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setRecordPaymentModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Invoice Total:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(calculated.summary.grandTotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Collected So Far:</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    {formatCurrency(calculated.summary.amountPaid, currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1 font-bold text-slate-900 dark:text-slate-100">
                  <span>Outstanding Balance:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    {formatCurrency(calculated.summary.balanceDue, currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
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
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Payment Method
                    </label>
                    <select
                      value={payMethodInput}
                      onChange={(e) => setPayMethodInput(e.target.value as PaymentMethod)}
                      className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-2 text-xs font-medium"
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
          <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Payment & Refund History — #{docNumber}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Original Invoice Total, Collected Payments, Refunds, and Remaining Balance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Invoice Total</div>
                  <div className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm mt-0.5">
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
                        className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-2 text-xs"
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
      {/* MODAL 4: SEND OR SHARE INVOICE (Complete Multi-Channel & Tokenized Link) */}
      {/* ==================================================================== */}
      <ShareInvoiceModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        document={documentModel}
        onDownloadPdf={handleDownloadPdf}
        onPrint={triggerPrint}
      />

      {/* ==================================================================== */}
      {/* UPGRADE PLAN MODAL (For Plan Limits & Premium Templates) */}
      {/* ==================================================================== */}
      <UpgradePlanModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        reason={upgradeReason}
      />

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
