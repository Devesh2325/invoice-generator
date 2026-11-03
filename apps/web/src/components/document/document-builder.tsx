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
  getCurrencyConfig,
  DEFAULT_NUMBERING_RULES,
  formatDocumentNumber,
  getNextSequenceNumber,
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
  resolveTemplateId,
  detectCurrency,
  getTemplateCurrency,
  templateForCurrency,
} from '@invoice/core';
import { TEMPLATES, TEMPLATE_DOCUMENT_TYPES, getTemplate, getTemplatesByCategory, getInvoiceTemplate } from '@invoice/theme';
import { TenantApi, AdminApi, ProductCatalogItem } from '@invoice/api';
import { useTenant } from '@/lib/auth/tenant-context';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { getAllDocuments, saveDocument } from '@/lib/storage/indexed-db';
import { exportDocumentToPdf, triggerPrint } from '@/lib/pdf/export-pdf';
import { exportDocumentToCsv, exportDocumentToExcel, exportDocumentToPng } from '@/lib/export/export-document';
import { DocumentPreview } from './document-preview';
import { InlineDocumentCanvas } from './inline-document-canvas';
import { InvoiceOptionsBar } from './invoice-options-bar';
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
  Check,
  ChevronDown,
  FileSpreadsheet,
  FileImage,
  Table,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface DocumentBuilderProps {
  initialDocument?: DocumentModel;
  onSaved?: (doc: DocumentModel) => void;
  /** Running inside another site's iframe: no workspace data, no local saving, Save goes to `onSaved`. */
  embed?: boolean;
  onDocumentChange?: (doc: DocumentModel) => void;
}

type DownloadFormat = 'pdf' | 'excel' | 'csv' | 'png';

// A host site must never see the workspace of someone who is also signed in here.
const EMBED_TENANT: Pick<ReturnType<typeof useTenant>, 'activeTenant' | 'brandSettings' | 'tenantCurrency' | 'user'> = {
  activeTenant: null,
  brandSettings: null,
  tenantCurrency: 'INR',
  user: null,
};

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

const LAST_SENDER_KEY = 'invoxa_last_sender';
const isIndianState = (state: string) => /^\d{2} - /.test(state);

const DEFAULT_PAYMENT_CONFIG: DocumentPaymentConfig = {
  bankAccounts: [],
  selectedBankAccountIds: [],
  upiId: '',
  upiPayeeName: '',
  autoGenerateUpiQr: true,
  display: {
    showBankDetails: true,
    showUpiId: true,
    showQrCode: true,
    showPaymentInstructions: true,
    showPaymentTerms: true,
  },
};

/** Sample accounts follow the currency. An account the user entered is never rewritten. */
function localizeSampleBanks(
  accounts: BankAccountDetails[],
  profile: ReturnType<typeof getCurrencyTaxProfile>
): BankAccountDetails[] {
  return accounts.map((bank) =>
    bank.id.startsWith('bank_demo') || /^DEMO?0+$/.test(bank.ifscOrRoutingCode)
      ? {
          ...bank,
          bankName: profile.defaultBankName,
          branchName: profile.defaultBankBranch,
          ifscOrRoutingCode: profile.routingLabel.includes('IBAN')
            ? 'KW81NBOK00000000000000'
            : profile.routingLabel === 'Sort code'
            ? '20-00-00'
            : '021000021',
          country: profile.defaultCountry,
        }
      : bank
  );
}

/**
 * A saved invoice stores "hidden" for anything that had nothing to show when it was saved.
 * Undo that on load, so a bank account or UPI ID added later appears on the invoice.
 */
function restoreEmptyPaymentDisplay(config: DocumentPaymentConfig, isIndia: boolean): DocumentPaymentConfig {
  const { display } = config;
  return {
    ...config,
    display: {
      ...display,
      showBankDetails: display.showBankDetails || config.bankAccounts.length === 0,
      showUpiId: display.showUpiId || (isIndia && !config.upiId),
      showQrCode: display.showQrCode || (isIndia && !config.qrCodeDataUrl),
    },
  };
}

