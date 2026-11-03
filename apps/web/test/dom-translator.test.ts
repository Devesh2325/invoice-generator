import { describe, expect, it } from 'vitest';
import { createPhraseTranslator } from '../src/lib/i18n/dom-translator';
import phrases from '../src/lib/i18n/locales/hi-phrases.json';

const translate = createPhraseTranslator({
  Save: 'सहेजें',
  'Invoice #': 'इनवॉइस #',
  'Invoice ## saved': 'इनवॉइस $1$2 सहेजा गया',
  'Invoice ## from #': '$3 से इनवॉइस $1$2',
  'Bill in # currencies': '$1 मुद्राएं',
});

describe('phrase translator', () => {
  it('keeps the spacing around a translated phrase', () => {
    expect(translate('  Save ')).toBe('  सहेजें ');
  });

  it('leaves anything it does not know in English', () => {
    expect(translate('Acme Ltd')).toBe('Acme Ltd');
    expect(translate('1,250.00')).toBe('1,250.00');
  });

  it('carries values through, even when Hindi changes their order', () => {
    expect(translate('Bill in 11 currencies')).toBe('11 मुद्राएं');
    expect(translate('Invoice #INV-7 saved')).toBe('इनवॉइस #INV-7 सहेजा गया');
    expect(translate('Invoice #INV-7 from Acme')).toBe('Acme से इनवॉइस #INV-7');
  });

  it('does not treat a key that only contains a hash as a pattern', () => {
    expect(translate('Invoice #')).toBe('इनवॉइस #');
    expect(translate('Invoice Summary')).toBe('Invoice Summary');
  });
});

describe('Hindi dictionary', () => {
  it('uses only values that its key provides', () => {
    for (const [key, value] of Object.entries(phrases as Record<string, string>)) {
      const slots = (key.match(/#/g) || []).length;
      for (const [, index] of value.matchAll(/\$(\d)/g)) {
        expect(Number(index), key).toBeLessThanOrEqual(slots);
      }
    }
  });
});
