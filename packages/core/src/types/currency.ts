export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  defaultLocale?: string;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, symbolPosition: 'before', defaultLocale: 'en-US' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, symbolPosition: 'before', defaultLocale: 'en-IN' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, symbolPosition: 'after', defaultLocale: 'en-US' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, symbolPosition: 'before', defaultLocale: 'en-GB' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimalPlaces: 2, symbolPosition: 'before', defaultLocale: 'en-CA' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'AU$', decimalPlaces: 2, symbolPosition: 'before', defaultLocale: 'en-AU' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, symbolPosition: 'before', defaultLocale: 'en-US' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, symbolPosition: 'before', defaultLocale: 'en-SG' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED ', decimalPlaces: 2, symbolPosition: 'before', defaultLocale: 'en-AE' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF ', decimalPlaces: 2, symbolPosition: 'before', defaultLocale: 'de-CH' },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD ', decimalPlaces: 3, symbolPosition: 'before', defaultLocale: 'en-KW' },
};

export const SUPPORTED_CURRENCIES = CURRENCIES;

export function getCurrencyConfig(code: string = 'INR'): CurrencyConfig {
  const normalized = (code || 'INR').toUpperCase();
  return CURRENCIES[normalized] || {
    code: normalized,
    name: normalized,
    symbol: `${normalized} `,
    decimalPlaces: 2,
    symbolPosition: 'before',
    defaultLocale: 'en-US',
  };
}

export interface FormatCurrencyOptions {
  locale?: string;
  decimalPlaces?: number;
  showSign?: boolean;
}

export interface CurrencyTaxProfile {
  currency: string;
  taxLabel: string;
  taxIdLabel: string;
  defaultTaxRate: number;
  routingLabel: string;
  defaultCountry: string;
  defaultState: string;
  defaultTemplateId: string;
  isIndiaGst: boolean;
  supportsUpi: boolean;
  supportsHsn: boolean;
  defaultBankName: string;
  defaultBankBranch: string;
  defaultTerms: string;
  defaultNotes: string;
}

