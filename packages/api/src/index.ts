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
  bankName: 'HDFC Bank Ltd',
  accountNumber: '50200049182731',
  confirmAccountNumber: '50200049182731',
  ifscOrRoutingCode: 'HDFC0000124',
  branchName: 'Nariman Point, Mumbai',
  accountType: 'current',
  swiftBicCode: 'HDFCINBB',
  country: 'India',
  isPrimary: true,
};

const DEFAULT_DEMO_PAYMENT_CONFIG: DocumentPaymentConfig = {
  bankAccounts: [DEFAULT_DEMO_BANK_ACCOUNT],
  selectedBankAccountIds: ['bank_demo_01'],
  upiId: 'acmedesign@hdfcbank',
  upiPayeeName: 'Acme Design Agency Pvt Ltd',
  autoGenerateUpiQr: true,
  qrCodeDataUrl:
    generateVerifiedUpiQrSvgDataUrl({
      upiId: 'acmedesign@hdfcbank',
      payeeName: 'Acme Design Agency Pvt Ltd',
      currency: 'INR',
    }) || undefined,
  display: {
    showBankDetails: true,
    showUpiId: true,
    showQrCode: true,
    showPaymentInstructions: true,
    showPaymentTerms: true,
  },
};

// 2. Demo Seed Data (Scoped strictly to Demo User 'usr_demo_01')
const DEMO_TENANTS: Tenant[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Acme Design Agency',
    slug: 'acme-design',
    ownerUserId: 'usr_demo_01',
    custom_domain: 'billing.acmedesign.io',
    is_domain_verified: true,
    role: 'owner',
    currency: 'INR',
    locale: 'en-IN',
    country: 'India',
    gstState: '27 - Maharashtra',
    taxId: '27AABCU9603R1ZM',
    street: 'Level 8, One BKC, Bandra Kurla Complex',
    city: 'Mumbai',
    postalCode: '400051',
    email: 'billing@acmedesign.io',
    phone: '+91 22 4001 9200',
    invoicePrefix: 'INV',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Nexus Cloud Solutions',
    slug: 'nexus-cloud',
    ownerUserId: 'usr_demo_01',
    custom_domain: null,
    is_domain_verified: false,
    role: 'admin',
    currency: 'USD',
    locale: 'en-US',
    country: 'United States',
    invoicePrefix: 'NEX',
  },
];

const DEMO_PARTIES: Record<string, Party[]> = {
  'a0000000-0000-0000-0000-000000000001': [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      type: 'customer',
      name: 'Reliance Retail Ventures Ltd',
      email: 'accounts@relianceretail.in',
      phone: '+91 22 6767 3800',
      taxId: '27AAACR5055K1Z7',
      billingAddress: {
        street1: '4th Floor, Court House, Lokmanya Tilak Marg',
        city: 'Mumbai',
        state: '27 - Maharashtra',
        postalCode: '400002',
        country: 'India',
      },
      notes: 'Enterprise GST client, net 15 payment terms',
      isArchived: false,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      type: 'customer',
      name: 'Infosys Finacle Technologies',
      email: 'finance@infosys.com',
      phone: '+91 80 2852 0261',
      taxId: '29AAACI1681G1Z0',
      billingAddress: {
        street1: 'Electronics City, Hosur Road',
        city: 'Bengaluru',
        state: '29 - Karnataka',
        postalCode: '560100',
        country: 'India',
      },
      notes: 'Inter-state IGST billing account',
      isArchived: false,
    },
  ],
  'a0000000-0000-0000-0000-000000000002': [
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      type: 'customer',
      name: 'Vandelay Industries',
      email: 'george@vandelay.com',
      phone: '+1 (555) 777-8899',
      taxId: 'GSTIN-88491',
      billingAddress: {
        street1: '129 W 81st St',
        city: 'New York',
        postalCode: '10024',
        country: 'United States',
      },
      isArchived: false,
    },
  ],
};

const DEMO_PRODUCTS: Record<string, ProductCatalogItem[]> = {
  'a0000000-0000-0000-0000-000000000001': [
    {
      id: 'p0000000-0000-0000-0000-000000000001',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      name: 'UI/UX Design & Brand System Sprint',
      sku: 'SAC-998314',
      hsnCode: '998314',
      description: '5-day interactive product design & component architecture',
      unitPrice: 85000,
      unit: 'sprint',
      taxRate: 18,
      isArchived: false,
    },
    {
      id: 'p0000000-0000-0000-0000-000000000002',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      name: 'Full-Stack Next.js Cloud Engineering',
      sku: 'SAC-998313',
      hsnCode: '998313',
      description: 'Senior software architecture and implementation',
      unitPrice: 4500,
      unit: 'hour',
      taxRate: 18,
      isArchived: false,
    },
  ],
};

