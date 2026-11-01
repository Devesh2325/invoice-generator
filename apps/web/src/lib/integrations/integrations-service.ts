import { DocumentModel } from '@invoice/core';

export interface PaymentIntegrationsConfig {
  razorpay: {
    enabled: boolean;
    keyId: string;
    keySecret?: string;
    autoGenerateLink: boolean;
  };
  stripe: {
    enabled: boolean;
    publishableKey: string;
    accountId?: string;
    autoGenerateLink: boolean;
  };
  paypal: {
    enabled: boolean;
    merchantEmailOrUser: string;
  };
  upi: {
    enabled: boolean;
    vpaId: string;
    payeeName: string;
  };
}

export interface AccountingIntegrationsConfig {
  tally: {
    defaultSalesLedger: string;
    defaultGstLedger: string;
    companyName: string;
  };
  zoho: {
    organizationId?: string;
  };
  quickbooks: {
    companyId?: string;
  };
  gstPortal: {
    gstin?: string;
  };
}

export interface AutomationIntegrationsConfig {
  webhook: {
    enabled: boolean;
    url: string;
    secret?: string;
  };
  googleSheets: {
    enabled: boolean;
    webhookUrl?: string;
  };
  whatsapp: {
    enabled: boolean;
    defaultPhoneCountryCode: string;
  };
}

export interface IntegrationsConfig {
  payments: PaymentIntegrationsConfig;
  accounting: AccountingIntegrationsConfig;
  automations: AutomationIntegrationsConfig;
}

export const DEFAULT_INTEGRATIONS_CONFIG: IntegrationsConfig = {
  payments: {
    razorpay: {
      enabled: false,
      keyId: '',
      keySecret: '',
      autoGenerateLink: false,
    },
    stripe: {
      enabled: false,
      publishableKey: '',
      accountId: '',
      autoGenerateLink: false,
    },
    paypal: {
      enabled: false,
      merchantEmailOrUser: '',
    },
    upi: {
      enabled: true,
      vpaId: '',
      payeeName: '',
    },
  },
  accounting: {
    tally: {
      defaultSalesLedger: 'Sales Account',
      defaultGstLedger: 'Output GST',
      companyName: '',
    },
    zoho: {
      organizationId: '',
    },
    quickbooks: {
      companyId: '',
    },
    gstPortal: {
      gstin: '',
    },
  },
  automations: {
    webhook: {
      enabled: false,
      url: '',
      secret: '',
    },
    googleSheets: {
      enabled: false,
      webhookUrl: '',
    },
    whatsapp: {
      enabled: true,
      defaultPhoneCountryCode: '91',
    },
  },
};

const STORAGE_KEY = 'invoxa_integrations_config';

export function getIntegrationsConfig(): IntegrationsConfig {
  if (typeof window === 'undefined') return DEFAULT_INTEGRATIONS_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INTEGRATIONS_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      payments: { ...DEFAULT_INTEGRATIONS_CONFIG.payments, ...parsed.payments },
      accounting: { ...DEFAULT_INTEGRATIONS_CONFIG.accounting, ...parsed.accounting },
      automations: { ...DEFAULT_INTEGRATIONS_CONFIG.automations, ...parsed.automations },
    };
  } catch {
    return DEFAULT_INTEGRATIONS_CONFIG;
  }
}

export function saveIntegrationsConfig(config: IntegrationsConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('invoxa-integrations-updated', { detail: config }));
  } catch (err) {
    console.error('Failed to save integrations config:', err);
  }
}

/**
 * Downloads a text/string file in the user's browser
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string = 'text/plain') {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates Tally XML Voucher Format for TallyPrime & Tally.ERP 9
 */
