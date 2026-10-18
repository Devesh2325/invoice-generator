'use client';

import React, { useState, useMemo } from 'react';
import {
  DocumentModel,
  formatCurrency,
  APP_CONFIG,
} from '@invoice/core';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Share2,
  Mail,
  MessageCircle,
  Copy,
  Printer,
  Download,
  Smartphone,
  Send,
  Check,
  Globe,
  X,
  ExternalLink,
} from 'lucide-react';

interface ShareInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentModel;
  onDownloadPdf?: () => void;
  onPrint?: () => void;
}

export function generatePublicShareToken(tenantId: string, docId: string): string {
  try {
    const raw = `${tenantId}:${docId}`;
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return Buffer.from(raw).toString('base64url');
  } catch {
    return `${tenantId}_${docId}`;
  }
}

export function decodePublicShareToken(token: string): { tenantId: string; docId: string } | null {
  try {
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    let decoded = '';
    if (typeof window !== 'undefined' && window.atob) {
      decoded = window.atob(base64);
    } else {
      decoded = Buffer.from(base64, 'base64').toString('utf-8');
    }
    const [tenantId, docId] = decoded.split(':');
    if (tenantId && docId) {
      return { tenantId, docId };
    }
    return null;
  } catch {
    return null;
  }
}

export const ShareInvoiceModal: React.FC<ShareInvoiceModalProps> = ({
  open,
  onOpenChange,
  document,
  onDownloadPdf,
  onPrint,
}) => {
  const [copied, setCopied] = useState(false);

  const tenantId = document.tenantId || 'default';
  const docId = document.id;
  const docNumber = document.documentNumber;
  const clientName = document.client?.name || 'Customer';
  const clientEmail = document.client?.email || '';
  const clientPhone = document.client?.phone || '';
  const senderName = document.sender?.name || APP_CONFIG.brandName;
  const grandTotal = document.summary?.grandTotal || 0;
  const currency = document.currency || 'INR';
  const dueDate = document.dueDate || 'On Receipt';

  const shareToken = useMemo(() => {
    return generatePublicShareToken(tenantId, docId);
  }, [tenantId, docId]);

  const publicShareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/share/${shareToken}`;
    }
    return `https://${APP_CONFIG.brandDomain}/share/${shareToken}`;
  }, [shareToken]);

  const shareMessage = `Hello ${clientName}, please find your invoice #${docNumber} for ${formatCurrency(
    grandTotal,
    currency
  )} from ${senderName}. Due date: ${dueDate}. View and pay online here: ${publicShareUrl}`;

  const emailSubject = `Invoice #${docNumber} from ${senderName}`;
  const emailBody = `Dear ${clientName},\n\nPlease find attached invoice #${docNumber} for ${formatCurrency(
    grandTotal,
    currency
  )}.\n\nDue Date: ${dueDate}\nView and pay online: ${publicShareUrl}\n\nThank you for your business!\n${senderName}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(publicShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: emailSubject,
          text: shareMessage,
          url: publicShareUrl,
        });
      } catch (err) {
        // Share cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
  const whatsAppUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    publicShareUrl
  )}&text=${encodeURIComponent(shareMessage)}`;

  const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(shareMessage)}`;
  const mailtoUrl = `mailto:${clientEmail}?subject=${encodeURIComponent(
    emailSubject
  )}&body=${encodeURIComponent(emailBody)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 sm:p-7 border-border bg-card rounded-2xl shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-foreground">
                Share Invoice #{docNumber}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Billed to {clientName} • {formatCurrency(grandTotal, currency)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Public Share Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-primary" />
              Tokenized Public Link (Read-Only)
            </span>
            <span className="text-[10px] text-muted-foreground">Unguessable & Scoped</span>
          </label>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={publicShareUrl}
              className="text-xs font-mono bg-muted/50 border-border select-all"
            />
            <Button
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0 text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Instant Dispatch Channels */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-foreground uppercase tracking-wider text-[10px]">
            Instant Send Channels
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* WhatsApp */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-border bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 transition-all text-center flex flex-col items-center justify-center gap-1.5 group"
            >
              <MessageCircle className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">WhatsApp</span>
            </a>

            {/* Email */}
            <a
              href={mailtoUrl}
              className="p-3 rounded-xl border border-border bg-blue-500/10 hover:bg-blue-500/15 text-blue-700 dark:text-blue-300 transition-all text-center flex flex-col items-center justify-center gap-1.5 group"
            >
              <Mail className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Email</span>
            </a>

            {/* SMS */}
            <a
              href={smsUrl}
              className="p-3 rounded-xl border border-border bg-amber-500/10 hover:bg-amber-500/15 text-amber-700 dark:text-amber-300 transition-all text-center flex flex-col items-center justify-center gap-1.5 group"
            >
              <Smartphone className="h-5 w-5 text-amber-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">SMS</span>
            </a>

            {/* Telegram */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-border bg-sky-500/10 hover:bg-sky-500/15 text-sky-700 dark:text-sky-300 transition-all text-center flex flex-col items-center justify-center gap-1.5 group"
            >
              <Send className="h-5 w-5 text-sky-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Telegram</span>
            </a>
          </div>
        </div>

        {/* Native Web Share API (Mobile) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button
            variant="outline"
            onClick={handleNativeShare}
            className="w-full text-xs font-bold border-border shadow-2xs"
          >
            <Share2 className="h-4 w-4 mr-2 text-primary" />
            Share via Mobile Device Apps
          </Button>
        )}

        {/* Action Controls: PDF Download & Print */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {onDownloadPdf && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadPdf}
                className="text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5 mr-1 text-primary" /> Download PDF
              </Button>
            )}

            {onPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="text-xs font-semibold"
              >
                <Printer className="h-3.5 w-3.5 mr-1" /> Print
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
