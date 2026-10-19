/**
 * CENTRAL APPLICATION CONFIGURATION (Single Source of Truth)
 * Governs platform brand identity, trial allowances, subscription tiers,
 * document terminology, and multi-tenant defaults across frontend & backend.
 */
export const APP_CONFIG = {
    brandName: 'Invoxa',
    brandTagline: 'Intelligent Invoicing & Financial Operations Platform',
    brandDescription: 'High-precision invoicing, purchase orders, estimates, inventory management, and white-label client billing.',
    brandDomain: 'invoxa.io',
    supportEmail: 'support@invoxa.io',
    trialInvoiceLimit: 7,
    trialWarningThresholds: [5, 6],
    superAdmin: {
        email: 'admin@billcraft.com', // Must not change per global rule
        role: 'super_admin',
    },
    appwrite: {
        defaultEndpoint: 'https://cloud.appwrite.io/v1',
        defaultDatabaseId: 'invoxa_main',
        collections: {
            tenants: 'tenants',
            parties: 'parties',
            products: 'products',
            documents: 'documents',
            payments: 'payments',
            auditLogs: 'audit_logs',
            brandSettings: 'brand_settings',
        },
        buckets: {
            assets: 'invoxa_assets',
        },
    },
    plans: {
        anonymous: {
            id: 'anonymous',
            name: 'Anonymous Visitor',
            invoiceLimit: 0,
            allowedTemplateIds: ['cleartax_gst', 'tally_prime', 'apple_clean'],
            canSave: false,
            inventory: false,
            whiteLabel: false,
        },
        starter: {
            id: 'starter',
            name: 'Free Trial',
            price: 0,
            invoiceLimit: 7,
            allowedTemplateIds: ['cleartax_gst', 'tally_prime', 'apple_clean'],
            canSave: true,
            inventory: false,
            whiteLabel: false,
        },
        pro: {
            id: 'pro',
            name: 'Pro Plan',
            price: 799,
            invoiceLimit: Infinity,
            allowedTemplateIds: 'all',
            canSave: true,
            inventory: true,
            whiteLabel: false,
        },
        enterprise: {
            id: 'enterprise',
            name: 'Enterprise White-Label',
            price: 2499,
            invoiceLimit: Infinity,
            allowedTemplateIds: 'all',
            canSave: true,
            inventory: true,
            whiteLabel: true,
        },
    },
    defaultTerminology: {
        invoice: 'Tax Invoice',
        estimate: 'Estimate / Quotation',
        purchase_order: 'Purchase Order',
        pro_forma: 'Proforma Invoice',
        receipt: 'Receipt Voucher',
        credit_note: 'Credit Note',
        debit_note: 'Debit Note',
        clientLabel: 'Customer / Client',
        vendorLabel: 'Vendor / Supplier',
    },
};
/**
 * Returns true if a given template ID is permitted under the user's plan.
 */
export function isTemplateAllowedForPlan(planId, templateId) {
    if (!planId || planId === 'anonymous') {
        return APP_CONFIG.plans.anonymous.allowedTemplateIds.includes(templateId);
    }
    if (planId === 'starter') {
        return APP_CONFIG.plans.starter.allowedTemplateIds.includes(templateId);
    }
    if (planId === 'pro' || planId === 'enterprise') {
        return true;
    }
    return false;
}
