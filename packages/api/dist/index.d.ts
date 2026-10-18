import { SupabaseClient } from '@supabase/supabase-js';
import { DocumentModel, Party, DocumentPaymentConfig, RoundingMode, PaymentMethod, DocumentStatus, AuditHistoryEntry, TenantAccessDeniedError, PlanLimitReachedError, APP_CONFIG, isTemplateAllowedForPlan } from '@invoice/core';
export { TenantAccessDeniedError, PlanLimitReachedError, APP_CONFIG, isTemplateAllowedForPlan };
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
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'invoice_deduction';
export interface StockMovement {
    id: string;
    productId: string;
    tenantId: string;
    type: StockMovementType;
    quantity: number;
    previousStock: number;
    newStock: number;
    reference?: string;
    reason?: string;
    timestamp: string;
}
export interface ProductCatalogItem {
    id: string;
    tenantId: string;
    name: string;
    category?: string;
    sku: string;
    barcode?: string;
    hsnCode?: string;
    description: string;
    unitPrice: number;
    unit: string;
    taxRate: number;
    taxInclusive?: boolean;
    stockQuantity: number;
    minStockThreshold: number;
    isArchived: boolean;
    stockMovements?: StockMovement[];
    createdAt?: string;
    updatedAt?: string;
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
    getTenantById(tenantId: string): Promise<Tenant | null>;
    getTenantUsage(tenantId: string): Promise<{
        plan: string;
        invoiceCount: number;
        invoiceLimit: number;
        isLimitReached: boolean;
        remaining: number;
        warningThresholdHit: boolean;
    }>;
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
    recordStockMovement(tenantId: string, productId: string, movement: {
        type: StockMovementType;
        quantity: number;
        reference?: string;
        reason?: string;
    }): Promise<StockMovement | null>;
    deductStockForInvoice(tenantId: string, doc: DocumentModel): Promise<void>;
    getLowStockProducts(tenantId: string): Promise<ProductCatalogItem[]>;
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
