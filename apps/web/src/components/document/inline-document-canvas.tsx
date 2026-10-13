'use client';

import React, { useRef, useMemo } from 'react';
import {
  DocumentModel,
  DocumentType,
  Party,
  formatCurrency,
  INDIAN_STATES,
  generateVerifiedUpiQrSvgDataUrl,
} from '@invoice/core';
import { ProductCatalogItem } from '@invoice/api';
import { getInvoiceTemplate, TemplatePreset } from '@invoice/theme';
import {
  Upload,
  Plus,
  Trash2,
  Copy,
  X,
  Users,
  Package,
  Calendar,
  Building2,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { DocumentTypeSelector } from './document-type-selector';

interface InlineDocumentCanvasProps {
  document: DocumentModel;
  savedCustomers?: Party[];
  savedItems?: ProductCatalogItem[];
  selectedCustomerId?: string;
  onSelectCustomer?: (partyId: string) => void;
  onSelectCatalogItem?: (index: number, productId: string) => void;
  onAddCatalogItem?: (productId: string) => void;
  onUpdateSender: (field: string, value: any) => void;
  onUpdateSenderAddress: (field: string, value: any) => void;
  onUpdateClient: (field: string, value: any) => void;
  onUpdateClientAddress: (field: string, value: any) => void;
  onUpdateDoc: (field: string, value: any) => void;
  onUpdateItem: (index: number, field: string, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onDuplicateItem: (index: number) => void;
  onLogoUpload: (dataUrl: string) => void;
  onRemoveLogo: () => void;
  onUpdateDiscount: (type: 'percentage' | 'fixed', val: number) => void;
  onUpdateShipping: (val: number) => void;
  onUpdateExtra: (val: number) => void;
  onUpdatePaid: (val: number) => void;
}

export const InlineDocumentCanvas: React.FC<InlineDocumentCanvasProps> = ({
  document,
  savedCustomers = [],
  savedItems = [],
  selectedCustomerId = '',
  onSelectCustomer,
  onSelectCatalogItem,
  onAddCatalogItem,
  onUpdateSender,
  onUpdateSenderAddress,
  onUpdateClient,
  onUpdateClientAddress,
  onUpdateDoc,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onDuplicateItem,
  onLogoUpload,
  onRemoveLogo,
  onUpdateDiscount,
  onUpdateShipping,
  onUpdateExtra,
  onUpdatePaid,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template configuration from the 18 print-ready presets
  const tpl = useMemo(
    () => getInvoiceTemplate(document.templateId || 'in-gst'),
    [document.templateId]
  );

  // Theme colors & overrides
  const effectiveAccent = document.customTheme?.primaryColor || tpl.accent || '#1D4ED8';
  const isDarkPaper = tpl.paper === '#0e1116' || tpl.id === 'dark-tech';
  const paperColor = isDarkPaper ? '#0E1116' : tpl.paper || '#FFFFFF';
  const textColor = isDarkPaper ? '#E6E9EF' : tpl.ink || '#0F172A';
  const mutedTextColor = isDarkPaper ? '#94A3B8' : '#64748B';
  const borderColor = isDarkPaper ? '#2A303B' : tpl.line || '#E2E8F0';
  const tintBg = isDarkPaper ? '#161A22' : tpl.tint || '#F8FAFC';

  // Layout architecture & typography
  const headerLayout = tpl.header; // 'band' | 'center' | 'big' | 'side' | 'left'
  const isBannerHeader = headerLayout === 'band';
  const isSidebarLayout = headerLayout === 'side';
  const isCenteredHeader = headerLayout === 'center';
  const isBigHeader = headerLayout === 'big';

  const isMonoFont = tpl.font.includes('Mono') || tpl.id === 'dark-tech';
  const isSerifFont =
    tpl.font.includes('Serif') || tpl.id === 'eu-reverse-charge' || tpl.id === 'hk-no-tax';
  const fontClass = isMonoFont ? 'font-mono' : isSerifFont ? 'font-serif' : 'font-sans';

  // Card rounding style
  const cardRadius =
    tpl.card === 'box' ? 'rounded-none' : tpl.card === 'round' ? 'rounded-xl' : 'rounded-lg';

  // Is India GST specific?
  const isIndiaGst = tpl.id === 'in-gst' || tpl.taxIdLabel === 'GSTIN';

  const currency = document.currency || tpl.currency || 'INR';
  const summary = document.summary;
  const isInterState = summary.gstSupplyType === 'inter';

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onLogoUpload(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Dynamic input styling
  const editableInput = isDarkPaper
    ? 'bg-white/5 hover:bg-white/10 focus:bg-slate-900 text-slate-100 placeholder-slate-500 border border-slate-700/60 focus:border-lime-400 rounded px-1.5 py-0.5 outline-none transition-all'
    : 'bg-transparent hover:bg-slate-50/80 focus:bg-white text-slate-900 placeholder-slate-400 border border-dashed border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-0.5 outline-none transition-all';

  const bannerEditableInput =
    'bg-white/15 hover:bg-white/25 focus:bg-white focus:text-slate-900 text-white placeholder-white/60 border border-white/30 rounded px-1.5 py-0.5 outline-none transition-all';

  const activeHeaderInput = isBannerHeader ? bannerEditableInput : editableInput;

  // Active bank accounts
  const activeBankAccounts = useMemo(() => {
    const payConfig = document.paymentConfig;
    if (!payConfig?.bankAccounts?.length) return [];
    if (payConfig.selectedBankAccountIds?.length) {
      return payConfig.bankAccounts.filter((b) =>
        payConfig.selectedBankAccountIds!.includes(b.id)
      );
    }
    return payConfig.bankAccounts;
  }, [document.paymentConfig]);

  // Verified QR Code url
  const verifiedQrDataUrl = useMemo(() => {
    const payConfig = document.paymentConfig;
    if (!payConfig || !payConfig.display.showQrCode) return null;
    if (payConfig.qrCodeDataUrl && !payConfig.autoGenerateUpiQr) {
      return payConfig.qrCodeDataUrl;
    }
    if (payConfig.upiId) {
      return (
        generateVerifiedUpiQrSvgDataUrl({
          upiId: payConfig.upiId,
          payeeName: payConfig.upiPayeeName || document.sender.name,
          amount: summary.balanceDue > 0 ? summary.balanceDue : summary.grandTotal,
          currency,
          invoiceNumber: document.documentNumber,
        }) || payConfig.qrCodeDataUrl || null
      );
    }
    return payConfig.qrCodeDataUrl || null;
  }, [document.paymentConfig, document.sender.name, document.documentNumber, summary.balanceDue, summary.grandTotal, currency]);

  // Renders the logo uploader
  const renderLogo = (isInverse = false) => (
    <div className="inline-block relative group">
      {document.sender.logoUrl ? (
        <div className="relative inline-block">
          <img
            src={document.sender.logoUrl}
            alt="Business Logo"
            className={`h-14 max-w-[200px] object-contain cursor-pointer rounded ${
              isInverse ? 'bg-white p-1.5 ring-1 ring-black/10' : ''
            }`}
            onClick={triggerUpload}
            title="Click to replace logo"
          />
          <button
            type="button"
            onClick={onRemoveLogo}
            title="Remove Logo"
            className="no-print absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerUpload}
          className={`no-print flex items-center gap-2 px-3 py-1.5 border-2 border-dashed rounded-xl text-xs font-semibold transition-all ${
            isInverse
              ? 'border-white/40 text-white hover:border-white bg-white/10'
              : isDarkPaper
              ? 'border-slate-700 text-slate-300 hover:border-lime-400 hover:text-lime-400 bg-white/5'
              : 'border-slate-300 text-slate-600 hover:border-blue-600 hover:text-blue-600 bg-slate-50/70'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>+ Upload Business Logo</span>
        </button>
      )}
    </div>
  );

  return (
    <div
      className={`shadow-2xl overflow-hidden max-w-4xl mx-auto ${fontClass} relative transition-all border`}
      style={{
        backgroundColor: paperColor,
        color: textColor,
        borderColor: borderColor,
        borderRadius: tpl.card === 'box' ? 0 : 16,
      }}
    >
      {/* Hidden Logo File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        className="hidden"
      />

      {/* Top Banner Indicator Strip (for 'strip' or 'left' style) */}
      {!isBannerHeader && !isSidebarLayout && (
        <div className="h-2 w-full" style={{ backgroundColor: effectiveAccent }} />
      )}

      {/* Template Meta Pill / Badge on Top Bar */}
      <div
        className="px-6 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-[11px]"
        style={{
          backgroundColor: tintBg,
          borderColor: borderColor,
          color: mutedTextColor,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-extrabold uppercase tracking-wider" style={{ color: effectiveAccent }}>
            {tpl.name}
          </span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border border-current/20">
            {tpl.region}
          </span>
          {tpl.badge && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${effectiveAccent}18`,
                color: effectiveAccent,
              }}
            >
              {tpl.badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] font-medium">
          <span>{tpl.taxLabel} Rate: {tpl.taxRate}%</span>
          <span>•</span>
          <span>Currency: {currency}</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SIDEBAR ARCHITECTURE (Used by 'ch-sidebar') */}
      {/* ==================================================================== */}
      {isSidebarLayout ? (
        <div className="flex flex-col md:flex-row min-h-[900px]">
          {/* Left Sidebar */}
          <div
            className="w-full md:w-72 p-6 md:p-8 flex flex-col gap-6 text-white shrink-0"
            style={{ backgroundColor: effectiveAccent }}
          >
            {/* Seller */}
            <div className="space-y-3">
              {renderLogo(true)}
              <div>
                <input
                  type="text"
                  value={document.sender.name}
                  onChange={(e) => onUpdateSender('name', e.target.value)}
                  placeholder="Business Name"
                  className={`${bannerEditableInput} text-lg font-black w-full`}
                />
              </div>
              <div className="space-y-1 text-xs">
                <input
                  type="text"
                  value={document.sender.taxId || ''}
                  onChange={(e) => onUpdateSender('taxId', e.target.value.toUpperCase())}
                  placeholder={`${tpl.taxIdLabel}: e.g. CHE-123.456.789`}
                  className={`${bannerEditableInput} font-mono w-full`}
                />
                <input
                  type="text"
                  value={document.sender.address?.street1 || ''}
                  onChange={(e) => onUpdateSenderAddress('street1', e.target.value)}
                  placeholder="Street Address"
                  className={`${bannerEditableInput} w-full`}
                />
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    value={document.sender.address?.city || ''}
                    onChange={(e) => onUpdateSenderAddress('city', e.target.value)}
                    placeholder="City"
                    className={`${bannerEditableInput} w-full`}
                  />
                  <input
                    type="text"
                    value={document.sender.address?.postalCode || ''}
                    onChange={(e) => onUpdateSenderAddress('postalCode', e.target.value)}
                    placeholder="Postal Code"
                    className={`${bannerEditableInput} w-full font-mono`}
                  />
                </div>
                <input
                  type="text"
                  value={document.sender.address?.country || ''}
                  onChange={(e) => onUpdateSenderAddress('country', e.target.value)}
                  placeholder="Country"
                  className={`${bannerEditableInput} w-full`}
                />
              </div>
            </div>

            {/* Bill To in Sidebar */}
            <div className="pt-4 border-t border-white/20 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-80 block">
                Bill To (Customer)
              </span>
              <input
                type="text"
                value={document.client.name}
                onChange={(e) => onUpdateClient('name', e.target.value)}
                placeholder="Client Name"
                className={`${bannerEditableInput} font-bold text-sm w-full`}
              />
              <input
                type="text"
                value={document.client.taxId || ''}
                onChange={(e) => onUpdateClient('taxId', e.target.value.toUpperCase())}
                placeholder={`${tpl.taxIdLabel}: Customer Tax ID`}
                className={`${bannerEditableInput} font-mono text-xs w-full`}
              />
              <input
                type="text"
                value={document.client.billingAddress?.street1 || ''}
                onChange={(e) => onUpdateClientAddress('street1', e.target.value)}
                placeholder="Billing Street"
                className={`${bannerEditableInput} text-xs w-full`}
              />
              <div className="grid grid-cols-2 gap-1 text-xs">
                <input
                  type="text"
                  value={document.client.billingAddress?.city || ''}
                  onChange={(e) => onUpdateClientAddress('city', e.target.value)}
                  placeholder="City"
                  className={`${bannerEditableInput} w-full`}
                />
                <input
                  type="text"
                  value={document.client.billingAddress?.country || ''}
                  onChange={(e) => onUpdateClientAddress('country', e.target.value)}
                  placeholder="Country"
                  className={`${bannerEditableInput} w-full`}
                />
              </div>
            </div>

            {/* Banking Details in Sidebar */}
            <div className="pt-4 border-t border-white/20 text-xs space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-80 block">
                Payment Coordinates
              </span>
              <div className="opacity-90">{tpl.routingLabel}: {document.paymentConfig?.bankAccounts?.[0]?.ifscOrRoutingCode || 'CH93 0000 0000 0000'}</div>
              <div className="opacity-90">Account: {document.paymentConfig?.bankAccounts?.[0]?.accountNumber || '—'}</div>
              {document.paymentConfig?.upiId && (
                <div className="opacity-90">{tpl.vpaLabel}: {document.paymentConfig.upiId}</div>
              )}
            </div>

            {/* QR Code in Sidebar */}
            {verifiedQrDataUrl && (
              <div className="mt-auto pt-4 border-t border-white/20 flex flex-col items-center text-center">
                <div className="bg-white p-2 rounded-lg">
                  <img src={verifiedQrDataUrl} alt="Payment QR" className="w-24 h-24 object-contain" />
                </div>
                <span className="text-[10px] font-bold mt-1 opacity-90">{tpl.qrLabel}</span>
              </div>
            )}
          </div>

          {/* Right Main Body of Sidebar Layout */}
          <div className="flex-1 p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b" style={{ borderColor }}>
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ color: effectiveAccent }}>
                  {tpl.title}
                </h2>
                {tpl.subtitle && (
                  <p className="text-xs font-semibold opacity-70">{tpl.subtitle}</p>
                )}
              </div>
              <DocumentTypeSelector
                value={document.type}
                onChange={(newType) => onUpdateDoc('type', newType)}
                primaryColor={effectiveAccent}
              />
            </div>

            {/* Metadata line */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3 rounded-lg" style={{ backgroundColor: tintBg, borderColor }}>
              <div>
                <span className="text-[10px] font-bold block" style={{ color: mutedTextColor }}>Doc No:</span>
                <input
                  type="text"
                  value={document.documentNumber}
                  onChange={(e) => onUpdateDoc('documentNumber', e.target.value)}
                  className={`${editableInput} font-mono font-bold w-full`}
                />
              </div>
              <div>
                <span className="text-[10px] font-bold block" style={{ color: mutedTextColor }}>Issue Date:</span>
                <input
                  type="date"
                  value={document.issueDate}
                  onChange={(e) => onUpdateDoc('issueDate', e.target.value)}
                  className={`${editableInput} w-full`}
                />
              </div>
              <div>
                <span className="text-[10px] font-bold block" style={{ color: mutedTextColor }}>{tpl.dueLabel}:</span>
                <input
                  type="date"
                  value={document.dueDate || ''}
                  onChange={(e) => onUpdateDoc('dueDate', e.target.value)}
                  className={`${editableInput} w-full`}
                />
              </div>
              <div>
                <span className="text-[10px] font-bold block" style={{ color: mutedTextColor }}>PO / Ref:</span>
                <input
                  type="text"
                  value={document.referenceNumber || ''}
                  onChange={(e) => onUpdateDoc('referenceNumber', e.target.value)}
                  placeholder="PO-001"
                  className={`${editableInput} w-full`}
                />
              </div>
            </div>

            {/* Line items table */}
            {renderLineItemsTable()}

            {/* Summary & Totals */}
            {renderTotalsAndFooter()}
          </div>
        </div>
      ) : (
        /* ==================================================================== */
        /* STANDARD / BAND / CENTERED / BIG / LEFT HEADER ARCHITECTURES */
        /* ==================================================================== */
        <div>
          {/* Header Container */}
          <div
            className={`p-6 md:p-8 border-b ${
              isCenteredHeader ? 'text-center' : ''
            }`}
            style={{
              backgroundColor: isBannerHeader ? effectiveAccent : paperColor,
              color: isBannerHeader ? '#FFFFFF' : textColor,
              borderColor: borderColor,
            }}
          >
            {/* Header Content */}
            {isBannerHeader ? (
              /* --- BAND HEADER (UK VAT, AU GST, NZ GST, Proforma) --- */
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                      {tpl.title}
                    </span>
                    {tpl.badge && (
                      <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                        {tpl.badge}
                      </span>
                    )}
                  </div>
                  {tpl.subtitle && (
                    <p className="text-xs text-white/80 font-medium">{tpl.subtitle}</p>
                  )}
                  <DocumentTypeSelector
                    value={document.type}
                    onChange={(newType) => onUpdateDoc('type', newType)}
                    isBannerHeader
                    primaryColor={effectiveAccent}
                  />
                </div>

                <div className="space-y-1.5 text-xs text-white/90 md:text-right">
                  <div className="flex items-center md:justify-end gap-2">
                    <span className="font-semibold text-white/80">Doc No:</span>
                    <input
                      type="text"
                      value={document.documentNumber}
                      onChange={(e) => onUpdateDoc('documentNumber', e.target.value)}
                      className={`${bannerEditableInput} font-mono font-bold w-36 md:text-right`}
                    />
                  </div>
                  <div className="flex items-center md:justify-end gap-2">
                    <span className="font-semibold text-white/80">Issue Date:</span>
                    <input
                      type="date"
                      value={document.issueDate}
                      onChange={(e) => onUpdateDoc('issueDate', e.target.value)}
                      className={`${bannerEditableInput} w-36 md:text-right`}
                    />
                  </div>
                  <div className="flex items-center md:justify-end gap-2">
                    <span className="font-semibold text-white/80">{tpl.dueLabel}:</span>
                    <input
                      type="date"
                      value={document.dueDate || ''}
                      onChange={(e) => onUpdateDoc('dueDate', e.target.value)}
                      className={`${bannerEditableInput} w-36 md:text-right`}
                    />
                  </div>
                  <div className="flex items-center md:justify-end gap-2">
                    <span className="font-semibold text-white/80">PO / Ref:</span>
                    <input
                      type="text"
                      value={document.referenceNumber || ''}
                      onChange={(e) => onUpdateDoc('referenceNumber', e.target.value)}
                      placeholder="PO-001"
                      className={`${bannerEditableInput} w-36 md:text-right`}
                    />
                  </div>
                </div>
              </div>
            ) : isCenteredHeader ? (
              /* --- CENTERED HEADER (EU Reverse Charge, HK No Tax, Quotation) --- */
              <div className="flex flex-col items-center space-y-4 max-w-xl mx-auto">
                {renderLogo()}
                <div>
                  <input
                    type="text"
                    value={document.sender.name}
                    onChange={(e) => onUpdateSender('name', e.target.value)}
                    placeholder="Your Business Name"
                    className={`${editableInput} text-xl md:text-2xl font-black text-center w-full`}
                  />
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs mt-1" style={{ color: mutedTextColor }}>
                    <span>{tpl.taxIdLabel}:</span>
                    <input
                      type="text"
                      value={document.sender.taxId || ''}
                      onChange={(e) => onUpdateSender('taxId', e.target.value.toUpperCase())}
                      placeholder="Tax ID"
                      className={`${editableInput} font-mono text-center w-36`}
                    />
                    <span>•</span>
                    <input
                      type="email"
                      value={document.sender.email || ''}
                      onChange={(e) => onUpdateSender('email', e.target.value)}
                      placeholder="email@company.com"
                      className={`${editableInput} text-center w-40`}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t w-full flex flex-col items-center gap-2" style={{ borderColor }}>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: effectiveAccent }}>
                      {tpl.title}
                    </h2>
                    <DocumentTypeSelector
                      value={document.type}
                      onChange={(newType) => onUpdateDoc('type', newType)}
                      primaryColor={effectiveAccent}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono" style={{ color: mutedTextColor }}>
                    <div>
                      <span>#{document.documentNumber}</span>
                    </div>
                    <div>•</div>
                    <div>
                      <span>Date: {document.issueDate}</span>
                    </div>
                    <div>•</div>
                    <div>
                      <span>{tpl.dueLabel}: {document.dueDate || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isBigHeader ? (
              /* --- BIG TYPOGRAPHY HEADER (Singapore GST, Mexico Factura) --- */
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <div className="text-4xl md:text-6xl font-black tracking-tight" style={{ color: effectiveAccent }}>
                    {tpl.title}
                  </div>
                  {tpl.subtitle && (
                    <p className="text-sm font-bold opacity-75 mt-0.5">{tpl.subtitle}</p>
                  )}
                  <div className="mt-2">
                    <DocumentTypeSelector
                      value={document.type}
                      onChange={(newType) => onUpdateDoc('type', newType)}
                      primaryColor={effectiveAccent}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:text-right">
                  {renderLogo()}
                  <div>
                    <input
                      type="text"
                      value={document.sender.name}
                      onChange={(e) => onUpdateSender('name', e.target.value)}
                      placeholder="Your Business Name"
                      className={`${editableInput} text-xl font-black w-full md:text-right`}
                    />
                  </div>
                  <div className="text-xs" style={{ color: mutedTextColor }}>
                    <span>{tpl.taxIdLabel}: </span>
                    <input
                      type="text"
                      value={document.sender.taxId || ''}
                      onChange={(e) => onUpdateSender('taxId', e.target.value.toUpperCase())}
                      placeholder="Tax ID"
                      className={`${editableInput} font-mono font-bold w-36`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* --- LEFT TWO-COLUMN HEADER (India GST, US Sales Tax, Dark Mode Tech) --- */
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                {/* Left: Sender */}
                <div className="space-y-3 w-full md:w-7/12">
                  {renderLogo()}
                  <div>
                    <input
                      type="text"
                      value={document.sender.name}
                      onChange={(e) => onUpdateSender('name', e.target.value)}
                      placeholder="Your Business / Company Name"
                      className={`${editableInput} text-xl md:text-2xl font-black w-full`}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="font-bold shrink-0" style={{ color: mutedTextColor }}>
                        {tpl.taxIdLabel}:
                      </span>
                      <input
                        type="text"
                        value={document.sender.taxId || ''}
                        onChange={(e) => onUpdateSender('taxId', e.target.value.toUpperCase())}
                        placeholder={isIndiaGst ? '27AABCU9603R1ZM' : 'Tax ID Number'}
                        className={`${editableInput} font-mono font-bold uppercase w-full`}
                      />
                    </div>

                    {isIndiaGst && (
                      <div className="flex items-center gap-1">
                        <span className="font-bold shrink-0" style={{ color: mutedTextColor }}>
                          State:
                        </span>
                        <select
                          value={document.sender.address?.state || '27 - Maharashtra'}
                          onChange={(e) => onUpdateSenderAddress('state', e.target.value)}
                          className={`${editableInput} font-semibold w-full cursor-pointer`}
                          style={{ backgroundColor: paperColor }}
                        >
                          <option value="">Select GST State</option>
                          {INDIAN_STATES.map((st) => (
                            <option key={st.code} value={st.label}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <input
                      type="email"
                      value={document.sender.email || ''}
                      onChange={(e) => onUpdateSender('email', e.target.value)}
                      placeholder="billing@company.com"
                      className={`${editableInput} w-full`}
                    />

                    <input
                      type="text"
                      value={document.sender.phone || ''}
                      onChange={(e) => onUpdateSender('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className={`${editableInput} w-full`}
                    />

                    <input
                      type="text"
                      value={document.sender.address?.street1 || ''}
                      onChange={(e) => onUpdateSenderAddress('street1', e.target.value)}
                      placeholder="Street / Building Address"
                      className={`${editableInput} sm:col-span-2 w-full`}
                    />

                    <div className="grid grid-cols-3 gap-1 sm:col-span-2">
                      <input
                        type="text"
                        value={document.sender.address?.city || ''}
                        onChange={(e) => onUpdateSenderAddress('city', e.target.value)}
                        placeholder="City"
                        className={`${editableInput} w-full`}
                      />
                      <input
                        type="text"
                        value={document.sender.address?.postalCode || ''}
                        onChange={(e) => onUpdateSenderAddress('postalCode', e.target.value)}
                        placeholder="Postal Code"
                        className={`${editableInput} w-full font-mono`}
                      />
                      <input
                        type="text"
                        value={document.sender.address?.country || ''}
                        onChange={(e) => onUpdateSenderAddress('country', e.target.value)}
                        placeholder="Country"
                        className={`${editableInput} w-full`}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Type & Meta */}
                <div className="w-full md:w-5/12 text-left md:text-right space-y-2">
                  <div className="flex md:justify-end items-center">
                    <DocumentTypeSelector
                      value={document.type}
                      onChange={(newType) => onUpdateDoc('type', newType)}
                      primaryColor={effectiveAccent}
                    />
                  </div>

                  <div className="space-y-1.5 text-xs pt-1">
                    <div className="flex items-center md:justify-end gap-2">
                      <span className="font-semibold" style={{ color: mutedTextColor }}>
                        Doc No:
                      </span>
                      <input
                        type="text"
                        value={document.documentNumber}
                        onChange={(e) => onUpdateDoc('documentNumber', e.target.value)}
                        placeholder="INV-2026-00001"
                        className={`${editableInput} font-mono font-bold text-sm md:text-right w-40`}
                      />
                    </div>

                    <div className="flex items-center md:justify-end gap-2">
                      <span style={{ color: mutedTextColor }}>PO / Ref:</span>
                      <input
                        type="text"
                        value={document.referenceNumber || ''}
                        onChange={(e) => onUpdateDoc('referenceNumber', e.target.value)}
                        placeholder="PO-99201"
                        className={`${editableInput} md:text-right w-40`}
                      />
                    </div>

                    <div className="flex items-center md:justify-end gap-2">
                      <span style={{ color: mutedTextColor }}>Issue Date:</span>
                      <input
                        type="date"
                        value={document.issueDate}
                        onChange={(e) => onUpdateDoc('issueDate', e.target.value)}
                        className={`${editableInput} font-medium w-40`}
                        style={{ backgroundColor: paperColor }}
                      />
                    </div>

                    <div className="flex items-center md:justify-end gap-2">
                      <span style={{ color: mutedTextColor }}>{tpl.dueLabel}:</span>
                      <input
                        type="date"
                        value={document.dueDate || ''}
                        onChange={(e) => onUpdateDoc('dueDate', e.target.value)}
                        className={`${editableInput} font-medium w-40`}
                        style={{ backgroundColor: paperColor }}
                      />
                    </div>

                    <div className="flex items-center md:justify-end gap-2">
                      <span style={{ color: mutedTextColor }}>Terms:</span>
                      <input
                        type="text"
                        value={document.paymentTerms || ''}
                        onChange={(e) => onUpdateDoc('paymentTerms', e.target.value)}
                        placeholder="Net 30 Days"
                        className={`${editableInput} md:text-right w-40`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* BODY: BILL TO, SUPPLY / TAX CALLOUT, ITEMS TABLE, TOTALS */}
          {/* ================================================================ */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Bill To & Supply Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Customer / Bill To Card */}
              <div
                className={`md:col-span-7 p-4 border space-y-2 ${cardRadius}`}
                style={{ backgroundColor: tintBg, borderColor }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b" style={{ borderColor }}>
                  <span
                    className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                    style={{ color: effectiveAccent }}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Bill To (Customer / Recipient)
                  </span>

                  {onSelectCustomer && (
                    <div className="no-print flex items-center gap-1.5">
                      <select
                        aria-label="Select Saved Customer"
                        value={selectedCustomerId}
                        onChange={(e) => {
                          if (e.target.value) {
                            onSelectCustomer(e.target.value);
                          }
                        }}
                        className="text-xs font-semibold border rounded-lg px-2 py-0.5 cursor-pointer max-w-[200px]"
                        style={{ backgroundColor: paperColor, borderColor, color: textColor }}
                      >
                        <option value="">
                          {savedCustomers.length > 0
                            ? `Select Customer (${savedCustomers.length})...`
                            : 'Select Customer...'}
                        </option>
                        {savedCustomers.map((cust) => (
                          <option key={cust.id} value={cust.id}>
                            {cust.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={document.client.name}
                  onChange={(e) => onUpdateClient('name', e.target.value)}
                  placeholder="Customer / Company Name"
                  className={`${editableInput} font-bold text-sm w-full`}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="font-bold shrink-0" style={{ color: mutedTextColor }}>
                      {tpl.taxIdLabel}:
                    </span>
                    <input
                      type="text"
                      value={document.client.taxId || ''}
                      onChange={(e) => onUpdateClient('taxId', e.target.value.toUpperCase())}
                      placeholder={isIndiaGst ? '27AAACR5055K1Z7' : 'Customer Tax ID'}
                      className={`${editableInput} font-mono font-bold uppercase w-full`}
                    />
                  </div>

                  {isIndiaGst && (
                    <div className="flex items-center gap-1">
                      <span className="font-bold shrink-0" style={{ color: mutedTextColor }}>
                        State:
                      </span>
                      <select
                        value={document.client.billingAddress?.state || '27 - Maharashtra'}
                        onChange={(e) => onUpdateClientAddress('state', e.target.value)}
                        className={`${editableInput} font-semibold w-full cursor-pointer`}
                        style={{ backgroundColor: paperColor }}
                      >
                        <option value="">Select GST State</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st.code} value={st.label}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <input
                    type="email"
                    value={document.client.email || ''}
                    onChange={(e) => onUpdateClient('email', e.target.value)}
                    placeholder="client@domain.com"
                    className={`${editableInput} w-full`}
                  />

                  <input
                    type="text"
                    value={document.client.phone || ''}
                    onChange={(e) => onUpdateClient('phone', e.target.value)}
                    placeholder="+1 555 123 4567"
                    className={`${editableInput} w-full`}
                  />

                  <input
                    type="text"
                    value={document.client.billingAddress?.street1 || ''}
                    onChange={(e) => onUpdateClientAddress('street1', e.target.value)}
                    placeholder="Billing Street Address"
                    className={`${editableInput} sm:col-span-2 w-full`}
                  />

                  <div className="grid grid-cols-3 gap-1 sm:col-span-2">
                    <input
                      type="text"
                      value={document.client.billingAddress?.city || ''}
                      onChange={(e) => onUpdateClientAddress('city', e.target.value)}
                      placeholder="City"
                      className={`${editableInput} w-full`}
                    />
                    <input
                      type="text"
                      value={document.client.billingAddress?.postalCode || ''}
                      onChange={(e) => onUpdateClientAddress('postalCode', e.target.value)}
                      placeholder="ZIP / PIN"
                      className={`${editableInput} w-full font-mono`}
                    />
                    <input
                      type="text"
                      value={document.client.billingAddress?.country || ''}
                      onChange={(e) => onUpdateClientAddress('country', e.target.value)}
                      placeholder="Country"
                      className={`${editableInput} w-full`}
                    />
                  </div>
                </div>
              </div>

              {/* Tax & Supply Callout / Balance Due */}
              <div
                className={`md:col-span-5 p-4 border flex flex-col justify-between space-y-3 ${cardRadius}`}
                style={{ backgroundColor: tintBg, borderColor }}
              >
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: mutedTextColor }}>
                    {tpl.supplyTitle || 'Tax & Supply Determination'}
                  </span>
                  <div className="p-2.5 rounded-lg border space-y-1.5" style={{ backgroundColor: paperColor, borderColor }}>
                    {isIndiaGst ? (
                      <>
                        <div className="flex justify-between">
                          <span style={{ color: mutedTextColor }}>Supplier State:</span>
                          <span className="font-bold">{document.sender.address?.state || '27 - Maharashtra'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: mutedTextColor }}>Place of Supply:</span>
                          <span className="font-bold">{document.client.billingAddress?.state || '27 - Maharashtra'}</span>
                        </div>
                        <div className="pt-1 border-t flex justify-between items-center" style={{ borderColor }}>
                          <span style={{ color: mutedTextColor }}>Tax Classification:</span>
                          <span
                            className="font-bold px-2 py-0.5 rounded text-[11px]"
                            style={{ backgroundColor: `${effectiveAccent}18`, color: effectiveAccent }}
                          >
                            {isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span style={{ color: mutedTextColor }}>Tax Rule:</span>
                          <span className="font-bold">{tpl.taxLabel} Standard ({tpl.taxRate}%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: mutedTextColor }}>Jurisdiction:</span>
                          <span className="font-bold">{tpl.region} Standards</span>
                        </div>
                        {tpl.note && (
                          <div className="pt-1 border-t text-[10px]" style={{ borderColor, color: mutedTextColor }}>
                            {tpl.note}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div
                  className="p-3.5 rounded-xl flex justify-between items-center text-white"
                  style={{ backgroundColor: effectiveAccent }}
                >
                  <div>
                    <div className="text-[10px] uppercase font-black opacity-85">{tpl.balanceLabel}</div>
                    <div className="text-xs opacity-90">{currency}</div>
                  </div>
                  <div className="text-xl font-black font-mono">
                    {formatCurrency(summary.balanceDue, currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* Line items table */}
            {renderLineItemsTable()}

            {/* Summary, Totals, Bank, and Notes */}
            {renderTotalsAndFooter()}
          </div>
        </div>
      )}
    </div>
  );

  /* ======================================================================== */
  /* HELPER SUB-RENDERERS: LINE ITEMS TABLE & TOTALS */
  /* ======================================================================== */
  function renderLineItemsTable() {
    // Determine table header style
    const headBg =
      tpl.tableHead === 'fill'
        ? effectiveAccent
        : tpl.tableHead === 'tint'
        ? tintBg
        : 'transparent';

    const headColor =
      tpl.tableHead === 'fill' ? '#FFFFFF' : textColor;

    return (
      <div className="space-y-3">
        <div className="overflow-x-auto border rounded-xl" style={{ borderColor }}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className="uppercase tracking-wider text-[10px] font-bold"
                style={{
                  backgroundColor: headBg,
                  color: headColor,
                  borderBottom: `2px solid ${borderColor}`,
                }}
              >
                <th className="py-2.5 px-2 w-7 text-center">#</th>
                <th className="py-2.5 px-2.5 min-w-[210px]">Item Description</th>
                <th className="py-2.5 px-2 w-24 text-center">{isIndiaGst ? 'HSN/SAC' : 'Code'}</th>
                <th className="py-2.5 px-2 w-16 text-right">Qty</th>
                <th className="py-2.5 px-2 w-24 text-right">Rate</th>
                <th className="py-2.5 px-2 w-20 text-right">Disc %</th>
                {isIndiaGst ? (
                  <>
                    <th className="py-2.5 px-2 w-20 text-right">GST %</th>
                    {isInterState ? (
                      <th className="py-2.5 px-2 w-24 text-right">IGST Amt</th>
                    ) : (
                      <>
                        <th className="py-2.5 px-2 w-24 text-right">CGST</th>
                        <th className="py-2.5 px-2 w-24 text-right">SGST</th>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <th className="py-2.5 px-2 w-20 text-right">{tpl.taxLabel} %</th>
                    <th className="py-2.5 px-2 w-24 text-right">{tpl.taxLabel} Amt</th>
                  </>
                )}
                <th className="py-2.5 px-2.5 w-28 text-right">Total</th>
                <th className="py-2.5 px-2 w-14 text-center no-print">Act</th>
              </tr>
            </thead>

            <tbody className="divide-y" style={{ borderColor }}>
              {document.items.map((item, idx) => {
                const isEven = idx % 2 === 0;
                const rowBg = tpl.zebra
                  ? isEven
                    ? paperColor
                    : tintBg
                  : paperColor;

                return (
                  <tr
                    key={item.id}
                    className="group transition-colors"
                    style={{ backgroundColor: rowBg }}
                  >
                    <td className="py-2.5 px-2 text-center font-mono" style={{ color: mutedTextColor }}>
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-2 space-y-1">
                      {onSelectCatalogItem && (
                        <div className="no-print">
                          <select
                            aria-label={`Select Saved Item for Row ${idx + 1}`}
                            value={(item as any).productId || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                onSelectCatalogItem(idx, e.target.value);
                              }
                            }}
                            className="w-full text-[11px] font-semibold border rounded px-1.5 py-0.5 cursor-pointer"
                            style={{ backgroundColor: paperColor, borderColor, color: textColor }}
                          >
                            <option value="">
                              {savedItems.length > 0
                                ? `📦 Select Saved Item (${savedItems.length})...`
                                : '📦 Select Saved Item...'}
                            </option>
                            {savedItems.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name} — {formatCurrency(prod.unitPrice, currency)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => onUpdateItem(idx, 'description', e.target.value)}
                        placeholder="Item or service description..."
                        className={`${editableInput} w-full font-medium`}
                      />
                    </td>
                    <td className="py-2.5 px-1.5">
                      <input
                        type="text"
                        value={item.hsnCode || ''}
                        onChange={(e) => onUpdateItem(idx, 'hsnCode', e.target.value)}
                        placeholder={isIndiaGst ? '998314' : 'SKU-01'}
                        className={`${editableInput} w-full text-center font-mono`}
                      />
                    </td>
                    <td className="py-2.5 px-1.5">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => onUpdateItem(idx, 'quantity', Number(e.target.value))}
                        className={`${editableInput} w-full text-right font-mono`}
                      />
                    </td>
                    <td className="py-2.5 px-1.5">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) => onUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                        className={`${editableInput} w-full text-right font-mono`}
                      />
                    </td>
                    <td className="py-2.5 px-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={item.discountValue || 0}
                        onChange={(e) =>
                          onUpdateItem(idx, 'discountValue', Number(e.target.value))
                        }
                        className={`${editableInput} w-full text-right font-mono`}
                      />
                    </td>

                    {/* Tax columns */}
                    {isIndiaGst ? (
                      <>
                        <td className="py-2.5 px-1.5">
                          <select
                            value={item.taxRate ?? 18}
                            onChange={(e) => onUpdateItem(idx, 'taxRate', Number(e.target.value))}
                            className={`${editableInput} w-full text-right font-mono cursor-pointer`}
                            style={{ backgroundColor: paperColor }}
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </td>
                        {isInterState ? (
                          <td className="py-2.5 px-2 text-right font-mono" style={{ color: mutedTextColor }}>
                            <div>{formatCurrency(item.igstAmount ?? item.taxAmount, currency)}</div>
                            <div className="text-[10px] opacity-75">({item.taxRate || 0}%)</div>
                          </td>
                        ) : (
                          <>
                            <td className="py-2.5 px-2 text-right font-mono" style={{ color: mutedTextColor }}>
                              <div>{formatCurrency(item.cgstAmount ?? item.taxAmount / 2, currency)}</div>
                              <div className="text-[10px] opacity-75">({(item.taxRate || 0) / 2}%)</div>
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono" style={{ color: mutedTextColor }}>
                              <div>{formatCurrency(item.sgstAmount ?? item.taxAmount / 2, currency)}</div>
                              <div className="text-[10px] opacity-75">({(item.taxRate || 0) / 2}%)</div>
                            </td>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-1.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.taxRate ?? tpl.taxRate}
                            onChange={(e) => onUpdateItem(idx, 'taxRate', Number(e.target.value))}
                            className={`${editableInput} w-full text-right font-mono`}
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono" style={{ color: mutedTextColor }}>
                          {formatCurrency(item.taxAmount, currency)}
                        </td>
                      </>
                    )}

                    <td className="py-2.5 px-2.5 text-right font-mono font-bold">
                      {formatCurrency(item.lineTotal, currency)}
                    </td>

                    <td className="py-2.5 px-1.5 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onDuplicateItem(idx)}
                          title="Duplicate Item"
                          className="p-1 hover:text-blue-500 rounded"
                          style={{ color: mutedTextColor }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(idx)}
                          disabled={document.items.length <= 1}
                          title="Remove Item"
                          className="p-1 hover:text-rose-500 disabled:opacity-30 rounded"
                          style={{ color: mutedTextColor }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action button: Add item */}
        <div className="no-print flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border-2 border-dashed transition-all hover:shadow-xs"
            style={{
              borderColor: `${effectiveAccent}60`,
              color: effectiveAccent,
              backgroundColor: `${effectiveAccent}0d`,
            }}
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Blank Line Item</span>
          </button>

          {onAddCatalogItem && savedItems.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Package className="h-4 w-4" style={{ color: mutedTextColor }} />
              <select
                aria-label="Quick Add Saved Item"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onAddCatalogItem(e.target.value);
                  }
                }}
                className="text-xs font-semibold border rounded-lg px-2.5 py-1.5 cursor-pointer shadow-2xs"
                style={{ backgroundColor: paperColor, borderColor, color: textColor }}
              >
                <option value="">+ Add from Saved Items ({savedItems.length})...</option>
                {savedItems.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} — {formatCurrency(prod.unitPrice, currency)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderTotalsAndFooter() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t" style={{ borderColor }}>
        {/* Left 7 Cols: Tax Summary, Payment Coordinates, Notes */}
        <div className="md:col-span-7 space-y-4">
          {/* GST breakdown (for India) or Tax Summary (for foreign) */}
          {summary.taxBreakdown.length > 0 && (
            <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: tintBg, borderColor }}>
              <div
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex justify-between border-b"
                style={{ backgroundColor: `${effectiveAccent}12`, borderColor, color: effectiveAccent }}
              >
                <span>{tpl.taxLabel} Tax Breakdown</span>
                <span>Rate Analysis</span>
              </div>
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b text-[10px]" style={{ borderColor, color: mutedTextColor }}>
                    <th className="py-1.5 px-2.5 text-left">Taxable Value</th>
                    <th className="py-1.5 px-2 text-right">Rate</th>
                    <th className="py-1.5 px-2.5 text-right">{tpl.taxLabel} Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor }}>
                  {summary.taxBreakdown.map((tb) => (
                    <tr key={tb.rate}>
                      <td className="py-1.5 px-2.5">
                        {formatCurrency(tb.taxableAmount, currency)}
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        {tb.rate}%
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-bold">
                        {formatCurrency(tb.taxAmount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment coordinates card */}
          {document.paymentConfig &&
            ((document.paymentConfig.display.showBankDetails && activeBankAccounts.length > 0) ||
              (document.paymentConfig.display.showUpiId && document.paymentConfig.upiId) ||
              document.paymentConfig.display.showQrCode) && (
              <div className="p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between gap-4" style={{ backgroundColor: tintBg, borderColor }}>
                <div className="space-y-2 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: effectiveAccent }}>
                    Payment Instructions & Bank Coordinates
                  </span>

                  {document.paymentConfig.display.showBankDetails &&
                    activeBankAccounts.map((bank) => (
                      <div
                        key={bank.id}
                        className="text-[11px] p-2.5 rounded-lg border grid grid-cols-2 gap-x-3 gap-y-1"
                        style={{ backgroundColor: paperColor, borderColor }}
                      >
                        <div>
                          <span style={{ color: mutedTextColor }}>Account Holder: </span>
                          <span className="font-bold">{bank.accountHolderName}</span>
                        </div>
                        <div>
                          <span style={{ color: mutedTextColor }}>Bank Name: </span>
                          <span className="font-bold">{bank.bankName}</span>
                        </div>
                        <div>
                          <span style={{ color: mutedTextColor }}>Account No: </span>
                          <span className="font-mono font-bold">{bank.accountNumber}</span>
                        </div>
                        <div>
                          <span style={{ color: mutedTextColor }}>{tpl.routingLabel}: </span>
                          <span className="font-mono font-bold">{bank.ifscOrRoutingCode}</span>
                        </div>
                        {bank.branchName && (
                          <div>
                            <span style={{ color: mutedTextColor }}>Branch: </span>
                            <span>{bank.branchName}</span>
                          </div>
                        )}
                      </div>
                    ))}

                  {document.paymentConfig.display.showUpiId && document.paymentConfig.upiId && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: mutedTextColor }}>
                        {tpl.vpaLabel}:
                      </span>
                      <span
                        className="font-mono text-xs font-bold px-2 py-0.5 rounded border"
                        style={{ backgroundColor: paperColor, borderColor }}
                      >
                        {document.paymentConfig.upiId}
                      </span>
                    </div>
                  )}
                </div>

                {verifiedQrDataUrl && (
                  <div
                    className="shrink-0 flex flex-col items-center justify-center p-2 rounded-lg border text-center"
                    style={{ backgroundColor: paperColor, borderColor }}
                  >
                    <img src={verifiedQrDataUrl} alt="Payment QR" className="h-20 w-20 object-contain" />
                    <span className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: mutedTextColor }}>
                      {tpl.qrLabel}
                    </span>
                  </div>
                )}
              </div>
            )}

          {/* Payment instructions note */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: mutedTextColor }}>
              Payment Instructions / Wire Notes
            </label>
            <textarea
              rows={2}
              value={document.paymentInstructions || ''}
              onChange={(e) => onUpdateDoc('paymentInstructions', e.target.value)}
              placeholder="e.g. Please quote invoice number in your wire transfer reference..."
              className={`${editableInput} w-full text-xs font-mono p-2`}
            />
          </div>

          {/* Terms & Conditions */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: mutedTextColor }}>
              Terms & Conditions
            </label>
            <textarea
              rows={2}
              value={document.notes || ''}
              onChange={(e) => onUpdateDoc('notes', e.target.value)}
              placeholder={tpl.terms || 'Payment terms & warranties...'}
              className={`${editableInput} w-full text-xs p-2`}
            />
          </div>
        </div>

        {/* Right 5 Cols: Calculation Totals & Signatory */}
        <div className="md:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border space-y-2 text-xs" style={{ backgroundColor: tintBg, borderColor }}>
            <div className="flex justify-between" style={{ color: mutedTextColor }}>
              <span>Subtotal (Gross)</span>
              <span className="font-mono font-semibold" style={{ color: textColor }}>
                {formatCurrency(summary.subtotal, currency)}
              </span>
            </div>

            {/* Extra Discount */}
            <div className="flex items-center justify-between gap-2" style={{ color: mutedTextColor }}>
              <div className="flex items-center gap-1">
                <span>Extra Discount</span>
                <select
                  value={document.documentDiscountType || 'percentage'}
                  onChange={(e) =>
                    onUpdateDiscount(
                      e.target.value as 'percentage' | 'fixed',
                      document.documentDiscountValue || 0
                    )
                  }
                  className="text-[10px] border rounded px-1 py-0.5"
                  style={{ backgroundColor: paperColor, borderColor, color: textColor }}
                >
                  <option value="percentage">%</option>
                  <option value="fixed">Flat</option>
                </select>
              </div>
              <input
                type="number"
                min="0"
                value={document.documentDiscountValue || 0}
                onChange={(e) =>
                  onUpdateDiscount(
                    document.documentDiscountType || 'percentage',
                    Number(e.target.value)
                  )
                }
                className={`${editableInput} w-24 text-right font-mono`}
              />
            </div>

            <div className="flex justify-between border-t pt-1.5" style={{ borderColor }}>
              <span className="font-semibold">Taxable Amount</span>
              <span className="font-mono font-bold" style={{ color: textColor }}>
                {formatCurrency(summary.taxableSubtotal, currency)}
              </span>
            </div>

            <div className="flex justify-between" style={{ color: mutedTextColor }}>
              <span>Total {tpl.taxLabel}</span>
              <span className="font-mono font-semibold" style={{ color: textColor }}>
                {formatCurrency(summary.totalTax, currency)}
              </span>
            </div>

            {/* Shipping & Extra Charges */}
            <div className="flex items-center justify-between gap-2" style={{ color: mutedTextColor }}>
              <span>Shipping / Delivery</span>
              <input
                type="number"
                min="0"
                value={document.shippingFee || 0}
                onChange={(e) => onUpdateShipping(Number(e.target.value))}
                className={`${editableInput} w-24 text-right font-mono`}
              />
            </div>

            <div className="flex items-center justify-between gap-2" style={{ color: mutedTextColor }}>
              <span>Packaging / Extra Charges</span>
              <input
                type="number"
                min="0"
                value={document.extraCharges || 0}
                onChange={(e) => onUpdateExtra(Number(e.target.value))}
                className={`${editableInput} w-24 text-right font-mono`}
              />
            </div>

            {/* Round-off */}
            {summary.roundOffAmount !== undefined && summary.roundOffAmount !== 0 && (
              <div className="flex justify-between text-slate-500 font-mono text-[11px]">
                <span>Round Off</span>
                <span>{summary.roundOffAmount > 0 ? `+${summary.roundOffAmount}` : summary.roundOffAmount}</span>
              </div>
            )}

            {/* Grand Total */}
            <div
              className="flex justify-between items-baseline border-t pt-2 mt-1 text-sm font-extrabold"
              style={{ borderColor, color: effectiveAccent }}
            >
              <span>{tpl.finalLabel || 'Grand Total'}</span>
              <span className="text-lg font-black font-mono">
                {formatCurrency(summary.grandTotal, currency)}
              </span>
            </div>

            {/* Amount Paid & Balance Due */}
            <div className="border-t pt-2 space-y-1" style={{ borderColor }}>
              <div className="flex items-center justify-between gap-2" style={{ color: mutedTextColor }}>
                <span>Amount Paid</span>
                <input
                  type="number"
                  min="0"
                  value={summary.amountPaid || 0}
                  onChange={(e) => onUpdatePaid(Number(e.target.value))}
                  className={`${editableInput} w-28 text-right font-mono`}
                />
              </div>

              <div
                className="flex justify-between items-baseline pt-1.5 font-black text-sm"
                style={{ color: effectiveAccent }}
              >
                <span>{tpl.balanceLabel}:</span>
                <span className="text-xl font-mono">
                  {formatCurrency(summary.balanceDue, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Authorized Signatory Block */}
          <div
            className="p-4 border rounded-xl flex flex-col justify-end items-end space-y-2 text-right"
            style={{ backgroundColor: tintBg, borderColor }}
          >
            <div className="w-48 border-b pb-1" style={{ borderColor }}>
              <input
                type="text"
                value={document.signatoryName || ''}
                onChange={(e) => onUpdateDoc('signatoryName', e.target.value)}
                placeholder="Authorized Signatory"
                className={`${editableInput} text-right font-bold text-xs w-full`}
              />
            </div>
            <span className="text-[10px] uppercase font-semibold" style={{ color: mutedTextColor }}>
              For {document.sender.name || 'Company'}
            </span>
          </div>
        </div>
      </div>
    );
  }
};
