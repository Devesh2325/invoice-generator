import { SupabaseClient } from '@supabase/supabase-js';
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
export declare function getSupabase(): SupabaseClient | null;
export declare const TenantApi: {
    getTenants(): Promise<Tenant[]>;
    getDocuments(tenantId: string): Promise<DocumentModel[]>;
    saveDocument(tenantId: string, doc: DocumentModel): Promise<DocumentModel>;
    getParties(tenantId: string): Promise<Party[]>;
    saveParty(tenantId: string, party: Party): Promise<Party>;
    getProducts(tenantId: string): Promise<ProductCatalogItem[]>;
    saveProduct(tenantId: string, product: ProductCatalogItem): Promise<ProductCatalogItem>;
    getBrandSettings(tenantId: string): Promise<TenantBrandSettings>;
    updateBrandSettings(tenantId: string, settings: Partial<TenantBrandSettings>): Promise<TenantBrandSettings>;
    recordPayment(tenantId: string, docId: string, amount: number, method: any, reference?: string): Promise<void>;
};
