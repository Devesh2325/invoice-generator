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
export declare function formatCurrency(amount: number | string, currencyCode?: string, options?: FormatCurrencyOptions): string;
