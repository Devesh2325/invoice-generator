'use client';

import React from 'react';
import { DocumentModel, formatCurrency } from '@invoice/core';
import { getTemplate } from '@invoice/theme';

interface DocumentPreviewProps {
  document: DocumentModel;
  className?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  className = '',
}) => {
  const templateMeta = getTemplate(document.templateId || 'modern');
  const tokens = templateMeta.defaultTokens;
  const currency = document.currency || 'USD';
  const summary = document.summary;

  const fontClass =
    tokens.fontFamily === 'serif'
      ? 'font-serif'
      : tokens.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  return (
    <div
      id="invoice-document-capture"
      className={`bg-white text-slate-900 shadow-lg border border-slate-200 rounded-lg p-8 md:p-12 max-w-4xl mx-auto ${fontClass} ${className} print:shadow-none print:border-none print:p-0 print:m-0`}
      style={{
        backgroundColor: tokens.backgroundColor,
        color: tokens.textColor,
      }}
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b pb-8 gap-6 border-slate-200">
        <div className="space-y-3">
          {document.sender.logoUrl ? (
            <img
              src={document.sender.logoUrl}
              alt="Logo"
              className="h-14 max-w-[200px] object-contain mb-2"
            />
          ) : (
            <div
              className="text-2xl font-black tracking-tight"
              style={{ color: tokens.primaryColor }}
            >
              {document.sender.name || 'YOUR COMPANY'}
            </div>
          )}

          <div className="text-xs text-slate-500 space-y-1">
            {document.sender.email && <div>{document.sender.email}</div>}
            {document.sender.phone && <div>{document.sender.phone}</div>}
            {document.sender.taxId && <div>Tax ID: {document.sender.taxId}</div>}
            {document.sender.address && (
              <div>
                {document.sender.address.street1}
                {document.sender.address.city && `, ${document.sender.address.city}`}
                {document.sender.address.country && `, ${document.sender.address.country}`}
              </div>
            )}
          </div>
        </div>

        <div className="text-left md:text-right space-y-2">
          <span
            className="inline-block uppercase tracking-wider text-2xl font-black"
            style={{ color: tokens.primaryColor }}
          >
            {document.type.replace('_', ' ')}
          </span>
          <div className="text-sm font-semibold text-slate-800">
            #{document.documentNumber}
          </div>
          {document.referenceNumber && (
            <div className="text-xs text-slate-500">Ref: {document.referenceNumber}</div>
          )}
          <div className="text-xs text-slate-600 mt-2 space-y-1">
            <div>
              <span className="text-slate-400">Issue Date: </span>
              {document.issueDate || '—'}
            </div>
            {document.dueDate && (
              <div>
                <span className="text-slate-400">Due Date: </span>
                {document.dueDate}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bill To / Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-slate-200">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Bill To:
          </div>
          <div className="text-base font-bold text-slate-900">
            {document.client.name || 'Customer Name'}
          </div>
          <div className="text-xs text-slate-600 mt-1 space-y-1">
            {document.client.email && <div>{document.client.email}</div>}
            {document.client.phone && <div>{document.client.phone}</div>}
            {document.client.taxId && <div>Tax ID: {document.client.taxId}</div>}
            {document.client.billingAddress && (
              <div>
                {document.client.billingAddress.street1}
                {document.client.billingAddress.city &&
                  `, ${document.client.billingAddress.city}`}
                {document.client.billingAddress.country &&
                  `, ${document.client.billingAddress.country}`}
              </div>
            )}
          </div>
        </div>

        {document.client.shippingAddress?.street1 && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Ship To:
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>{document.client.shippingAddress.street1}</div>
              <div>
                {document.client.shippingAddress.city},{' '}
                {document.client.shippingAddress.country}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="py-6">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr
              className="border-b text-xs font-semibold uppercase tracking-wider"
              style={{
                borderColor: tokens.borderColor,
                color: tokens.subtextColor,
              }}
            >
              <th className="py-3 px-2">Description</th>
              <th className="py-3 px-2 text-right">Qty</th>
              <th className="py-3 px-2 text-right">Rate</th>
              <th className="py-3 px-2 text-right">Disc</th>
              <th className="py-3 px-2 text-right">Tax</th>
              <th className="py-3 px-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {document.items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50/50">
                <td className="py-3 px-2 font-medium text-slate-800">
                  {item.description || 'Line item'}
                </td>
                <td className="py-3 px-2 text-right tabular-nums text-slate-600">
                  {item.quantity}
                </td>
                <td className="py-3 px-2 text-right tabular-nums text-slate-600">
                  {formatCurrency(item.unitPrice, currency)}
                </td>
                <td className="py-3 px-2 text-right tabular-nums text-slate-500">
                  {item.lineDiscount > 0
                    ? `-${formatCurrency(item.lineDiscount, currency)}`
                    : '—'}
                </td>
                <td className="py-3 px-2 text-right tabular-nums text-slate-500">
                  {item.taxRate ? `${item.taxRate}%` : '—'}
                </td>
                <td className="py-3 px-2 text-right tabular-nums font-semibold text-slate-900">
                  {formatCurrency(item.lineTotal, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary and Totals */}
      <div className="flex flex-col md:flex-row justify-between items-start pt-4 border-t border-slate-200 gap-8">
        {/* Notes and Payment Terms */}
        <div className="w-full md:w-1/2 space-y-4 text-xs text-slate-600">
          {document.notes && (
            <div>
              <div className="font-bold uppercase tracking-wider text-slate-400 mb-1">
                Notes
              </div>
              <p className="whitespace-pre-line">{document.notes}</p>
            </div>
          )}

          {document.paymentInstructions && (
            <div>
              <div className="font-bold uppercase tracking-wider text-slate-400 mb-1">
                Payment Instructions
              </div>
              <p className="whitespace-pre-line">{document.paymentInstructions}</p>
            </div>
          )}

          {document.paymentTerms && (
            <div>
              <span className="font-semibold text-slate-700">Terms: </span>
              {document.paymentTerms}
            </div>
          )}
        </div>

        {/* Totals Box */}
        <div className="w-full md:w-5/12 space-y-2 text-sm">
          <div className="flex justify-between py-1 text-slate-600">
            <span>Subtotal</span>
            <span className="tabular-nums font-medium">
              {formatCurrency(summary.subtotal, currency)}
            </span>
          </div>

          {summary.discountTotal > 0 && (
            <div className="flex justify-between py-1 text-emerald-600">
              <span>Discount</span>
              <span className="tabular-nums font-medium">
                -{formatCurrency(summary.discountTotal, currency)}
              </span>
            </div>
          )}

          {summary.taxBreakdown.map((b) => (
            <div key={b.rate} className="flex justify-between py-1 text-slate-600">
              <span>Tax ({b.rate}%)</span>
              <span className="tabular-nums font-medium">
                {formatCurrency(b.taxAmount, currency)}
              </span>
            </div>
          ))}

          {summary.shippingFee > 0 && (
            <div className="flex justify-between py-1 text-slate-600">
              <span>Shipping</span>
              <span className="tabular-nums font-medium">
                {formatCurrency(summary.shippingFee, currency)}
              </span>
            </div>
          )}

          {summary.extraCharges > 0 && (
            <div className="flex justify-between py-1 text-slate-600">
              <span>Additional Charges</span>
              <span className="tabular-nums font-medium">
                {formatCurrency(summary.extraCharges, currency)}
              </span>
            </div>
          )}

          <div
            className="flex justify-between py-3 border-t-2 border-slate-900 font-black text-lg"
            style={{ color: tokens.primaryColor }}
          >
            <span>Total</span>
            <span className="tabular-nums">
              {formatCurrency(summary.grandTotal, currency)}
            </span>
          </div>

          {summary.amountPaid > 0 && (
            <>
              <div className="flex justify-between py-1 text-slate-600 text-xs">
                <span>Amount Paid</span>
                <span className="tabular-nums font-medium">
                  {formatCurrency(summary.amountPaid, currency)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-200 font-bold text-base text-red-600">
                <span>Balance Due</span>
                <span className="tabular-nums">
                  {formatCurrency(summary.balanceDue, currency)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
