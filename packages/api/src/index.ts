import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DocumentModel,
  Party,
  BankAccountDetails,
  DocumentPaymentConfig,
  RoundingMode,
  PaymentMethod,
  DocumentStatus,
  computeEffectiveInvoiceStatus,
  AuditHistoryEntry,
  generateVerifiedUpiQrSvgDataUrl,
} from '@invoice/core';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerUserId?: string;
  custom_domain?: string | null;
  is_domain_verified: boolean;
  role: 'owner' | 'admin' | 'accountant' | 'staff' | 'viewer';
  currency?: string;
  locale?: string;
  country?: string;
  gstState?: string;
  taxId?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  email?: string;
  phone?: string;
  invoicePrefix?: string;
  isWhiteLabel?: boolean;
  plan?: string;
}

export interface ProductCatalogItem {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  hsnCode?: string;
  description: string;
  unitPrice: number;
  unit: string;
  taxRate: number;
  isArchived: boolean;
}

export interface TenantBrandSettings {
  tenantId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  defaultTemplateId?: string;
  defaultTerms?: string;
  defaultInstructions?: string;
  footerText?: string;
  signatoryName?: string;

  // Company & Currency Configuration
  businessName?: string;
  email?: string;
  phone?: string;
  currency?: string;
  locale?: string;
  decimalPrecision?: number;
  country?: string;
  gstState?: string;
  taxId?: string;
  street?: string;
  city?: string;
  postalCode?: string;

  // Invoice Numbering, Tax & Rounding Defaults
  invoicePrefix?: string;
  nextInvoiceNumber?: number;
  defaultDueDays?: number;
  defaultTaxRate?: number;
  enableRoundOff?: boolean;
  roundingMode?: RoundingMode;

  // Payment Configuration (Structured Bank Accounts, UPI, QR Code & Display Controls)
  paymentConfig?: DocumentPaymentConfig;
  whiteLabelEnabled?: boolean;
}

// 1. Client initialization
let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url === 'https://your-project.supabase.co') {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey);
  }
  return supabaseClient;
}

// Helper for browser storage persistence per user/tenant
function getLocalStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalStore<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write error:', e);
  }
}

const DEFAULT_DEMO_BANK_ACCOUNT: BankAccountDetails = {
  id: 'bank_demo_01',
  accountHolderName: 'Acme Design Agency Pvt Ltd',
  bankName: 'Demo Bank',
  accountNumber: '0000000000',
  confirmAccountNumber: '0000000000',
  ifscOrRoutingCode: 'DEMO0000000',
  branchName: 'Main Branch',
  accountType: 'current',
  swiftBicCode: 'DEMOBANK',
  country: 'India',
  isPrimary: true,
};

const DEFAULT_DEMO_PAYMENT_CONFIG: DocumentPaymentConfig = {
  bankAccounts: [DEFAULT_DEMO_BANK_ACCOUNT],
  selectedBankAccountIds: ['bank_demo_01'],
  upiId: 'billing@example.com',
  upiPayeeName: 'Acme Design Agency Pvt Ltd',
  autoGenerateUpiQr: true,
  display: {
    showBankDetails: true,
    showUpiId: true,
    showQrCode: true,
    showPaymentInstructions: true,
    showPaymentTerms: true,
  },
};

// 2. Collections start empty - populating strictly as real users and tenants create data
const DEMO_TENANTS: Tenant[] = [];

const DEMO_PARTIES: Record<string, Party[]> = {};
const DEMO_PRODUCTS: Record<string, ProductCatalogItem[]> = {};

const DEMO_DOCUMENTS: Record<string, DocumentModel[]> = {};

