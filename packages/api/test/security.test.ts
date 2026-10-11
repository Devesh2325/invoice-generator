import { describe, it, expect } from 'vitest';
import { TenantApi } from '../src/index';

describe('Multi-Tenant Access Control & Isolation', () => {
  it('retrieves isolated tenants for authenticated user', async () => {
    const tenants = await TenantApi.getTenants();
    expect(tenants.length).toBeGreaterThan(0);
    expect(tenants[0].name).toBe('Acme Design Agency');
  });

  it('retrieves only documents belonging to the specified tenant ID', async () => {
    const tenantId1 = 'a0000000-0000-0000-0000-000000000001';
    const tenantId2 = 'a0000000-0000-0000-0000-000000000002';

    const docs1 = await TenantApi.getDocuments(tenantId1);
    const docs2 = await TenantApi.getDocuments(tenantId2);

    expect(docs1.length).toBeGreaterThan(0);
    // Cross tenant isolation: tenant 2 should not see tenant 1 docs
    expect(docs2).toEqual([]);
  });

  it('isolates customer directory by tenant', async () => {
    const tenantId1 = 'a0000000-0000-0000-0000-000000000001';
    const tenantId2 = 'a0000000-0000-0000-0000-000000000002';

    const parties1 = await TenantApi.getParties(tenantId1);
    const parties2 = await TenantApi.getParties(tenantId2);

    expect(parties1.some((p) => p.name === 'Reliance Retail Ventures Ltd')).toBe(true);
    expect(parties2.some((p) => p.name === 'Reliance Retail Ventures Ltd')).toBe(false);
    expect(parties2.some((p) => p.name === 'Vandelay Industries')).toBe(true);
  });
});
