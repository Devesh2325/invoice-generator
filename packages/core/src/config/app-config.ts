import { PLANS, UNLIMITED_DOCUMENTS, type PlanId, type PlanLimits } from '../types/team';
import { getCurrencyTaxProfile } from '../types/currency';
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
      integrationDocs: boolean;
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
      integrationDocs: boolean;
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
      integrationDocs: boolean;
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
      integrationDocs: boolean;
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

/**
 * Every country template is free, because each is the default for its currency and free users must
 * be able to save with it. Paid plans add dark-tech, reverse charge and the special documents.
 */
const FREE_TEMPLATE_IDS = [
  'in-gst',
  'modern',
  'creative',
  'hk-no-tax',
  'uk-vat',
  'eu-vat',
  'us-sales-tax',
  'ca-hst',
  'au-gst',
  'sg-gst',
  'ae-vat',
  'jp-qualified',
  'ch-sidebar',
];

/** Older template IDs that saved invoices and links may still use, and the design each one renders with. */
const LEGACY_TEMPLATE_IDS: Record<string, string> = {
  cleartax_gst: 'in-gst',
  tally_prime: 'in-gst',
  vyapar_classic: 'in-gst',
  zoho_gst: 'in-gst',
  agency_retainer: 'in-gst',
  stripe_fintech: 'dark-tech',
  stripe_clean: 'dark-tech',
  behance_dark: 'dark-tech',
  classic: 'eu-vat',
  elegant: 'eu-vat',
  bold_header: 'uk-vat',
  medical_rx: 'uk-vat',
  corporate: 'au-gst',
  professional: 'au-gst',
  logistics_waybill: 'au-gst',
  canva_studio: 'creative',
  dribbble_bold: 'creative',
  minimal: 'hk-no-tax',
  apple_clean: 'hk-no-tax',
  notion_minimal: 'hk-no-tax',
  compact: 'ch-sidebar',
  retail: 'ch-sidebar',
  retail_pos: 'ch-sidebar',
  zoho_standard: 'sg-gst',
  freshbooks_classic: 'ca-hst',
  freshbooks_cloud: 'ca-hst',
  quickbooks_enterprise: 'us-sales-tax',
  service_business: 'us-sales-tax',
};

/** Returns the current ID for a template, whether it's given an old ID or a current one. */
export function resolveTemplateId(templateId: string): string {
  return LEGACY_TEMPLATE_IDS[templateId] || templateId;
}

/**
 * The currency each country's tax design is made for. Tax labels, ID fields and the state list all
 * follow the currency, so a country design with another country's currency would mix the two.
 * Designs not listed here work in any currency.
 */
export const TEMPLATE_CURRENCIES: Record<string, string> = {
  'in-gst': 'INR',
  'uk-vat': 'GBP',
  'eu-vat': 'EUR',
  'eu-reverse-charge': 'EUR',
  'us-sales-tax': 'USD',
  'ca-hst': 'CAD',
  'au-gst': 'AUD',
  'sg-gst': 'SGD',
  'ae-vat': 'AED',
  'jp-qualified': 'JPY',
  'ch-sidebar': 'CHF',
};

export function getTemplateCurrency(templateId: string): string | undefined {
  return TEMPLATE_CURRENCIES[resolveTemplateId(templateId)];
}

/** The given template, or that currency's usual one if the template belongs to another country. */
export function templateForCurrency(templateId: string, currency: string): string {
  const resolved = resolveTemplateId(templateId);
  const owner = TEMPLATE_CURRENCIES[resolved];
  return owner && owner !== currency.toUpperCase() ? getCurrencyTaxProfile(currency).defaultTemplateId : resolved;
}

export const APP_CONFIG: AppConfig = {
  brandName: 'Invoxa',
  brandTagline: 'Intelligent Invoicing & Financial Operations Platform',
  brandDescription: 'High-precision invoicing, purchase orders, estimates, inventory management, and white-label client billing.',
  brandDomain: 'invoxa.io',
  supportEmail: 'support@invoxa.io',
  trialInvoiceLimit: 7,
  trialWarningThresholds: [5, 6],
  superAdmin: {
    email: 'dmchaturvedi@gmail.com',
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
      allowedTemplateIds: FREE_TEMPLATE_IDS,
      canSave: false,
      inventory: false,
      whiteLabel: false,
      integrationDocs: false,
    },
    starter: {
      id: 'starter',
      name: 'Free Trial',
      price: 0,
      invoiceLimit: 7,
      allowedTemplateIds: FREE_TEMPLATE_IDS,
      canSave: true,
      inventory: false,
      whiteLabel: false,
      integrationDocs: false,
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
      integrationDocs: true,
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
      integrationDocs: true,
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
export function isTemplateAllowedForPlan(planId: string | undefined, templateId: string): boolean {
  const id = resolveTemplateId(templateId);
  if (!planId || planId === 'anonymous') {
    return APP_CONFIG.plans.anonymous.allowedTemplateIds.includes(id);
  }
  if (planId === 'starter') {
    if (PLANS.starter.hasAllTemplates) return true;
    return APP_CONFIG.plans.starter.allowedTemplateIds.includes(id);
  }
  if (planId === 'pro' || planId === 'enterprise') {
    return true;
  }
  return false;
}

/** The plans as shipped, for resetting a plan in the super admin. */
export const DEFAULT_PLANS: Record<PlanId, PlanLimits> = JSON.parse(JSON.stringify(PLANS));

/** The parts of a plan the super admin can change. */
export type PlanOverrides = Partial<
  Record<
    PlanId,
    Partial<
      Pick<
        PlanLimits,
        | 'priceMonthly'
        | 'priceYearly'
        | 'maxMembers'
        | 'maxInvoicesPerMonth'
        | 'hasAllTemplates'
        | 'canRemoveWatermark'
        | 'hasPrioritySupport'
        | 'hasIntegrationDocs'
        | 'hasWhiteLabel'
      >
    >
  >
>;

/**
 * Applies the super admin's plan settings everywhere at once. Both plan lists are updated in place,
 * because limits are read by code that runs outside React, such as TenantApi.saveDocument.
 */
export function applyPlanOverrides(overrides: PlanOverrides): void {
  (Object.keys(DEFAULT_PLANS) as PlanId[]).forEach((id) => {
    const plan = Object.assign(PLANS[id], DEFAULT_PLANS[id], overrides[id] || {});
    const config = APP_CONFIG.plans[id];
    config.price = plan.priceMonthly;
    config.invoiceLimit = plan.maxInvoicesPerMonth >= UNLIMITED_DOCUMENTS ? Infinity : plan.maxInvoicesPerMonth;
    config.integrationDocs = plan.hasIntegrationDocs;
    config.whiteLabel = plan.hasWhiteLabel;
  });
  APP_CONFIG.trialInvoiceLimit = PLANS.starter.maxInvoicesPerMonth;
}
