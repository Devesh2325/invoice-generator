import { describe, it, expect, beforeEach } from 'vitest';
import { TenantApi, resetApiMemoryStore, TenantAccessDeniedError } from '../src/index';
import { DocumentModel, Party } from '@invoice/core';

function createMockInvoice(id: string, tenantId: string, docNumber: string, clientName: string, amount = 1000): DocumentModel {
  return {
    id,
    tenantId,
    type: 'invoice',
    status: 'finalized',
    documentNumber: docNumber,
    issueDate: '2026-10-18',
    currency: 'INR',
    sender: {
      name: 'Test Business',
      email: 'billing@test.com',
    },
    client: {
      id: `party_${id}`,
      tenantId,
      type: 'customer',
      name: clientName,
      email: `${clientName.toLowerCase().replace(/\s+/g, '')}@client.com`,
    },
    items: [
      {
        id: `item_${id}`,
        description: 'Professional Services',
        quantity: 1,
        unitPrice: amount,
        taxRate: 18,
        discountValue: 0,
        discountType: 'fixed',
        taxInclusive: false,
        lineTotal: amount * 1.18,
        sortOrder: 0,
      },
    ],
    summary: {
      subtotal: amount,
      discountTotal: 0,
      taxableSubtotal: amount,
      taxBreakdown: { '18': amount * 0.18 },
      totalTax: amount * 0.18,
      grandTotal: amount * 1.18,
      amountPaid: 0,
      balanceDue: amount * 1.18,
    },
  };
}

