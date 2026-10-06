import { describe, it, expect } from 'vitest';
import { CURRENCIES, formatCurrency } from '@invoice/core';

describe('Web Configuration & Helpers', () => {
  it('formats currency correctly for web preview displays', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatCurrency(5000, 'EUR')).toBe('5,000.00 €');
    expect(formatCurrency(9999, 'JPY')).toBe('¥9,999');
  });

  it('contains supported currency records', () => {
    expect(CURRENCIES.USD).toBeDefined();
    expect(CURRENCIES.GBP).toBeDefined();
    expect(CURRENCIES.CAD).toBeDefined();
  });
});