export function getCurrencyTaxProfile(currencyCode: string = 'INR'): CurrencyTaxProfile {
  const code = (currencyCode || 'INR').toUpperCase();
  switch (code) {
    case 'GBP':
      return {
        currency: 'GBP',
        taxLabel: 'VAT',
        taxIdLabel: 'VAT Reg No.',
        defaultTaxRate: 20,
        routingLabel: 'Sort code',
        defaultCountry: 'United Kingdom',
        defaultState: 'Greater London',
        defaultTemplateId: 'uk-vat',
        isIndiaGst: false,
        supportsUpi: false,
        supportsHsn: false,
        defaultBankName: 'Barclays Bank UK',
        defaultBankBranch: 'London Main Branch',
        defaultTerms: 'Net 30 Days',
        defaultNotes: '1. Payment is due within 30 days of invoice date.\n2. Please quote invoice number in bank transfer reference.',
      };
    case 'USD':
      return {
        currency: 'USD',
        taxLabel: 'Sales Tax',
        taxIdLabel: 'EIN / Tax ID',
        defaultTaxRate: 0,
        routingLabel: 'Routing number',
        defaultCountry: 'United States',
        defaultState: 'California',
        defaultTemplateId: 'us-sales-tax',
        isIndiaGst: false,
        supportsUpi: false,
        supportsHsn: false,
        defaultBankName: 'Chase Bank NA',
        defaultBankBranch: 'New York Branch',
        defaultTerms: 'Net 30 Days',
        defaultNotes: '1. Payment is due within 30 days of invoice date.\n2. Wire/ACH payments: please include invoice number.',
      };
    case 'EUR':
      return {
        currency: 'EUR',
        taxLabel: 'VAT',
        taxIdLabel: 'VAT ID No.',
        defaultTaxRate: 20,
        routingLabel: 'IBAN / BIC',
        defaultCountry: 'Germany',
        defaultState: 'Berlin',
        defaultTemplateId: 'eu-vat',
        isIndiaGst: false,
        supportsUpi: false,
        supportsHsn: false,
        defaultBankName: 'Deutsche Bank',
        defaultBankBranch: 'Frankfurt Branch',
        defaultTerms: 'Net 30 Days',
        defaultNotes: '1. Payment is due within 30 days of invoice date.\n2. SEPA transfer: please quote invoice reference.',
      };
    case 'CAD':
      return {
        currency: 'CAD',
        taxLabel: 'GST/HST',
        taxIdLabel: 'GST/HST No.',
        defaultTaxRate: 13,
        routingLabel: 'Transit No.',
        defaultCountry: 'Canada',
        defaultState: 'Ontario',
        defaultTemplateId: 'ca-hst',
        isIndiaGst: false,
        supportsUpi: false,
        supportsHsn: false,
        defaultBankName: 'Royal Bank of Canada',
        defaultBankBranch: 'Toronto Branch',
        defaultTerms: 'Net 30 Days',
        defaultNotes: '1. Payment is due within 30 days of invoice date.',
      };
    case 'AUD':
      return {
        currency: 'AUD',
        taxLabel: 'GST',
        taxIdLabel: 'ABN',
        defaultTaxRate: 10,
        routingLabel: 'BSB',
        defaultCountry: 'Australia',
        defaultState: 'New South Wales',
        defaultTemplateId: 'au-gst',
        isIndiaGst: false,
        supportsUpi: false,
        supportsHsn: false,
        defaultBankName: 'Commonwealth Bank',
        defaultBankBranch: 'Sydney Branch',
        defaultTerms: 'Net 30 Days',
        defaultNotes: '1. Payment is due within 30 days of invoice date.',
      };
    case 'AED':
      return {
        currency: 'AED',
        taxLabel: 'VAT',
        taxIdLabel: 'TRN',
        defaultTaxRate: 5,
        routingLabel: 'IBAN / SWIFT',
        defaultCountry: 'United Arab Emirates',
        defaultState: 'Dubai',
        defaultTemplateId: 'ae-vat',
        isIndiaGst: false,
        supportsUpi: false,
        supportsHsn: false,
        defaultBankName: 'Emirates NBD',
        defaultBankBranch: 'Dubai Branch',
        defaultTerms: 'Net 30 Days',
        defaultNotes: '1. Payment is due within 30 days of invoice date.',
      };
    case 'SGD':
      return {
        currency: 'SGD',
        taxLabel: 'GST',
        taxIdLabel: 'UEN / GST Reg No.',
        defaultTaxRate: 9,
        routingLabel: 'Bank Code / SWIFT',
        defaultCountry: 'Singapore',
        defaultState: 'Singapore',
        defaultTemplateId: 'sg-gst',
        isIndiaGst: false,
        supportsUpi: false,
        supportsHsn: false,
        defaultBankName: 'DBS Bank Ltd',
        defaultBankBranch: 'Singapore Branch',
        defaultTerms: 'Net 30 Days',
        defaultNotes: '1. Payment is due within 30 days of invoice date.',
      };
    case 'KWD':
      return {
        currency: 'KWD',
        taxLabel: 'Tax',
        taxIdLabel: 'Civil ID / Tax No.',
        defaultTaxRate: 0,
        routingLabel: 'IBAN / SWIFT',
        defaultCountry: 'Kuwait',
        defaultState: 'Al Asimah (Kuwait City)',
        defaultTemplateId: 'hk-no-tax',
        isIndiaGst: false,
        supportsUpi: false,
        supportsHsn: false,
        defaultBankName: 'National Bank of Kuwait (NBK)',
        defaultBankBranch: 'Kuwait City Branch',
        defaultTerms: 'Net 30 Days',
        defaultNotes: '1. Payment is due within 30 days of invoice date.\n2. Please remit payment via bank transfer to the IBAN indicated.',
      };
    case 'CHF':
      return {
        currency: 'CHF',
        taxLabel: 'MWST/TVA',
        taxIdLabel: 'CHE-UID / MWST',
        defaultTaxRate: 8.1,
        routingLabel: 'IBAN / BIC',
        defaultCountry: 'Switzerland',
        defaultState: 'Zurich',
        defaultTemplateId: 'ch-sidebar',
        isIndiaGst: false,
        supportsUpi: false,
        supportsHsn: false,
        defaultBankName: 'UBS Switzerland AG',
        defaultBankBranch: 'Zurich Main Branch',
        defaultTerms: 'Net 30 Days',
        defaultNotes: '1. Payment is due within 30 days of invoice date.\n2. Please quote invoice reference in transfer.',
      };
    case 'JPY':
      return {
        currency: 'JPY',
        taxLabel: 'Consumption Tax',
        taxIdLabel: 'Invoice Reg. No. (T+13 digits)',
        defaultTaxRate: 10,
        routingLabel: 'Bank Code / Branch',
        defaultCountry: 'Japan',
        defaultState: 'Tokyo',
        defaultTemplateId: 'jp-qualified',
        isIndiaGst: false,
        supportsUpi: false,
        supportsHsn: false,
        defaultBankName: 'Mitsubishi UFJ Bank',
        defaultBankBranch: 'Tokyo Main Branch',
        defaultTerms: 'Net 30 Days',
        defaultNotes: '1. Payment is due within 30 days of invoice date.\n2. 支払期日は請求書発行日から30日以内です。',
      };
    case 'INR':
      return {
        currency: 'INR',
        taxLabel: 'GST',
        taxIdLabel: 'GSTIN',
        defaultTaxRate: 18,
        routingLabel: 'IFSC',
        defaultCountry: 'India',
        defaultState: '27 - Maharashtra',
        defaultTemplateId: 'in-gst',
        isIndiaGst: true,
        supportsUpi: true,
        supportsHsn: true,
        defaultBankName: 'HDFC Bank Ltd',
        defaultBankBranch: 'Main Branch, Mumbai',
        defaultTerms: 'Net 15 Days',
        defaultNotes: '1. Payment is due within 15 days of invoice date.\n2. Goods/services once billed are subject to local jurisdiction.',
      };
    default:
      return {
        currency: code,
        taxLabel: 'Tax / VAT',
        taxIdLabel: 'Tax ID / VAT No.',
        defaultTaxRate: 0,
        routingLabel: 'IBAN / SWIFT',
        defaultCountry: 'International',
        defaultState: 'General',
        defaultTemplateId: 'hk-no-tax',
        isIndiaGst: false,
        supportsUpi: false,
        supportsHsn: false,
        defaultBankName: 'Standard International Bank',
        defaultBankBranch: 'Main Branch',
        defaultTerms: 'Net 30 Days',
        defaultNotes: '1. Payment is due within 30 days of invoice date.\n2. Please quote invoice number in bank transfer reference.',
      };
  }
}

