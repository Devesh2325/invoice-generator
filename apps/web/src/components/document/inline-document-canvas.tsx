'use client';

import React, { useRef } from 'react';
import {
  DocumentModel,
  DocumentType,
  Party,
  formatCurrency,
  INDIAN_STATES,
  generateVerifiedUpiQrSvgDataUrl,
} from '@invoice/core';
import { ProductCatalogItem } from '@invoice/api';
import { getTemplate } from '@invoice/theme';
import {
  Upload,
  Plus,
  Trash2,
  Copy,
  X,
  Users,
  Package,
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
  const templateMeta = getTemplate(document.templateId || 'cleartax_gst');
  const baseTokens = templateMeta.defaultTokens;

  // Dynamic theme tokens (respecting custom overrides)
  const primaryColor = document.customTheme?.primaryColor || baseTokens.primaryColor;
  const secondaryColor = document.customTheme?.secondaryColor || baseTokens.secondaryColor;
  const fontFamily = document.customTheme?.fontFamily || baseTokens.fontFamily;
  const headerLayout = baseTokens.headerLayout;
  const isBannerHeader = headerLayout === 'banner';
  const isTallyGrid = templateMeta.id === 'tally_prime';
  const isSidebarLayout = headerLayout === 'sidebar';

  const currency = document.currency || 'INR';
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

  const fontClass =
    fontFamily === 'serif'
      ? 'font-serif'
      : fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  // Light vs Dark Banner input styles
  const editableInput =
    'bg-transparent hover:bg-blue-50/70 focus:bg-white focus:ring-1 focus:ring-blue-500 border border-dashed border-slate-200 hover:border-blue-300 focus:border-blue-500 rounded px-1.5 py-0.5 transition-all outline-none';

  const bannerEditableInput =
    'bg-white/10 hover:bg-white/20 focus:bg-white focus:text-slate-900 text-white placeholder-white/60 border border-white/25 rounded px-1.5 py-0.5 transition-all outline-none';

  const activeHeaderInput = isBannerHeader ? bannerEditableInput : editableInput;

  return (
    <div
      className={`bg-white text-slate-900 shadow-2xl ${
        isTallyGrid
          ? 'border-2 border-slate-900 rounded-none'
          : 'border border-slate-200 rounded-2xl'
      } overflow-hidden max-w-4xl mx-auto ${fontClass} relative transition-all flex`}
    >
      {/* Left Sidebar Accent for FreshBooks style */}
      {isSidebarLayout && (
        <div className="w-3 shrink-0" style={{ backgroundColor: primaryColor }} />
      )}

      <div className="flex-1">
        {/* Hidden Logo File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="image/*"
          className="hidden"
        />

        {/* Top Accent Strip for non-banner templates */}
        {!isBannerHeader && !isTallyGrid && !isSidebarLayout && (
          <div className="h-2.5 w-full" style={{ backgroundColor: primaryColor }} />
        )}

        {/* ================================================================== */}
        {/* HEADER SECTION (Reflects Banner / Tally / Centered / Split Theme) */}
        {/* ================================================================== */}
        <div
          className={`p-6 md:p-10 border-b ${
            isTallyGrid ? 'border-b-2 border-slate-900 bg-slate-50/40' : 'border-slate-200'
          }`}
          style={
            isBannerHeader
              ? {
                  background:
                    templateMeta.id === 'canva_studio'
                      ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                      : primaryColor,
                  color: '#FFFFFF',
                }
              : undefined
          }
        >
          {/* Template Style Pill Indicator */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-current/10 text-[11px]">
            <span className={isBannerHeader ? 'text-white/80 font-medium' : 'text-slate-400 font-medium'}>
              Active Template: <strong className={isBannerHeader ? 'text-white' : 'text-slate-700'}>{templateMeta.name}</strong> ({templateMeta.competitorStyle})
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                isBannerHeader
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isInterState ? '⚡ Inter-State GST (IGST)' : '🇮🇳 Intra-State GST (CGST + SGST)'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            {/* Left: Company Logo & Full Sender Details */}
            <div className="space-y-2.5 w-full md:w-7/12">
              <div className="inline-block relative group">
                {document.sender.logoUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={document.sender.logoUrl}
                      alt="Company Logo"
                      className={`h-16 max-w-[220px] object-contain cursor-pointer rounded ${
                        isBannerHeader ? 'bg-white p-1.5' : ''
                      }`}
                      onClick={triggerUpload}
                      title="Click to replace logo"
                    />
                    <button
                      type="button"
                      onClick={onRemoveLogo}
                      title="Remove Logo"
                      className="no-print absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={triggerUpload}
                    className={`no-print flex items-center gap-2 px-3.5 py-2 border-2 border-dashed rounded-xl text-xs font-semibold transition-all ${
                      isBannerHeader
                        ? 'border-white/40 text-white hover:border-white bg-white/10'
                        : 'border-slate-300 text-slate-600 hover:border-blue-600 hover:text-blue-600 bg-slate-50/70'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span>+ Upload Company Logo</span>
                  </button>
                )}
              </div>

              {/* Company Name */}
              <div>
                <input
                  type="text"
                  value={document.sender.name}
                  onChange={(e) => onUpdateSender('name', e.target.value)}
                  placeholder="Your Business / Company Name"
                  className={`${activeHeaderInput} text-xl md:text-2xl font-black w-full`}
                />
              </div>

              {/* Sender GSTIN, Email, Phone, Address, State, PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                <div className="flex items-center gap-1">
                  <span className={`font-bold shrink-0 ${isBannerHeader ? 'text-white/80' : 'text-slate-500'}`}>
                    GSTIN:
                  </span>
                  <input
                    type="text"
                    value={document.sender.taxId || ''}
                    onChange={(e) => onUpdateSender('taxId', e.target.value.toUpperCase())}
                    placeholder="27AABCU9603R1ZM"
                    className={`${activeHeaderInput} font-mono font-bold uppercase w-full`}
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className={`font-bold shrink-0 ${isBannerHeader ? 'text-white/80' : 'text-slate-500'}`}>
                    State:
                  </span>
                  <select
                    value={document.sender.address?.state || '27 - Maharashtra'}
                    onChange={(e) => onUpdateSenderAddress('state', e.target.value)}
                    className={`${activeHeaderInput} font-semibold w-full cursor-pointer text-slate-900 bg-white/90`}
                  >
                    <option value="">Select GST State</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st.code} value={st.label}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="email"
                  value={document.sender.email || ''}
                  onChange={(e) => onUpdateSender('email', e.target.value)}
                  placeholder="billing@company.in"
                  className={`${activeHeaderInput} w-full`}
                />

                <input
                  type="text"
                  value={document.sender.phone || ''}
                  onChange={(e) => onUpdateSender('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`${activeHeaderInput} w-full`}
                />

                <input
                  type="text"
                  value={document.sender.address?.street1 || ''}
                  onChange={(e) => onUpdateSenderAddress('street1', e.target.value)}
                  placeholder="Street / Building Address"
                  className={`${activeHeaderInput} sm:col-span-2 w-full`}
                />

                <div className="grid grid-cols-3 gap-1.5 sm:col-span-2">
                  <input
                    type="text"
                    value={document.sender.address?.city || ''}
                    onChange={(e) => onUpdateSenderAddress('city', e.target.value)}
                    placeholder="City"
                    className={`${activeHeaderInput} w-full`}
                  />
                  <input
                    type="text"
                    value={document.sender.address?.postalCode || ''}
                    onChange={(e) => onUpdateSenderAddress('postalCode', e.target.value)}
                    placeholder="PIN Code"
                    className={`${activeHeaderInput} w-full font-mono`}
                  />
                  <input
                    type="text"
                    value={document.sender.address?.country || ''}
                    onChange={(e) => onUpdateSenderAddress('country', e.target.value)}
                    placeholder="Country"
                    className={`${activeHeaderInput} w-full`}
                  />
                </div>
              </div>
            </div>

            {/* Right: Document Type & Metadata */}
            <div className="w-full md:w-5/12 text-left md:text-right space-y-2">
              <div className="flex md:justify-end items-center">
                <DocumentTypeSelector
                  value={document.type}
                  onChange={(newType) => onUpdateDoc('type', newType)}
                  isBannerHeader={isBannerHeader}
                  primaryColor={primaryColor}
                  align="right"
                />
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex items-center md:justify-end gap-2">
                  <span className={isBannerHeader ? 'text-white/80 font-semibold' : 'text-slate-500 font-semibold'}>
                    Invoice No:
                  </span>
                  <input
                    type="text"
                    value={document.documentNumber}
                    onChange={(e) => onUpdateDoc('documentNumber', e.target.value)}
                    placeholder="INV-2026-00001"
                    className={`${activeHeaderInput} font-mono font-bold text-sm md:text-right w-40`}
                  />
                </div>

                <div className="flex items-center md:justify-end gap-2">
                  <span className={isBannerHeader ? 'text-white/80' : 'text-slate-500'}>
                    PO / Ref No:
                  </span>
                  <input
                    type="text"
                    value={document.referenceNumber || ''}
                    onChange={(e) => onUpdateDoc('referenceNumber', e.target.value)}
                    placeholder="PO-99201"
                    className={`${activeHeaderInput} md:text-right w-40`}
                  />
                </div>

                <div className="flex items-center md:justify-end gap-2">
                  <span className={isBannerHeader ? 'text-white/80' : 'text-slate-500'}>
                    Issue Date:
                  </span>
                  <input
                    type="date"
                    value={document.issueDate}
                    onChange={(e) => onUpdateDoc('issueDate', e.target.value)}
                    className={`${activeHeaderInput} font-medium w-40 text-slate-900 bg-white/90`}
                  />
                </div>

                <div className="flex items-center md:justify-end gap-2">
                  <span className={isBannerHeader ? 'text-white/80' : 'text-slate-500'}>
                    {document.type === 'purchase_order'
                      ? 'Delivery Date:'
                      : document.type === 'estimate'
                      ? 'Valid Until:'
                      : 'Due Date:'}
                  </span>
                  <input
                    type="date"
                    value={document.dueDate || ''}
                    onChange={(e) => onUpdateDoc('dueDate', e.target.value)}
                    className={`${activeHeaderInput} font-medium w-40 text-slate-900 bg-white/90`}
                  />
                </div>

                <div className="flex items-center md:justify-end gap-2">
                  <span className={isBannerHeader ? 'text-white/80' : 'text-slate-500'}>
                    Payment Terms:
                  </span>
                  <input
                    type="text"
                    value={document.paymentTerms || ''}
                    onChange={(e) => onUpdateDoc('paymentTerms', e.target.value)}
                    placeholder="Net 15 Days"
                    className={`${activeHeaderInput} md:text-right w-40`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* BODY SECTION: CLIENT DETAILS, ITEMS TABLE, GST SUMMARY & FOOTER */}
        {/* ================================================================== */}
        <div className="p-6 md:p-10 space-y-6">
          {/* Bill To & Place of Supply Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200/80">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                  style={{ color: primaryColor }}
                >
                  <Users className="h-3.5 w-3.5" />
                  {document.type === 'purchase_order'
                    ? 'Vendor / Supplier Details'
                    : document.type === 'estimate'
                    ? 'Client / Proposal Recipient'
                    : 'Bill To (Customer / Buyer Details)'}
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
                      className="text-xs font-semibold bg-white hover:bg-blue-50/50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 cursor-pointer shadow-2xs max-w-[240px]"
                    >
                      <option value="">
                        {savedCustomers.length > 0
                          ? `Select Saved Customer (${savedCustomers.length})...`
                          : 'No saved customers yet — type below'}
                      </option>
                      {savedCustomers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name}
                          {cust.taxId ? ` (${cust.taxId})` : cust.billingAddress?.city ? ` — ${cust.billingAddress.city}` : ''}
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
                className={`${editableInput} font-bold text-slate-900 text-sm w-full`}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-500 shrink-0">GSTIN:</span>
                  <input
                    type="text"
                    value={document.client.taxId || ''}
                    onChange={(e) => onUpdateClient('taxId', e.target.value.toUpperCase())}
                    placeholder="27AAACR5055K1Z7"
                    className={`${editableInput} font-mono font-bold uppercase w-full`}
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-500 shrink-0">State:</span>
                  <select
                    value={document.client.billingAddress?.state || '27 - Maharashtra'}
                    onChange={(e) => onUpdateClientAddress('state', e.target.value)}
                    className={`${editableInput} font-semibold w-full cursor-pointer bg-white`}
                  >
                    <option value="">Select Place of Supply State</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st.code} value={st.label}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="email"
                  value={document.client.email || ''}
                  onChange={(e) => onUpdateClient('email', e.target.value)}
                  placeholder="accounts@client.in"
                  className={`${editableInput} w-full`}
                />

                <input
                  type="text"
                  value={document.client.phone || ''}
                  onChange={(e) => onUpdateClient('phone', e.target.value)}
                  placeholder="+91 22 6767 3800"
                  className={`${editableInput} w-full`}
                />

                <input
                  type="text"
                  value={document.client.billingAddress?.street1 || ''}
                  onChange={(e) => onUpdateClientAddress('street1', e.target.value)}
                  placeholder="Billing Street Address"
                  className={`${editableInput} sm:col-span-2 w-full`}
                />

                <div className="grid grid-cols-3 gap-1.5 sm:col-span-2">
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
                    placeholder="PIN Code"
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

            {/* Right 5 cols: GST Supply Mode & Quick Balance Callout */}
            <div className="md:col-span-5 p-4 bg-slate-50/90 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  GST Tax Determination
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supplier State:</span>
                    <span className="font-bold text-slate-800">
                      {document.sender.address?.state || '27 - Maharashtra'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Place of Supply:</span>
                    <span className="font-bold text-slate-800">
                      {document.client.billingAddress?.state || '27 - Maharashtra'}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500">Tax Regime:</span>
                    <span
                      className="font-bold px-2 py-0.5 rounded text-[11px]"
                      style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                    >
                      {isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)'}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="p-3.5 rounded-xl flex justify-between items-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <div>
                  <div className="text-[10px] uppercase font-bold opacity-80">Balance Due</div>
                  <div className="text-xs opacity-90">{currency}</div>
                </div>
                <div className="text-xl font-black font-mono">
                  {formatCurrency(summary.balanceDue, currency)}
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* INLINE EDITABLE LINE ITEMS TABLE WITH HSN/SAC & CGST/SGST/IGST */}
          {/* ================================================================ */}
          <div className="space-y-3">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr
                    className="uppercase tracking-wider text-[10px] font-bold"
                    style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}
                  >
                    <th className="py-2.5 px-2 w-7 text-center">#</th>
                    <th className="py-2.5 px-2.5 min-w-[210px]">Item Description</th>
                    <th className="py-2.5 px-2 w-24 text-center">HSN/SAC</th>
                    <th className="py-2.5 px-2 w-16 text-right">Qty</th>
                    <th className="py-2.5 px-2 w-24 text-right">Rate</th>
                    <th className="py-2.5 px-2 w-20 text-right">Disc %</th>
                    <th className="py-2.5 px-2 w-20 text-right">GST %</th>
                    {isInterState ? (
                      <th className="py-2.5 px-2 w-24 text-right">IGST Amt</th>
                    ) : (
                      <>
                        <th className="py-2.5 px-2 w-24 text-right">CGST</th>
                        <th className="py-2.5 px-2 w-24 text-right">SGST</th>
                      </>
                    )}
                    <th className="py-2.5 px-2.5 w-28 text-right">Total</th>
                    <th className="py-2.5 px-2 w-14 text-center no-print">Act</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {document.items.map((item, idx) => (
                    <tr key={item.id} className="group hover:bg-blue-50/20 transition-colors">
                      <td className="py-2.5 px-2 text-center font-mono text-slate-400">
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
                              className="w-full text-[11px] font-semibold bg-slate-50 hover:bg-blue-50/60 border border-slate-200 rounded px-2 py-1 text-slate-700 cursor-pointer"
                            >
                              <option value="">
                                {savedItems.length > 0
                                  ? `📦 Select Saved Item (${savedItems.length})...`
                                  : '📦 No saved items yet — type below'}
                              </option>
                              {savedItems.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} — {formatCurrency(prod.unitPrice, currency)} (GST {prod.taxRate}%)
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
                          className={`${editableInput} w-full font-medium text-slate-900`}
                        />
                      </td>
                      <td className="py-2.5 px-1.5">
                        <input
                          type="text"
                          value={item.hsnCode || ''}
                          onChange={(e) => onUpdateItem(idx, 'hsnCode', e.target.value)}
                          placeholder="998314"
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
                      <td className="py-2.5 px-1.5">
                        <select
                          value={item.taxRate ?? 18}
                          onChange={(e) => onUpdateItem(idx, 'taxRate', Number(e.target.value))}
                          className={`${editableInput} w-full text-right font-mono bg-white cursor-pointer`}
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>
                      {isInterState ? (
                        <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                          <div>{formatCurrency(item.igstAmount ?? item.taxAmount, currency)}</div>
                          <div className="text-[10px] text-slate-400">({item.taxRate || 0}%)</div>
                        </td>
                      ) : (
                        <>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                            <div>
                              {formatCurrency(item.cgstAmount ?? item.taxAmount / 2, currency)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ({(item.taxRate || 0) / 2}%)
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                            <div>
                              {formatCurrency(item.sgstAmount ?? item.taxAmount / 2, currency)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ({(item.taxRate || 0) / 2}%)
                            </div>
                          </td>
                        </>
                      )}
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.lineTotal, currency)}
                      </td>
                      <td className="py-2.5 px-1.5 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onDuplicateItem(idx)}
                            title="Duplicate Item"
                            className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(idx)}
                            disabled={document.items.length <= 1}
                            title="Remove Item"
                            className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="no-print flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onAddItem}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border-2 border-dashed transition-all hover:shadow-xs"
                style={{
                  borderColor: `${primaryColor}60`,
                  color: primaryColor,
                  backgroundColor: `${primaryColor}08`,
                }}
              >
                <Plus className="h-4 w-4" />
                <span>+ Add Blank Line Item</span>
              </button>

              {onAddCatalogItem && savedItems.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-slate-500" />
                  <select
                    aria-label="Quick Add Saved Item"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onAddCatalogItem(e.target.value);
                      }
                    }}
                    className="text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 cursor-pointer shadow-2xs"
                  >
                    <option value="">+ Add Line from Saved Items ({savedItems.length})...</option>
                    {savedItems.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} — {formatCurrency(prod.unitPrice, currency)} (GST {prod.taxRate}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* BOTTOM SECTION: NOTES, BANK DETAILS, GST BREAKDOWN & TOTALS */}
          {/* ================================================================ */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-slate-200">
            {/* Left 7 Cols: GST Tax Table, Bank Instructions & Notes */}
            <div className="md:col-span-7 space-y-4">
              {summary.taxBreakdown.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/60">
                  <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 flex justify-between">
                    <span>GST Tax Breakdown</span>
                    <span>
                      {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                    </span>
                  </div>
                  <table className="w-full text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-1.5 px-2.5 text-left">Taxable Value</th>
                        {isInterState ? (
                          <th className="py-1.5 px-2 text-right">IGST</th>
                        ) : (
                          <>
                            <th className="py-1.5 px-2 text-right">CGST</th>
                            <th className="py-1.5 px-2 text-right">SGST</th>
                          </>
                        )}
                        <th className="py-1.5 px-2.5 text-right">Total Tax</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary.taxBreakdown.map((tb) => (
                        <tr key={tb.rate}>
                          <td className="py-1.5 px-2.5">
                            {formatCurrency(tb.taxableAmount, currency)}
                          </td>
                          {isInterState ? (
                            <td className="py-1.5 px-2 text-right">
                              {formatCurrency(tb.igstAmount ?? tb.taxAmount, currency)} ({tb.rate}
                              %)
                            </td>
                          ) : (
                            <>
                              <td className="py-1.5 px-2 text-right">
                                {formatCurrency(tb.cgstAmount ?? tb.taxAmount / 2, currency)} (
                                {tb.rate / 2}%)
                              </td>
                              <td className="py-1.5 px-2 text-right">
                                {formatCurrency(tb.sgstAmount ?? tb.taxAmount / 2, currency)} (
                                {tb.rate / 2}%)
                              </td>
                            </>
                          )}
                          <td className="py-1.5 px-2.5 text-right font-bold">
                            {formatCurrency(tb.taxAmount, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Structured Bank Details, UPI & QR Code (Controlled by Payment Settings toggles) */}
              {document.paymentConfig &&
                ((document.paymentConfig.display.showBankDetails &&
                  document.paymentConfig.bankAccounts.length > 0) ||
                  (document.paymentConfig.display.showUpiId && document.paymentConfig.upiId) ||
                  document.paymentConfig.display.showQrCode) && (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      {document.paymentConfig.display.showBankDetails &&
                        document.paymentConfig.bankAccounts
                          .filter(
                            (b) =>
                              !document.paymentConfig?.selectedBankAccountIds?.length ||
                              document.paymentConfig.selectedBankAccountIds.includes(b.id)
                          )
                          .map((bank) => (
                            <div
                              key={bank.id}
                              className="text-[11px] bg-white p-2.5 rounded-lg border border-slate-200/80 grid grid-cols-2 gap-x-3 gap-y-1"
                            >
                              <div>
                                <span className="text-slate-400">Account Holder: </span>
                                <span className="font-bold text-slate-800">
                                  {bank.accountHolderName}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">Bank Name: </span>
                                <span className="font-bold text-slate-800">{bank.bankName}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Account No: </span>
                                <span className="font-mono font-bold text-slate-900">
                                  {bank.accountNumber}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">IFSC / Routing: </span>
                                <span className="font-mono font-bold text-slate-900">
                                  {bank.ifscOrRoutingCode}
                                </span>
                              </div>
                              {bank.branchName && (
                                <div>
                                  <span className="text-slate-400">Branch: </span>
                                  <span className="text-slate-700">{bank.branchName}</span>
                                </div>
                              )}
                              {bank.accountType && (
                                <div>
                                  <span className="text-slate-400">Type: </span>
                                  <span className="capitalize text-slate-700">
                                    {bank.accountType}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}

                      {document.paymentConfig.display.showUpiId && document.paymentConfig.upiId && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            UPI ID / VPA:
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {document.paymentConfig.upiId}
                          </span>
                        </div>
                      )}
                    </div>

                    {document.paymentConfig.display.showQrCode &&
                      (() => {
                        const qrUrl =
                          document.paymentConfig.qrCodeDataUrl &&
                          !document.paymentConfig.autoGenerateUpiQr
                            ? document.paymentConfig.qrCodeDataUrl
                            : generateVerifiedUpiQrSvgDataUrl({
                                upiId: document.paymentConfig.upiId,
                                payeeName:
                                  document.paymentConfig.upiPayeeName || document.sender.name,
                                amount:
                                  summary.balanceDue > 0
                                    ? summary.balanceDue
                                    : summary.grandTotal,
                                currency,
                                invoiceNumber: document.documentNumber,
                              }) || document.paymentConfig.qrCodeDataUrl;
                        return qrUrl ? (
                          <div className="shrink-0 flex flex-col items-center justify-center bg-white p-2 rounded-lg border border-slate-200 text-center">
                            <img
                              src={qrUrl}
                              alt="Verified Payment QR Code"
                              className="h-20 w-20 object-contain"
                            />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                              Scan to Pay
                            </span>
                          </div>
                        ) : null;
                      })()}
                  </div>
                )}

              {(!document.paymentConfig ||
                document.paymentConfig.display.showPaymentInstructions) && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Payment Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={document.paymentInstructions || ''}
                    onChange={(e) => onUpdateDoc('paymentInstructions', e.target.value)}
                    placeholder="Additional payment instructions or wire notes..."
                    className={`${editableInput} w-full text-xs font-mono text-slate-700 bg-slate-50/70 p-2`}
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Terms & Conditions / Notes
                </label>
                <textarea
                  rows={2}
                  value={document.notes || ''}
                  onChange={(e) => onUpdateDoc('notes', e.target.value)}
                  placeholder="Notes, warranty, or jurisdiction terms..."
                  className={`${editableInput} w-full text-xs text-slate-600 bg-slate-50/70 p-2`}
                />
              </div>
            </div>

            {/* Right 5 Cols: Summary & Inline Adjustments + Signatory */}
            <div className="md:col-span-5 space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal (Gross)</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatCurrency(summary.subtotal, currency)}
                  </span>
                </div>

                {/* Extra Document Discount */}
                <div className="flex items-center justify-between gap-2 text-slate-600">
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
                      className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-white"
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
                    className={`${editableInput} w-24 text-right font-mono bg-white`}
                  />
                </div>

                <div className="flex justify-between text-slate-700 border-t border-slate-200 pt-1.5">
                  <span className="font-semibold">Taxable Amount</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(summary.taxableSubtotal, currency)}
                  </span>
                </div>

                {isInterState ? (
                  <div className="flex justify-between text-slate-700">
                    <span>IGST Total</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatCurrency(summary.igstTotal ?? summary.totalTax, currency)}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span>CGST Total</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatCurrency(summary.cgstTotal ?? summary.totalTax / 2, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>SGST Total</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatCurrency(summary.sgstTotal ?? summary.totalTax / 2, currency)}
                      </span>
                    </div>
                  </>
                )}

                {/* Shipping */}
                <div className="flex items-center justify-between gap-2 text-slate-600">
                  <span>Shipping / Freight</span>
                  <input
                    type="number"
                    min="0"
                    value={document.shippingFee || 0}
                    onChange={(e) => onUpdateShipping(Number(e.target.value))}
                    className={`${editableInput} w-24 text-right font-mono bg-white`}
                  />
                </div>

                {/* Extra Charges */}
                <div className="flex items-center justify-between gap-2 text-slate-600">
                  <span>Other Charges</span>
                  <input
                    type="number"
                    min="0"
                    value={document.extraCharges || 0}
                    onChange={(e) => onUpdateExtra(Number(e.target.value))}
                    className={`${editableInput} w-24 text-right font-mono bg-white`}
                  />
                </div>

                {/* Round-Off Toggle & Adjustment */}
                <div className="flex items-center justify-between gap-2 text-slate-700 border-t border-slate-200 pt-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(document.enableRoundOff)}
                      onChange={(e) => onUpdateDoc('enableRoundOff', e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <span className="font-medium">Round-Off Adjustment</span>
                  </label>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatCurrency(summary.roundOffAmount || 0, currency, { showSign: true })}
                  </span>
                </div>

                {/* Final Payable Amount */}
                <div
                  className="flex justify-between items-center p-3 rounded-lg text-white font-bold text-sm mt-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>Final Payable Amount</span>
                  <span className="font-mono text-base">
                    {formatCurrency(summary.grandTotal, currency)}
                  </span>
                </div>

                {/* Amount Paid */}
                <div className="flex items-center justify-between gap-2 text-emerald-700 pt-1">
                  <span className="font-medium">Advance / Paid</span>
                  <input
                    type="number"
                    min="0"
                    value={summary.amountPaid || 0}
                    onChange={(e) => onUpdatePaid(Number(e.target.value))}
                    className={`${editableInput} w-24 text-right font-mono bg-white text-emerald-700 font-bold`}
                  />
                </div>

                {(summary.refundedAmount || 0) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span className="font-medium">Refunded Amount</span>
                    <span className="font-mono font-bold">
                      {formatCurrency(summary.refundedAmount || 0, currency)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-2 text-sm">
                  <span>Balance Due</span>
                  <span className="font-mono" style={{ color: primaryColor }}>
                    {formatCurrency(summary.balanceDue, currency)}
                  </span>
                </div>
              </div>

              {/* Authorized Signatory Box */}
              <div className="border border-slate-200 rounded-xl p-3 text-right bg-slate-50/40 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  For {document.sender.name || 'Authorized Business'}
                </div>
                <input
                  type="text"
                  value={document.signatoryName || ''}
                  onChange={(e) => onUpdateDoc('signatoryName', e.target.value)}
                  placeholder="Type Signatory Name..."
                  className={`${editableInput} text-right font-serif italic text-sm text-slate-800 w-full`}
                />
                <div className="text-[10px] font-semibold text-slate-400 border-t border-slate-200 pt-1 inline-block px-4">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