describe('Multi-Tenant Access Control & Isolation Engine', () => {
  const tenantA = 'tenant_alpha_001';
  const tenantB = 'tenant_beta_002';
  const mainTenant = 'tenant_main_platform';

  beforeEach(() => {
    resetApiMemoryStore();
  });

  // a) Tenant A creates invoice/customer -> invisible to Tenant B and the main account
  it('a) Tenant A creates invoice and customer -> completely invisible to Tenant B and Main account', async () => {
    // Tenant A creates a customer and an invoice
    const customerA: Party = {
      id: 'cust_a_101',
      tenantId: tenantA,
      type: 'customer',
      name: 'Alpha Customer Ltd',
      email: 'contact@alphacustomer.com',
    };
    await TenantApi.saveParty(tenantA, customerA);

    const invoiceA = createMockInvoice('inv_a_101', tenantA, 'INV-A-001', 'Alpha Customer Ltd', 5000);
    await TenantApi.saveDocument(tenantA, invoiceA);

    // Verify Tenant A can see them
    const docsA = await TenantApi.getDocuments(tenantA);
    const partiesA = await TenantApi.getParties(tenantA);
    expect(docsA.some((d) => d.id === 'inv_a_101')).toBe(true);
    expect(partiesA.some((p) => p.id === 'cust_a_101')).toBe(true);

    // Verify Tenant B CANNOT see Tenant A's invoice or customer
    const docsB = await TenantApi.getDocuments(tenantB);
    const partiesB = await TenantApi.getParties(tenantB);
    expect(docsB.some((d) => d.id === 'inv_a_101')).toBe(false);
    expect(partiesB.some((p) => p.id === 'cust_a_101')).toBe(false);

    // Verify Main Account CANNOT see Tenant A's private data
    const docsMain = await TenantApi.getDocuments(mainTenant);
    const partiesMain = await TenantApi.getParties(mainTenant);
    expect(docsMain.some((d) => d.id === 'inv_a_101')).toBe(false);
    expect(partiesMain.some((p) => p.id === 'cust_a_101')).toBe(false);
  });

  // b) Tenant A admin cannot open Tenant B data by changing an ID in the URL or API (must return 403/404)
  it('b) Cross-tenant direct ID lookups are strictly blocked with 403/404', async () => {
    // Tenant B saves an invoice and customer
    const invoiceB = createMockInvoice('inv_b_secret', tenantB, 'INV-B-999', 'Beta VIP Client', 12000);
    await TenantApi.saveDocument(tenantB, invoiceB);

    const customerB: Party = {
      id: 'cust_b_secret',
      tenantId: tenantB,
      type: 'customer',
      name: 'Beta VIP Client',
    };
    await TenantApi.saveParty(tenantB, customerB);

    // 1. Tenant A attempts to fetch Tenant B's invoice by ID -> MUST throw 403 TenantAccessDeniedError
    await expect(TenantApi.getDocumentById(tenantA, 'inv_b_secret')).rejects.toThrow(
      TenantAccessDeniedError
    );

    // 2. Tenant A attempts to fetch Tenant B's customer by ID -> MUST throw 403 TenantAccessDeniedError
    await expect(TenantApi.getPartyById(tenantA, 'cust_b_secret')).rejects.toThrow(
      TenantAccessDeniedError
    );

    // 3. Requesting a non-existent ID returns null (404 Not Found)
    const nonExistentDoc = await TenantApi.getDocumentById(tenantA, 'inv_does_not_exist_xyz');
    expect(nonExistentDoc).toBeNull();

    const nonExistentParty = await TenantApi.getPartyById(tenantA, 'cust_does_not_exist_xyz');
    expect(nonExistentParty).toBeNull();
  });

  // c) Same email or customer name in two tenants stays fully separate
  it('c) Same customer name or email across two tenants stays strictly separated with independent ledgers', async () => {
    const sharedEmail = 'procurement@acme-conglomerate.com';
    const sharedName = 'Acme Conglomerate Global';

    // Tenant A registers Acme Conglomerate
    const partyA: Party = {
      id: 'cust_a_shared',
      tenantId: tenantA,
      type: 'customer',
      name: sharedName,
      email: sharedEmail,
      notes: 'Private terms for Tenant A',
    };
    await TenantApi.saveParty(tenantA, partyA);
    const invoiceA = createMockInvoice('inv_a_shared', tenantA, 'INV-A-100', sharedName, 25000);
    await TenantApi.saveDocument(tenantA, invoiceA);

    // Tenant B independently registers Acme Conglomerate with different terms and ID
    const partyB: Party = {
      id: 'cust_b_shared',
      tenantId: tenantB,
      type: 'customer',
      name: sharedName,
      email: sharedEmail,
      notes: 'Custom negotiated rate for Tenant B',
    };
    await TenantApi.saveParty(tenantB, partyB);
    const invoiceB = createMockInvoice('inv_b_shared', tenantB, 'INV-B-200', sharedName, 4000);
    await TenantApi.saveDocument(tenantB, invoiceB);

    // Verification
    const partiesInA = await TenantApi.getParties(tenantA);
    const partiesInB = await TenantApi.getParties(tenantB);

    expect(partiesInA.length).toBe(1);
    expect(partiesInA[0].id).toBe('cust_a_shared');
    expect(partiesInA[0].notes).toBe('Private terms for Tenant A');

    expect(partiesInB.length).toBe(1);
    expect(partiesInB[0].id).toBe('cust_b_shared');
    expect(partiesInB[0].notes).toBe('Custom negotiated rate for Tenant B');

    // Invoices remain separate
    const docsInA = await TenantApi.getDocuments(tenantA);
    const docsInB = await TenantApi.getDocuments(tenantB);
    expect(docsInA.map((d) => d.id)).toEqual(['inv_a_shared']);
    expect(docsInB.map((d) => d.id)).toEqual(['inv_b_shared']);
  });

  // d) Deleting or suspending a tenant affects only that tenant
  it('d) Deleting or suspending Tenant A purges only Tenant A data; Tenant B remains completely unaffected', async () => {
    // Populate data in both tenants
    await TenantApi.saveDocument(tenantA, createMockInvoice('inv_a_temp', tenantA, 'INV-A-TEMP', 'Client A'));
    await TenantApi.saveDocument(tenantB, createMockInvoice('inv_b_perm', tenantB, 'INV-B-PERM', 'Client B'));

    await TenantApi.saveParty(tenantA, { id: 'cust_a_temp', tenantId: tenantA, type: 'customer', name: 'Temp A' });
    await TenantApi.saveParty(tenantB, { id: 'cust_b_perm', tenantId: tenantB, type: 'customer', name: 'Permanent B' });

    // Delete Tenant A
    await TenantApi.deleteTenant(tenantA);

    // Tenant A is wiped
    const docsA = await TenantApi.getDocuments(tenantA);
    const partiesA = await TenantApi.getParties(tenantA);
    expect(docsA).toEqual([]);
    expect(partiesA).toEqual([]);

    // Tenant B is completely intact
    const docsB = await TenantApi.getDocuments(tenantB);
    const partiesB = await TenantApi.getParties(tenantB);
    expect(docsB.length).toBe(1);
    expect(docsB[0].id).toBe('inv_b_perm');
    expect(partiesB.length).toBe(1);
    expect(partiesB[0].id).toBe('cust_b_perm');
  });

  // e) Main account data never appears inside any white-label panel
  it('e) Main platform account invoices never leak into any white-label tenant workspace', async () => {
    const whiteLabelTenantId = 'tenant_whitelabel_corp';

    // Main platform creates an internal invoice
    const mainInvoice = createMockInvoice('inv_main_secret', mainTenant, 'INV-ROOT-001', 'Platform Subscriber', 50000);
    await TenantApi.saveDocument(mainTenant, mainInvoice);

    // White-label tenant checks their documents
    const whiteLabelDocs = await TenantApi.getDocuments(whiteLabelTenantId);
    expect(whiteLabelDocs.some((d) => d.id === 'inv_main_secret')).toBe(false);

    // Attempting direct access throws 403
    await expect(TenantApi.getDocumentById(whiteLabelTenantId, 'inv_main_secret')).rejects.toThrow(
      TenantAccessDeniedError
    );
  });

  // f) Exports, search, reports and dashboard counts are all tenant-scoped
  it('f) Dashboard metrics, search, and audit logs are strictly tenant-scoped', async () => {
    // Tenant A creates 2 invoices (5,000 + 3,000 = 8,000 billed)
    await TenantApi.saveDocument(tenantA, createMockInvoice('inv_a_1', tenantA, 'INV-A-1', 'Medical Supplies Inc', 5000));
    await TenantApi.saveDocument(tenantA, createMockInvoice('inv_a_2', tenantA, 'INV-A-2', 'Pharma Logistics', 3000));

    // Tenant B creates 1 invoice (50,000 billed)
    await TenantApi.saveDocument(tenantB, createMockInvoice('inv_b_1', tenantB, 'INV-B-1', 'Aerospace Engineering', 50000));

    // Metrics verification
    const metricsA = await TenantApi.getTenantMetrics(tenantA);
    const metricsB = await TenantApi.getTenantMetrics(tenantB);

    expect(metricsA.documentsCount).toBe(2);
    expect(metricsA.totalBilled).toBe(8000 * 1.18); // including 18% tax

    expect(metricsB.documentsCount).toBe(1);
    expect(metricsB.totalBilled).toBe(50000 * 1.18);

    // Search isolation verification
    const searchResultA = await TenantApi.searchTenantData(tenantA, 'Aerospace');
    expect(searchResultA.documents).toEqual([]); // Tenant B's data is not in Tenant A's search

    const searchResultB = await TenantApi.searchTenantData(tenantB, 'Aerospace');
    expect(searchResultB.documents.length).toBe(1);
    expect(searchResultB.documents[0].id).toBe('inv_b_1');

    // Audit log isolation verification
    const auditLogsA = await TenantApi.getAuditLogs(tenantA);
    expect(auditLogsA.every((log) => log.docNumber.startsWith('INV-A'))).toBe(true);
  });
});
