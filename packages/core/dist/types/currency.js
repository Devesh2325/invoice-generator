export const CURRENCIES = {
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
export function getCurrencyConfig(code = 'INR') {
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
export function getCurrencyTaxProfile(currencyCode = 'INR') {
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
                defaultTemplateId: 'eu-reverse-charge',
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
export function formatCurrency(amount, currencyCode = 'INR', options) {
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
