import { describe, it, expect } from 'vitest';
import { getTemplate, TEMPLATES } from '../src/index';

describe('Document Theme & Templates', () => {
  it('loads all 8 registered templates', () => {
    const keys = Object.keys(TEMPLATES);
    expect(keys.length).toBe(8);
    expect(keys).toContain('modern');
    expect(keys).toContain('minimal');
    expect(keys).toContain('professional');
    expect(keys).toContain('classic');
    expect(keys).toContain('corporate');
    expect(keys).toContain('service_business');
    expect(keys).toContain('consulting');
    expect(keys).toContain('retail');
  });

  it('provides sensible fallback for unknown template ID', () => {
    const tmpl = getTemplate('non_existent_id');
    expect(tmpl.id).toBe('modern');
    expect(tmpl.defaultTokens.primaryColor).toBe('#3157D5');
  });
});