export const DocumentBuilder: React.FC<DocumentBuilderProps> = ({
  initialDocument,
  onSaved,
  embed = false,
  onDocumentChange,
}) => {
  const tenantContext = useTenant();
  const { activeTenant, brandSettings, tenantCurrency, user } = embed ? EMBED_TENANT : tenantContext;
  const tenantLoading = !embed && tenantContext.isLoading;
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

  // Read after mount: the server can't see localStorage, and the first render must match its HTML.
  const [disabledTemplateIds, setDisabledTemplateIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const handleTplUpdate = () => setDisabledTemplateIds(new Set(AdminApi.getDisabledTemplateIds()));
    handleTplUpdate();
    window.addEventListener('invoxa-templates-updated', handleTplUpdate);
    return () => window.removeEventListener('invoxa-templates-updated', handleTplUpdate);
  }, []);

  const categorizedTemplates = useMemo(() => {
    const all = getTemplatesByCategory();
    return all
      .map((cat) => ({
        ...cat,
        // An embed has no workspace to upgrade, so it only offers free templates.
        templates: cat.templates.filter(
          (t) => !disabledTemplateIds.has(t.id) && (!embed || isTemplateAllowedForPlan('starter', t.id))
        ),
      }))
      .filter((cat) => cat.templates.length > 0);
  }, [disabledTemplateIds, embed]);

  // Core Invoice Metadata
  const [docId] = useState<string>(initialDocument?.id || `doc_${Date.now()}`);
  const [invoiceName, setInvoiceName] = useState<string>(
    initialDocument?.invoiceName || ''
  );
  const [docType, setDocType] = useState<DocumentType>(initialDocument?.type || 'invoice');
  const [status, setStatus] = useState<DocumentStatus>(initialDocument?.status || 'draft');
  const [docNumber, setDocNumber] = useState<string>(
    initialDocument?.documentNumber ||
      formatDocumentNumber(DEFAULT_NUMBERING_RULES[initialDocument?.type || 'invoice'], 1, new Date())
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
    initialDocument?.decimalPrecision ??
      brandSettings?.decimalPrecision ??
      getCurrencyConfig(initialCurrency).decimalPlaces
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
        unit: 'PCS',
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
    resolveTemplateId(
      initialDocument?.templateId || brandSettings?.defaultTemplateId || initialTaxProfile.defaultTemplateId
    )
  );
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string | undefined>(
    initialDocument?.customTheme?.primaryColor || brandSettings?.primaryColor
  );
  const [customFontFamily, setCustomFontFamily] = useState<'sans' | 'serif' | 'mono' | undefined>(
    initialDocument?.customTheme?.fontFamily
  );

  // Payment Configuration (Bank Accounts, UPI, QR Code, Display Toggles)
  const [paymentConfig, setPaymentConfig] = useState<DocumentPaymentConfig>(() => {
    if (initialDocument?.paymentConfig) {
      return restoreEmptyPaymentDisplay(initialDocument.paymentConfig, initialTaxProfile.isIndiaGst);
    }
    if (brandSettings?.paymentConfig) return brandSettings.paymentConfig;
    if (!initialTaxProfile.isIndiaGst) {
      return {
        ...DEFAULT_PAYMENT_CONFIG,
        autoGenerateUpiQr: false,
        display: { ...DEFAULT_PAYMENT_CONFIG.display, showUpiId: false, showQrCode: false },
      };
    }
    return DEFAULT_PAYMENT_CONFIG;
  });

  const [notes, setNotes] = useState<string>(
    initialDocument?.notes || ''
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialDocument?.paymentTerms || brandSettings?.defaultTerms || initialTaxProfile.defaultTerms
  );
  const [paymentInstructions, setPaymentInstructions] = useState<string>(
    initialDocument?.paymentInstructions ||
      brandSettings?.defaultInstructions ||
      ''
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
    // A saved business keeps its own address when it bills in another currency.
    const hasSavedAddress = Boolean(brandSettings?.street || brandSettings?.city);

    const nextTemplateId = templateForCurrency(templateId, newCurrency);
    if (nextTemplateId !== templateId) {
      setTemplateId(nextTemplateId);
      setCustomPrimaryColor(undefined);
    }
    setDecimalPrecision(getCurrencyConfig(newCurrency).decimalPlaces);
    if (paymentTerms === prevProfile.defaultTerms) setPaymentTerms(newProfile.defaultTerms);
    // Rounding to whole rupees is common in India. Elsewhere it would remove the cents from the total.
    if (prevProfile.isIndiaGst !== newProfile.isIndiaGst && brandSettings?.enableRoundOff === undefined) {
      setEnableRoundOff(newProfile.isIndiaGst);
    }

    // If switching between Indian GST (INR) and International (GBP, USD, EUR, KWD, etc.)
    if (prevProfile.isIndiaGst && !newProfile.isIndiaGst) {
      // Switching from INR to foreign currency:
      if (!hasSavedAddress && (senderCountry.toLowerCase() === 'india' || !senderCountry || isIndianState(senderState))) {
        setSenderCountry(newProfile.defaultCountry);
        setSenderState(newProfile.defaultState);
      }
      if (clientCountry.toLowerCase() === 'india' || !clientCountry || isIndianState(clientState)) {
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
        bankAccounts: localizeSampleBanks(prev.bankAccounts, newProfile),
      }));
      if (notes.includes('Mumbai jurisdiction') || notes.includes('15 days')) {
        setNotes(newProfile.defaultNotes);
      }
      if (paymentInstructions.includes('UPI accepted') || paymentInstructions.includes('NEFT / RTGS')) {
        setPaymentInstructions('Bank transfer accepted. Please quote Invoice No. in payment remarks.');
      }
    } else if (!prevProfile.isIndiaGst && newProfile.isIndiaGst) {
      // Switching from foreign currency to INR:
      if (!hasSavedAddress && (!senderCountry || senderCountry === prevProfile.defaultCountry)) {
        setSenderCountry('India');
        setSenderState('27 - Maharashtra');
      }
      if (!clientCountry || clientCountry === prevProfile.defaultCountry) {
        setClientCountry('India');
        setClientState('27 - Maharashtra');
      }
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          taxRate: it.taxRate === prevProfile.defaultTaxRate ? 18 : it.taxRate,
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
    } else if (!prevProfile.isIndiaGst && !newProfile.isIndiaGst) {
      // Switching between foreign currencies (e.g. USD <-> GBP <-> KWD)
      if (!hasSavedAddress && (senderCountry === prevProfile.defaultCountry || !senderCountry)) {
        setSenderCountry(newProfile.defaultCountry);
        setSenderState(newProfile.defaultState);
      }
      if (clientCountry === prevProfile.defaultCountry || !clientCountry) {
        setClientCountry(newProfile.defaultCountry);
        setClientState(newProfile.defaultState);
      }
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          taxRate: it.taxRate === prevProfile.defaultTaxRate ? newProfile.defaultTaxRate : it.taxRate,
        }))
      );
      setPaymentConfig((prev) => ({
        ...prev,
        bankAccounts: localizeSampleBanks(prev.bankAccounts, newProfile),
      }));
      if (notes === prevProfile.defaultNotes) {
        setNotes(newProfile.defaultNotes);
      }
    }
  };

  /** Choosing a country's design also switches to that country's currency, tax labels and address fields. */
  const applyTemplate = (id: string) => {
    const owner = getTemplateCurrency(id);
    if (owner && owner !== currency) handleCurrencyChange(owner);
    setTemplateId(id);
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
      setClientState(
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
      setDecimalPrecision(brandSettings.decimalPrecision ?? getCurrencyConfig(targetCurr).decimalPlaces);
      if (brandSettings.paymentConfig) setPaymentConfig(brandSettings.paymentConfig);
      if (brandSettings.defaultTerms) setPaymentTerms(brandSettings.defaultTerms);
      if (brandSettings.defaultInstructions)
        setPaymentInstructions(brandSettings.defaultInstructions);
      if (brandSettings.signatoryName) setSignatoryName(brandSettings.signatoryName);
      setTemplateId(templateForCurrency(brandSettings.defaultTemplateId || templateId, targetCurr));
      setAppliedTenantId(activeTenant.id);
    }
  }, [initialDocument, activeTenant, brandSettings, appliedTenantId]);

  // UI & Modal state
  // In an embed, the starting document is the host's prefill, not something already saved.
  const [isPersisted, setIsPersisted] = useState<boolean>(Boolean(initialDocument) && !embed);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>(
    Boolean(initialDocument) && !embed ? 'saved' : 'unsaved'
  );
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Modals for Payment Settings, Record Payment, Issue Refund, Payment History, Share
  const [paymentSettingsModalOpen, setPaymentSettingsModalOpen] = useState(false);
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('');

  // Visitors with no saved settings start in their own country's currency rather than always in INR.
  const startingCurrencyChosen = useRef(false);
  useEffect(() => {
    if (tenantLoading || startingCurrencyChosen.current) return;
    startingCurrencyChosen.current = true;
    if (initialDocument || user || activeTenant) return;
    if (new URLSearchParams(window.location.search).get('template')) return;
    const detected = detectCurrency(Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.language);
    if (detected !== currency) handleCurrencyChange(detected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantLoading]);

  // Apply a template chosen from a link such as /create?template=tally_prime.
  // Runs after brand defaults are applied so the customer's choice wins.
  useEffect(() => {
    if (initialDocument || embed) return;
    const param = new URLSearchParams(window.location.search).get('template');
    const requested = param && resolveTemplateId(param);
    if (!requested || !TEMPLATES[requested]) return;
    if (isTemplateAllowedForPlan(activeTenant?.plan || 'starter', requested)) {
      applyTemplate(requested);
    } else {
      setUpgradeReason(`The "${TEMPLATES[requested].name}" template is available on paid plans.`);
      setUpgradeModalOpen(true);
    }
  }, [initialDocument, embed, appliedTenantId, activeTenant?.plan]);

  // New documents get the next free number for their type, not always 00001.
  useEffect(() => {
    if (initialDocument || embed) return;
    let active = true;
    const loadNextNumber = async () => {
      const docs = activeTenant?.id ? await TenantApi.getDocuments(activeTenant.id) : await getAllDocuments();
      const sameType = docs.filter((d) => d.type === docType);
      const { number } = getNextSequenceNumber(
        sameType.map((d) => d.documentNumber),
        {
          ...DEFAULT_NUMBERING_RULES[docType],
          nextNumber: sameType.length + 1,
          ...(docType === 'invoice' && brandSettings?.invoicePrefix ? { prefix: brandSettings.invoicePrefix } : {}),
        }
      );
      if (active) setDocNumber(number);
    };
    loadNextNumber().catch((err) => console.error('Could not work out the next number:', err));
    return () => {
      active = false;
    };
  }, [initialDocument, docType, activeTenant?.id, brandSettings?.invoicePrefix]);

  // Visitors without an account shouldn't retype their business on every invoice.
  useEffect(() => {
    if (initialDocument || activeTenant || embed) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(LAST_SENDER_KEY) || 'null');
      if (!saved) return;
      setSenderName(saved.name || '');
      setSenderEmail(saved.email || '');
      setSenderPhone(saved.phone || '');
      setSenderTaxId(saved.taxId || '');
      setSenderLogo(saved.logoUrl || '');
      setSenderStreet(saved.address?.street1 || '');
      setSenderCity(saved.address?.city || '');
      setSenderPostalCode(saved.address?.postalCode || '');
      if (saved.address?.state) {
        setSenderState(saved.address.state);
        setClientState(saved.address.state);
      }
      if (saved.address?.country) setSenderCountry(saved.address.country);
    } catch {}
    // Only on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const calculationInput = useMemo(
    () => ({
      currency,
      senderState,
      clientState,
      items: items.map((i) => ({
        ...i,
        unit: i.unit || 'PCS',
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
    }),
    [
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
    ]
  );
  const calculated = useMemo(() => calculateDocument(calculationInput), [calculationInput]);

  const effectiveStatus = useMemo(() => {
    return computeEffectiveInvoiceStatus({
      status,
      dueDate,
      summary: calculated.summary,
    });
  }, [status, dueDate, calculated.summary]);

  const invoicePaymentConfig: DocumentPaymentConfig = useMemo(() => {
    const qrCodeDataUrl =
      (paymentConfig.autoGenerateUpiQr
        ? generateVerifiedUpiQrSvgDataUrl({
            upiId: paymentConfig.upiId,
            payeeName: paymentConfig.upiPayeeName || senderName,
            amount: calculated.summary.balanceDue > 0 ? calculated.summary.balanceDue : calculated.summary.grandTotal,
            currency,
            invoiceNumber: docNumber,
          })
        : paymentConfig.qrCodeDataUrl) || undefined;
    return {
      ...paymentConfig,
      qrCodeDataUrl,
      display: {
        ...paymentConfig.display,
        showBankDetails: paymentConfig.display.showBankDetails && paymentConfig.bankAccounts.length > 0,
        showUpiId: paymentConfig.display.showUpiId && Boolean(paymentConfig.upiId),
        showQrCode: paymentConfig.display.showQrCode && Boolean(qrCodeDataUrl),
      },
    };
  }, [paymentConfig, senderName, calculated.summary.balanceDue, calculated.summary.grandTotal, currency, docNumber]);

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
      paymentConfig: invoicePaymentConfig,
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
    invoicePaymentConfig,
    notes,
    paymentTerms,
    paymentInstructions,
    signatoryName,
    payments,
    refunds,
  ]);

  // Track edits in memory - DO NOT auto-save empty drafts to database
  const isFirstMount = useRef(true);
  const lastStatus = useRef(status);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Saving moves a draft to pending, and that alone isn't an edit.
    if (lastStatus.current !== status) {
      lastStatus.current = status;
      return;
    }
    setSaveStatus('unsaved');
  }, [documentModel, status]);

  useEffect(() => {
    if (!onDocumentChange) return;
    const timer = setTimeout(() => onDocumentChange(documentModel), 250);
    return () => clearTimeout(timer);
  }, [documentModel, onDocumentChange]);

  // Line item manipulation helpers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        description: '',
        hsnCode: '',
        unit: 'PCS',
        quantity: 1,
        unitPrice: 0,
        taxRate: getCurrencyTaxProfile(currency).isIndiaGst
          ? brandSettings?.defaultTaxRate ?? 18
          : getCurrencyTaxProfile(currency).defaultTaxRate,
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
    setClientCountry(found.billingAddress?.country || getCurrencyTaxProfile(currency).defaultCountry);
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
      ...prev.filter((item) => String(item.description || '').trim() || Number(item.unitPrice) > 0),
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
    else if (field === 'templateId') applyTemplate(value);
    else if (field === 'notes') setNotes(value);
    else if (field === 'paymentTerms') setPaymentTerms(value);
    else if (field === 'paymentInstructions') setPaymentInstructions(value);
    else if (field === 'signatoryName') setSignatoryName(value);
    else if (field === 'enableRoundOff') setEnableRoundOff(Boolean(value));
  };

  // Actions
  const handleDownload = async (format: DownloadFormat) => {
    try {
      setIsExportingPdf(true);
      if (format === 'excel') await exportDocumentToExcel(documentModel);
      else if (format === 'csv') exportDocumentToCsv(documentModel);
      else if (format === 'png') await exportDocumentToPng(documentModel);
      else await exportDocumentToPdf('invoice-pdf-export-sheet', `${docNumber || 'tax-invoice'}`);
    } catch (err) {
      console.error('Download error:', err);
      toast({ title: 'Could not create the file', description: 'Please try again, or use Print and save as PDF instead.', variant: 'destructive' });
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
      if (!embed) await saveDocument(updated);
      if (activeTenant?.id) {
        await TenantApi.saveDocument(activeTenant.id, updated);
      }
      if (!activeTenant && !embed) {
        try {
          window.localStorage.setItem(LAST_SENDER_KEY, JSON.stringify(updated.sender));
        } catch {}
      }
      setIsPersisted(true);
      setSaveStatus('saved');
      if (onSaved) onSaved(updated);
      toast({
        title: 'Invoice saved',
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
    toast({ title: `Duplicated as #${newDocNumber}` });
  };

  // Record Payment handler inside Builder
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmountInput);
    if (amt <= 0) return;

    const newPayment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      documentId: docId,
      amount: Number(amt.toFixed(decimalPrecision)),
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
    // documentModel still holds the totals from before this payment, and lists and status read the saved summary.
    const nextSummary = calculateDocument({
      ...calculationInput,
      amountPaid: nextPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    }).summary;
    const updatedDoc: DocumentModel = {
      ...documentModel,
      status: computeEffectiveInvoiceStatus({ status: nextStatus, dueDate, summary: nextSummary }),
      summary: nextSummary,
      payments: nextPayments,
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveDocument(updatedDoc);
      if (activeTenant?.id) {
        await TenantApi.saveDocument(activeTenant.id, updatedDoc);
      }
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      setPayments(payments);
      setStatus(status);
      setRecordPaymentModalOpen(false);
      if (err?.name === 'PlanLimitReachedError') {
        setUpgradeReason(err.message);
        setUpgradeModalOpen(true);
      } else {
        toast({ title: 'Payment not saved', description: err?.message || 'Please try again.', variant: 'destructive' });
      }
      return;
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
      amount: Number(amt.toFixed(decimalPrecision)),
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
      country: senderCountry || getCurrencyTaxProfile(currency).defaultCountry,
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
    toast({ title: `Converted to invoice #${newDocNumber}` });
  };

  const downloadMenu = (trigger: React.ReactElement) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 w-60 border-border bg-popover p-1.5 shadow-xl">
        <DropdownMenuItem onClick={() => handleDownload('pdf')} className="flex cursor-pointer items-center gap-2.5 py-2 text-sm">
          <FileText className="h-4 w-4 text-rose-500" /> PDF document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('excel')} className="flex cursor-pointer items-center gap-2.5 py-2 text-sm">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Excel workbook (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('csv')} className="flex cursor-pointer items-center gap-2.5 py-2 text-sm">
          <Table className="h-4 w-4 text-sky-600" /> CSV spreadsheet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('png')} className="flex cursor-pointer items-center gap-2.5 py-2 text-sm">
          <FileImage className="h-4 w-4 text-violet-600" /> PNG image
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 border-border" />
        <DropdownMenuItem onClick={triggerPrint} className="flex cursor-pointer items-center gap-2.5 py-2 text-sm">
          <Printer className="h-4 w-4 text-muted-foreground" /> Print
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen flex flex-col text-foreground">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-border/70 bg-card/80 px-3 backdrop-blur-xl no-print sm:gap-3 sm:px-5">
        {!embed && (
          <Link
            href={user ? '/dashboard/documents' : '/'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}

        <DocumentTypeSelector
          value={docType}
          onChange={(type) => {
            setDocType(type);
            // A credit note design on a tax invoice would print negative amounts, so go back to the usual design.
            const linkedType = TEMPLATE_DOCUMENT_TYPES[templateId];
            if (linkedType && linkedType !== type) {
              setTemplateId(getCurrencyTaxProfile(currency).defaultTemplateId);
              setCustomPrimaryColor(undefined);
            }
          }}
          primaryColor={effectivePrimaryColor}
          compact
          align="left"
          customLabels={customTerminology}
          onUpdateTerminology={handleUpdateTerminology}
        />

        <span className="hidden text-sm text-muted-foreground sm:inline" role="status">
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Not saved yet'}
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {!embed && <LanguageSwitcher compact />}
          <Button
            variant="outline"
            onClick={() => setActiveView((view) => (view === 'editor' ? 'preview' : 'editor'))}
            className="hidden h-10 text-sm font-medium lg:inline-flex"
          >
            {activeView === 'editor' ? <Eye className="mr-1.5 h-4 w-4" /> : <Edit3 className="mr-1.5 h-4 w-4" />}
            {activeView === 'editor' ? 'Preview' : 'Edit'}
          </Button>
          <div className="hidden lg:block">
            {downloadMenu(
              <Button variant="outline" disabled={isExportingPdf} className="h-10 text-sm font-medium">
                <Download className="mr-1.5 h-4 w-4" />
                {isExportingPdf ? 'Preparing…' : 'Download'}
                <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
          <Button
            onClick={handleSaveInvoice}
            disabled={saveStatus === 'saving'}
            className="brand-gradient hidden h-10 text-sm font-semibold text-white lg:inline-flex"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {isPersisted ? 'Save changes' : 'Save invoice'}
          </Button>

          {!embed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 w-10 p-0" aria-label="More options">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 w-56 border-border bg-popover p-1.5 shadow-xl">
              <DropdownMenuItem onClick={() => setShareModalOpen(true)} className="flex cursor-pointer items-center gap-2.5 py-2 text-sm">
                <Share2 className="h-4 w-4 text-muted-foreground" /> Send or share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSaveDraft} className="flex cursor-pointer items-center gap-2.5 py-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" /> Save as draft
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 border-border" />
              <DropdownMenuItem
                onClick={() => {
                  setPayAmountInput(calculated.summary.balanceDue > 0 ? calculated.summary.balanceDue : calculated.summary.grandTotal);
                  setRecordPaymentModalOpen(true);
                }}
                className="flex cursor-pointer items-center gap-2.5 py-2 text-sm"
              >
                <CreditCard className="h-4 w-4 text-muted-foreground" /> Record a payment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHistoryModalOpen(true)} className="flex cursor-pointer items-center gap-2.5 py-2 text-sm">
                <History className="h-4 w-4 text-muted-foreground" /> Payment history ({payments.length + refunds.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </header>

      <main className="flex-1 px-3 pb-28 pt-4 no-print sm:px-5 lg:pb-10 lg:pt-6">
        {/* Kept mounted so the canvas remembers its column choices while previewing */}
        <div className={`mx-auto max-w-4xl space-y-5 ${activeView === 'preview' ? 'hidden' : ''}`}>
          <InvoiceOptionsBar
            currency={currency}
            onCurrencyChange={handleCurrencyChange}
            templateId={templateId}
            templateGroups={categorizedTemplates.map((group) => ({
              ...group,
              templates: group.templates.map((template) => ({
                id: template.id,
                name: template.name,
                accent: template.defaultTokens.primaryColor,
              })),
            }))}
            isTemplateAllowed={(id) => isTemplateAllowedForPlan(activeTenant?.plan || 'starter', id)}
            onTemplateChange={(id) => {
              if (!isTemplateAllowedForPlan(activeTenant?.plan || 'starter', id)) {
                setUpgradeReason(`The "${TEMPLATES[id]?.name || id}" template is available on paid plans.`);
                setUpgradeModalOpen(true);
                return;
              }
              applyTemplate(id);
              setCustomPrimaryColor(undefined);
              if (TEMPLATE_DOCUMENT_TYPES[id]) setDocType(TEMPLATE_DOCUMENT_TYPES[id]);
            }}
            accentColor={effectivePrimaryColor}
            colorSwatches={THEME_COLOR_SWATCHES}
            onAccentChange={setCustomPrimaryColor}
            invoiceName={invoiceName}
            onInvoiceNameChange={setInvoiceName}
            roundOff={enableRoundOff}
            onRoundOffChange={setEnableRoundOff}
            onOpenPaymentSettings={() => setPaymentSettingsModalOpen(true)}
          />

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
            onLogoUpload={setSenderLogo}
            onRemoveLogo={() => setSenderLogo('')}
            onUpdateDiscount={(type, value) => {
              setDocDiscountType(type);
              setDocDiscountValue(value);
            }}
            onUpdateShipping={setShippingFee}
            onUpdateExtra={setExtraCharges}
            onUpdatePaid={setManualAmountPaid}
          />
        </div>

        {/* The finished invoice, exactly as it prints */}
        {activeView === 'preview' && (
          <div className="mx-auto max-w-4xl">
            <DocumentPreview document={documentModel} captureId="invoice-screen-preview" hideToolbar />
          </div>
        )}
      </main>

      {/* Small screens: one bar for everything */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border bg-card p-3 no-print lg:hidden">
        <Button
          variant="outline"
          onClick={() => setActiveView((view) => (view === 'editor' ? 'preview' : 'editor'))}
          className="h-11 flex-1 text-sm font-medium"
        >
          {activeView === 'editor' ? <Eye className="mr-1.5 h-4 w-4" /> : <Edit3 className="mr-1.5 h-4 w-4" />}
          {activeView === 'editor' ? 'Preview' : 'Edit'}
        </Button>
        <div className="flex-1">
          {downloadMenu(
            <Button variant="outline" disabled={isExportingPdf} className="h-11 w-full text-sm font-medium">
              <Download className="mr-1.5 h-4 w-4" /> Download
            </Button>
          )}
        </div>
        <Button
          onClick={handleSaveInvoice}
          disabled={saveStatus === 'saving'}
          className="brand-gradient h-11 flex-1 text-sm font-semibold text-white"
        >
          <Save className="mr-1.5 h-4 w-4" /> Save
        </Button>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: PAYMENT SETTINGS (BANK ACCOUNTS, UPI ID, QR CODE & DISPLAY CONTROLS) */}
      {/* ==================================================================== */}
      {paymentSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto no-print">
          <Card className="w-full max-w-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Payment Settings & Invoice Display Controls
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose how customers can pay you. Only the methods you turn on appear on the invoice.
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
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">
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
                  {getCurrencyTaxProfile(currency).supportsUpi && (
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
                  )}
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
                  <h4 className="text-xs font-bold text-slate-500">
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
                        country: senderCountry || getCurrencyTaxProfile(currency).defaultCountry,
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
                            <div className="text-slate-600 font-mono text-xs">
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
                          placeholder="e.g. Apex Digital Solutions"
                        />
                        {bankFormErrors.accountHolderName && (
                          <p className="text-xs text-red-600 mt-0.5">
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
                          placeholder="e.g. Your bank name"
                        />
                        {bankFormErrors.bankName && (
                          <p className="text-xs text-red-600 mt-0.5">
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
                          <p className="text-xs text-red-600 mt-0.5">
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
                          <p className="text-xs text-red-600 mt-0.5">
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
                          <p className="text-xs text-red-600 mt-0.5">
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
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {getCurrencyTaxProfile(currency).supportsUpi ? '3. UPI ID & Verified QR Code' : '3. Payment QR Code'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <div className="md:col-span-2 space-y-3 text-xs">
                    {getCurrencyTaxProfile(currency).supportsUpi && (
                    <>
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
                        <p className="text-xs text-amber-600 mt-1">
                          {upiValidation.error}
                        </p>
                      )}
                      {paymentConfig.upiId && upiValidation.valid && (
                        <p className="text-xs text-emerald-600 mt-1">
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
                    </>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {getCurrencyTaxProfile(currency).supportsUpi && (
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
                      )}

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
                    <span className="text-xs font-bold text-slate-400 mb-2">
                      QR Code Preview
                    </span>
                    {liveQrPreviewUrl ? (
                      <>
                        <img
                          src={liveQrPreviewUrl}
                          alt="Verified QR Preview"
                          className="h-24 w-24 object-contain bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800"
                        />
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1.5">
                          ✓ Verified Payment QR Ready
                        </span>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 px-2">
                        {getCurrencyTaxProfile(currency).supportsUpi
                          ? 'Enter a valid UPI ID & Payee Name or upload a QR image to generate preview.'
                          : 'Upload a QR image from your bank or payment app.'}
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
                      <option value="bank_transfer">Bank Transfer</option>
                      {getCurrencyTaxProfile(currency).supportsUpi && <option value="upi">UPI</option>}
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
                    placeholder="Bank or payment reference"
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
                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Invoice Total</div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                    {formatCurrency(calculated.summary.grandTotal, currency)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-xs text-emerald-700 uppercase font-bold">Collected</div>
                  <div className="font-mono font-semibold text-emerald-700 text-sm mt-0.5">
                    {formatCurrency(calculated.summary.amountPaid, currency)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <div className="text-xs text-rose-700 uppercase font-bold">Refunded</div>
                  <div className="font-mono font-semibold text-rose-700 text-sm mt-0.5">
                    {formatCurrency(calculated.summary.refundedAmount || 0, currency)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-xs text-amber-700 uppercase font-bold">Balance Due</div>
                  <div className="font-mono font-semibold text-amber-700 text-sm mt-0.5">
                    {formatCurrency(calculated.summary.balanceDue, currency)}
                  </div>
                </div>
              </div>

              {/* Payments List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-500">
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
                            Number((totalPaymentsRecorded - totalRefundsRecorded).toFixed(decimalPrecision))
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
                          <div className="text-xs text-slate-500">
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
                  <h4 className="text-xs font-bold text-rose-600">
                    Refunds Issued ({refunds.length})
                  </h4>
                  <div className="divide-y border border-rose-200 bg-rose-50/30 rounded-lg text-xs">
                    {refunds.map((r) => (
                      <div key={r.id} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900 capitalize">
                            Refund via {r.refundMethod.replace('_', ' ')} • {r.refundDate}
                          </div>
                          <div className="text-xs text-slate-500">
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
                        {getCurrencyTaxProfile(currency).supportsUpi && <option value="upi">UPI</option>}
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
        onDownloadPdf={() => handleDownload('pdf')}
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
        translate="no"
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