const EURO_REGIONS = new Set(['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK']);
const REGION_CURRENCIES: Record<string, string> = {
  AE: 'AED', AU: 'AUD', CA: 'CAD', CH: 'CHF', GB: 'GBP', IN: 'INR', JP: 'JPY', KW: 'KWD', SG: 'SGD', US: 'USD',
};
// A time zone is a better sign of location than a language setting: many people outside the US use en-US.
const TIME_ZONE_REGIONS: Record<string, string> = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Singapore': 'SG', 'Asia/Dubai': 'AE', 'Asia/Tokyo': 'JP',
  'Asia/Kuwait': 'KW', 'Europe/London': 'GB', 'Europe/Zurich': 'CH', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR',
  'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Europe/Dublin': 'IE', 'America/Toronto': 'CA',
  'America/Vancouver': 'CA', 'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
  'America/Los_Angeles': 'US', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Perth': 'AU',
};

/** A starting currency for someone with no saved settings. They can change it, so a wrong guess costs one click. */
export function detectCurrency(timeZone?: string, language?: string): string {
  const region = (timeZone && TIME_ZONE_REGIONS[timeZone]) || language?.split('-')[1]?.toUpperCase() || '';
  if (EURO_REGIONS.has(region)) return 'EUR';
  return REGION_CURRENCIES[region] || 'USD';
}

export function formatCurrency(
  amount: number | string,
  currencyCode: string = 'INR',
  options?: FormatCurrencyOptions
): string {
  const config = getCurrencyConfig(currencyCode);
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const dp = options?.decimalPlaces !== undefined ? options.decimalPlaces : config.decimalPlaces;

  if (isNaN(num)) {
    const zeroStr = (0).toFixed(dp);
    return config.symbolPosition === 'before'
      ? `${config.symbol}${zeroStr}`
      : `${zeroStr} ${config.symbol}`;
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const locale = options?.locale || config.defaultLocale || 'en-US';

  const formattedNum = absNum.toLocaleString(locale, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });

  const signPrefix = isNegative ? '-' : options?.showSign && num > 0 ? '+' : '';

  return config.symbolPosition === 'before'
    ? `${signPrefix}${config.symbol}${formattedNum}`
    : `${signPrefix}${formattedNum} ${config.symbol}`;
}
