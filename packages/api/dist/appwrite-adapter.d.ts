import { DocumentModel, Party, AuditHistoryEntry } from '@invoice/core';
import type { Tenant, ProductCatalogItem, TenantBrandSettings } from './index';
export declare class AppwriteAdapter {
    private static getDatabaseId;
    private static getBucketId;
    static getTenants(userId?: string): Promise<Tenant[] | null>;
    static getTenantById(tenantId: string): Promise<Tenant | null>;
    static createTenant(tenant: Tenant): Promise<Tenant | null>;
    static updateTenant(tenantId: string, patch: Partial<Tenant>): Promise<Tenant | null>;
    static getParties(tenantId: string): Promise<Party[] | null>;
    static saveParty(tenantId: string, party: Party): Promise<Party | null>;
    static deleteParty(tenantId: string, partyId: string): Promise<boolean>;
    static getProducts(tenantId: string): Promise<ProductCatalogItem[] | null>;
    static saveProduct(tenantId: string, product: ProductCatalogItem): Promise<ProductCatalogItem | null>;
    static deleteProduct(tenantId: string, productId: string): Promise<boolean>;
    static getDocuments(tenantId: string): Promise<DocumentModel[] | null>;
    static saveDocument(tenantId: string, doc: DocumentModel, tenantPlan?: string): Promise<DocumentModel | null>;
    static deleteDocument(tenantId: string, docId: string): Promise<boolean>;
    static getBrandSettings(tenantId: string): Promise<TenantBrandSettings | null>;
    static saveBrandSettings(tenantId: string, settings: TenantBrandSettings): Promise<TenantBrandSettings | null>;
    static uploadAsset(file: File): Promise<string | null>;
    static getAuditLogs(tenantId: string): Promise<AuditHistoryEntry[] | null>;
    static recordAuditLog(tenantId: string, entry: AuditHistoryEntry): Promise<void>;
}
