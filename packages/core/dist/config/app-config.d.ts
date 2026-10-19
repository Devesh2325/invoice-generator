/**
 * CENTRAL APPLICATION CONFIGURATION (Single Source of Truth)
 * Governs platform brand identity, trial allowances, subscription tiers,
 * document terminology, and multi-tenant defaults across frontend & backend.
 */
export interface AppConfig {
    brandName: string;
    brandTagline: string;
    brandDescription: string;
    brandDomain: string;
    supportEmail: string;
    trialInvoiceLimit: number;
    trialWarningThresholds: number[];
    superAdmin: {
        email: string;
        role: string;
    };
    plans: {
        anonymous: {
            id: string;
            name: string;
            invoiceLimit: number;
            allowedTemplateIds: string[];
            canSave: boolean;
            inventory: boolean;
            whiteLabel: boolean;
        };
        starter: {
            id: string;
            name: string;
            price: number;
            invoiceLimit: number;
            allowedTemplateIds: string[];
            canSave: boolean;
            inventory: boolean;
            whiteLabel: boolean;
        };
        pro: {
            id: string;
            name: string;
            price: number;
            invoiceLimit: number;
            allowedTemplateIds: 'all';
            canSave: boolean;
            inventory: boolean;
            whiteLabel: boolean;
        };
        enterprise: {
            id: string;
            name: string;
            price: number;
            invoiceLimit: number;
            allowedTemplateIds: 'all';
            canSave: boolean;
            inventory: boolean;
            whiteLabel: boolean;
        };
    };
    defaultTerminology: Record<string, string>;
    appwrite: {
        defaultEndpoint: string;
        defaultDatabaseId: string;
        collections: {
            tenants: string;
            parties: string;
            products: string;
            documents: string;
            payments: string;
            auditLogs: string;
            brandSettings: string;
        };
        buckets: {
            assets: string;
        };
    };
}
export declare const APP_CONFIG: AppConfig;
/**
 * Returns true if a given template ID is permitted under the user's plan.
 */
export declare function isTemplateAllowedForPlan(planId: string | undefined, templateId: string): boolean;
