'use client';

import React, { useRef } from 'react';
import {
  DocumentModel,
  DocumentType,
  formatCurrency,
  CURRENCIES,
} from '@invoice/core';
import { getTemplate } from '@invoice/theme';
import {
  Upload,
  Plus,
  Trash2,
  Copy,
  X,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';

interface InlineDocumentCanvasProps {
  document: DocumentModel;
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
  const templateMeta = getTemplate(document.templateId || 'modern');
  const tokens = templateMeta.defaultTokens;
  const currency = document.currency || 'USD';
  const summary = document.summary;

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
    tokens.fontFamily === 'serif'
      ? 'font-serif'
      : tokens.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  // Common editable classes: looks like plain typography until hovered/focused
  const editableInput =
    'bg-transparent hover:bg-blue-50/60 focus:bg-white focus:ring-1.5 focus:ring-primary focus:border-primary border border-transparent rounded px-1.5 py-0.5 transition-all outline-none';

  return (
    <div
      id="invoice-document-capture"
      className={`bg-white text-slate-900 shadow-xl border border-slate-200 rounded-2xl p-6 md:p-12 max-w-4xl mx-auto ${fontClass} relative transition-all print:shadow-none print:border-none print:p-0 print:m-0`}
    >
      {/* Hidden Logo File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        className="hidden"
      />

      {/* Decorative top accent for templates */}
      {templateMeta.id === 'modern' && (
        <div className="h-2.5 -mt-6 -mx-6 md:-mt-12 md:-mx-12 rounded-t-2xl mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary" />
      )}
      {templateMeta.id === 'service_business' && (
        <div className="h-3 -mt-6 -mx-6 md:-mt-12 md:-mx-12 rounded-t-2xl mb-8 bg-amber-500" />
      )}
      {templateMeta.id === 'consulting' && (
        <div className="h-3 -mt-6 -mx-6 md:-mt-12 md:-mx-12 rounded-t-2xl mb-8 bg-indigo-700" />
      )}

      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b pb-8 gap-6 border-slate-200">
        {/* Left: Sender & Logo */}
        <div className="space-y-3 w-full md:w-1/2">
          {/* Logo Dropzone / Display */}
          <div className="inline-block relative group">
            {document.sender.logoUrl ? (
              <div className="relative">
                <img
                  src={document.sender.logoUrl}
                  alt="Company Logo"
                  className="h-16 max-w-[220px] object-contain cursor-pointer rounded hover:opacity-90 transition-opacity"
                  onClick={triggerUpload}
                  title="Click to change logo"
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
                className="no-print flex items-center gap-2 px-3.5 py-2.5 border-2 border-dashed border-slate-300 hover:border-primary rounded-xl text-xs font-semibold text-slate-500 hover:text-primary transition-all bg-slate-50/50 hover:bg-blue-50/30"
              >
                <Upload className="h-4 w-4" />
                <span>+ Upload Company Logo</span>
              </button>
            )}
          </div>

          {/* Business Name */}
          <div>
            <input
              type="text"
              value={document.sender.name}
              onChange={(e) => onUpdateSender('name', e.target.value)}
              placeholder="Your Business Name"
              className={`${editableInput} text-2xl font-black text-slate-900 w-full`}
            />
          </div>

          {/* Business Details (Email, Phone, Tax ID, Street, City) */}
          <div className="space-y-1 text-xs text-slate-600">
            <input
              type="email"
              value={document.sender.email || ''}
              onChange={(e) => onUpdateSender('email', e.target.value)}
              placeholder="business@email.com"
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
              value={document.sender.taxId || ''}
              onChange={(e) => onUpdateSender('taxId', e.target.value)}
              placeholder="Tax ID / VAT Registration"
              className={`${editableInput} w-full`}
            />
            <input
              type="text"
              value={document.sender.address?.street1 || ''}
              onChange={(e) => onUpdateSenderAddress('street1', e.target.value)}
              placeholder="Street Address"
              className={`${editableInput} w-full`}
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={document.sender.address?.city || ''}
                onChange={(e) => onUpdateSenderAddress('city', e.target.value)}
                placeholder="City"
                className={`${editableInput} w-1/2`}
              />
              <input
                type="text"
                value={document.sender.address?.country || ''}
                onChange={(e) => onUpdateSenderAddress('country', e.target.value)}
                placeholder="Country"
                className={`${editableInput} w-1/2`}
              />
            </div>
          </div>
        </div>

        {/* Right: Document Metadata & Dates */}
        <div className="w-full md:w-5/12 text-left md:text-right space-y-3">
          {/* Document Type Selector */}
          <div className="flex md:justify-end items-center">
            <select
              value={document.type}
              onChange={(e) => onUpdateDoc('type', e.target.value as DocumentType)}
              className="text-lg md:text-2xl font-black uppercase tracking-wider bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 rounded px-2 py-1 cursor-pointer text-primary outline-none"
            >
              <option value="invoice">Invoice</option>
              <option value="estimate">Estimate / Quote</option>
              <option value="purchase_order">Purchase Order</option>
              <option value="receipt">Receipt</option>
              <option value="credit_note">Credit Note</option>
              <option value="debit_note">Debit Note</option>
              <option value="pro_forma">Pro Forma</option>
            </select>
          </div>

          {/* Document Number */}
          <div className="flex items-center md:justify-end gap-1 text-sm font-bold text-slate-800">
            <span className="text-slate-400">#</span>
            <input
              type="text"
              value={document.documentNumber}
              onChange={(e) => onUpdateDoc('documentNumber', e.target.value)}
              placeholder="INV-2026-00001"
              className={`${editableInput} font-mono font-bold text-base md:text-right w-44`}
            />
          </div>

          {/* Reference PO */}
          <div className="flex items-center md:justify-end gap-1 text-xs text-slate-500">
            <span className="text-slate-400">Ref:</span>
            <input
              type="text"
              value={document.referenceNumber || ''}
              onChange={(e) => onUpdateDoc('referenceNumber', e.target.value)}
              placeholder="PO / Contract #"
              className={`${editableInput} text-xs md:text-right w-36`}
            />
          </div>

          {/* Dates & Currency */}
          <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex items-center md:justify-end gap-2">
              <span className="text-slate-400">Issue Date:</span>
              <input
                type="date"
                value={document.issueDate}
                onChange={(e) => onUpdateDoc('issueDate', e.target.value)}
                className={`${editableInput} text-xs md:text-right font-medium`}
              />
            </div>

            <div className="flex items-center md:justify-end gap-2">
              <span className="text-slate-400">Due Date:</span>
              <input
                type="date"
                value={document.dueDate || ''}
                onChange={(e) => onUpdateDoc('dueDate', e.target.value)}
                className={`${editableInput} text-xs md:text-right font-medium`}
              />
            </div>

            <div className="flex items-center md:justify-end gap-2">
              <span className="text-slate-400">Currency:</span>
              <select
                value={currency}
                onChange={(e) => onUpdateDoc('currency', e.target.value)}
                className="bg-transparent hover:bg-slate-100 rounded px-1.5 py-0.5 text-xs font-semibold text-slate-800 cursor-pointer border border-transparent"
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
      </div>

      {/* Bill To / Client Section */}
      <div className="py-6 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Bill To (Client / Customer)
          </span>
          <input
            type="text"
            value={document.client.name}
            onChange={(e) => onUpdateClient('name', e.target.value)}
            placeholder="Client or Company Name"
            className={`${editableInput} font-bold text-slate-900 text-sm w-full`}
          />
          <input
            type="email"
            value={document.client.email || ''}
            onChange={(e) => onUpdateClient('email', e.target.value)}
            placeholder="client@company.com"
            className={`${editableInput} text-xs text-slate-600 w-full`}
          />
          <input
            type="text"
            value={document.client.phone || ''}
            onChange={(e) => onUpdateClient('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
            className={`${editableInput} text-xs text-slate-600 w-full`}
          />
          <input
            type="text"
            value={document.client.taxId || ''}
            onChange={(e) => onUpdateClient('taxId', e.target.value)}
            placeholder="Client Tax ID / VAT"
            className={`${editableInput} text-xs text-slate-600 w-full`}
          />
          <input
            type="text"
            value={document.client.billingAddress?.street1 || ''}
            onChange={(e) => onUpdateClientAddress('street1', e.target.value)}
            placeholder="Billing Address"
            className={`${editableInput} text-xs text-slate-600 w-full`}
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={document.client.billingAddress?.city || ''}
              onChange={(e) => onUpdateClientAddress('city', e.target.value)}
              placeholder="City"
              className={`${editableInput} text-xs text-slate-600 w-1/2`}
            />
            <input
              type="text"
              value={document.client.billingAddress?.country || ''}
              onChange={(e) => onUpdateClientAddress('country', e.target.value)}
              placeholder="Country"
              className={`${editableInput} text-xs text-slate-600 w-1/2`}
            />
          </div>
        </div>

        {/* Payment Terms & Instructions Box */}
        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Payment Terms & Notes
          </span>
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block">Terms Deadline</label>
            <input
              type="text"
              value={document.paymentTerms || ''}
              onChange={(e) => onUpdateDoc('paymentTerms', e.target.value)}
              placeholder="e.g. Net 14 Days, Due on receipt"
              className={`${editableInput} text-xs w-full font-medium`}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block">Bank / Payment Details</label>
            <textarea
              rows={3}
              value={document.paymentInstructions || ''}
              onChange={(e) => onUpdateDoc('paymentInstructions', e.target.value)}
              placeholder="Wire Transfer, Bank Name, Account #, Routing..."
              className={`${editableInput} text-xs w-full resize-none font-mono text-[11px]`}
            />
          </div>
        </div>
      </div>

      {/* Line Items Table with INLINE Editing & Adding */}
      <div className="py-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-2 w-5/12">Description / Service</th>
                <th className="py-3 px-2 text-right w-16">Qty</th>
                <th className="py-3 px-2 text-right w-24">Rate</th>
                <th className="py-3 px-2 text-right w-20">Disc %</th>
                <th className="py-3 px-2 text-right w-20">Tax %</th>
                <th className="py-3 px-2 text-right w-28">Amount</th>
                <th className="py-3 px-1 w-14 text-center no-print"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {document.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/80 group">
                  {/* Item Description */}
                  <td className="py-2.5 px-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => onUpdateItem(idx, 'description', e.target.value)}
                      placeholder="Item description or service..."
                      className={`${editableInput} font-semibold text-slate-800 w-full`}
                    />
                  </td>

                  {/* Quantity */}
                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={item.quantity}
                      onChange={(e) => onUpdateItem(idx, 'quantity', Number(e.target.value))}
                      className={`${editableInput} text-right tabular-nums w-full font-medium`}
                    />
                  </td>

                  {/* Unit Rate */}
                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => onUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                      className={`${editableInput} text-right tabular-nums w-full font-medium`}
                    />
                  </td>

                  {/* Line Discount % */}
                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      value={item.discountValue || 0}
                      onChange={(e) => onUpdateItem(idx, 'discountValue', Number(e.target.value))}
                      className={`${editableInput} text-right tabular-nums w-full text-slate-500`}
                    />
                  </td>

                  {/* Tax Rate % */}
                  <td className="py-2.5 px-2 text-right">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      value={item.taxRate || 0}
                      onChange={(e) => onUpdateItem(idx, 'taxRate', Number(e.target.value))}
                      className={`${editableInput} text-right tabular-nums w-full text-slate-500`}
                    />
                  </td>

                  {/* Line Total (Live Calculated) */}
                  <td className="py-2.5 px-2 text-right tabular-nums font-black text-slate-900">
                    {formatCurrency(item.lineTotal, currency)}
                  </td>

                  {/* Row Actions (Duplicate & Delete) */}
                  <td className="py-2.5 px-1 text-center no-print">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => onDuplicateItem(idx)}
                        title="Duplicate line"
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        disabled={document.items.length <= 1}
                        onClick={() => onRemoveItem(idx)}
                        title="Delete line"
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 disabled:opacity-20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Line Item Button Directly Below Table */}
        <div className="pt-4 no-print flex items-center justify-between">
          <button
            type="button"
            onClick={onAddItem}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100/80 text-primary rounded-lg text-xs font-bold transition-colors border border-blue-200 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Line Item</span>
          </button>
          <span className="text-[11px] text-slate-400">
            {document.items.length} item(s) on document
          </span>
        </div>
      </div>

      {/* Totals & Notes Section */}
      <div className="flex flex-col md:flex-row justify-between items-start pt-6 border-t border-slate-200 gap-8">
        {/* Left Notes */}
        <div className="w-full md:w-1/2 space-y-3 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Client Notes & Terms of Service
          </span>
          <textarea
            rows={4}
            value={document.notes || ''}
            onChange={(e) => onUpdateDoc('notes', e.target.value)}
            placeholder="Enter notes, delivery remarks, or customer warranty instructions..."
            className={`${editableInput} w-full resize-none`}
          />
        </div>

        {/* Right Totals with Inline Adjustments */}
        <div className="w-full md:w-5/12 bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
          {/* Subtotal */}
          <div className="flex justify-between items-center text-slate-600">
            <span>Subtotal</span>
            <span className="tabular-nums font-bold">
              {formatCurrency(summary.subtotal, currency)}
            </span>
          </div>

          {/* Document Discount Inline */}
          <div className="flex justify-between items-center text-emerald-700">
            <span className="flex items-center gap-1">
              <span>Doc Discount:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={document.documentDiscountValue || 0}
                onChange={(e) => onUpdateDiscount('percentage', Number(e.target.value))}
                className={`${editableInput} w-14 text-right text-xs text-emerald-700 font-bold`}
              />
              <span>%</span>
            </span>
            <span className="tabular-nums font-bold">
              -{formatCurrency(summary.discountTotal, currency)}
            </span>
          </div>

          {/* Tax Breakdown */}
          {summary.taxBreakdown.map((b) => (
            <div key={b.rate} className="flex justify-between items-center text-slate-600">
              <span>Tax ({b.rate}%)</span>
              <span className="tabular-nums font-semibold">
                {formatCurrency(b.taxAmount, currency)}
              </span>
            </div>
          ))}

          {/* Shipping Fee Inline */}
          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-1">
              <span>Shipping Fee:</span>
              <input
                type="number"
                min="0"
                step="any"
                value={document.shippingFee || 0}
                onChange={(e) => onUpdateShipping(Number(e.target.value))}
                className={`${editableInput} w-16 text-right text-xs`}
              />
            </span>
            <span className="tabular-nums">
              {formatCurrency(summary.shippingFee, currency)}
            </span>
          </div>

          {/* Extra Charges Inline */}
          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-1">
              <span>Extra Charges:</span>
              <input
                type="number"
                min="0"
                step="any"
                value={document.extraCharges || 0}
                onChange={(e) => onUpdateExtra(Number(e.target.value))}
                className={`${editableInput} w-16 text-right text-xs`}
              />
            </span>
            <span className="tabular-nums">
              {formatCurrency(summary.extraCharges, currency)}
            </span>
          </div>

          {/* Grand Total */}
          <div
            className="flex justify-between items-center pt-3 border-t-2 border-slate-900 text-lg font-black"
            style={{ color: tokens.primaryColor }}
          >
            <span>Total</span>
            <span className="tabular-nums">
              {formatCurrency(summary.grandTotal, currency)}
            </span>
          </div>

          {/* Amount Paid Inline */}
          <div className="flex justify-between items-center pt-1 text-slate-600">
            <span className="flex items-center gap-1">
              <span>Amount Paid:</span>
              <input
                type="number"
                min="0"
                step="any"
                value={document.summary.amountPaid || 0}
                onChange={(e) => onUpdatePaid(Number(e.target.value))}
                className={`${editableInput} w-20 text-right text-xs font-semibold`}
              />
            </span>
            <span className="tabular-nums font-bold">
              {formatCurrency(summary.amountPaid, currency)}
            </span>
          </div>

          {/* Balance Due */}
          {summary.balanceDue > 0 ? (
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-black text-red-600">
              <span>Balance Due</span>
              <span className="tabular-nums">
                {formatCurrency(summary.balanceDue, currency)}
              </span>
            </div>
          ) : (
            <div className="pt-1 text-right text-[11px] font-bold text-emerald-600">
              ✓ Fully Paid
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
