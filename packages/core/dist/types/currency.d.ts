export interface CurrencyConfig {
    code: string;
    name: string;
    symbol: string;
    decimalPlaces: number;
    symbolPosition: 'before' | 'after';
    defaultLocale?: string;
}
export declare const CURRENCIES: Record<string, CurrencyConfig>;
export declare const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig>;
export declare function getCurrencyConfig(code?: string): CurrencyConfig;
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
export declare function getCurrencyTaxProfile(currencyCode?: string): CurrencyTaxProfile;
export declare function formatCurrency(amount: number | string, currencyCode?: string, options?: FormatCurrencyOptions): string;
