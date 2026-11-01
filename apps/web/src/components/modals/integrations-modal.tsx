'use client';

import React, { useState, useEffect } from 'react';
import { DocumentModel, formatCurrency } from '@invoice/core';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Plug,
  CreditCard,
  FileSpreadsheet,
  Zap,
  CheckCircle2,
  Download,
  Send,
  ExternalLink,
  ShieldCheck,
  Building,
  RefreshCw,
  QrCode,
  Globe,
  MessageCircle,
  Copy,
  Sliders,
  Check,
  X,
} from 'lucide-react';
import {
  IntegrationsConfig,
  getIntegrationsConfig,
  saveIntegrationsConfig,
  generateTallyXml,
  generateZohoCsv,
  generateQuickbooksCsv,
  generateGstJson,
  triggerFileDownload,
  triggerInvoiceWebhook,
} from '@/lib/integrations/integrations-service';

interface IntegrationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentModel;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  open,
  onOpenChange,
  document,
}) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'accounting' | 'automations'>('payments');
  const [config, setConfig] = useState<IntegrationsConfig>(() => getIntegrationsConfig());
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setConfig(getIntegrationsConfig());
    }
  }, [open]);

  const handleSave = () => {
    saveIntegrationsConfig(config);
    toast({
      title: 'Integrations Updated',
      description: 'Your integration credentials & preferences have been saved.',
    });
    onOpenChange(false);
  };

  const handleExportTally = () => {
    const xml = generateTallyXml(document, config.accounting.tally.companyName);
    const filename = `Tally_Sales_${document.documentNumber || 'INV'}.xml`;
    triggerFileDownload(xml, filename, 'application/xml');
    toast({
      title: 'Tally XML Downloaded',
      description: `Import ${filename} directly into TallyPrime (Import -> Vouchers).`,
    });
  };

  const handleExportZoho = () => {
    const csv = generateZohoCsv(document);
    const filename = `ZohoBooks_Invoice_${document.documentNumber || 'INV'}.csv`;
    triggerFileDownload(csv, filename, 'text/csv');
    toast({
      title: 'Zoho CSV Downloaded',
      description: `Ready for import into Zoho Books Invoices.`,
    });
  };

  const handleExportQuickbooks = () => {
    const csv = generateQuickbooksCsv(document);
    const filename = `QuickBooks_Invoice_${document.documentNumber || 'INV'}.csv`;
    triggerFileDownload(csv, filename, 'text/csv');
    toast({
      title: 'QuickBooks CSV Downloaded',
      description: `Ready for import into QuickBooks Online.`,
    });
  };

  const handleExportGstJson = () => {
    const json = generateGstJson(document);
    const filename = `GST_eInvoice_${document.documentNumber || 'INV'}.json`;
    triggerFileDownload(json, filename, 'application/json');
    toast({
      title: 'GST e-Invoice JSON Downloaded',
      description: `Standard NIC e-Invoice JSON schema generated.`,
    });
  };

  const handleTestWebhook = async () => {
    if (!config.automations.webhook.url) {
      toast({
        title: 'Missing Webhook URL',
        description: 'Please enter a valid HTTP/HTTPS webhook endpoint.',
        variant: 'destructive',
      });
      return;
    }
    setIsTestingWebhook(true);
    const res = await triggerInvoiceWebhook(
      config.automations.webhook.url,
      document,
      config.automations.webhook.secret
    );
    setIsTestingWebhook(false);
    if (res.success) {
      toast({
        title: 'Webhook Test Passed',
        description: `Server responded with status ${res.status || 200}. Payload delivered!`,
      });
    } else {
      toast({
        title: 'Webhook Test Failed',
        description: res.error || 'Endpoint returned an error status.',
        variant: 'destructive',
      });
    }
  };

  const handleShareWhatsApp = () => {
    const clientPhone = (document.client.phone || '').replace(/[^0-9]/g, '');
    const clientName = document.client.name || 'Customer';
    const amount = formatCurrency(document.summary.grandTotal, document.currency);
    const message = encodeURIComponent(
      `Hello ${clientName},\n\nHere is your invoice ${document.documentNumber} for ${amount}.\nDate: ${document.issueDate}\nDue Date: ${document.dueDate || 'On Receipt'}\n\nThank you for your business!`
    );
    const url = clientPhone
      ? `https://wa.me/${clientPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-card border-border shadow-2xl rounded-2xl">
        {/* Header Banner */}
        <div className="p-6 border-b border-border bg-muted/40 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Plug className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-foreground">
                  Integrations & Connected Apps
                </h3>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                  Pro & Studio
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect payment gateways, export directly to accounting software (Tally, Zoho, QBO), or automate via Webhooks.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-border flex items-center gap-4 text-xs font-bold bg-background">
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'payments'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Payment Gateways</span>
            {(config.payments.razorpay.enabled || config.payments.stripe.enabled) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accounting')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'accounting'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Accounting & ERP Sync</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-primary/10 text-primary">
              Tally • Zoho • GST
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('automations')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'automations'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Cloud & Webhooks</span>
          </button>
        </div>

        {/* Tab 1: Payment Gateways */}
        {activeTab === 'payments' && (
          <div className="p-6 space-y-5">
            {/* Razorpay */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-600 text-xs">
                    R
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>Razorpay (UPI, Cards, NetBanking)</span>
                      {config.payments.razorpay.enabled ? (
                        <Badge variant="success" className="text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Collect payments directly via Razorpay Payment Links & Smart QR.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.payments.razorpay.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        payments: {
                          ...config.payments,
                          razorpay: { ...config.payments.razorpay, enabled: e.target.checked },
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {config.payments.razorpay.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Key ID (rzp_live_... / rzp_test_...)
                    </label>
                    <Input
                      value={config.payments.razorpay.keyId}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          payments: {
                            ...config.payments,
                            razorpay: { ...config.payments.razorpay, keyId: e.target.value },
                          },
                        })
                      }
                      placeholder="rzp_live_xxxxxxxxxxxx"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Key Secret
                    </label>
                    <Input
                      type="password"
                      value={config.payments.razorpay.keySecret || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          payments: {
                            ...config.payments,
                            razorpay: { ...config.payments.razorpay, keySecret: e.target.value },
                          },
                        })
                      }
                      placeholder="••••••••••••••••"
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Stripe */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-black text-indigo-600 text-xs">
                    S
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>Stripe Checkout (International Cards & Apple Pay)</span>
                      {config.payments.stripe.enabled ? (
                        <Badge variant="success" className="text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Collect USD, EUR, GBP and global credit card payments securely.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.payments.stripe.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        payments: {
                          ...config.payments,
                          stripe: { ...config.payments.stripe, enabled: e.target.checked },
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {config.payments.stripe.enabled && (
                <div className="pt-2 border-t border-border/60">
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Publishable Key (pk_live_... / pk_test_...)
                  </label>
                  <Input
                    value={config.payments.stripe.publishableKey}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        payments: {
                          ...config.payments,
                          stripe: { ...config.payments.stripe, publishableKey: e.target.value },
                        },
                      })
                    }
                    placeholder="pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* PayPal */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center font-black text-sky-600 text-xs">
                    P
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>PayPal Direct Pay</span>
                      {config.payments.paypal.enabled ? (
                        <Badge variant="success" className="text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add a one-click PayPal link (`paypal.me/yourbusiness`) on invoices.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.payments.paypal.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        payments: {
                          ...config.payments,
                          paypal: { ...config.payments.paypal, enabled: e.target.checked },
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {config.payments.paypal.enabled && (
                <div className="pt-2 border-t border-border/60">
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    PayPal Email or PayPal.me Username
                  </label>
                  <Input
                    value={config.payments.paypal.merchantEmailOrUser}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        payments: {
                          ...config.payments,
                          paypal: { ...config.payments.paypal, merchantEmailOrUser: e.target.value },
                        },
                      })
                    }
                    placeholder="e.g. billing@mybusiness.com or mybusiness"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Accounting & ERP Sync */}
        {activeTab === 'accounting' && (
          <div className="p-6 space-y-4">
            <div className="p-3 bg-muted/60 rounded-xl border border-border text-xs text-muted-foreground flex items-center justify-between">
              <span>Current Invoice: <strong>{document.documentNumber}</strong> ({document.client.name})</span>
              <span className="font-mono font-bold text-foreground">{formatCurrency(document.summary.grandTotal, document.currency)}</span>
            </div>

            {/* TallyPrime Export */}
            <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Building className="h-4 w-4 text-emerald-600" />
                  <span>TallyPrime & Tally.ERP 9</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                    XML Voucher Ready
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Export standard Tally Sales XML. In Tally, open company and select <em>Import Data &rarr; Vouchers</em>.
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleExportTally}
                className="shrink-0 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Tally XML</span>
              </Button>
            </div>

            {/* Zoho Books Export */}
            <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-amber-500" />
                  <span>Zoho Books</span>
                  <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                    CSV Schema
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Export CSV formatted specifically for Zoho Books Invoices import with lines and tax mapping.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportZoho}
                className="shrink-0 text-xs font-bold border-border bg-background hover:bg-accent text-foreground flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Zoho CSV</span>
              </Button>
            </div>

            {/* QuickBooks Online Export */}
            <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span>Intuit QuickBooks</span>
                  <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/30">
                    QBO CSV
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Export CSV compatible with QuickBooks Online Invoice Batch Import.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportQuickbooks}
                className="shrink-0 text-xs font-bold border-border bg-background hover:bg-accent text-foreground flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export QBO CSV</span>
              </Button>
            </div>

            {/* GST Portal e-Invoice JSON */}
            <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Government GST e-Invoice Portal</span>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                    NIC Schema v1.1
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Export standard e-Invoice JSON payload for Direct IRN/QR code generation on the GST Portal.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportGstJson}
                className="shrink-0 text-xs font-bold border-border bg-background hover:bg-accent text-foreground flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export GST JSON</span>
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Automations & Cloud Sync */}
        {activeTab === 'automations' && (
          <div className="p-6 space-y-5">
            {/* Zapier / Custom Webhooks */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-black text-orange-600 text-xs">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>Zapier, Make & Custom Webhooks</span>
                      {config.automations.webhook.enabled ? (
                        <Badge variant="success" className="text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Trigger HTTP POST event to your webhook or automation pipeline whenever an invoice is created or finalized.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.automations.webhook.enabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        automations: {
                          ...config.automations,
                          webhook: { ...config.automations.webhook, enabled: e.target.checked },
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {config.automations.webhook.enabled && (
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      Target Webhook URL
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={config.automations.webhook.url}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            automations: {
                              ...config.automations,
                              webhook: { ...config.automations.webhook, url: e.target.value },
                            },
                          })
                        }
                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                        className="h-8 text-xs font-mono flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTestWebhook}
                        disabled={isTestingWebhook}
                        className="h-8 text-xs font-bold border-border bg-background hover:bg-accent shrink-0"
                      >
                        {isTestingWebhook ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Send className="h-3.5 w-3.5 mr-1" />
                        )}
                        <span>Test Webhook</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp Direct Notification */}
            <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                  <span>WhatsApp Business Direct Send</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                    Instant
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Send this invoice directly to your client&apos;s WhatsApp with a pre-composed payment message.
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleShareWhatsApp}
                className="shrink-0 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Open in WhatsApp</span>
              </Button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Settings are stored securely and sync with your workspace.
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold border-border bg-background hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs px-4"
            >
              Save Integrations
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
