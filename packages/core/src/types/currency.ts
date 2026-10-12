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