const DEMO_DOCUMENTS: Record<string, DocumentModel[]> = {
  'a0000000-0000-0000-0000-000000000001': [
    {
      id: 'doc_demo_01',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      ownerUserId: 'usr_demo_01',
      invoiceName: 'Q4 UI/UX Brand System Retainer',
      type: 'invoice',
      status: 'partially_paid',
      documentNumber: 'INV-2026-00101',
      issueDate: '2026-10-01',
      dueDate: '2026-10-15',
      currency: 'INR',
      placeOfSupply: '27 - Maharashtra',
      enableRoundOff: true,
      roundingMode: 'nearest_integer',
      decimalPrecision: 2,
      sender: {
        name: 'Acme Design Agency Pvt Ltd',
        email: 'billing@acmedesign.io',
        phone: '+91 22 4001 9200',
        taxId: '27AABCU9603R1ZM',
        address: {
          street1: 'Level 8, One BKC, Bandra Kurla Complex',
          city: 'Mumbai',
          state: '27 - Maharashtra',
          postalCode: '400051',
          country: 'India',
        },
      },
      client: DEMO_PARTIES['a0000000-0000-0000-0000-000000000001'][0],
      items: [
        {
          id: 'item_1',
          description: 'UI/UX Design & Brand System Sprint',
          hsnCode: '998314',
          quantity: 1,
          unitPrice: 85000,
          lineGross: 85000,
          lineDiscount: 0,
          lineNet: 85000,
          taxAmount: 15300,
          taxRate: 18,
          cgstRate: 9,
          cgstAmount: 7650,
          sgstRate: 9,
          sgstAmount: 7650,
          igstRate: 0,
          igstAmount: 0,
          lineTotal: 100300,
        },
      ],
      summary: {
        subtotal: 85000,
        discountTotal: 0,
        taxableSubtotal: 85000,
        totalTax: 15300,
        gstSupplyType: 'intra',
        cgstTotal: 7650,
        sgstTotal: 7650,
        igstTotal: 0,
        taxBreakdown: [
          {
            rate: 18,
            taxableAmount: 85000,
            taxAmount: 15300,
            cgstRate: 9,
            cgstAmount: 7650,
            sgstRate: 9,
            sgstAmount: 7650,
            igstRate: 0,
            igstAmount: 0,
          },
        ],
        shippingFee: 0,
        extraCharges: 0,
        totalBeforeRoundOff: 100300,
        roundOffAmount: 0,
        grandTotal: 100300,
        amountPaid: 50000,
        refundedAmount: 0,
        netAmountPaid: 50000,
        balanceDue: 50300,
      },
      templateId: 'cleartax_gst',
      paymentConfig: DEFAULT_DEMO_PAYMENT_CONFIG,
      paymentTerms: 'Net 15 Days',
      paymentInstructions: 'NEFT / RTGS / IMPS / UPI accepted. Please quote invoice number in remarks.',
      payments: [
        {
          id: 'pay_1',
          documentId: 'doc_demo_01',
          amount: 50000,
          paymentDate: '2026-10-03',
          paymentMethod: 'bank_transfer',
          reference: 'NEFT-894102',
          notes: '50% advance milestone payment',
          createdAt: '2026-10-03T10:00:00Z',
        },
      ],
      refunds: [],
      auditHistory: [
        {
          id: 'aud_1',
          action: 'INVOICE_CREATED',
          description: 'Invoice INV-2026-00101 created and finalized for ₹1,00,300.00',
          timestamp: '2026-10-01T09:00:00Z',
        },
        {
          id: 'aud_2',
          action: 'PAYMENT_RECORDED',
          description: 'Recorded payment of ₹50,000.00 via Bank Transfer (Ref: NEFT-894102)',
          timestamp: '2026-10-03T10:00:00Z',
        },
      ],
      createdAt: '2026-10-01T09:00:00Z',
      updatedAt: '2026-10-03T10:00:00Z',
      finalizedAt: '2026-10-01T09:30:00Z',
    },
  ],
};

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
        const userTenants = all.filter((t) => t.ownerUserId === userId);
        if (userTenants.length > 0) return userTenants;
      }
      return mergedDemo;
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
