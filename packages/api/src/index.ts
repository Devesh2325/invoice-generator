import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DocumentModel, Party } from '@invoice/core';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  custom_domain?: string | null;
  is_domain_verified: boolean;
  role: 'owner' | 'admin' | 'accountant' | 'staff' | 'viewer';
}

export interface ProductCatalogItem {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
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

// 2. Demo In-Memory State for Instant Local Prototyping
const DEMO_TENANTS: Tenant[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Acme Design Agency',
    slug: 'acme-design',
    custom_domain: 'billing.acmedesign.io',
    is_domain_verified: true,
    role: 'owner',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Nexus Cloud Solutions',
    slug: 'nexus-cloud',
    custom_domain: null,
    is_domain_verified: false,
    role: 'admin',
  },
];

const DEMO_PARTIES: Record<string, Party[]> = {
  'a0000000-0000-0000-0000-000000000001': [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      type: 'customer',
      name: 'Globex Corporation',
      email: 'accounts@globex.com',
      phone: '+1 (555) 019-2831',
      taxId: 'VAT-99281',
      billingAddress: {
        street1: '742 Evergreen Terrace',
        city: 'Springfield',
        postalCode: '90210',
        country: 'United States',
      },
      notes: 'Key client, net 30 payment terms',
      isArchived: false,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      type: 'customer',
      name: 'Initech LLC',
      email: 'finance@initech.com',
      phone: '+1 (555) 849-1122',
      taxId: 'US-102948',
      billingAddress: {
        street1: '4120 Freemont Blvd',
        city: 'Austin',
        postalCode: '78701',
        country: 'United States',
      },
      notes: 'Enterprise account',
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
      taxId: 'VAT-88491',
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
      name: 'UI/UX Design Sprint',
      sku: 'SRV-DSGN-01',
      description: '5-day interactive product design sprint',
      unitPrice: 4500,
      unit: 'sprint',
      taxRate: 10,
      isArchived: false,
    },
    {
      id: 'p0000000-0000-0000-0000-000000000002',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      name: 'Full-Stack Engineering Hour',
      sku: 'SRV-ENG-01',
      description: 'Senior React/Node software development',
      unitPrice: 150,
      unit: 'hour',
      taxRate: 10,
      isArchived: false,
    },
  ],
};

const DEMO_DOCUMENTS: Record<string, DocumentModel[]> = {
  'a0000000-0000-0000-0000-000000000001': [
    {
      id: 'doc_demo_01',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      type: 'invoice',
      status: 'finalized',
      documentNumber: 'INV-2026-00101',
      issueDate: '2026-10-01',
      dueDate: '2026-10-15',
      currency: 'USD',
      sender: {
        name: 'Acme Design Agency',
        email: 'billing@acmedesign.io',
        taxId: 'US-849201948',
        address: {
          street1: '100 Market St',
          city: 'San Francisco',
          postalCode: '94105',
          country: 'United States',
        },
      },
      client: DEMO_PARTIES['a0000000-0000-0000-0000-000000000001'][0],
      items: [
        {
          id: 'item_1',
          description: 'UI/UX Design Sprint',
          quantity: 1,
          unitPrice: 4500,
          lineGross: 4500,
          lineDiscount: 0,
          lineNet: 4500,
          taxAmount: 450,
          taxRate: 10,
          lineTotal: 4950,
        },
        {
          id: 'item_2',
          description: 'Frontend Implementation',
          quantity: 20,
          unitPrice: 150,
          lineGross: 3000,
          lineDiscount: 0,
          lineNet: 3000,
          taxAmount: 300,
          taxRate: 10,
          lineTotal: 3300,
        },
      ],
      summary: {
        subtotal: 7500,
        discountTotal: 0,
        taxableSubtotal: 7500,
        totalTax: 750,
        taxBreakdown: [{ rate: 10, taxableAmount: 7500, taxAmount: 750 }],
        shippingFee: 0,
        extraCharges: 0,
        grandTotal: 8250,
        amountPaid: 3000,
        balanceDue: 5250,
      },
      templateId: 'modern',
      payments: [
        {
          id: 'pay_1',
          documentId: 'doc_demo_01',
          amount: 3000,
          paymentDate: '2026-10-03',
          paymentMethod: 'bank_transfer',
          reference: 'WIRE-894102',
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
    defaultTerms: 'Net 30 days',
    defaultInstructions: 'Bank: J.P. Morgan Chase | Acct: 123456789 | Routing: 987654321',
    footerText: 'Thank you for partnering with Acme Design Agency.',
  },
};

// 3. Typed Data Access Service
export const TenantApi = {
  async getTenants(): Promise<Tenant[]> {
    const supabase = getSupabase();
    if (!supabase) return DEMO_TENANTS;

    const { data, error } = await supabase
      .from('tenant_members')
      .select('role, tenants(*)');

    if (error || !data) return DEMO_TENANTS;
    return data.map((item: any) => ({
      ...item.tenants,
      role: item.role,
    }));
  },

  async getDocuments(tenantId: string): Promise<DocumentModel[]> {
    const supabase = getSupabase();
    if (!supabase) return DEMO_DOCUMENTS[tenantId] || [];

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
      if (!DEMO_DOCUMENTS[tenantId]) DEMO_DOCUMENTS[tenantId] = [];
      const idx = DEMO_DOCUMENTS[tenantId].findIndex((d) => d.id === doc.id);
      if (idx >= 0) {
        DEMO_DOCUMENTS[tenantId][idx] = doc;
      } else {
        DEMO_DOCUMENTS[tenantId].unshift(doc);
      }
      return doc;
    }

    const { data, error } = await supabase
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
    if (!supabase) return DEMO_PARTIES[tenantId] || [];

    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_archived', false);

    if (error || !data) return DEMO_PARTIES[tenantId] || [];
    return data;
  },

  async saveParty(tenantId: string, party: Party): Promise<Party> {
    if (!DEMO_PARTIES[tenantId]) DEMO_PARTIES[tenantId] = [];
    const idx = DEMO_PARTIES[tenantId].findIndex((p) => p.id === party.id);
    if (idx >= 0) {
      DEMO_PARTIES[tenantId][idx] = party;
    } else {
      DEMO_PARTIES[tenantId].push(party);
    }
    return party;
  },

  async getProducts(tenantId: string): Promise<ProductCatalogItem[]> {
    return DEMO_PRODUCTS[tenantId] || [];
  },

  async saveProduct(tenantId: string, product: ProductCatalogItem): Promise<ProductCatalogItem> {
    if (!DEMO_PRODUCTS[tenantId]) DEMO_PRODUCTS[tenantId] = [];
    DEMO_PRODUCTS[tenantId].push(product);
    return product;
  },

  async getBrandSettings(tenantId: string): Promise<TenantBrandSettings> {
    return (
      DEMO_BRAND_SETTINGS[tenantId] || {
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
    const existing = await this.getBrandSettings(tenantId);
    const updated = { ...existing, ...settings };
    DEMO_BRAND_SETTINGS[tenantId] = updated;
    return updated;
  },

  async recordPayment(
    tenantId: string,
    docId: string,
    amount: number,
    method: any,
    reference?: string
  ): Promise<void> {
    const docs = DEMO_DOCUMENTS[tenantId] || [];
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
  },
};
