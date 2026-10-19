import { Models } from 'appwrite';
export interface AppwriteTenantDoc extends Models.Document {
    tenantId: string;
    name: string;
    slug: string;
    ownerUserId?: string;
    plan: string;
    isWhiteLabel: boolean;
    data: string;
}
export interface AppwritePartyDoc extends Models.Document {
    tenantId: string;
    partyId: string;
    type: string;
    name: string;
    email?: string;
    phone?: string;
    taxId?: string;
    isArchived: boolean;
    data: string;
}
export interface AppwriteProductDoc extends Models.Document {
    tenantId: string;
    productId: string;
    name: string;
    sku: string;
    barcode?: string;
    category?: string;
    unitPrice: number;
    taxRate: number;
    stockQuantity: number;
    minStockThreshold: number;
    isArchived: boolean;
    data: string;
}
export interface AppwriteDocumentDoc extends Models.Document {
    tenantId: string;
    docId: string;
    documentNumber: string;
    type: string;
    status: string;
    issueDate: string;
    dueDate?: string;
    currency: string;
    grandTotal: number;
    amountPaid: number;
    balanceDue: number;
    clientName: string;
    data: string;
}
export interface AppwritePaymentDoc extends Models.Document {
    tenantId: string;
    paymentId: string;
    documentId: string;
    amount: number;
    method: string;
    reference?: string;
    timestamp: string;
    status: string;
}
export interface AppwriteBrandSettingsDoc extends Models.Document {
    tenantId: string;
    primaryColor?: string;
    data: string;
}
export interface AppwriteAuditLogDoc extends Models.Document {
    tenantId: string;
    actor: string;
    action: string;
    details: string;
    timestamp: string;
}
