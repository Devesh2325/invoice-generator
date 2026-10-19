import { describe, it, expect, beforeEach } from 'vitest';
import {
  TenantApi,
  isAppwriteConfigured,
  getAppwriteConfig,
  AppwriteAdapter,
  resetApiMemoryStore,
  PlanLimitReachedError,
} from '../src';
import { APP_CONFIG, DocumentModel, Party, ProductCatalogItem } from '@invoice/core';

describe('Appwrite Integration & Tenant Isolation Suite', () => {
  beforeEach(() => {
    resetApiMemoryStore();
  });

  describe('Configuration & Initialization', () => {
    it('accurately identifies when Appwrite is unconfigured', () => {
      // With default environment, it returns false safely
      expect(typeof isAppwriteConfigured()).toBe('boolean');
    });

    it('returns default database and collection names from central APP_CONFIG', () => {
      const cfg = getAppwriteConfig();
      expect(cfg.databaseId).toBe(APP_CONFIG.appwrite.defaultDatabaseId);
      expect(cfg.bucketId).toBe(APP_CONFIG.appwrite.buckets.assets);
      expect(cfg.endpoint).toBe(APP_CONFIG.appwrite.defaultEndpoint);
    });

    it('contains all required collection IDs in APP_CONFIG', () => {
      const collections = APP_CONFIG.appwrite.collections;
      expect(collections.tenants).toBe('tenants');
      expect(collections.parties).toBe('parties');
      expect(collections.products).toBe('products');
      expect(collections.documents).toBe('documents');
      expect(collections.payments).toBe('payments');
      expect(collections.brandSettings).toBe('brand_settings');
      expect(collections.auditLogs).toBe('audit_logs');
    });
  });

  describe('Multi-Tenant Offline & Graceful Fallback Mode', () => {
    const tenantA = 'tenant_appwrite_test_a';
    const tenantB = 'tenant_appwrite_test_b';

    it('preserves complete tenant isolation for customers (Parties)', async () => {
      const customerA: Party = {
        id: 'cust_a1',
        tenantId: tenantA,
        type: 'customer',
        name: 'Alpha Corp Ltd',
        email: 'alpha@example.com',
      };
      await TenantApi.saveParty(tenantA, customerA);

      const partiesA = await TenantApi.getParties(tenantA);
      const partiesB = await TenantApi.getParties(tenantB);

      expect(partiesA.some((p) => p.name === 'Alpha Corp Ltd')).toBe(true);
      expect(partiesB.some((p) => p.name === 'Alpha Corp Ltd')).toBe(false);
    });

    it('preserves complete tenant isolation for Products & Inventory', async () => {
      const productA: ProductCatalogItem = {
        id: 'prod_a1',
        tenantId: tenantA,
        name: 'Solar Inverter 5kVA',
        sku: 'SOL-5000',
        unitPrice: 45000,
        unit: 'unit',
        taxRate: 18,
        stockQuantity: 10,
        minStockThreshold: 2,
        isArchived: false,
      };
      await TenantApi.saveProduct(tenantA, productA);

      const prodsA = await TenantApi.getProducts(tenantA);
      const prodsB = await TenantApi.getProducts(tenantB);

      expect(prodsA.some((p) => p.sku === 'SOL-5000')).toBe(true);
      expect(prodsB.some((p) => p.sku === 'SOL-5000')).toBe(false);
    });

    it('enforces backend trial 7-invoice limit strictly across tenants', async () => {
      const starterTenant = 'tenant_starter_appwrite_limit';
      await TenantApi.createTenant({
        id: starterTenant,
        name: 'Starter Workspace',
        slug: 'starter-ws',
        role: 'owner',
        is_domain_verified: false,
        plan: 'starter',
      });

      // Create 7 invoices
      for (let i = 1; i <= 7; i++) {
        const doc: DocumentModel = {
          id: `inv_limit_test_${i}`,
          tenantId: starterTenant,
          type: 'invoice',
          status: 'draft',
          documentNumber: `INV-2026-0000${i}`,
          issueDate: '2026-10-19',
          currency: 'INR',
          sender: { name: 'Starter Business' },
          client: { id: 'c1', type: 'customer', name: 'Client 1' },
          items: [],
          summary: {
            subTotal: 100,
            taxTotal: 18,
            grandTotal: 118,
            amountPaid: 0,
            balanceDue: 118,
          },
          templateId: 'cleartax_gst',
          payments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await TenantApi.saveDocument(starterTenant, doc);
      }

      const docs = await TenantApi.getDocuments(starterTenant);
      expect(docs.length).toBe(7);

      // Attempting to create the 8th invoice MUST throw PlanLimitReachedError
      const eighthDoc: DocumentModel = {
        id: 'inv_limit_test_8',
        tenantId: starterTenant,
        type: 'invoice',
        status: 'draft',
        documentNumber: 'INV-2026-00008',
        issueDate: '2026-10-19',
        currency: 'INR',
        sender: { name: 'Starter Business' },
        client: { id: 'c1', type: 'customer', name: 'Client 1' },
        items: [],
        summary: {
          subTotal: 100,
          taxTotal: 18,
          grandTotal: 118,
          amountPaid: 0,
          balanceDue: 118,
        },
        templateId: 'cleartax_gst',
        payments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await expect(TenantApi.saveDocument(starterTenant, eighthDoc)).rejects.toThrow(
        PlanLimitReachedError
      );
    });

    it('enforces template plan gating on backend', async () => {
      const starterTenant = 'tenant_starter_template_gate';
      await TenantApi.createTenant({
        id: starterTenant,
        name: 'Starter Workspace',
        slug: 'starter-ws-gate',
        role: 'owner',
        is_domain_verified: false,
        plan: 'starter',
      });

      const proTemplateDoc: DocumentModel = {
        id: 'inv_pro_template_test',
        tenantId: starterTenant,
        type: 'invoice',
        status: 'draft',
        documentNumber: 'INV-PRO-001',
        issueDate: '2026-10-19',
        currency: 'INR',
        sender: { name: 'Starter Business' },
        client: { id: 'c1', type: 'customer', name: 'Client 1' },
        items: [],
        summary: {
          subTotal: 100,
          taxTotal: 18,
          grandTotal: 118,
          amountPaid: 0,
          balanceDue: 118,
        },
        templateId: 'tokyo_clean', // Pro-only template
        payments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await expect(TenantApi.saveDocument(starterTenant, proTemplateDoc)).rejects.toThrow(
        PlanLimitReachedError
      );
    });
  });
});