const DEMO_BRAND_SETTINGS: Record<string, TenantBrandSettings> = {
  'a0000000-0000-0000-0000-000000000001': {
    tenantId: 'a0000000-0000-0000-0000-000000000001',
    businessName: 'Acme Design Agency Pvt Ltd',
    email: 'billing@acmedesign.io',
    phone: '+91 22 4001 9200',
    currency: 'INR',
    locale: 'en-IN',
    decimalPrecision: 2,
    country: 'India',
    gstState: '27 - Maharashtra',
    taxId: '27AABCU9603R1ZM',
    street: 'Level 8, One BKC, Bandra Kurla Complex',
    city: 'Mumbai',
    postalCode: '400051',
    invoicePrefix: 'INV',
    nextInvoiceNumber: 102,
    defaultDueDays: 15,
    defaultTaxRate: 18,
    enableRoundOff: true,
    roundingMode: 'nearest_integer',
    primaryColor: '#3157D5',
    secondaryColor: '#0F172A',
    fontFamily: 'sans',
    defaultTemplateId: 'cleartax_gst',
    defaultTerms: 'Payment due within 15 days. Subject to Mumbai Jurisdiction.',
    defaultInstructions: 'NEFT / RTGS / UPI accepted. Please mention Invoice No. in transfer reference.',
    footerText: 'Thank you for your business!',
    signatoryName: 'Authorized Director',
    paymentConfig: DEFAULT_DEMO_PAYMENT_CONFIG,
  },
};

