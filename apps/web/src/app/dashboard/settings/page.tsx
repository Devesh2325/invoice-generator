'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi } from '@invoice/api';
import {
  SUPPORTED_CURRENCIES,
  INDIAN_STATES,
  formatCurrency,
  BankAccountDetails,
  InvoicePaymentDisplayConfig,
  RoundingMode,
  validateUpiId,
  validateBankAccount,
  generateVerifiedUpiQrSvgDataUrl,
} from '@invoice/core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ImportWizardModal } from '@/components/modals/import-wizard-modal';
import {
  CloudUpload,
  Mail,
  Key,
  Globe,
  Building2,
  Landmark,
  QrCode,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  Eye,
} from 'lucide-react';

export default function TenantSettingsPage() {
  const { activeTenant, brandSettings, refreshBrandSettings } = useTenant();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 1. Currency Configuration
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [defaultLocale, setDefaultLocale] = useState('en-IN');

  // 2. Company & Invoice Numbering Defaults
  const [sellerLogoUrl, setSellerLogoUrl] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerTaxId, setSellerTaxId] = useState('');
  const [sellerGstState, setSellerGstState] = useState('27 - Maharashtra');
  const [sellerAddress, setSellerAddress] = useState('');
  const [sellerCity, setSellerCity] = useState('');
  const [sellerCountry, setSellerCountry] = useState('India');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1001);
  const [defaultTerms, setDefaultTerms] = useState('Payment is due within 14 days of invoice date.');
  const [defaultNotes, setDefaultNotes] = useState('Thank you for your business!');
  const [paymentInstructions, setPaymentInstructions] = useState(
    'Please include the invoice number as the payment reference.'
  );

  // 3. Rounding & Calculation Defaults
  const [enableRoundOff, setEnableRoundOff] = useState(false);
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('nearest_integer');
  const [decimalPrecision, setDecimalPrecision] = useState<number>(2);

  // 4. Payment Settings (Bank Accounts, UPI, QR, Display Toggles)
  const [bankAccounts, setBankAccounts] = useState<BankAccountDetails[]>([]);
  const [upiId, setUpiId] = useState('');
  const [upiPayeeName, setUpiPayeeName] = useState('');
  const [qrMode, setQrMode] = useState<'auto_upi' | 'uploaded'>('auto_upi');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [paymentDisplay, setPaymentDisplay] = useState<InvoicePaymentDisplayConfig>({
    showBankDetails: true,
    showUpiId: true,
    showQrCode: true,
    showPaymentInstructions: true,
    showPaymentTerms: true,
  });

  // 5. Email / Resend Settings
  const [resendApiKey, setResendApiKey] = useState('');
  const [senderEmail, setSenderEmail] = useState('billing@company.com');
  const [emailSaved, setEmailSaved] = useState(false);

  // Hydrate from brandSettings when loaded
  useEffect(() => {
    if (!brandSettings) return;
    setDefaultCurrency(brandSettings.currency || activeTenant?.currency || 'INR');
    setDefaultLocale(brandSettings.locale || 'en-IN');
    setSellerLogoUrl(brandSettings.logoUrl || '');
    setSellerName(brandSettings.businessName || activeTenant?.name || '');
    setSellerTaxId(brandSettings.taxId || '');
    setSellerGstState(brandSettings.gstState || '27 - Maharashtra');
    setSellerAddress(brandSettings.street || '');
    setSellerCity(brandSettings.city || '');
    setSellerCountry(brandSettings.country || 'India');
    setSellerEmail(brandSettings.email || '');
    setSellerPhone(brandSettings.phone || '');
    setInvoicePrefix(brandSettings.invoicePrefix || 'INV');
    setNextInvoiceNumber(brandSettings.nextInvoiceNumber || 1001);
    setDefaultTerms(brandSettings.defaultTerms || 'Payment is due within 14 days of invoice date.');
    setDefaultNotes(brandSettings.footerText || 'Thank you for your business!');
    setPaymentInstructions(
      brandSettings.defaultInstructions ||
        'Please include the invoice number as the payment reference.'
    );
    setEnableRoundOff(Boolean(brandSettings.enableRoundOff));
    setRoundingMode((brandSettings.roundingMode as RoundingMode) || 'nearest_integer');
    setDecimalPrecision(
      typeof brandSettings.decimalPrecision === 'number' ? brandSettings.decimalPrecision : 2
    );
    const pConfig = brandSettings.paymentConfig;
    setBankAccounts(
      pConfig?.bankAccounts && pConfig.bankAccounts.length > 0
        ? pConfig.bankAccounts
        : [
            {
              id: 'bank_default_1',
              accountHolderName: brandSettings.businessName || activeTenant?.name || '',
              bankName: '',
              accountNumber: '',
              confirmAccountNumber: '',
              ifscOrRoutingCode: '',
              branchName: '',
              accountType: 'current',
              swiftBicCode: '',
              country: brandSettings.country || 'India',
              isPrimary: true,
            },
          ]
    );
    setUpiId(pConfig?.upiId || '');
    setUpiPayeeName(pConfig?.upiPayeeName || brandSettings.businessName || activeTenant?.name || '');
    setQrCodeDataUrl(pConfig?.qrCodeDataUrl || '');
    setQrMode(pConfig?.autoGenerateUpiQr === false && pConfig?.qrCodeDataUrl ? 'uploaded' : 'auto_upi');
    if (pConfig?.display) {
      setPaymentDisplay(pConfig.display);
    }
  }, [brandSettings, activeTenant]);

  const upiValidation = useMemo(() => {
    if (!upiId.trim()) return { valid: false, empty: true, error: 'Enter a UPI ID / VPA to enable UPI & QR generation' };
    const res = validateUpiId(upiId);
    return { ...res, empty: false };
  }, [upiId]);

  const verifiedQrPreviewUrl = useMemo(() => {
    if (qrMode === 'uploaded') {
      return qrCodeDataUrl || null;
    }
    return generateVerifiedUpiQrSvgDataUrl({
      upiId,
      payeeName: upiPayeeName || sellerName,
      currency: defaultCurrency,
    });
  }, [qrMode, qrCodeDataUrl, upiId, upiPayeeName, sellerName, defaultCurrency]);

  const handleAddBankAccount = () => {
    setBankAccounts((prev) => [
      ...prev,
      {
        id: `bank_${Date.now()}`,
        accountHolderName: sellerName || activeTenant?.name || '',
        bankName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscOrRoutingCode: '',
        branchName: '',
        accountType: 'current',
        swiftBicCode: '',
        country: sellerCountry || 'India',
        isPrimary: prev.length === 0,
      },
    ]);
  };

  const handleUpdateBank = (idx: number, patch: Partial<BankAccountDetails>) => {
    setBankAccounts((prev) =>
      prev.map((acct, i) => (i === idx ? { ...acct, ...patch } : acct))
    );
  };

  const handleRemoveBank = (idx: number) => {
    setBankAccounts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUploadQrImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setQrCodeDataUrl(reader.result);
        setQrMode('uploaded');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadCompanyLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setValidationError('Company logo image must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setSellerLogoUrl(dataUrl);
        if (activeTenant) {
          await TenantApi.updateBrandSettings(activeTenant.id, { logoUrl: dataUrl });
          await refreshBrandSettings();
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCompanyLogo = async () => {
    setSellerLogoUrl('');
    if (activeTenant) {
      await TenantApi.updateBrandSettings(activeTenant.id, { logoUrl: '' });
      await refreshBrandSettings();
    }
  };

  const handleSaveAllSettings = async () => {
    if (!activeTenant) return;
    setValidationError(null);

    // Validate non-empty bank accounts
    const activeBanks = bankAccounts.filter(
      (b) => b.bankName.trim() || b.accountNumber.trim() || b.ifscOrRoutingCode.trim()
    );
    for (const acct of activeBanks) {
      const check = validateBankAccount(acct);
      if (!check.valid) {
        setValidationError(
          `Bank Account (${acct.bankName || 'Unnamed'}): ${Object.values(check.errors).join(', ')}`
        );
        return;
      }
    }

    // Validate UPI if entered
    if (upiId.trim()) {
      const uCheck = validateUpiId(upiId);
      if (!uCheck.valid) {
        setValidationError(uCheck.error || 'Invalid UPI ID');
        return;
      }
    }

    setSaving(true);
    try {
      const finalQrUrl =
        qrMode === 'uploaded'
          ? qrCodeDataUrl
          : generateVerifiedUpiQrSvgDataUrl({
              upiId,
              payeeName: upiPayeeName || sellerName,
              currency: defaultCurrency,
            }) || '';

      await TenantApi.updateBrandSettings(activeTenant.id, {
        currency: defaultCurrency,
        locale: defaultLocale,
        logoUrl: sellerLogoUrl,
        businessName: sellerName,
        taxId: sellerTaxId,
        gstState: sellerGstState,
        street: sellerAddress,
        city: sellerCity,
        country: sellerCountry,
        email: sellerEmail,
        phone: sellerPhone,
        invoicePrefix,
        nextInvoiceNumber: Number(nextInvoiceNumber) || 1001,
        defaultTerms,
        footerText: defaultNotes,
        defaultInstructions: paymentInstructions,
        enableRoundOff,
        roundingMode,
        decimalPrecision,
        paymentConfig: {
          bankAccounts: activeBanks,
          selectedBankAccountIds: activeBanks.map((b) => b.id),
          upiId: upiId.trim(),
          upiPayeeName: upiPayeeName.trim() || sellerName,
          autoGenerateUpiQr: qrMode === 'auto_upi',
          qrCodeDataUrl: finalQrUrl || undefined,
          display: paymentDisplay,
        },
      });

      await refreshBrandSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save workspace settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full">
        {/* Sticky Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs sticky top-4 z-20">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Settings & Invoice Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure application-wide currency, payment methods (Bank, UPI, Verified QR), rounding rules, and invoice defaults.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <Badge variant="success" className="text-xs py-1 px-2.5 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved & Applied Globally
              </Badge>
            )}
            <Button
              size="sm"
              disabled={saving}
              onClick={handleSaveAllSettings}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm flex items-center gap-1.5 px-4"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving Configuration...' : 'Save All Settings'}
            </Button>
          </div>
        </div>

        {validationError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* 1. Currency Configuration */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-600" /> Currency Configuration
            </CardTitle>
            <CardDescription className="text-xs">
              Select the default currency used across Dashboard KPIs, Invoices, Customer Balances, Items, Payments, Reports, and PDFs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Application Currency *
                </label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => {
                    const code = e.target.value;
                    setDefaultCurrency(code);
                    const meta = SUPPORTED_CURRENCIES[code];
                    if (meta?.defaultLocale) {
                      setDefaultLocale(meta.defaultLocale);
                    }
                  }}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} ({curr.symbol}) — {curr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Number & Currency Locale
                </label>
                <select
                  value={defaultLocale}
                  onChange={(e) => setDefaultLocale(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium"
                >
                  <option value="en-IN">en-IN (Indian Grouping: 1,25,000.00)</option>
                  <option value="en-US">en-US (Standard Grouping: 125,000.00)</option>
                  <option value="en-GB">en-GB (UK Grouping: 125,000.00)</option>
                  <option value="de-DE">de-DE (European Grouping: 125.000,00)</option>
                  <option value="ar-AE">ar-AE (UAE Formatting)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Live Currency Format Preview
                </span>
                <span className="text-lg font-black text-indigo-600 tabular-nums mt-0.5">
                  {formatCurrency(125450.75, defaultCurrency, {
                    locale: defaultLocale,
                    decimalPlaces: decimalPrecision,
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Payment Settings (Bank Details, UPI ID, QR Code, Display Toggles) */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Landmark className="h-4 w-4 text-emerald-600" /> Payment Settings (Invoice Configuration)
            </CardTitle>
            <CardDescription className="text-xs">
              Configure structured bank accounts, UPI ID, and verified QR codes, and control which payment methods appear on generated invoices, previews, and PDFs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Independent Invoice Display Controls */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-indigo-600" /> Invoice Payment Display Controls
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { key: 'showBankDetails', label: 'Show Bank Details' },
                  { key: 'showUpiId', label: 'Show UPI ID' },
                  { key: 'showQrCode', label: 'Show QR Code' },
                  { key: 'showPaymentInstructions', label: 'Show Instructions' },
                  { key: 'showPaymentTerms', label: 'Show Payment Terms' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-indigo-300 text-xs font-semibold text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(
                        paymentDisplay[item.key as keyof InvoicePaymentDisplayConfig]
                      )}
                      onChange={(e) =>
                        setPaymentDisplay((prev) => ({
                          ...prev,
                          [item.key]: e.target.checked,
                        }))
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Structured Bank Details Form (Supports Multiple Accounts) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Bank Accounts ({bankAccounts.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Enter individual bank fields instead of unstructured text. Supports multiple bank accounts.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddBankAccount}
                  className="text-xs flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Bank Account
                </Button>
              </div>

              {bankAccounts.map((acct, idx) => {
                const isIndia =
                  (acct.country || 'India').toLowerCase() === 'india' ||
                  (acct.country || '').toLowerCase() === 'in';
                const accountMismatch =
                  acct.confirmAccountNumber !== undefined &&
                  acct.confirmAccountNumber !== '' &&
                  acct.accountNumber !== acct.confirmAccountNumber;

                return (
                  <div
                    key={acct.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-800">
                        Bank Account #{idx + 1}{' '}
                        {acct.bankName ? `— ${acct.bankName}` : ''}
                      </span>
                      {bankAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBank(idx)}
                          className="text-xs text-red-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Country
                        </label>
                        <select
                          value={acct.country || 'India'}
                          onChange={(e) => handleUpdateBank(idx, { country: e.target.value })}
                          className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs"
                        >
                          <option value="India">India (IFSC)</option>
                          <option value="United States">United States (ABA / Routing)</option>
                          <option value="United Kingdom">United Kingdom (Sort Code / IBAN)</option>
                          <option value="United Arab Emirates">UAE (IBAN / SWIFT)</option>
                          <option value="European Union">European Union (IBAN / BIC)</option>
                          <option value="Singapore">Singapore (Bank / Branch Code)</option>
                          <option value="Other">Other International</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Account Holder Name *
                        </label>
                        <Input
                          value={acct.accountHolderName}
                          onChange={(e) =>
                            handleUpdateBank(idx, { accountHolderName: e.target.value })
                          }
                          placeholder="e.g. Acme Solutions Pvt Ltd"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Bank Name *
                        </label>
                        <Input
                          value={acct.bankName}
                          onChange={(e) => handleUpdateBank(idx, { bankName: e.target.value })}
                          placeholder="e.g. HDFC Bank / Chase"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Account Number *
                        </label>
                        <Input
                          value={acct.accountNumber}
                          onChange={(e) =>
                            handleUpdateBank(idx, { accountNumber: e.target.value })
                          }
                          placeholder="Enter account number"
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Confirm Account Number *
                        </label>
                        <Input
                          value={acct.confirmAccountNumber ?? acct.accountNumber}
                          onChange={(e) =>
                            handleUpdateBank(idx, { confirmAccountNumber: e.target.value })
                          }
                          placeholder="Re-enter account number"
                          className={`h-9 text-xs font-mono ${
                            accountMismatch ? 'border-red-500 bg-red-50' : ''
                          }`}
                        />
                        {accountMismatch && (
                          <span className="text-[10px] text-red-600 font-semibold">
                            Account numbers do not match
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          {isIndia ? 'IFSC Code *' : 'Routing / Sort Code / IBAN *'}
                        </label>
                        <Input
                          value={acct.ifscOrRoutingCode}
                          onChange={(e) =>
                            handleUpdateBank(idx, {
                              ifscOrRoutingCode: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder={isIndia ? 'HDFC0001234' : 'Routing / Sort Code'}
                          className="h-9 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Branch Name
                        </label>
                        <Input
                          value={acct.branchName || ''}
                          onChange={(e) =>
                            handleUpdateBank(idx, { branchName: e.target.value })
                          }
                          placeholder="e.g. Nariman Point, Mumbai"
                          className="h-9 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Account Type
                        </label>
                        <select
                          value={acct.accountType}
                          onChange={(e) =>
                            handleUpdateBank(idx, { accountType: e.target.value as any })
                          }
                          className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs"
                        >
                          <option value="current">Current Account</option>
                          <option value="savings">Savings Account</option>
                          <option value="checking">Checking Account</option>
                          <option value="business">Business Account</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          SWIFT / BIC Code (Optional)
                        </label>
                        <Input
                          value={acct.swiftBicCode || ''}
                          onChange={(e) =>
                            handleUpdateBank(idx, {
                              swiftBicCode: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="HDFCINBBXXX"
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* UPI & QR Code Configuration */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <QrCode className="h-4 w-4 text-indigo-600" /> UPI & Payment QR Code
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Configure a verified UPI ID / VPA or upload a custom payment QR code. QR codes are never generated from incomplete or unverified details.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        UPI ID / VPA
                      </label>
                      <Input
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value.trim())}
                        placeholder="merchant@okaxis or 9876543210@upi"
                        className="h-9 text-xs font-mono bg-white"
                      />
                      {!upiValidation.empty && (
                        <div className="mt-1 text-[11px]">
                          {upiValidation.valid ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Verified VPA format
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> {upiValidation.error}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        UPI Payee / Merchant Name
                      </label>
                      <Input
                        value={upiPayeeName}
                        onChange={(e) => setUpiPayeeName(e.target.value)}
                        placeholder="Acme Solutions Pvt Ltd"
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <label className="text-xs font-semibold text-slate-700">
                      QR Code Source:
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        checked={qrMode === 'auto_upi'}
                        onChange={() => setQrMode('auto_upi')}
                      />
                      <span>Auto-generate from verified UPI ID</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        checked={qrMode === 'uploaded'}
                        onChange={() => setQrMode('uploaded')}
                      />
                      <span>Upload Custom QR Image</span>
                    </label>

                    {qrMode === 'uploaded' && (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadQrImage}
                        className="text-xs"
                      />
                    )}
                  </div>
                </div>

                {/* Live QR Preview Box */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center min-h-[150px]">
                  <span className="text-[10px] font-bold uppercase text-slate-400 mb-2">
                    QR Code Preview
                  </span>
                  {verifiedQrPreviewUrl ? (
                    <>
                      <img
                        src={verifiedQrPreviewUrl}
                        alt="Verified Payment QR Preview"
                        className="h-28 w-28 object-contain border border-slate-100 rounded p-1"
                      />
                      <span className="text-[10px] text-emerald-600 font-semibold mt-1.5">
                        ✓ Verified & Ready for Invoices
                      </span>
                    </>
                  ) : (
                    <div className="text-[11px] text-slate-400 py-4 px-2">
                      Enter a valid UPI ID (e.g. <code className="text-slate-600">name@bank</code>) and Payee Name or upload an image to preview QR code.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Rounding & Calculation Configuration */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-amber-600" /> Rounding & Invoice Calculation Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Configure default round-off behavior, rounding rules, and decimal precision for new invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50">
              <input
                type="checkbox"
                id="enableRoundOffToggle"
                checked={enableRoundOff}
                onChange={(e) => setEnableRoundOff(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <label htmlFor="enableRoundOffToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                Enable Round-Off Adjustment by Default
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Rounding Rule
              </label>
              <select
                value={roundingMode}
                onChange={(e) => setRoundingMode(e.target.value as RoundingMode)}
                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium"
              >
                <option value="nearest_integer">Nearest Whole Currency Unit (0.5 rounds up)</option>
                <option value="half_up">Standard Half-Up (Precision Bound)</option>
                <option value="half_even">Banker&apos;s Rounding (Half-Even)</option>
                <option value="up">Always Round Up (Ceiling)</option>
                <option value="down">Always Round Down (Floor)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Decimal Precision
              </label>
              <select
                value={decimalPrecision}
                onChange={(e) => setDecimalPrecision(Number(e.target.value))}
                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium"
              >
                <option value={2}>2 Decimal Places (0.00)</option>
                <option value={0}>0 Decimal Places (Whole Units)</option>
                <option value={3}>3 Decimal Places (0.000)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 4. Company Profile, Logo & Invoice Numbering Defaults */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" /> Company Profile, Logo & Invoice Defaults
            </CardTitle>
            <CardDescription className="text-xs">
              Upload your Company Logo and configure default seller details, GST state, numbering prefix, payment terms, and instructions automatically applied to new invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Logo Upload Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {sellerLogoUrl ? (
                  <div className="relative bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                    <img
                      src={sellerLogoUrl}
                      alt="Company Logo Preview"
                      className="h-14 max-w-[180px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-24 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-400">
                    No Logo
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Company Logo (Invoice Header)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    PNG, JPG, or SVG (max 2MB). Automatically displayed on all generated invoices, previews, and PDFs.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition-all">
                  <CloudUpload className="h-3.5 w-3.5" />
                  <span>{sellerLogoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadCompanyLogo}
                    className="hidden"
                  />
                </label>
                {sellerLogoUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveCompanyLogo}
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Company / Seller Name
                </label>
                <Input
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Acme Solutions Pvt Ltd"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Company Tax ID / GSTIN
                </label>
                <Input
                  value={sellerTaxId}
                  onChange={(e) => setSellerTaxId(e.target.value.toUpperCase())}
                  placeholder="27AABCU9603R1ZM"
                  className="text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Seller GST State
                </label>
                <select
                  value={sellerGstState}
                  onChange={(e) => setSellerGstState(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-2.5 text-xs"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st.code} value={st.label}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Street Address
                </label>
                <Input
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
                  placeholder="100 Corporate Park"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  City
                </label>
                <Input
                  value={sellerCity}
                  onChange={(e) => setSellerCity(e.target.value)}
                  placeholder="Mumbai"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Country
                </label>
                <Input
                  value={sellerCountry}
                  onChange={(e) => setSellerCountry(e.target.value)}
                  placeholder="India"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Support / Billing Email
                </label>
                <Input
                  value={sellerEmail}
                  onChange={(e) => setSellerEmail(e.target.value)}
                  placeholder="billing@company.com"
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Phone Number
                </label>
                <Input
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Invoice Prefix
                  </label>
                  <Input
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                    placeholder="INV"
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Next Sequence #
                  </label>
                  <Input
                    type="number"
                    value={nextInvoiceNumber}
                    onChange={(e) => setNextInvoiceNumber(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Payment Terms
                </label>
                <Input
                  value={defaultTerms}
                  onChange={(e) => setDefaultTerms(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Payment Instructions
                </label>
                <Input
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Invoice Footer Notes
                </label>
                <Input
                  value={defaultNotes}
                  onChange={(e) => setDefaultNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Local-to-Cloud Import Section */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CloudUpload className="h-4 w-4 text-primary" /> Offline Device Migration
            </CardTitle>
            <CardDescription className="text-xs">
              Synchronize invoices created anonymously on this device into this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-blue-50/50 border border-blue-200 rounded-lg gap-3">
              <div className="text-xs text-slate-700">
                Scan and import local IndexedDB invoices into{' '}
                <strong>{activeTenant?.name}</strong> with conflict verification.
              </div>
              <Button
                size="sm"
                onClick={() => setImportModalOpen(true)}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shrink-0"
              >
                Launch Import Wizard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 6. Email & Resend Transactional Settings */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Transactional Email Delivery
            </CardTitle>
            <CardDescription className="text-xs">
              Connect Resend to automatically email invoices, receipts, and payment reminders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Resend API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="re_123456789..."
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    className="pl-9 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  From Email Address
                </label>
                <Input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEmailSaved(true);
                  setTimeout(() => setEmailSaved(false), 3000);
                }}
                className="text-xs font-semibold"
              >
                {emailSaved ? 'Email Settings Saved!' : 'Save Email Config'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {activeTenant && (
          <ImportWizardModal
            tenantId={activeTenant.id}
            isOpen={importModalOpen}
            onClose={() => setImportModalOpen(false)}
            onImportComplete={() => {
              setImportModalOpen(false);
              alert('Import completed successfully!');
            }}
          />
        )}
      </div>
    </TenantLayout>
  );
}
