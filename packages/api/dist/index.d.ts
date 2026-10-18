import { SupabaseClient } from '@supabase/supabase-js';
import { DocumentModel, Party, DocumentPaymentConfig, RoundingMode, PaymentMethod, DocumentStatus, AuditHistoryEntry, TenantAccessDeniedError, APP_CONFIG } from '@invoice/core';
export { TenantAccessDeniedError, APP_CONFIG };
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
    invoicePrefix?: string;
    nextInvoiceNumber?: number;
    defaultDueDays?: number;
    defaultTaxRate?: number;
    enableRoundOff?: boolean;
    roundingMode?: RoundingMode;
    paymentConfig?: DocumentPaymentConfig;
    whiteLabelEnabled?: boolean;
}
export declare function getSupabase(): SupabaseClient | null;
export declare function resetApiMemoryStore(): void;
export declare const TenantApi: {
    getTenants(userId?: string): Promise<Tenant[]>;
    createTenant(tenant: Tenant): Promise<Tenant>;
    updateTenant(tenantId: string, patch: Partial<Tenant>): Promise<Tenant | null>;
    getDocuments(tenantId: string): Promise<DocumentModel[]>;
    getDocumentById(tenantId: string, docId: string): Promise<DocumentModel | null>;
    deleteDocument(tenantId: string, docId: string): Promise<boolean>;
    saveDocument(tenantId: string, doc: DocumentModel): Promise<DocumentModel>;
    updateDocumentStatus(tenantId: string, docId: string, newStatus: DocumentStatus): Promise<DocumentModel | null>;
    getParties(tenantId: string): Promise<Party[]>;
    getPartyById(tenantId: string, partyId: string): Promise<Party | null>;
    deleteParty(tenantId: string, partyId: string): Promise<boolean>;
    saveParty(tenantId: string, party: Party): Promise<Party>;
    importPartiesBatch(tenantId: string, incomingParties: Party[], duplicateStrategy?: "skip" | "update" | "import"): Promise<{
        importedCount: number;
        updatedCount: number;
        skippedCount: number;
    }>;
    getProducts(tenantId: string): Promise<ProductCatalogItem[]>;
    getProductById(tenantId: string, productId: string): Promise<ProductCatalogItem | null>;
    deleteProduct(tenantId: string, productId: string): Promise<boolean>;
    saveProduct(tenantId: string, product: ProductCatalogItem): Promise<ProductCatalogItem>;
    getBrandSettings(tenantId: string): Promise<TenantBrandSettings>;
    updateBrandSettings(tenantId: string, settings: Partial<TenantBrandSettings>): Promise<TenantBrandSettings>;
    recordPayment(tenantId: string, docId: string, amount: number, method: PaymentMethod, reference?: string, notes?: string, paymentDate?: string): Promise<DocumentModel | null>;
    recordRefund(tenantId: string, docId: string, amount: number, method: PaymentMethod, reason?: string, reference?: string, notes?: string, refundDate?: string): Promise<DocumentModel | null>;
    getAuditLogs(tenantId: string): Promise<(AuditHistoryEntry & {
        docNumber: string;
    })[]>;
    deleteTenant(tenantId: string): Promise<boolean>;
    getTenantMetrics(tenantId: string): Promise<{
        documentsCount: number;
        customersCount: number;
        vendorsCount: number;
        productsCount: number;
        totalBilled: number;
        totalCollected: number;
        totalOutstanding: number;
    }>;
    searchTenantData(tenantId: string, query: string): Promise<{
        documents: DocumentModel[];
        customers: Party[];
        products: ProductCatalogItem[];
    }>;
};
export * from './blog';
export * from './team';
export * from './admin';