// 3. Typed Data Access Service (Strictly User & Tenant Isolated)
export const TenantApi = {
  async getTenants(userId?: string): Promise<Tenant[]> {
    const supabase = getSupabase();
    if (!supabase) {
      const customTenants = getLocalStore<Tenant[]>('billcraft_custom_tenants', []);
      const demoOverrides = getLocalStore<Record<string, Partial<Tenant>>>('billcraft_demo_tenant_overrides', {});
      const mergedDemo = DEMO_TENANTS.map((dt) => ({
        ...dt,
        ...(demoOverrides[dt.id] || {}),
      }));
      const all = [...customTenants, ...mergedDemo];
      if (userId) {
        let currentUserEmail = '';
        if (typeof window !== 'undefined') {
          try {
            const uRaw = window.localStorage.getItem('billcraft_current_user');
            if (uRaw) {
              const u = JSON.parse(uRaw);
              currentUserEmail = u?.email?.toLowerCase() || '';
            }
          } catch {}
        }
        const userTenants = all.filter(
          (t) =>
            t.ownerUserId === userId ||
            (currentUserEmail && t.ownerUserId?.toLowerCase() === currentUserEmail)
        );
        if (userTenants.length > 0) return userTenants;
      }
      return all.length > 0 ? all : mergedDemo;
    }

    const { data, error } = await supabase
      .from('tenant_members')
      .select('role, tenants(*)');

    if (error || !data) return DEMO_TENANTS;
    return data.map((item: any) => ({
      ...item.tenants,
      role: item.role,
    }));
  },

  async createTenant(tenant: Tenant): Promise<Tenant> {
    const customTenants = getLocalStore<Tenant[]>('billcraft_custom_tenants', []);
    const updated = [tenant, ...customTenants.filter((t) => t.id !== tenant.id)];
    setLocalStore('billcraft_custom_tenants', updated);
    return tenant;
  },

  async updateTenant(tenantId: string, patch: Partial<Tenant>): Promise<Tenant | null> {
    const customTenants = getLocalStore<Tenant[]>('billcraft_custom_tenants', []);
    const idx = customTenants.findIndex((t) => t.id === tenantId);
    if (idx >= 0) {
      customTenants[idx] = { ...customTenants[idx], ...patch };
      setLocalStore('billcraft_custom_tenants', customTenants);
      return customTenants[idx];
    }

    // Also allow updating demo tenants in local overrides
    const demoTarget = DEMO_TENANTS.find((d) => d.id === tenantId);
    if (demoTarget) {
      const demoOverrides = getLocalStore<Record<string, Partial<Tenant>>>('billcraft_demo_tenant_overrides', {});
      demoOverrides[tenantId] = { ...(demoOverrides[tenantId] || {}), ...patch };
      setLocalStore('billcraft_demo_tenant_overrides', demoOverrides);
      return { ...demoTarget, ...demoOverrides[tenantId] };
    }
    return null;
  },

  async getDocuments(tenantId: string): Promise<DocumentModel[]> {
    const supabase = getSupabase();
    if (!supabase) {
      const storeDocs = getLocalStore<Record<string, DocumentModel[]>>(
        'billcraft_tenant_documents',
        DEMO_DOCUMENTS
      );
      const list = storeDocs[tenantId] || [];
      return list.map((doc) => ({
        ...doc,
        status: computeEffectiveInvoiceStatus(doc),
      }));
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error || !data) return DEMO_DOCUMENTS[tenantId] || [];
    return data;
  },

  async getDocumentById(tenantId: string, docId: string): Promise<DocumentModel | null> {
    const docs = await this.getDocuments(tenantId);
    return docs.find((d) => d.id === docId) || null;
  },

  async saveDocument(tenantId: string, doc: DocumentModel): Promise<DocumentModel> {
    const effectiveStatus = computeEffectiveInvoiceStatus(doc);
    const enrichedDoc: DocumentModel = {
      ...doc,
      tenantId,
      status: effectiveStatus,
      updatedAt: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (!supabase) {
      const storeDocs = getLocalStore<Record<string, DocumentModel[]>>(
        'billcraft_tenant_documents',
        DEMO_DOCUMENTS
      );
      if (!storeDocs[tenantId]) storeDocs[tenantId] = [];
      const idx = storeDocs[tenantId].findIndex((d) => d.id === enrichedDoc.id);
      if (idx >= 0) {
        storeDocs[tenantId][idx] = enrichedDoc;
      } else {
        storeDocs[tenantId].unshift(enrichedDoc);
      }
      setLocalStore('billcraft_tenant_documents', storeDocs);
      return enrichedDoc;
    }

    const { error } = await supabase
      .from('documents')
      .upsert({
        id: enrichedDoc.id,
        tenant_id: tenantId,
        type: enrichedDoc.type,
        status: enrichedDoc.status,
        document_number: enrichedDoc.documentNumber,
        reference_number: enrichedDoc.referenceNumber,
        issue_date: enrichedDoc.issueDate,
        due_date: enrichedDoc.dueDate,
        currency: enrichedDoc.currency,
        client_snapshot: enrichedDoc.client,
        sender_snapshot: enrichedDoc.sender,
        summary: enrichedDoc.summary,
        template_id: enrichedDoc.templateId,
        notes: enrichedDoc.notes,
        payment_terms: enrichedDoc.paymentTerms,
        payment_instructions: enrichedDoc.paymentInstructions,
      })
      .select()
      .single();

    if (error) throw error;
    return enrichedDoc;
  },

  async updateDocumentStatus(
    tenantId: string,
    docId: string,
    newStatus: DocumentStatus
  ): Promise<DocumentModel | null> {
    const storeDocs = getLocalStore<Record<string, DocumentModel[]>>(
      'billcraft_tenant_documents',
      DEMO_DOCUMENTS
    );
    const docs = storeDocs[tenantId] || [];
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return null;

    doc.status = newStatus;
    doc.updatedAt = new Date().toISOString();
    if (!doc.auditHistory) doc.auditHistory = [];
    doc.auditHistory.unshift({
      id: `aud_${Date.now()}`,
      action: 'STATUS_UPDATED',
      description: `Invoice status updated to ${newStatus.toUpperCase()}`,
      timestamp: doc.updatedAt,
    });
    setLocalStore('billcraft_tenant_documents', storeDocs);
    return doc;
  },

  async getParties(tenantId: string): Promise<Party[]> {
    const supabase = getSupabase();
    if (!supabase) {
      const storeParties = getLocalStore<Record<string, Party[]>>(
        'billcraft_tenant_parties',
        DEMO_PARTIES
      );
      return storeParties[tenantId] || [];
    }

    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_archived', false);

    if (error || !data) return DEMO_PARTIES[tenantId] || [];
    return data;
  },

  async saveParty(tenantId: string, party: Party): Promise<Party> {
    const storeParties = getLocalStore<Record<string, Party[]>>(
      'billcraft_tenant_parties',
      DEMO_PARTIES
    );
    if (!storeParties[tenantId]) storeParties[tenantId] = [];
    const idx = storeParties[tenantId].findIndex((p) => p.id === party.id);
    if (idx >= 0) {
      storeParties[tenantId][idx] = party;
    } else {
      storeParties[tenantId].push(party);
    }
    setLocalStore('billcraft_tenant_parties', storeParties);
    return party;
  },

  async importPartiesBatch(
    tenantId: string,
    incomingParties: Party[],
    duplicateStrategy: 'skip' | 'update' | 'import' = 'skip'
  ): Promise<{
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
  }> {
    const storeParties = getLocalStore<Record<string, Party[]>>(
      'billcraft_tenant_parties',
      DEMO_PARTIES
    );
    if (!storeParties[tenantId]) storeParties[tenantId] = [];
    const existing = storeParties[tenantId];

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const candidate of incomingParties) {
      const matchIdx = existing.findIndex(
        (e) =>
          (candidate.email &&
            e.email &&
            e.email.toLowerCase() === candidate.email.toLowerCase()) ||
          (candidate.taxId &&
            e.taxId &&
            e.taxId.toUpperCase() === candidate.taxId.toUpperCase()) ||
          e.name.trim().toLowerCase() === candidate.name.trim().toLowerCase()
      );

      if (matchIdx >= 0) {
        if (duplicateStrategy === 'skip') {
          skippedCount++;
          continue;
        } else if (duplicateStrategy === 'update') {
          existing[matchIdx] = {
            ...existing[matchIdx],
            ...candidate,
            id: existing[matchIdx].id,
            updatedAt: new Date().toISOString(),
          };
          updatedCount++;
          continue;
        }
      }

      existing.push({
        ...candidate,
        id: candidate.id || `party_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      });
      importedCount++;
    }

    setLocalStore('billcraft_tenant_parties', storeParties);
    return { importedCount, updatedCount, skippedCount };
  },

  async getProducts(tenantId: string): Promise<ProductCatalogItem[]> {
    const storeProducts = getLocalStore<Record<string, ProductCatalogItem[]>>(
      'billcraft_tenant_products',
      DEMO_PRODUCTS
    );
    return storeProducts[tenantId] || [];
  },

  async saveProduct(tenantId: string, product: ProductCatalogItem): Promise<ProductCatalogItem> {
    const storeProducts = getLocalStore<Record<string, ProductCatalogItem[]>>(
      'billcraft_tenant_products',
      DEMO_PRODUCTS
    );
    if (!storeProducts[tenantId]) storeProducts[tenantId] = [];
    const idx = storeProducts[tenantId].findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      storeProducts[tenantId][idx] = product;
    } else {
      storeProducts[tenantId].push(product);
    }
    setLocalStore('billcraft_tenant_products', storeProducts);
    return product;
  },

  async getBrandSettings(tenantId: string): Promise<TenantBrandSettings> {
    const storeBrand = getLocalStore<Record<string, TenantBrandSettings>>(
      'billcraft_tenant_brand',
      DEMO_BRAND_SETTINGS
    );
    const customTenants = getLocalStore<Tenant[]>('billcraft_custom_tenants', []);
    const demoOverrides = getLocalStore<Record<string, Partial<Tenant>>>('billcraft_demo_tenant_overrides', {});
    const tenantObj =
      customTenants.find((t) => t.id === tenantId) ||
      DEMO_TENANTS.map((d) => ({ ...d, ...(demoOverrides[d.id] || {}) })).find(
        (t) => t.id === tenantId
      );

    const existing = storeBrand[tenantId];
    const defaultBank: BankAccountDetails = {
      id: `bank_${tenantId.slice(0, 8)}`,
      accountHolderName: existing?.businessName || tenantObj?.name || 'Business Account',
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200049182731',
      confirmAccountNumber: '50200049182731',
      ifscOrRoutingCode: 'HDFC0000124',
      branchName: tenantObj?.city || 'Main Branch',
      accountType: 'current',
      country: tenantObj?.country || 'India',
      isPrimary: true,
    };

    const fallbackPaymentConfig: DocumentPaymentConfig = {
      bankAccounts: [defaultBank],
      selectedBankAccountIds: [defaultBank.id],
      upiId: '',
      upiPayeeName: existing?.businessName || tenantObj?.name || '',
      autoGenerateUpiQr: true,
      display: {
        showBankDetails: true,
        showUpiId: true,
        showQrCode: false,
        showPaymentInstructions: true,
        showPaymentTerms: true,
      },
    };

    const defaults: TenantBrandSettings = {
      tenantId,
      businessName: tenantObj?.name || 'Workspace Business',
      email: tenantObj?.email || '',
      phone: tenantObj?.phone || '',
      currency: tenantObj?.currency || 'INR',
      locale: tenantObj?.locale || (tenantObj?.currency === 'USD' ? 'en-US' : 'en-IN'),
      decimalPrecision: 2,
      country: tenantObj?.country || 'India',
      gstState: tenantObj?.gstState || '27 - Maharashtra',
      taxId: tenantObj?.taxId || '',
      street: tenantObj?.street || '',
      city: tenantObj?.city || '',
      postalCode: tenantObj?.postalCode || '',
      invoicePrefix: tenantObj?.invoicePrefix || 'INV',
      nextInvoiceNumber: 1,
      defaultDueDays: 15,
      defaultTaxRate: 18,
      enableRoundOff: false,
      roundingMode: 'nearest_integer',
      primaryColor: '#3157D5',
      secondaryColor: '#0F172A',
      fontFamily: 'sans',
      defaultTemplateId: 'cleartax_gst',
      defaultTerms: 'Net 15 Days',
      defaultInstructions: 'NEFT / RTGS / IMPS / UPI accepted.',
      footerText: 'Thank you for your business!',
      signatoryName: 'Authorized Signatory',
      paymentConfig: fallbackPaymentConfig,
    };

    return {
      ...defaults,
      ...(existing || {}),
      tenantId,
      paymentConfig: existing?.paymentConfig || fallbackPaymentConfig,
    };
  },

  async updateBrandSettings(
    tenantId: string,
    settings: Partial<TenantBrandSettings>
  ): Promise<TenantBrandSettings> {
    const storeBrand = getLocalStore<Record<string, TenantBrandSettings>>(
      'billcraft_tenant_brand',
      DEMO_BRAND_SETTINGS
    );
    const existing = await this.getBrandSettings(tenantId);
    const updated: TenantBrandSettings = {
      ...existing,
      ...settings,
      paymentConfig: settings.paymentConfig
        ? {
            ...existing.paymentConfig,
            ...settings.paymentConfig,
            display: {
              ...(existing.paymentConfig?.display || {
                showBankDetails: true,
                showUpiId: true,
                showQrCode: false,
                showPaymentInstructions: true,
                showPaymentTerms: true,
              }),
              ...(settings.paymentConfig.display || {}),
            },
          }
        : existing.paymentConfig,
    };
    storeBrand[tenantId] = updated;
    setLocalStore('billcraft_tenant_brand', storeBrand);

    // Sync core company/currency fields onto the tenant object as well
    await this.updateTenant(tenantId, {
      name: updated.businessName || undefined,
      currency: updated.currency,
      locale: updated.locale,
      country: updated.country,
      gstState: updated.gstState,
      taxId: updated.taxId,
      street: updated.street,
      city: updated.city,
      postalCode: updated.postalCode,
      email: updated.email,
      phone: updated.phone,
      invoicePrefix: updated.invoicePrefix,
    });

    return updated;
  },

  async recordPayment(
    tenantId: string,
    docId: string,
    amount: number,
    method: PaymentMethod,
    reference?: string,
    notes?: string,
    paymentDate?: string
  ): Promise<DocumentModel | null> {
    const storeDocs = getLocalStore<Record<string, DocumentModel[]>>(
      'billcraft_tenant_documents',
      DEMO_DOCUMENTS
    );
    const docs = storeDocs[tenantId] || [];
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return null;

    const cleanAmount = Number(Number(amount).toFixed(2));
    if (cleanAmount <= 0) return doc;

    const newPayment = {
      id: `pay_${Date.now()}`,
      documentId: docId,
      amount: cleanAmount,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: method,
      reference,
      notes,
      createdAt: new Date().toISOString(),
    };

    if (!doc.payments) doc.payments = [];
    doc.payments.push(newPayment);

    const totalCollected = doc.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalRefunded = (doc.refunds || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);

    doc.summary.amountPaid = Number(totalCollected.toFixed(2));
    doc.summary.refundedAmount = Number(totalRefunded.toFixed(2));
    doc.summary.netAmountPaid = Number(Math.max(0, totalCollected - totalRefunded).toFixed(2));
    doc.summary.balanceDue = Number(
      Math.max(0, doc.summary.grandTotal - doc.summary.amountPaid).toFixed(2)
    );

    if (doc.status === 'draft') {
      doc.status = 'pending';
    }
    doc.status = computeEffectiveInvoiceStatus(doc);
    doc.updatedAt = new Date().toISOString();

    if (!doc.auditHistory) doc.auditHistory = [];
    doc.auditHistory.unshift({
      id: `aud_${Date.now()}`,
      action: 'PAYMENT_RECORDED',
      description: `Payment of ${cleanAmount} (${doc.currency}) recorded via ${method.replace('_', ' ')}${
        reference ? ` [Ref: ${reference}]` : ''
      }`,
      timestamp: doc.updatedAt,
    });

    setLocalStore('billcraft_tenant_documents', storeDocs);
    return doc;
  },

  async recordRefund(
    tenantId: string,
    docId: string,
    amount: number,
    method: PaymentMethod,
    reason?: string,
    reference?: string,
    notes?: string,
    refundDate?: string
  ): Promise<DocumentModel | null> {
    const storeDocs = getLocalStore<Record<string, DocumentModel[]>>(
      'billcraft_tenant_documents',
      DEMO_DOCUMENTS
    );
    const docs = storeDocs[tenantId] || [];
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return null;

    const maxRefundable = Math.max(
      0,
      Number(doc.summary.amountPaid || 0) - Number(doc.summary.refundedAmount || 0)
    );
    const cleanRefund = Number(Math.min(maxRefundable, Math.max(0, Number(amount))).toFixed(2));
    if (cleanRefund <= 0) return doc;

    const newRefund = {
      id: `ref_${Date.now()}`,
      documentId: docId,
      amount: cleanRefund,
      refundDate: refundDate || new Date().toISOString().split('T')[0],
      refundMethod: method,
      reason,
      reference,
      notes,
      createdAt: new Date().toISOString(),
    };

    if (!doc.refunds) doc.refunds = [];
    doc.refunds.push(newRefund);

    const totalCollected = (doc.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalRefunded = doc.refunds.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    doc.summary.amountPaid = Number(totalCollected.toFixed(2));
    doc.summary.refundedAmount = Number(totalRefunded.toFixed(2));
    doc.summary.netAmountPaid = Number(Math.max(0, totalCollected - totalRefunded).toFixed(2));
    // Original invoice amount (grandTotal), collected payments (amountPaid), refunded amount (refundedAmount), and remaining unpaid balance (balanceDue) remain distinct
    doc.summary.balanceDue = Number(
      Math.max(0, doc.summary.grandTotal - doc.summary.amountPaid).toFixed(2)
    );

    doc.status = computeEffectiveInvoiceStatus(doc);
    doc.updatedAt = new Date().toISOString();

    if (!doc.auditHistory) doc.auditHistory = [];
    doc.auditHistory.unshift({
      id: `aud_${Date.now()}`,
      action: 'REFUND_ISSUED',
      description: `${
        totalRefunded >= totalCollected ? 'Full' : 'Partial'
      } refund of ${cleanRefund} (${doc.currency}) issued via ${method.replace('_', ' ')}${
        reason ? ` — Reason: ${reason}` : ''
      }`,
      timestamp: doc.updatedAt,
    });

    setLocalStore('billcraft_tenant_documents', storeDocs);
    return doc;
  },

  async getAuditLogs(tenantId: string): Promise<(AuditHistoryEntry & { docNumber: string })[]> {
    const docs = await this.getDocuments(tenantId);
    const logs: (AuditHistoryEntry & { docNumber: string })[] = [];
    docs.forEach((doc) => {
      (doc.auditHistory || []).forEach((entry) => {
        logs.push({
          ...entry,
          docNumber: doc.documentNumber,
        });
      });
    });
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
};

export * from './blog';
export * from './team';
export * from './admin';
