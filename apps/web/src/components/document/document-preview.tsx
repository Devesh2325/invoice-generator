'use client';

import React, { useRef } from 'react';
import { DocumentModel, formatCurrency } from '@invoice/core';
import { getTemplate } from '@invoice/theme';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface DocumentPreviewProps {
  document: DocumentModel;
  className?: string;
  onLogoUpload?: (dataUrl: string) => void;
  onRemoveLogo?: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  className = '',
  onLogoUpload,
  onRemoveLogo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateMeta = getTemplate(document.templateId || 'modern');
  const tokens = templateMeta.defaultTokens;
  const currency = document.currency || 'USD';
  const summary = document.summary;

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onLogoUpload) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onLogoUpload(result);
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const fontClass =
    tokens.fontFamily === 'serif'
      ? 'font-serif'
      : tokens.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  // Common Logo Render Component
  const renderLogo = (customClass = 'h-14 max-w-[200px]') => (
    <div className="relative group inline-block">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        className="hidden"
      />
      {document.sender.logoUrl ? (
        <div className="relative">
          <img
            src={document.sender.logoUrl}
            alt="Business Logo"
            className={`${customClass} object-contain cursor-pointer transition-opacity group-hover:opacity-90`}
            onClick={triggerUpload}
            title="Click to replace logo"
          />
          {onRemoveLogo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveLogo();
              }}
              title="Remove Logo"
              className="no-print absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerUpload}
          className="no-print flex items-center gap-1.5 px-3 py-2 border-2 border-dashed border-slate-300 hover:border-primary rounded-lg text-xs font-semibold text-slate-500 hover:text-primary transition-colors bg-slate-50/50"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>+ Add Company Logo</span>
        </button>
      )}
    </div>
  );

  // --------------------------------------------------------------------------
  // TEMPLATE 1: MODERN FINTECH
  // --------------------------------------------------------------------------
  if (templateMeta.id === 'modern') {
    return (
      <div
        id="invoice-document-capture"
        className={`bg-white text-slate-900 shadow-xl border border-slate-200 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto ${fontClass} ${className} print:shadow-none print:border-none print:p-0 print:m-0`}
      >
        <div className="h-2 -mt-8 -mx-8 md:-mt-12 md:-mx-12 rounded-t-2xl mb-8 bg-gradient-to-r from-blue-600 to-indigo-600" />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b pb-8 gap-6 border-slate-100">
          <div className="space-y-3">
            {renderLogo()}
            <div className="text-2xl font-black tracking-tight text-slate-900">
              {document.sender.name || 'YOUR BUSINESS'}
            </div>
            <div className="text-xs text-slate-500 space-y-0.5">
              {document.sender.email && <div>{document.sender.email}</div>}
              {document.sender.phone && <div>{document.sender.phone}</div>}
              {document.sender.taxId && <div>Tax ID: {document.sender.taxId}</div>}
              {document.sender.address && (
                <div>
                  {document.sender.address.street1}, {document.sender.address.city}
                </div>
              )}
            </div>
          </div>

          <div className="text-left md:text-right space-y-2">
            <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold uppercase tracking-wider text-xs rounded-full">
              {document.type.replace('_', ' ')}
            </div>
            <div className="text-2xl font-black text-slate-900">
              #{document.documentNumber}
            </div>
            <div className="text-xs text-slate-500 space-y-0.5">
              <div>Issue Date: <span className="font-semibold text-slate-700">{document.issueDate}</span></div>
              {document.dueDate && <div>Due Date: <span className="font-semibold text-slate-700">{document.dueDate}</span></div>}
              {document.referenceNumber && <div>Ref: {document.referenceNumber}</div>}
            </div>
          </div>
        </div>

        {/* Client Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bill To</span>
            <div className="font-bold text-slate-900 text-sm">{document.client.name}</div>
            <div className="text-xs text-slate-600 space-y-0.5">
              {document.client.email && <div>{document.client.email}</div>}
              {document.client.phone && <div>{document.client.phone}</div>}
              {document.client.taxId && <div>Tax ID: {document.client.taxId}</div>}
              {document.client.billingAddress?.street1 && (
                <div>{document.client.billingAddress.street1}, {document.client.billingAddress.city}</div>
              )}
            </div>
          </div>

          {document.client.shippingAddress?.street1 ? (
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ship To</span>
              <div className="text-xs text-slate-600 space-y-0.5">
                <div>{document.client.shippingAddress.street1}</div>
                <div>{document.client.shippingAddress.city}, {document.client.shippingAddress.country}</div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Status</span>
              <div className="text-sm font-bold text-slate-900 capitalize">{document.status}</div>
              <div className="text-xs text-slate-500">Terms: {document.paymentTerms || 'Standard'}</div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="py-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 rounded-l-lg">Description</th>
                <th className="py-3 px-2 text-right">Qty</th>
                <th className="py-3 px-2 text-right">Rate</th>
                <th className="py-3 px-2 text-right">Disc</th>
                <th className="py-3 px-2 text-right">Tax</th>
                <th className="py-3 px-3 text-right rounded-r-lg">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {document.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 font-medium text-slate-800">{item.description}</td>
                  <td className="py-3 px-2 text-right tabular-nums text-slate-600">{item.quantity}</td>
                  <td className="py-3 px-2 text-right tabular-nums text-slate-600">{formatCurrency(item.unitPrice, currency)}</td>
                  <td className="py-3 px-2 text-right tabular-nums text-slate-500">{item.lineDiscount > 0 ? `-${formatCurrency(item.lineDiscount, currency)}` : '—'}</td>
                  <td className="py-3 px-2 text-right tabular-nums text-slate-500">{item.taxRate ? `${item.taxRate}%` : '—'}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-slate-900">{formatCurrency(item.lineTotal, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Notes */}
        <div className="flex flex-col md:flex-row justify-between items-start pt-6 border-t border-slate-100 gap-8">
          <div className="w-full md:w-1/2 space-y-4 text-xs text-slate-600">
            {document.notes && (
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">Notes</span>
                <p className="whitespace-pre-line">{document.notes}</p>
              </div>
            )}
            {document.paymentInstructions && (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <span className="font-bold uppercase tracking-wider text-[10px] text-blue-800 block mb-1">Payment Instructions</span>
                <p className="whitespace-pre-line text-blue-900">{document.paymentInstructions}</p>
              </div>
            )}
          </div>

          <div className="w-full md:w-5/12 bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium">{formatCurrency(summary.subtotal, currency)}</span>
            </div>
            {summary.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="tabular-nums font-medium">-{formatCurrency(summary.discountTotal, currency)}</span>
              </div>
            )}
            {summary.taxBreakdown.map((b) => (
              <div key={b.rate} className="flex justify-between text-slate-600">
                <span>Tax ({b.rate}%)</span>
                <span className="tabular-nums font-medium">{formatCurrency(b.taxAmount, currency)}</span>
              </div>
            ))}
            {summary.shippingFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="tabular-nums font-medium">{formatCurrency(summary.shippingFee, currency)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-black text-blue-600">
              <span>Grand Total</span>
              <span className="tabular-nums">{formatCurrency(summary.grandTotal, currency)}</span>
            </div>
            {summary.amountPaid > 0 && (
              <>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Amount Paid</span>
                  <span className="tabular-nums font-medium">{formatCurrency(summary.amountPaid, currency)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold text-red-600">
                  <span>Balance Due</span>
                  <span className="tabular-nums">{formatCurrency(summary.balanceDue, currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 2: MINIMAL MONOCHROME
  // --------------------------------------------------------------------------
  if (templateMeta.id === 'minimal') {
    return (
      <div
        id="invoice-document-capture"
        className={`bg-white text-zinc-900 shadow-lg border border-zinc-200 p-8 md:p-14 max-w-4xl mx-auto font-sans ${className} print:shadow-none print:border-none print:p-0 print:m-0`}
      >
        <div className="flex justify-between items-start pb-12 border-b border-zinc-900">
          <div>
            {renderLogo()}
            <div className="text-xl font-bold tracking-tight text-zinc-900 mt-3">
              {document.sender.name || 'COMPANY NAME'}
            </div>
            <div className="text-xs text-zinc-500 mt-1 space-y-0.5">
              {document.sender.email && <div>{document.sender.email}</div>}
              {document.sender.address?.street1 && <div>{document.sender.address.street1}, {document.sender.address.city}</div>}
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-light tracking-tight uppercase text-zinc-900">
              {document.type.replace('_', ' ')}
            </div>
            <div className="text-sm font-mono mt-1 text-zinc-600">
              #{document.documentNumber}
            </div>
            <div className="text-xs text-zinc-400 mt-2">
              Date: {document.issueDate}
              {document.dueDate && <div>Due: {document.dueDate}</div>}
            </div>
          </div>
        </div>

        <div className="py-8 grid grid-cols-2 gap-8 text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block mb-1">To</span>
            <div className="font-semibold text-zinc-900 text-sm">{document.client.name}</div>
            <div className="text-zinc-500 mt-1">
              {document.client.email && <div>{document.client.email}</div>}
              {document.client.billingAddress?.street1 && <div>{document.client.billingAddress.street1}</div>}
            </div>
          </div>
          <div className="text-right">
            {document.referenceNumber && (
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block mb-1">Ref</span>
                <div className="font-mono text-zinc-800">{document.referenceNumber}</div>
              </div>
            )}
          </div>
        </div>

        <table className="w-full text-left text-xs mb-8">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
              <th className="py-2.5">Item</th>
              <th className="py-2.5 text-right">Qty</th>
              <th className="py-2.5 text-right">Price</th>
              <th className="py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {document.items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-3 font-medium text-zinc-800">{item.description}</td>
                <td className="py-3 text-right tabular-nums text-zinc-500">{item.quantity}</td>
                <td className="py-3 text-right tabular-nums text-zinc-500">{formatCurrency(item.unitPrice, currency)}</td>
                <td className="py-3 text-right tabular-nums font-semibold text-zinc-900">{formatCurrency(item.lineTotal, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-start pt-6 border-t border-zinc-900">
          <div className="text-xs text-zinc-500 max-w-sm space-y-2">
            {document.notes && <p className="italic">{document.notes}</p>}
            {document.paymentInstructions && <p className="font-mono text-[11px]">{document.paymentInstructions}</p>}
          </div>

          <div className="w-64 space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal</span>
              <span className="tabular-nums font-mono">{formatCurrency(summary.subtotal, currency)}</span>
            </div>
            {summary.discountTotal > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>Discount</span>
                <span className="tabular-nums font-mono">-{formatCurrency(summary.discountTotal, currency)}</span>
              </div>
            )}
            {summary.totalTax > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>Tax</span>
                <span className="tabular-nums font-mono">{formatCurrency(summary.totalTax, currency)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t-2 border-zinc-900 font-bold text-base text-zinc-900">
              <span>Total</span>
              <span className="tabular-nums font-mono">{formatCurrency(summary.grandTotal, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 3: PROFESSIONAL NAVY
  // --------------------------------------------------------------------------
  if (templateMeta.id === 'professional') {
    return (
      <div
        id="invoice-document-capture"
        className={`bg-white text-slate-900 shadow-xl border border-slate-200 overflow-hidden max-w-4xl mx-auto ${fontClass} ${className} print:shadow-none print:border-none print:p-0 print:m-0`}
      >
        {/* Full-width Navy Banner */}
        <div className="bg-slate-900 text-white p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            {renderLogo('h-12 max-w-[180px] brightness-0 invert')}
            <h2 className="text-2xl font-black tracking-tight text-white">
              {document.sender.name || 'ENTERPRISE SOLUTIONS'}
            </h2>
            <div className="text-xs text-slate-300">
              {document.sender.email} • {document.sender.phone}
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 text-right min-w-[220px]">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 block">
              {document.type.replace('_', ' ')}
            </span>
            <div className="text-xl font-bold text-white">#{document.documentNumber}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Issue Date: {document.issueDate}
              {document.dueDate && <div>Due Date: {document.dueDate}</div>}
            </div>
          </div>
        </div>

        <div className="p-8 md:p-10 space-y-6">
          {/* Bill To */}
          <div className="bg-slate-50 border-l-4 border-slate-900 p-4 rounded-r-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Invoiced Client</span>
            <div className="text-sm font-bold text-slate-900">{document.client.name}</div>
            <div className="text-xs text-slate-600 mt-1">
              {document.client.email && <span>{document.client.email} • </span>}
              {document.client.billingAddress?.street1 && <span>{document.client.billingAddress.street1}, {document.client.billingAddress.city}</span>}
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Service / Item</th>
                <th className="py-3 px-2 text-right">Qty</th>
                <th className="py-3 px-2 text-right">Unit Rate</th>
                <th className="py-3 px-2 text-right">Tax</th>
                <th className="py-3 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {document.items.map((item, idx) => (
                <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-3 px-3 font-semibold text-slate-800">{item.description}</td>
                  <td className="py-3 px-2 text-right tabular-nums text-slate-600">{item.quantity}</td>
                  <td className="py-3 px-2 text-right tabular-nums text-slate-600">{formatCurrency(item.unitPrice, currency)}</td>
                  <td className="py-3 px-2 text-right tabular-nums text-slate-500">{item.taxRate ? `${item.taxRate}%` : '—'}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-slate-900">{formatCurrency(item.lineTotal, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary & Signatory */}
          <div className="flex flex-col md:flex-row justify-between items-end pt-4 border-t border-slate-200 gap-8">
            <div className="space-y-4 text-xs text-slate-600 max-w-sm">
              {document.paymentInstructions && (
                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block mb-1">Remittance Details</span>
                  <p className="whitespace-pre-line bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-[11px]">{document.paymentInstructions}</p>
                </div>
              )}
              <div className="pt-4 border-t border-dashed border-slate-300 w-48 text-center text-[10px] text-slate-400">
                Authorized Signatory
              </div>
            </div>

            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums font-bold">{formatCurrency(summary.subtotal, currency)}</span>
              </div>
              {summary.totalTax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Total Tax</span>
                  <span className="tabular-nums">{formatCurrency(summary.totalTax, currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-slate-900 font-black text-lg text-slate-900">
                <span>Total Due</span>
                <span className="tabular-nums">{formatCurrency(summary.grandTotal, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 4: CLASSIC SERIF
  // --------------------------------------------------------------------------
  if (templateMeta.id === 'classic') {
    return (
      <div
        id="invoice-document-capture"
        className={`bg-[#FAFAF9] text-stone-900 shadow-lg border border-stone-300 p-8 md:p-14 max-w-4xl mx-auto font-serif ${className} print:shadow-none print:border-none print:p-0 print:m-0`}
      >
        <div className="text-center pb-6 border-b-2 border-stone-800">
          <div className="flex justify-center mb-3">{renderLogo()}</div>
          <h1 className="text-2xl font-bold tracking-wide uppercase text-stone-900">
            {document.sender.name || 'ESTABLISHED COMMERCE'}
          </h1>
          <div className="text-xs text-stone-600 mt-1">
            {document.sender.address?.street1 && <span>{document.sender.address.street1}, {document.sender.address.city} • </span>}
            {document.sender.email}
          </div>
          <div className="mt-4 pt-3 border-t border-stone-300 inline-block px-8 text-xs font-bold uppercase tracking-widest text-stone-700">
            {document.type.replace('_', ' ')} № {document.documentNumber}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-6 text-xs border-b border-stone-200">
          <div>
            <span className="font-bold text-stone-500 uppercase tracking-wider block mb-1">Billed To</span>
            <div className="font-bold text-stone-900 text-sm">{document.client.name}</div>
            <div className="text-stone-600 mt-1">{document.client.billingAddress?.street1}</div>
          </div>
          <div className="text-right">
            <div><span className="text-stone-500">Date of Issue: </span>{document.issueDate}</div>
            {document.dueDate && <div><span className="text-stone-500">Payment Due: </span>{document.dueDate}</div>}
          </div>
        </div>

        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-800 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Quantity</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {document.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-3 font-medium text-stone-900">{item.description}</td>
                  <td className="py-3 text-right tabular-nums text-stone-700">{item.quantity}</td>
                  <td className="py-3 text-right tabular-nums text-stone-700">{formatCurrency(item.unitPrice, currency)}</td>
                  <td className="py-3 text-right tabular-nums font-bold text-stone-900">{formatCurrency(item.lineTotal, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-start pt-4 border-t-2 border-stone-800">
          <div className="text-xs text-stone-600 max-w-sm space-y-2 italic">
            {document.notes && <p>{document.notes}</p>}
            <p className="not-italic text-[10px] text-stone-500 pt-4">Thank you for your business and patronage.</p>
          </div>

          <div className="w-64 space-y-1.5 text-xs text-right">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold tabular-nums">{formatCurrency(summary.subtotal, currency)}</span>
            </div>
            {summary.totalTax > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="tabular-nums">{formatCurrency(summary.totalTax, currency)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-stone-800 font-bold text-base text-stone-900">
              <span>Total Payable:</span>
              <span className="tabular-nums">{formatCurrency(summary.grandTotal, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 5: EXECUTIVE CORPORATE
  // --------------------------------------------------------------------------
  if (templateMeta.id === 'corporate') {
    return (
      <div
        id="invoice-document-capture"
        className={`bg-white text-slate-900 shadow-xl border-2 border-teal-800 p-8 md:p-12 max-w-4xl mx-auto font-sans ${className} print:shadow-none print:border-none print:p-0 print:m-0`}
      >
        <div className="flex justify-between items-start pb-6 border-b border-slate-200">
          <div>
            {renderLogo()}
            <div className="text-xl font-black text-teal-800 mt-2">{document.sender.name || 'CORPORATE CORP'}</div>
            <div className="text-xs text-slate-500 mt-1">{document.sender.email} • {document.sender.phone}</div>
          </div>

          <div className="bg-slate-100 p-4 rounded border border-slate-300 text-xs text-right space-y-1">
            <div className="text-lg font-black text-teal-900 uppercase">{document.type.replace('_', ' ')}</div>
            <div className="font-mono font-bold">Doc #: {document.documentNumber}</div>
            <div>Date: {document.issueDate}</div>
            {document.dueDate && <div>Due: {document.dueDate}</div>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-6 text-xs">
          <div className="border border-slate-200 rounded p-3 bg-slate-50">
            <div className="font-bold text-teal-800 uppercase text-[10px] mb-1">Billing Details</div>
            <div className="font-bold text-slate-900">{document.client.name}</div>
            <div className="text-slate-600 mt-0.5">{document.client.email}</div>
          </div>
          <div className="border border-slate-200 rounded p-3 bg-slate-50">
            <div className="font-bold text-teal-800 uppercase text-[10px] mb-1">Corporate Tax Compliance</div>
            <div>Tax ID: {document.client.taxId || 'N/A'}</div>
            <div>Currency: {currency}</div>
          </div>
        </div>

        <table className="w-full text-left text-xs border border-slate-200 mb-6">
          <thead className="bg-teal-800 text-white font-bold uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-2 text-right">Quantity</th>
              <th className="py-2.5 px-2 text-right">Unit Price</th>
              <th className="py-2.5 px-3 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {document.items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-3 px-3 font-semibold">{item.description}</td>
                <td className="py-3 px-2 text-right tabular-nums">{item.quantity}</td>
                <td className="py-3 px-2 text-right tabular-nums">{formatCurrency(item.unitPrice, currency)}</td>
                <td className="py-3 px-3 text-right tabular-nums font-bold">{formatCurrency(item.lineTotal, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-start pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 max-w-sm space-y-2">
            <div className="border border-slate-200 p-3 rounded bg-slate-50">
              <span className="font-bold text-teal-900 block mb-1">Remittance Instructions</span>
              <p className="font-mono text-[11px]">{document.paymentInstructions || 'Direct wire or ACH'}</p>
            </div>
          </div>

          <div className="w-64 bg-slate-50 border border-slate-200 p-4 rounded text-xs space-y-2">
            <div className="flex justify-between"><span>Subtotal:</span><span className="font-bold">{formatCurrency(summary.subtotal, currency)}</span></div>
            {summary.totalTax > 0 && <div className="flex justify-between"><span>Taxes:</span><span>{formatCurrency(summary.totalTax, currency)}</span></div>}
            <div className="flex justify-between pt-2 border-t border-teal-800 font-black text-base text-teal-900">
              <span>Total:</span><span>{formatCurrency(summary.grandTotal, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 6: SERVICE BUSINESS & TRADES
  // --------------------------------------------------------------------------
  if (templateMeta.id === 'service_business') {
    return (
      <div
        id="invoice-document-capture"
        className={`bg-white text-slate-900 shadow-xl border-t-8 border-amber-500 p-8 md:p-12 max-w-4xl mx-auto font-sans ${className} print:shadow-none print:border-none print:p-0 print:m-0`}
      >
        <div className="flex justify-between items-start pb-6 border-b border-amber-200">
          <div className="space-y-2">
            {renderLogo()}
            <div className="text-xl font-bold text-amber-900">{document.sender.name || 'SERVICE CONTRACTOR'}</div>
            <div className="text-xs text-slate-600">{document.sender.phone} • {document.sender.email}</div>
          </div>

          <div className="text-right">
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
              {document.type.replace('_', ' ')}
            </span>
            <div className="text-xl font-black text-slate-900 mt-2">#{document.documentNumber}</div>
            <div className="text-xs text-slate-500">Job Date: {document.issueDate}</div>
          </div>
        </div>

        {/* Project Scope Banner */}
        <div className="my-6 p-4 bg-amber-50/60 border border-amber-200 rounded-lg text-xs">
          <span className="font-bold text-amber-900 uppercase tracking-wider block mb-1">Client & Location</span>
          <div className="font-bold text-slate-900 text-sm">{document.client.name}</div>
          <div className="text-slate-600">{document.client.billingAddress?.street1}, {document.client.billingAddress?.city}</div>
        </div>

        {/* Task Items */}
        <table className="w-full text-left text-xs mb-6">
          <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase">
            <tr>
              <th className="py-2.5 px-3">Service / Labor / Material</th>
              <th className="py-2.5 px-2 text-right">Hours/Qty</th>
              <th className="py-2.5 px-2 text-right">Rate</th>
              <th className="py-2.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {document.items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50">
                <td className="py-3 px-3 font-semibold text-slate-800">{item.description}</td>
                <td className="py-3 px-2 text-right tabular-nums">{item.quantity}</td>
                <td className="py-3 px-2 text-right tabular-nums">{formatCurrency(item.unitPrice, currency)}</td>
                <td className="py-3 px-3 text-right tabular-nums font-bold text-slate-900">{formatCurrency(item.lineTotal, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-start pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-600 max-w-sm space-y-2">
            <span className="font-bold text-slate-700 block">Terms of Service</span>
            <p className="text-[11px]">{document.notes || 'Labor guaranteed. Payment due upon completion.'}</p>
          </div>

          <div className="w-64 p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-1.5 text-xs text-right">
            <div className="flex justify-between text-slate-700"><span>Subtotal:</span><span className="font-bold">{formatCurrency(summary.subtotal, currency)}</span></div>
            {summary.totalTax > 0 && <div className="flex justify-between text-slate-700"><span>Tax:</span><span>{formatCurrency(summary.totalTax, currency)}</span></div>}
            <div className="flex justify-between pt-2 border-t border-amber-300 font-black text-base text-amber-900">
              <span>Total:</span><span>{formatCurrency(summary.grandTotal, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 7: CONSULTING ADVISORY
  // --------------------------------------------------------------------------
  if (templateMeta.id === 'consulting') {
    return (
      <div
        id="invoice-document-capture"
        className={`bg-white text-slate-900 shadow-xl border-t-8 border-indigo-600 p-8 md:p-14 max-w-4xl mx-auto font-sans ${className} print:shadow-none print:border-none print:p-0 print:m-0`}
      >
        <div className="flex justify-between items-start pb-8 border-b border-indigo-100">
          <div>
            {renderLogo()}
            <div className="text-xl font-extrabold text-indigo-900 mt-2">{document.sender.name || 'ADVISORY PARTNERS'}</div>
            <div className="text-xs text-slate-500 mt-1">Strategic Advisory & Consulting Group</div>
          </div>

          <div className="text-right space-y-1 text-xs">
            <span className="text-indigo-600 font-extrabold uppercase tracking-widest text-xs block">
              {document.type.replace('_', ' ')}
            </span>
            <div className="text-xl font-bold text-slate-900">№ {document.documentNumber}</div>
            <div className="text-slate-400">Date: {document.issueDate}</div>
          </div>
        </div>

        {/* Engagement Callout */}
        <div className="my-6 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block mb-1">Engagement Partner</span>
          <div className="text-sm font-bold text-slate-900">{document.client.name}</div>
          <div className="text-slate-600 mt-0.5">{document.client.email}</div>
        </div>

        {/* Deliverables Table */}
        <table className="w-full text-left text-xs mb-8">
          <thead>
            <tr className="border-b-2 border-indigo-600 text-indigo-900 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-2.5">Milestone / Deliverable</th>
              <th className="py-2.5 text-right">Units</th>
              <th className="py-2.5 text-right">Rate</th>
              <th className="py-2.5 text-right">Fee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {document.items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-3 font-semibold text-slate-800">{item.description}</td>
                <td className="py-3 text-right tabular-nums text-slate-600">{item.quantity}</td>
                <td className="py-3 text-right tabular-nums text-slate-600">{formatCurrency(item.unitPrice, currency)}</td>
                <td className="py-3 text-right tabular-nums font-bold text-indigo-950">{formatCurrency(item.lineTotal, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-start pt-6 border-t border-slate-200">
          <div className="text-xs text-slate-500 max-w-sm space-y-2">
            <span className="font-bold text-slate-800 block text-xs">Payment Terms & Wire Instructions</span>
            <p className="whitespace-pre-line text-[11px]">{document.paymentInstructions || 'Direct wire remittance'}</p>
          </div>

          <div className="w-64 space-y-2 text-xs text-right">
            <div className="flex justify-between text-slate-600"><span>Advisory Subtotal:</span><span className="font-bold">{formatCurrency(summary.subtotal, currency)}</span></div>
            {summary.totalTax > 0 && <div className="flex justify-between text-slate-600"><span>Tax:</span><span>{formatCurrency(summary.totalTax, currency)}</span></div>}
            <div className="flex justify-between pt-2 border-t-2 border-indigo-600 font-black text-base text-indigo-900">
              <span>Total Investment:</span><span>{formatCurrency(summary.grandTotal, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 8: RETAIL & POS RECEIPT
  // --------------------------------------------------------------------------
  return (
    <div
      id="invoice-document-capture"
      className={`bg-white text-slate-900 shadow-md border-2 border-dashed border-sky-400 p-6 md:p-10 max-w-3xl mx-auto font-mono ${className} print:shadow-none print:border-none print:p-0 print:m-0`}
    >
      <div className="text-center pb-4 border-b-2 border-dashed border-slate-300 space-y-1">
        <div className="flex justify-center mb-2">{renderLogo('h-10 max-w-[150px]')}</div>
        <div className="font-black text-lg uppercase tracking-wider">{document.sender.name || 'COMMERCIAL RETAIL'}</div>
        <div className="text-xs text-slate-500">STORE RECEIPT & INVOICE</div>
        <div className="text-[11px] text-slate-500">#{document.documentNumber} • {document.issueDate}</div>
      </div>

      <div className="py-4 text-xs space-y-1 border-b border-dashed border-slate-300">
        <div>CUSTOMER: <span className="font-bold">{document.client.name}</span></div>
        {document.client.email && <div className="text-[11px] text-slate-500">{document.client.email}</div>}
      </div>

      <div className="py-4">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-dashed border-slate-400 text-[10px] uppercase">
              <th className="py-1">ITEM</th>
              <th className="py-1 text-center">QTY</th>
              <th className="py-1 text-right">PRICE</th>
              <th className="py-1 text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-slate-200">
            {document.items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-2 font-bold">{item.description}</td>
                <td className="py-2 text-center tabular-nums">{item.quantity}</td>
                <td className="py-2 text-right tabular-nums">{formatCurrency(item.unitPrice, currency)}</td>
                <td className="py-2 text-right tabular-nums font-bold">{formatCurrency(item.lineTotal, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-2 border-t-2 border-dashed border-slate-300 space-y-1 text-xs text-right">
        <div className="flex justify-between"><span>SUBTOTAL</span><span>{formatCurrency(summary.subtotal, currency)}</span></div>
        {summary.discountTotal > 0 && <div className="flex justify-between text-emerald-600"><span>DISCOUNT SAVINGS</span><span>-{formatCurrency(summary.discountTotal, currency)}</span></div>}
        {summary.totalTax > 0 && <div className="flex justify-between"><span>TAX</span><span>{formatCurrency(summary.totalTax, currency)}</span></div>}
        <div className="flex justify-between pt-2 border-t border-slate-900 font-black text-base">
          <span>GRAND TOTAL</span><span>{formatCurrency(summary.grandTotal, currency)}</span>
        </div>
      </div>

      <div className="text-center pt-8 text-[11px] text-slate-500 space-y-2">
        <div className="tracking-widest font-mono text-slate-400">||| | |||| ||||| || |||| |||</div>
        <div>THANK YOU FOR SHOPPING WITH US!</div>
      </div>
    </div>
  );
};
