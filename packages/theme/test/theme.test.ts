import { describe, it, expect } from 'vitest';
import { getTemplate, getTemplatesByCategory, TEMPLATES } from '../src/index';

describe('Document Theme & Templates', () => {
  it('loads all 17 registered templates across 5 categories', () => {
    const keys = Object.keys(TEMPLATES);
    expect(keys.length).toBe(17);
    expect(keys).toContain('modern');
    expect(keys).toContain('cleartax_gst');
    expect(keys).toContain('tally_prime');
    expect(keys).toContain('vyapar_classic');
    expect(keys).toContain('stripe_clean');
    expect(keys).toContain('zoho_standard');
    expect(keys).toContain('freshbooks_cloud');
    expect(keys).toContain('quickbooks_premier');
    expect(keys).toContain('canva_studio');
    expect(keys).toContain('agency_retainer');

    const grouped = getTemplatesByCategory();
    expect(grouped.length).toBe(5);
  });

  it('provides sensible fallback for unknown template ID', () => {
    const tmpl = getTemplate('non_existent_id');
    expect(tmpl.id).toBe('modern');
    expect(tmpl.defaultTokens.primaryColor).toBe('#3157D5');
  });
});
