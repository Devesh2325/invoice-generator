'use client';

import React, { useRef } from 'react';
import {
  DocumentModel,
  formatCurrency,
  generateVerifiedUpiQrSvgDataUrl,
  formatInvoiceStatusLabel,
} from '@invoice/core';
import { getTemplate } from '@invoice/theme';
import { Upload, X } from 'lucide-react';

interface DocumentPreviewProps {
  document: DocumentModel;
  className?: string;
  captureId?: string;
  isPrintOnly?: boolean;
  onLogoUpload?: (dataUrl: string) => void;
  onRemoveLogo?: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  className = '',
  captureId = 'invoice-document-capture',
  isPrintOnly = false,
  onLogoUpload,
  onRemoveLogo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateMeta = getTemplate(document.templateId || 'cleartax_gst');
  const baseTokens = templateMeta.defaultTokens;

  // Merge template tokens with any user custom theme overrides
  const primaryColor = document.customTheme?.primaryColor || baseTokens.primaryColor;
  const secondaryColor = document.customTheme?.secondaryColor || baseTokens.secondaryColor;
  const fontFamily = document.customTheme?.fontFamily || baseTokens.fontFamily;

  const currency = document.currency || 'INR';
  const summary = document.summary;
  const isInterState = summary.gstSupplyType === 'inter';
  const senderState = document.sender.address?.state || '';
  const clientState = document.client.billingAddress?.state || document.placeOfSupply || '';

  const payConfig = document.paymentConfig;
  const showBankDetails = payConfig ? payConfig.display.showBankDetails : false;
  const showUpiId = payConfig ? payConfig.display.showUpiId : false;
  const showQrCode = payConfig ? payConfig.display.showQrCode : false;
  const showPaymentInstructions = payConfig ? payConfig.display.showPaymentInstructions : true;
  const showPaymentTerms = payConfig ? payConfig.display.showPaymentTerms : true;

  const activeBankAccounts = React.useMemo(() => {
    if (!payConfig?.bankAccounts?.length) return [];
    if (payConfig.selectedBankAccountIds && payConfig.selectedBankAccountIds.length > 0) {
      return payConfig.bankAccounts.filter((b) =>
        payConfig.selectedBankAccountIds!.includes(b.id)
      );
    }
    return payConfig.bankAccounts;
  }, [payConfig]);

