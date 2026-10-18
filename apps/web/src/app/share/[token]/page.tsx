'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DocumentModel,
  formatCurrency,
  APP_CONFIG,
} from '@invoice/core';
import { TenantApi, TenantBrandSettings } from '@invoice/api';
import { decodePublicShareToken } from '@/components/modals/share-invoice-modal';
import { DocumentPreview } from '@/components/document/document-preview';
import { Button } from '@/components/ui/button';
import {
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  ShieldCheck,
  QrCode,
  ArrowLeft,
  Share2,
  ExternalLink,
} from 'lucide-react';

export default function PublicShareInvoicePage() {
  const params = useParams();
  const token = params?.token as string;

  const [document, setDocument] = useState<DocumentModel | null>(null);
  const [brandSettings, setBrandSettings] = useState<TenantBrandSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpiModal, setShowUpiModal] = useState<boolean>(false);

  useEffect(() => {
    async function loadSharedInvoice() {
      if (!token) {
        setError('Missing invoice token.');
        setLoading(false);
        return;
      }

      const decoded = decodePublicShareToken(token);
      if (!decoded) {
        setError('Invalid or expired invoice link.');
        setLoading(false);
        return;
      }

      try {
        const doc = await TenantApi.getDocumentById(decoded.tenantId, decoded.docId);
        if (!doc) {
          setError('This invoice could not be found or has been revoked.');
          setLoading(false);
          return;
        }

        const brand = await TenantApi.getBrandSettings(decoded.tenantId);
        setDocument(doc);
        setBrandSettings(brand);
      } catch (err: any) {
        setError(err.message || 'Unable to access shared invoice.');
      } finally {
        setLoading(false);
      }
    }

    loadSharedInvoice();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const statusBadge = useMemo(() => {
    if (!document) return null;
    const s = document.status || 'draft';
    if (s === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Paid in Full
        </span>
      );
    }
    if (s === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          <AlertCircle className="w-3.5 h-3.5" />
          Payment Overdue
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        <Clock className="w-3.5 h-3.5" />
        Payment Due
      </span>
    );
  }, [document]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
          Loading secure invoice...
        </p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Invoice Link Inaccessible
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6 text-sm">
          {error || 'This link may have expired or the issuing organization revoked access.'}
        </p>
        <Link href="/">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
            Go to {APP_CONFIG.brandName} Homepage
          </Button>
        </Link>
      </div>
    );
  }

  const senderName = document.sender?.name || brandSettings?.businessName || 'Issuing Business';
  const currency = document.currency || 'INR';
  const totalAmount = document.summary?.grandTotal || 0;
  const balanceDue = document.summary?.balanceDue ?? totalAmount;
  const upiId = document.paymentConfig?.upiId || brandSettings?.paymentConfig?.upiId;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* Top Banner & Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-none">
                  {document.documentNumber || 'Invoice'}
                </h1>
                {statusBadge}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Issued by <span className="font-semibold text-slate-700 dark:text-slate-300">{senderName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {upiId && document.status !== 'paid' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpiModal(true)}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/50 gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                <span>Pay via UPI</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-slate-700 dark:text-slate-200"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Trust & Verification Strip */}
      <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50 px-4 py-2 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span>
              Official Read-Only Invoice Link &bull; Verified Digital Copy issued via{' '}
              <strong>{brandSettings?.whiteLabelEnabled ? senderName : APP_CONFIG.brandName}</strong>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <span>Issue Date: <strong>{document.issueDate || 'N/A'}</strong></span>
            {document.dueDate && (
              <span>Due: <strong>{document.dueDate}</strong></span>
            )}
            <span>
              Total: <strong>{formatCurrency(totalAmount, currency)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Canvas with dynamic high-resolution preview */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex justify-center">
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-2 sm:p-6 overflow-hidden">
          <DocumentPreview
            document={document}
            className="w-full"
            isPrintOnly={false}
          />
        </div>
      </main>

      {/* Payment / UPI Modal */}
      {showUpiModal && upiId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Pay {formatCurrency(balanceDue, currency)} via UPI
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Scan with any UPI app (Google Pay, PhonePe, Paytm, BHIM)
            </p>

            <div className="my-5 p-4 bg-white dark:bg-white rounded-xl inline-block shadow-inner border border-slate-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `upi://pay?pa=${upiId}&pn=${encodeURIComponent(senderName)}&am=${balanceDue}&cu=${currency}&tn=Inv%20${document.documentNumber}`
                )}`}
                alt="UPI QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 text-left text-xs mb-4">
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Payee UPI ID:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">{upiId}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Payee Name:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{senderName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Amount:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(balanceDue, currency)}</span>
              </div>
            </div>

            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700"
              onClick={() => setShowUpiModal(false)}
            >
              Done / Close
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden">
        <p>
          Generated securely via{' '}
          <Link
            href="/"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {brandSettings?.whiteLabelEnabled ? senderName : APP_CONFIG.brandName}
          </Link>
          . Free, open & modern invoicing platform.
        </p>
      </footer>
    </div>
  );
}
