export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, symbolPosition: 'before' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, symbolPosition: 'after' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, symbolPosition: 'before' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimalPlaces: 2, symbolPosition: 'before' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'AU$', decimalPlaces: 2, symbolPosition: 'before' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, symbolPosition: 'before' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, symbolPosition: 'before' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, symbolPosition: 'before' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED ', decimalPlaces: 2, symbolPosition: 'before' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF ', decimalPlaces: 2, symbolPosition: 'before' },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD ', decimalPlaces: 3, symbolPosition: 'before' },
};

export function getCurrencyConfig(code: string): CurrencyConfig {
  return CURRENCIES[code.toUpperCase()] || {
    code: code.toUpperCase(),
    name: code.toUpperCase(),
    symbol: `${code.toUpperCase()} `,
    decimalPlaces: 2,
    symbolPosition: 'before',
  };
}

export function formatCurrency(amount: number | string, currencyCode: string = 'USD'): string {
  const config = getCurrencyConfig(currencyCode);
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${config.symbol}0.00`;

  const formattedNum = num.toLocaleString('en-US', {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  });

  return config.symbolPosition === 'before'
    ? `${config.symbol}${formattedNum}`
    : `${formattedNum} ${config.symbol}`;
}