  const verifiedQrDataUrl = React.useMemo(() => {
    if (!showQrCode || !payConfig) return null;
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
  }, [showQrCode, payConfig, document.sender.name, document.documentNumber, summary.balanceDue, summary.grandTotal, currency]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onLogoUpload) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onLogoUpload(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    if (onLogoUpload && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const fontClass =
    fontFamily === 'serif'
      ? 'font-serif'
      : fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const docTitle =
    document.type === 'invoice'
      ? 'TAX INVOICE'
      : document.type === 'estimate'
      ? 'ESTIMATE / QUOTATION'
      : document.type === 'pro_forma'
      ? 'PRO FORMA INVOICE'
      : document.type.replace('_', ' ').toUpperCase();

  // Common Logo Render
  const renderLogo = (customClass = 'h-14 max-w-[200px]', invertBg = false) => (
    <div className="relative group inline-block">
      {!isPrintOnly && onLogoUpload && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="image/*"
          className="hidden"
        />
      )}
      {document.sender.logoUrl ? (
        <div className="relative inline-block">
          <img
            src={document.sender.logoUrl}
            alt="Business Logo"
            className={`${customClass} object-contain ${
              onLogoUpload ? 'cursor-pointer' : ''
            } ${invertBg ? 'bg-white p-1.5 rounded' : ''}`}
            onClick={triggerUpload}
            title={onLogoUpload ? 'Click to replace logo' : undefined}
          />
          {!isPrintOnly && onRemoveLogo && (
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
      ) : !isPrintOnly && onLogoUpload ? (
        <button
          type="button"
          onClick={triggerUpload}
          className={`no-print flex items-center gap-1.5 px-3 py-2 border-2 border-dashed rounded-lg text-xs font-semibold transition-colors ${
            invertBg
              ? 'border-white/40 text-white/90 hover:border-white bg-white/10'
              : 'border-slate-300 text-slate-500 hover:border-blue-600 hover:text-blue-600 bg-slate-50/60'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>+ Add Company Logo</span>
        </button>
      ) : null}
    </div>
  );

  // Shared Full Sender Address Block
  const renderSenderDetails = (textColorClass = 'text-slate-600', strongClass = 'text-slate-800') => (
    <div className={`text-xs space-y-0.5 leading-relaxed ${textColorClass}`}>
      {document.sender.address?.street1 && <div>{document.sender.address.street1}</div>}
      {(document.sender.address?.city ||
        document.sender.address?.state ||
        document.sender.address?.postalCode) && (
        <div>
          {[
            document.sender.address?.city,
            document.sender.address?.state,
            document.sender.address?.postalCode,
          ]
            .filter(Boolean)
            .join(', ')}
        </div>
      )}
      {document.sender.address?.country && <div>{document.sender.address.country}</div>}
      <div className="pt-1 flex flex-wrap gap-x-4 gap-y-0.5">
        {document.sender.email && (
          <span>
            <strong className={strongClass}>Email:</strong> {document.sender.email}
          </span>
        )}
        {document.sender.phone && (
          <span>
            <strong className={strongClass}>Phone:</strong> {document.sender.phone}
          </span>
        )}
      </div>
      {document.sender.taxId && (
        <div className="pt-0.5">
          <span className={`font-bold ${strongClass}`}>GSTIN: </span>
          <span className="font-mono font-bold tracking-wide">{document.sender.taxId}</span>
        </div>
      )}
      {senderState && (
        <div>
          <span className={`font-semibold ${strongClass}`}>State: </span>
          <span>{senderState}</span>
        </div>
      )}
    </div>
  );

  // Shared Full Client Address Block
  const renderClientDetails = () => (
    <div className="text-xs text-slate-600 space-y-0.5 leading-relaxed">
      <div className="font-bold text-slate-900 text-sm">{document.client.name || 'Client Name'}</div>
      {document.client.billingAddress?.street1 && (
        <div>{document.client.billingAddress.street1}</div>
      )}
      {(document.client.billingAddress?.city ||
        document.client.billingAddress?.state ||
        document.client.billingAddress?.postalCode) && (
        <div>
          {[
            document.client.billingAddress?.city,
            document.client.billingAddress?.state,
            document.client.billingAddress?.postalCode,
          ]
            .filter(Boolean)
            .join(', ')}
        </div>
      )}
      {document.client.billingAddress?.country && (
        <div>{document.client.billingAddress.country}</div>
      )}
      <div className="pt-1 flex flex-wrap gap-x-4 gap-y-0.5">
        {document.client.email && (
          <span>
            <strong className="text-slate-700">Email:</strong> {document.client.email}
          </span>
        )}
        {document.client.phone && (
          <span>
            <strong className="text-slate-700">Phone:</strong> {document.client.phone}
          </span>
        )}
      </div>
      {document.client.taxId && (
        <div className="pt-0.5">
          <span className="font-bold text-slate-800">GSTIN: </span>
          <span className="font-mono font-bold text-slate-900">{document.client.taxId}</span>
        </div>
      )}
      {clientState && (
        <div>
          <span className="font-semibold text-slate-800">Place of Supply / State: </span>
          <span className="font-semibold text-slate-900">{clientState}</span>
        </div>
      )}
    </div>
  );

  // Shared Line Items Table with HSN/SAC & CGST/SGST or IGST columns
  const renderItemsTable = (headerStyle: 'solid' | 'tinted' | 'bordered' | 'minimal' = 'solid') => {
    const thStyle =
      headerStyle === 'solid'
        ? { backgroundColor: primaryColor, color: '#FFFFFF' }
        : headerStyle === 'tinted'
        ? {
            backgroundColor: `${primaryColor}14`,
            color: primaryColor,
            borderBottom: `2px solid ${primaryColor}`,
          }
        : headerStyle === 'bordered'
        ? {
            backgroundColor: '#F8FAFC',
            color: '#0F172A',
            borderTop: '2px solid #0F172A',
            borderBottom: '2px solid #0F172A',
          }
        : {
            backgroundColor: 'transparent',
            color: primaryColor,
            borderBottom: `2px solid ${primaryColor}`,
          };

    return (
      <div className="my-6 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr style={thStyle} className="uppercase tracking-wider font-bold text-[10px]">
              <th className="py-2.5 px-2.5 w-8 text-center">#</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-2 text-center">HSN/SAC</th>
              <th className="py-2.5 px-2 text-right">Qty</th>
              <th className="py-2.5 px-2.5 text-right">Rate</th>
              <th className="py-2.5 px-2 text-right">Disc</th>
              <th className="py-2.5 px-2 text-right">Taxable</th>
              {isInterState ? (
                <th className="py-2.5 px-2.5 text-right">IGST</th>
              ) : (
                <>
                  <th className="py-2.5 px-2 text-right">CGST</th>
                  <th className="py-2.5 px-2 text-right">SGST</th>
                </>
              )}
              <th className="py-2.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {document.items.map((item, idx) => (
              <tr
                key={item.id}
                className={idx % 2 === 1 && headerStyle === 'solid' ? 'bg-slate-50/60' : ''}
              >
                <td className="py-3 px-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                <td className="py-3 px-3 font-medium text-slate-900">{item.description}</td>
                <td className="py-3 px-2 text-center font-mono text-slate-600">
                  {item.hsnCode || '—'}
                </td>
                <td className="py-3 px-2 text-right font-mono text-slate-800">{item.quantity}</td>
                <td className="py-3 px-2.5 text-right font-mono text-slate-800">
                  {formatCurrency(item.unitPrice, currency)}
                </td>
                <td className="py-3 px-2 text-right font-mono text-slate-600">
                  {item.lineDiscount > 0 ? formatCurrency(item.lineDiscount, currency) : '—'}
                </td>
                <td className="py-3 px-2 text-right font-mono text-slate-800">
                  {formatCurrency(item.lineNet, currency)}
                </td>
                {isInterState ? (
                  <td className="py-3 px-2.5 text-right font-mono text-slate-700">
                    <div>{formatCurrency(item.igstAmount || item.taxAmount, currency)}</div>
                    <div className="text-[10px] text-slate-400">({item.taxRate || 0}%)</div>
                  </td>
                ) : (
                  <>
                    <td className="py-3 px-2 text-right font-mono text-slate-700">
                      <div>{formatCurrency(item.cgstAmount || item.taxAmount / 2, currency)}</div>
                      <div className="text-[10px] text-slate-400">
                        ({(item.taxRate || 0) / 2}%)
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-700">
                      <div>{formatCurrency(item.sgstAmount || item.taxAmount / 2, currency)}</div>
                      <div className="text-[10px] text-slate-400">
                        ({(item.taxRate || 0) / 2}%)
                      </div>
                    </td>
                  </>
                )}
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                  {formatCurrency(item.lineTotal, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Shared Totals, GST Breakdown, Notes & Signatory Footer
  const renderSummaryAndFooter = () => (
    <div className="space-y-6 pt-2">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Payment Instructions, Terms & GST Tax Breakdown Table */}
        <div className="md:col-span-7 space-y-4">
          {/* GST Rate-wise Tax Summary Box */}
          {summary.taxBreakdown.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
              <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 flex justify-between">
                <span>GST Tax Summary Breakdown</span>
                <span>
                  Supply Type:{' '}
                  <strong className="text-slate-900">
                    {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                  </strong>
                </span>
              </div>
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-1.5 px-2.5 text-left">Taxable Value</th>
                    {isInterState ? (
                      <>
                        <th className="py-1.5 px-2 text-right">IGST %</th>
                        <th className="py-1.5 px-2.5 text-right">IGST Amt</th>
                      </>
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
                        <>
                          <td className="py-1.5 px-2 text-right">{tb.rate}%</td>
                          <td className="py-1.5 px-2.5 text-right">
                            {formatCurrency(tb.igstAmount ?? tb.taxAmount, currency)}
                          </td>
                        </>
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

          {/* Structured Payment Details (Controlled by Payment Settings toggles) */}
          {(showBankDetails && activeBankAccounts.length > 0) ||
          (showUpiId && payConfig?.upiId) ||
          verifiedQrDataUrl ? (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-2.5 flex-1">
                {showBankDetails && activeBankAccounts.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Bank Account Details ({activeBankAccounts.length > 1 ? `${activeBankAccounts.length} Accounts` : 'NEFT / RTGS / Wire'})
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {activeBankAccounts.map((bank) => (
                        <div
                          key={bank.id}
                          className="text-[11px] bg-white p-2.5 rounded-lg border border-slate-200/80 grid grid-cols-2 gap-x-3 gap-y-1"
                        >
                          <div>
                            <span className="text-slate-400">Account Holder: </span>
                            <span className="font-bold text-slate-800">{bank.accountHolderName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Bank Name: </span>
                            <span className="font-bold text-slate-800">{bank.bankName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Account No: </span>
                            <span className="font-mono font-bold text-slate-900">{bank.accountNumber}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">IFSC / Routing: </span>
                            <span className="font-mono font-bold text-slate-900">{bank.ifscOrRoutingCode}</span>
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
                              <span className="capitalize text-slate-700">{bank.accountType}</span>
                            </div>
                          )}
                          {bank.swiftBicCode && (
                            <div className="col-span-2">
                              <span className="text-slate-400">SWIFT / BIC: </span>
                              <span className="font-mono font-semibold text-slate-800">{bank.swiftBicCode}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showUpiId && payConfig?.upiId && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      UPI ID / VPA:
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {payConfig.upiId}
                    </span>
                  </div>
                )}
              </div>

              {verifiedQrDataUrl && (
                <div className="shrink-0 flex flex-col items-center justify-center bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <img
                    src={verifiedQrDataUrl}
                    alt="Verified Payment QR Code"
                    className="h-24 w-24 object-contain"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                    Scan to Pay
                  </span>
                </div>
              )}
            </div>
          ) : null}

          {showPaymentTerms && document.paymentTerms && (
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payment Terms:
              </span>
              <span className="font-semibold">{document.paymentTerms}</span>
            </div>
          )}

          {showPaymentInstructions && document.paymentInstructions && (
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Payment Instructions
              </div>
              <div className="text-xs text-slate-700 whitespace-pre-line font-mono leading-relaxed">
                {document.paymentInstructions}
              </div>
            </div>
          )}

          {document.notes && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Terms & Conditions / Notes
              </div>
              <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                {document.notes}
              </div>
            </div>
          )}
        </div>

        {/* Right 5 cols: Totals & Signatory */}
        <div className="md:col-span-5 space-y-4">
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (Gross)</span>
              <span className="font-mono font-medium text-slate-900">
                {formatCurrency(summary.subtotal, currency)}
              </span>
            </div>

            {summary.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Total Discount</span>
                <span className="font-mono font-medium">
                  -{formatCurrency(summary.discountTotal, currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-1.5">
              <span>Taxable Amount</span>
              <span className="font-mono font-semibold text-slate-900">
                {formatCurrency(summary.taxableSubtotal, currency)}
              </span>
            </div>

            {isInterState ? (
              <div className="flex justify-between text-slate-700">
                <span>IGST Total</span>
                <span className="font-mono font-medium text-slate-900">
                  {formatCurrency(summary.igstTotal ?? summary.totalTax, currency)}
                </span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-slate-700">
                  <span>CGST Total</span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatCurrency(summary.cgstTotal ?? summary.totalTax / 2, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>SGST Total</span>
                  <span className="font-mono font-medium text-slate-900">
                    {formatCurrency(summary.sgstTotal ?? summary.totalTax / 2, currency)}
                  </span>
                </div>
              </>
            )}

            {summary.shippingFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Shipping & Handling</span>
                <span className="font-mono">{formatCurrency(summary.shippingFee, currency)}</span>
              </div>
            )}

            {summary.extraCharges > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Extra Charges</span>
                <span className="font-mono">{formatCurrency(summary.extraCharges, currency)}</span>
              </div>
            )}

            {(document.enableRoundOff || (summary.roundOffAmount !== undefined && summary.roundOffAmount !== 0)) && (
              <>
                <div className="flex justify-between text-slate-500 border-t border-slate-100 pt-1.5">
                  <span>Total Before Round-Off</span>
                  <span className="font-mono">
                    {formatCurrency(summary.totalBeforeRoundOff ?? summary.grandTotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Round-Off Adjustment</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(summary.roundOffAmount || 0, currency, { showSign: true })}
                  </span>
                </div>
              </>
            )}

            <div
              className="flex justify-between items-center p-3 rounded-lg text-white font-bold text-sm mt-2"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Final Payable Amount</span>
              <span className="font-mono text-base">
                {formatCurrency(summary.grandTotal, currency)}
              </span>
            </div>

            {(summary.amountPaid > 0 || (summary.refundedAmount || 0) > 0) && (
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <div className="flex justify-between text-emerald-700">
                  <span>Payments Collected</span>
                  <span className="font-mono font-semibold">
                    -{formatCurrency(summary.amountPaid, currency)}
                  </span>
                </div>
                {(summary.refundedAmount || 0) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Refunded Amount</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(summary.refundedAmount || 0, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-sm">
                  <span>Balance Due</span>
                  <span className="font-mono" style={{ color: primaryColor }}>
                    {formatCurrency(summary.balanceDue, currency)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Authorized Signatory Box */}
          <div className="border border-slate-200 rounded-lg p-3 text-right bg-slate-50/40">
            <div className="text-[10px] font-bold text-slate-500 uppercase">
              For {document.sender.name || 'Authorized Business'}
            </div>
            <div className="h-10 flex items-end justify-end">
              {document.signatoryName && (
                <span className="font-serif italic text-sm text-slate-800">
                  {document.signatoryName}
                </span>
              )}
            </div>
            <div className="text-[10px] font-semibold text-slate-400 border-t border-slate-200 pt-1 inline-block px-4">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // LAYOUT GROUP A: TALLY / BORDERED TAX GRID ('tally_prime')
  // ============================================================================
  if (templateMeta.id === 'tally_prime') {
    return (
      <div
        id={captureId}
        className={`bg-white text-slate-900 border-2 border-slate-900 p-6 md:p-8 max-w-4xl mx-auto ${fontClass} ${className} print:shadow-none print:m-0`}
      >
        <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-600">
            {docTitle}
          </div>
          <div className="text-2xl font-black uppercase text-slate-900 mt-0.5">
            {document.sender.name}
          </div>
          <div className="text-xs text-slate-700">
            {[
              document.sender.address?.street1,
              document.sender.address?.city,
              document.sender.address?.state,
              document.sender.address?.postalCode,
            ]
              .filter(Boolean)
              .join(', ')}
          </div>
          <div className="text-xs font-mono font-bold mt-1">
            {document.sender.taxId && <span>GSTIN: {document.sender.taxId}</span>}
            {document.sender.phone && <span className="ml-4">Tel: {document.sender.phone}</span>}
            {document.sender.email && <span className="ml-4">Email: {document.sender.email}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-slate-900 mb-4">
          <div className="p-3 border-b-2 md:border-b-0 md:border-r-2 border-slate-900">
            <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">
              Buyer (Bill To):
            </div>
            {renderClientDetails()}
          </div>
          <div className="grid grid-cols-2 text-xs divide-y divide-x divide-slate-900">
            <div className="p-2.5">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Invoice No.</div>
              <div className="font-mono font-bold text-slate-900">{document.documentNumber}</div>
            </div>
            <div className="p-2.5">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Dated</div>
              <div className="font-bold text-slate-900">{document.issueDate}</div>
            </div>
            <div className="p-2.5">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Due Date</div>
              <div className="font-semibold text-slate-900">{document.dueDate || '—'}</div>
            </div>
            <div className="p-2.5">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Terms / Ref</div>
              <div className="font-semibold text-slate-900">
                {document.paymentTerms || document.referenceNumber || 'Immediate'}
              </div>
            </div>
            <div className="p-2.5 col-span-2">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Place of Supply</div>
              <div className="font-bold text-slate-900">
                {clientState || senderState || 'India'} (
                {isInterState ? 'Inter-State IGST' : 'Intra-State CGST+SGST'})
              </div>
            </div>
          </div>
        </div>

        {renderItemsTable('bordered')}
        {renderSummaryAndFooter()}
      </div>
    );
  }

  // ============================================================================
  // LAYOUT GROUP B: FULL-BLEED COLORED BANNER HEADER
  // ('cleartax_gst', 'vyapar_classic', 'professional', 'corporate', 'canva_studio', 'agency_retainer')
  // ============================================================================
  if (baseTokens.headerLayout === 'banner') {
    return (
      <div
        id={captureId}
        className={`bg-white text-slate-900 shadow-xl border border-slate-200 rounded-xl overflow-hidden max-w-4xl mx-auto ${fontClass} ${className} print:shadow-none print:border-none print:rounded-none`}
      >
        {/* Full-bleed Colored Header Banner */}
        <div
          className="p-6 md:p-10 text-white flex flex-col md:flex-row justify-between items-start gap-6"
          style={{
            background:
              templateMeta.id === 'canva_studio'
                ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                : primaryColor,
          }}
        >
          <div className="space-y-2.5">
            {renderLogo('h-14 max-w-[200px]', true)}
            <div className="text-2xl font-black tracking-tight">
              {document.sender.name || 'Your Business Name'}
            </div>
            {renderSenderDetails('text-white/85', 'text-white')}
          </div>

          <div className="text-left md:text-right space-y-2 shrink-0">
            <div className="inline-block px-3 py-1 rounded bg-white/20 backdrop-blur-xs text-white text-xs font-black tracking-widest uppercase">
              {docTitle}
            </div>
            <div className="text-2xl font-mono font-black">#{document.documentNumber}</div>
            <div className="text-xs text-white/90 space-y-0.5">
              <div>
                Issue Date: <strong>{document.issueDate}</strong>
              </div>
              {document.dueDate && (
                <div>
                  Due Date: <strong>{document.dueDate}</strong>
                </div>
              )}
              {document.referenceNumber && (
                <div>
                  PO / Ref: <strong>{document.referenceNumber}</strong>
                </div>
              )}
              {document.paymentTerms && (
                <div>
                  Terms: <strong>{document.paymentTerms}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-6">
          {/* Bill To + Supply Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-1"
                style={{ color: primaryColor }}
              >
                Billed To (Customer Details)
              </div>
              {renderClientDetails()}
            </div>
            <div className="flex flex-col justify-between md:text-right space-y-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  GST Supply Classification
                </div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {isInterState
                    ? 'Inter-State Supply (IGST Applicable)'
                    : 'Intra-State Supply (CGST + SGST Applicable)'}
                </div>
                {(clientState || senderState) && (
                  <div className="text-xs text-slate-600">
                    Place of Supply: <strong>{clientState || senderState}</strong>
                  </div>
                )}
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200 inline-block md:ml-auto">
                <div className="text-[10px] uppercase font-bold text-slate-400">Amount Due</div>
                <div className="text-xl font-black font-mono" style={{ color: primaryColor }}>
                  {formatCurrency(summary.balanceDue, currency)}
                </div>
              </div>
            </div>
          </div>

          {renderItemsTable('solid')}
          {renderSummaryAndFooter()}
        </div>
      </div>
    );
  }

  // ============================================================================
  // LAYOUT GROUP C: LEFT ACCENT SIDEBAR ('freshbooks_cloud')
  // ============================================================================
  if (baseTokens.headerLayout === 'sidebar') {
    return (
      <div
        id={captureId}
        className={`bg-white text-slate-900 shadow-xl border border-slate-200 rounded-xl overflow-hidden max-w-4xl mx-auto flex ${fontClass} ${className} print:shadow-none print:border-none`}
      >
        <div className="w-3 shrink-0" style={{ backgroundColor: primaryColor }} />
        <div className="flex-1 p-6 md:p-10 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-6">
            <div className="space-y-2">
              {renderLogo()}
              <div className="text-2xl font-black" style={{ color: primaryColor }}>
                {document.sender.name}
              </div>
              {renderSenderDetails()}
            </div>
            <div className="text-left md:text-right space-y-2">
              <div
                className="text-2xl font-black uppercase tracking-tight"
                style={{ color: primaryColor }}
              >
                {docTitle}
              </div>
              <div className="font-mono font-bold text-base text-slate-800">
                #{document.documentNumber}
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <div>Issued: {document.issueDate}</div>
                {document.dueDate && <div>Due: {document.dueDate}</div>}
                {document.referenceNumber && <div>Ref: {document.referenceNumber}</div>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Bill To
              </div>
              {renderClientDetails()}
            </div>
            <div
              className="p-4 rounded-lg flex flex-col justify-center items-start md:items-end"
              style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Balance Due
              </span>
              <span className="text-3xl font-black font-mono mt-1" style={{ color: primaryColor }}>
                {formatCurrency(summary.balanceDue, currency)}
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
              </span>
            </div>
          </div>

          {renderItemsTable('tinted')}
          {renderSummaryAndFooter()}
        </div>
      </div>
    );
  }

  // ============================================================================
  // LAYOUT GROUP D: CENTERED CLASSIC SERIF ('classic')
  // ============================================================================
  if (baseTokens.headerLayout === 'centered') {
    return (
      <div
        id={captureId}
        className={`bg-white text-slate-900 shadow-xl border border-slate-300 p-8 md:p-12 max-w-4xl mx-auto ${fontClass} ${className} print:shadow-none print:border-none`}
      >
        <div className="text-center border-b-4 border-double border-slate-800 pb-6 mb-6 space-y-2">
          {renderLogo('h-14 mx-auto')}
          <div className="text-3xl font-bold tracking-wide uppercase text-slate-900">
            {document.sender.name}
          </div>
          {renderSenderDetails('text-slate-600 flex flex-col items-center')}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-300 pb-6 mb-6 gap-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
              Prepared For:
            </div>
            {renderClientDetails()}
          </div>
          <div className="text-left md:text-right space-y-1 text-xs">
            <div className="text-lg font-bold uppercase tracking-widest text-slate-900">
              {docTitle}
            </div>
            <div className="font-mono font-bold text-sm">No: #{document.documentNumber}</div>
            <div>Date: {document.issueDate}</div>
            {document.dueDate && <div>Due Date: {document.dueDate}</div>}
            {document.referenceNumber && <div>Ref: {document.referenceNumber}</div>}
            {document.paymentTerms && <div>Payment Terms: {document.paymentTerms}</div>}
          </div>
        </div>

        {renderItemsTable('bordered')}
        {renderSummaryAndFooter()}
      </div>
    );
  }

  // ============================================================================
  // LAYOUT GROUP E: SPLIT MODERN / SAAS / ENTERPRISE
  // ('modern', 'stripe_clean', 'zoho_standard', 'quickbooks_premier', 'consulting', 'minimal', 'service_business', 'retail')
  // ============================================================================
  return (
    <div
      id={captureId}
      className={`bg-white text-slate-900 shadow-xl border border-slate-200 rounded-2xl p-6 md:p-10 max-w-4xl mx-auto ${fontClass} ${className} print:shadow-none print:border-none print:p-0`}
    >
      {/* Top Accent Strip */}
      <div
        className="h-2.5 -mt-6 -mx-6 md:-mt-10 md:-mx-10 rounded-t-2xl mb-8"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Split Header */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-6">
        <div className="space-y-2.5">
          {renderLogo()}
          <div className="text-2xl font-black tracking-tight text-slate-900">
            {document.sender.name || 'Your Business Name'}
          </div>
          {renderSenderDetails()}
        </div>

        <div className="text-left md:text-right space-y-2 shrink-0">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            {docTitle}
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            #{document.documentNumber}
          </div>
          <div className="text-xs text-slate-600 space-y-0.5">
            <div>
              Issue Date: <strong className="text-slate-900">{document.issueDate}</strong>
            </div>
            {document.dueDate && (
              <div>
                Due Date: <strong className="text-slate-900">{document.dueDate}</strong>
              </div>
            )}
            {document.referenceNumber && (
              <div>
                Ref / PO: <strong className="text-slate-900">{document.referenceNumber}</strong>
              </div>
            )}
            {document.paymentTerms && (
              <div>
                Terms: <strong className="text-slate-900">{document.paymentTerms}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bill To & Supply Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
          <span
            className="text-[10px] font-bold uppercase tracking-wider block mb-1"
            style={{ color: primaryColor }}
          >
            Bill To (Customer)
          </span>
          {renderClientDetails()}
        </div>

        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Tax & Supply Details
            </span>
            <div className="text-xs font-bold text-slate-800">
              {isInterState
                ? 'Inter-State Supply (IGST Applicable)'
                : 'Intra-State Supply (CGST + SGST Applicable)'}
            </div>
            <div className="text-xs text-slate-600">
              Supplier State: <strong>{senderState || 'Not Specified'}</strong>
            </div>
            <div className="text-xs text-slate-600">
              Place of Supply: <strong>{clientState || senderState || 'Same State'}</strong>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-xs font-bold uppercase text-slate-500">Balance Due</span>
            <span className="text-xl font-black font-mono" style={{ color: primaryColor }}>
              {formatCurrency(summary.balanceDue, currency)}
            </span>
          </div>
        </div>
      </div>

      {renderItemsTable(templateMeta.id === 'minimal' ? 'minimal' : 'solid')}
      {renderSummaryAndFooter()}
    </div>
  );
};
