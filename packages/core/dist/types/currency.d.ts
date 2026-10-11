export interface CurrencyConfig {
    code: string;
    name: string;
    symbol: string;
    decimalPlaces: number;
    symbolPosition: 'before' | 'after';
}
export declare const CURRENCIES: Record<string, CurrencyConfig>;
export declare function getCurrencyConfig(code: string): CurrencyConfig;
export declare function formatCurrency(amount: number | string, currencyCode?: string): string;