export function generateTallyXml(doc: DocumentModel, customCompanyName?: string): string {
  const dateFormatted = (doc.issueDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  const partyName = doc.client.name || 'Cash Client';
  const docNum = doc.documentNumber || 'INV-001';
  const company = customCompanyName || doc.sender.name || 'My Company';
  const totalAmount = doc.summary.grandTotal || 0;
  const taxableAmount = doc.summary.subtotal || totalAmount;
  const taxAmount = doc.summary.totalTax || 0;

  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${company}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${dateFormatted}</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${docNum}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
            <NARRATION>Invoice ${docNum} generated via BillCraft Invoicing</NARRATION>
            <!-- Debit Party Ledger -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${partyName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${totalAmount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <!-- Credit Sales Account -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Sales Account</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${taxableAmount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            ${
              taxAmount > 0
                ? `<!-- Credit GST / Tax Account -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Output GST / Tax</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${taxAmount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`
                : ''
            }
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

/**
 * Generates Standard CSV compatible with Zoho Books Invoice Import
 */
export function generateZohoCsv(doc: DocumentModel): string {
  const headers = [
    'Invoice Number',
    'Customer Name',
    'Invoice Date',
    'Due Date',
    'Item Name',
    'Item Description',
    'Quantity',
    'Usage Unit',
    'Item Price',
    'Discount',
    'Tax Percentage',
    'Total',
  ];

  const rows = doc.items.map((it) => [
    `"${doc.documentNumber}"`,
    `"${doc.client.name.replace(/"/g, '""')}"`,
    `"${doc.issueDate}"`,
    `"${doc.dueDate || doc.issueDate}"`,
    `"${(it.description || 'Item').slice(0, 50).replace(/"/g, '""')}"`,
    `"${(it.description || '').replace(/"/g, '""')}"`,
    it.quantity,
    `"${(it as any).unit || 'PCS'}"`,
    it.unitPrice.toFixed(2),
    `${it.discountValue || 0}%`,
    `${it.taxRate || 0}%`,
    it.lineTotal.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Generates Standard CSV compatible with QuickBooks Online Import
 */
export function generateQuickbooksCsv(doc: DocumentModel): string {
  const headers = [
    'InvoiceNo',
    'Customer',
    'InvoiceDate',
    'DueDate',
    'Terms',
    'Item(Product/Service)',
    'ItemDescription',
    'ItemQuantity',
    'ItemRate',
    'ItemAmount',
    'TaxCode',
  ];

  const rows = doc.items.map((it) => [
    `"${doc.documentNumber}"`,
    `"${doc.client.name.replace(/"/g, '""')}"`,
    `"${doc.issueDate}"`,
    `"${doc.dueDate || doc.issueDate}"`,
    `"${doc.paymentTerms || 'Net 30'}"`,
    `"${(it.description || 'Service').slice(0, 40).replace(/"/g, '""')}"`,
    `"${(it.description || '').replace(/"/g, '""')}"`,
    it.quantity,
    it.unitPrice.toFixed(2),
    it.lineTotal.toFixed(2),
    it.taxRate ? `${it.taxRate}%` : 'TAX',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Generates JSON Schema compatible with Government GST e-Invoice standard
 */
export function generateGstJson(doc: DocumentModel): string {
  const payload = {
    Version: '1.1',
    TranDtls: {
      TaxSch: 'GST',
      SupTyp: 'B2B',
      RegRev: 'N',
      EcmGstin: null,
      IgstOnIntra: 'N',
    },
    DocDtls: {
      Typ: doc.type === 'credit_note' ? 'CRN' : doc.type === 'debit_note' ? 'DBN' : 'INV',
      No: doc.documentNumber,
      Dt: doc.issueDate.split('-').reverse().join('/'),
    },
    SellerDtls: {
      Gstin: doc.sender.taxId || 'URP',
      LglNm: doc.sender.name,
      TrdNm: doc.sender.name,
      Addr1: doc.sender.address?.street1 || 'Main Street',
      Loc: doc.sender.address?.city || 'Mumbai',
      Pin: Number(doc.sender.address?.postalCode) || 400001,
      Stcd: doc.sender.address?.state?.slice(0, 2) || '27',
      Ph: doc.sender.phone || null,
      Em: doc.sender.email || null,
    },
    BuyerDtls: {
      Gstin: doc.client.taxId || 'URP',
      LglNm: doc.client.name,
      TrdNm: doc.client.name,
      Pos: doc.client.billingAddress?.state?.slice(0, 2) || '27',
      Addr1: doc.client.billingAddress?.street1 || 'Billing Address',
      Loc: doc.client.billingAddress?.city || 'Mumbai',
      Pin: Number(doc.client.billingAddress?.postalCode) || 400001,
      Stcd: doc.client.billingAddress?.state?.slice(0, 2) || '27',
      Ph: doc.client.phone || null,
      Em: doc.client.email || null,
    },
    ItemList: doc.items.map((it, idx) => ({
      SlNo: String(idx + 1),
      PrdDesc: it.description,
      IsServc: 'Y',
      HsnCd: it.hsnCode || '998314',
      Qty: it.quantity,
      Unit: (it as any).unit || 'NOS',
      UnitPrice: it.unitPrice,
      TotAmt: it.unitPrice * it.quantity,
      Discount: it.lineDiscount || 0,
      AssAmt: it.lineNet,
      GstRt: it.taxRate || 18,
      IgstAmt: it.igstAmount || 0,
      CgstAmt: it.cgstAmount || 0,
      SgstAmt: it.sgstAmount || 0,
      TotItemVal: it.lineTotal,
    })),
    ValDtls: {
      AssVal: doc.summary.subtotal,
      CgstVal: doc.summary.gstSupplyType === 'intra' ? doc.summary.totalTax / 2 : 0,
      SgstVal: doc.summary.gstSupplyType === 'intra' ? doc.summary.totalTax / 2 : 0,
      IgstVal: doc.summary.gstSupplyType === 'inter' ? doc.summary.totalTax : 0,
      RndOffAmt: doc.summary.roundOffAmount || 0,
      TotInvVal: doc.summary.grandTotal,
    },
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Triggers a Webhook / Zapier event for the invoice
 */
export async function triggerInvoiceWebhook(
  url: string,
  doc: DocumentModel,
  secret?: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const payload = {
      event: 'invoice.created',
      timestamp: new Date().toISOString(),
      invoice: {
        id: doc.id,
        number: doc.documentNumber,
        type: doc.type,
        issueDate: doc.issueDate,
        dueDate: doc.dueDate,
        currency: doc.currency,
        client: {
          name: doc.client.name,
          email: doc.client.email,
          phone: doc.client.phone,
          taxId: doc.client.taxId,
        },
        totals: {
          subtotal: doc.summary.subtotal,
          tax: doc.summary.totalTax,
          discount: doc.summary.discountTotal,
          grandTotal: doc.summary.grandTotal,
          balanceDue: doc.summary.balanceDue,
        },
        itemsCount: doc.items.length,
      },
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (secret) {
      headers['X-BillCraft-Signature'] = secret;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return { success: res.ok, status: res.status };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error triggering webhook' };
  }
}
