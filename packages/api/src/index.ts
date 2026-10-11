import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DocumentModel, Party } from '@invoice/core';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerUserId?: string;
  custom_domain?: string | null;
  is_domain_verified: boolean;
  role: 'owner' | 'admin' | 'accountant' | 'staff' | 'viewer';
  currency?: string;
  country?: string;
  gstState?: string;
  taxId?: string;
  street?: string;
  city?: string;
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
  defaultTerms?: string;
  defaultInstructions?: string;
  footerText?: string;
  businessName?: string;
  currency?: string;
  country?: string;
  gstState?: string;
  taxId?: string;
  street?: string;
  city?: string;
  invoicePrefix?: string;
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
    country: 'India',
    gstState: '27 - Maharashtra',
    taxId: '27AABCU9603R1ZM',
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
    country: 'United States',
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
      type: 'invoice',
      status: 'finalized',
      documentNumber: 'INV-2026-00101',
      issueDate: '2026-10-01',
      dueDate: '2026-10-15',
      currency: 'INR',
      placeOfSupply: '27 - Maharashtra',
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
        grandTotal: 100300,
        amountPaid: 50000,
        balanceDue: 50300,
      },
      templateId: 'cleartax_gst',
      payments: [
        {
          id: 'pay_1',
          documentId: 'doc_demo_01',
          amount: 50000,
          paymentDate: '2026-10-03',
          paymentMethod: 'bank_transfer',
          reference: 'NEFT-894102',
          createdAt: '2026-10-03T10:00:00Z',
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
    primaryColor: '#3157D5',
    secondaryColor: '#0F172A',
    fontFamily: 'sans',
    defaultTerms: 'Payment due within 15 days. Subject to Mumbai Jurisdiction.',
    defaultInstructions: 'Bank: HDFC Bank | A/C: 50200049182731 | IFSC: HDFC0000124',
    footerText: 'Thank you for your business!',
  },
};

// 3. Typed Data Access Service (Strictly User & Tenant Isolated)
export const TenantApi = {
  async getTenants(userId?: string): Promise<Tenant[]> {
    const supabase = getSupabase();
    if (!supabase) {
      const customTenants = getLocalStore<Tenant[]>('billcraft_custom_tenants', []);
      const all = [...customTenants, ...DEMO_TENANTS];
      if (userId) {
        const userTenants = all.filter((t) => t.ownerUserId === userId);
        if (userTenants.length > 0) return userTenants;
      }
      return DEMO_TENANTS;
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
    return null;
  },

  async getDocuments(tenantId: string): Promise<DocumentModel[]> {
    const supabase = getSupabase();
    if (!supabase) {
      const storeDocs = getLocalStore<Record<string, DocumentModel[]>>(
        'billcraft_tenant_documents',
        DEMO_DOCUMENTS
      );
      return storeDocs[tenantId] || [];
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error || !data) return DEMO_DOCUMENTS[tenantId] || [];
    return data;
  },

  async saveDocument(tenantId: string, doc: DocumentModel): Promise<DocumentModel> {
    const supabase = getSupabase();
    if (!supabase) {
      const storeDocs = getLocalStore<Record<string, DocumentModel[]>>(
        'billcraft_tenant_documents',
        DEMO_DOCUMENTS
      );
      if (!storeDocs[tenantId]) storeDocs[tenantId] = [];
      const idx = storeDocs[tenantId].findIndex((d) => d.id === doc.id);
      if (idx >= 0) {
        storeDocs[tenantId][idx] = doc;
      } else {
        storeDocs[tenantId].unshift(doc);
      }
      setLocalStore('billcraft_tenant_documents', storeDocs);
      return doc;
    }

    const { error } = await supabase
      .from('documents')
      .upsert({
        id: doc.id,
        tenant_id: tenantId,
        type: doc.type,
        status: doc.status,
        document_number: doc.documentNumber,
        reference_number: doc.referenceNumber,
        issue_date: doc.issueDate,
        due_date: doc.dueDate,
        currency: doc.currency,
        client_snapshot: doc.client,
        sender_snapshot: doc.sender,
        summary: doc.summary,
        template_id: doc.templateId,
        notes: doc.notes,
        payment_terms: doc.paymentTerms,
        payment_instructions: doc.paymentInstructions,
      })
      .select()
      .single();

    if (error) throw error;
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
    storeProducts[tenantId].push(product);
    setLocalStore('billcraft_tenant_products', storeProducts);
    return product;
  },

  async getBrandSettings(tenantId: string): Promise<TenantBrandSettings> {
    const storeBrand = getLocalStore<Record<string, TenantBrandSettings>>(
      'billcraft_tenant_brand',
      DEMO_BRAND_SETTINGS
    );
    return (
      storeBrand[tenantId] || {
        tenantId,
        primaryColor: '#3157D5',
        secondaryColor: '#0F172A',
        fontFamily: 'sans',
      }
    );
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
    const updated = { ...existing, ...settings };
    storeBrand[tenantId] = updated;
    setLocalStore('billcraft_tenant_brand', storeBrand);
    return updated;
  },

  async recordPayment(
    tenantId: string,
    docId: string,
    amount: number,
    method: any,
    reference?: string
  ): Promise<void> {
    const storeDocs = getLocalStore<Record<string, DocumentModel[]>>(
      'billcraft_tenant_documents',
      DEMO_DOCUMENTS
    );
    const docs = storeDocs[tenantId] || [];
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return;

    const newPayment = {
      id: `pay_${Date.now()}`,
      documentId: docId,
      amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: method,
      reference,
      createdAt: new Date().toISOString(),
    };

    doc.payments.push(newPayment);
    doc.summary.amountPaid += amount;
    doc.summary.balanceDue = Math.max(0, doc.summary.grandTotal - doc.summary.amountPaid);
    if (doc.summary.balanceDue === 0) {
      doc.status = 'paid';
    } else {
      doc.status = 'partially_paid';
    }
    setLocalStore('billcraft_tenant_documents', storeDocs);
  },
};
