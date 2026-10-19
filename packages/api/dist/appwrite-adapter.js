import { Query, ID, getAppwriteDatabases, getAppwriteStorage, getAppwriteConfig, isAppwriteConfigured, } from './appwrite';
import { computeEffectiveInvoiceStatus, PlanLimitReachedError, APP_CONFIG, } from '@invoice/core';
export class AppwriteAdapter {
    static getDatabaseId() {
        return getAppwriteConfig().databaseId;
    }
    static getBucketId() {
        return getAppwriteConfig().bucketId;
    }
    // -------------------------------------------------------------
    // Tenants & Workspaces
    // -------------------------------------------------------------
    static async getTenants(userId) {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            const queries = [Query.limit(100)];
            if (userId) {
                queries.push(Query.equal('ownerUserId', userId));
            }
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.tenants, queries);
            return res.documents.map((d) => JSON.parse(d.data));
        }
        catch (e) {
            console.warn('Appwrite listTenants error:', e);
            return null;
        }
    }
    static async getTenantById(tenantId) {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.tenants, [Query.equal('tenantId', tenantId), Query.limit(1)]);
            if (res.documents.length === 0)
                return null;
            return JSON.parse(res.documents[0].data);
        }
        catch (e) {
            console.warn('Appwrite getTenantById error:', e);
            return null;
        }
    }
    static async createTenant(tenant) {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            await db.createDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.tenants, ID.unique(), {
                tenantId: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                ownerUserId: tenant.ownerUserId || '',
                plan: tenant.plan || 'starter',
                isWhiteLabel: Boolean(tenant.isWhiteLabel),
                data: JSON.stringify(tenant),
            });
            return tenant;
        }
        catch (e) {
            console.error('Appwrite createTenant error:', e);
            return null;
        }
    }
    static async updateTenant(tenantId, patch) {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.tenants, [Query.equal('tenantId', tenantId), Query.limit(1)]);
            if (res.documents.length === 0)
                return null;
            const doc = res.documents[0];
            const current = JSON.parse(doc.data);
            const updated = { ...current, ...patch };
            await db.updateDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.tenants, doc.$id, {
                name: updated.name,
                slug: updated.slug,
                plan: updated.plan || 'starter',
                isWhiteLabel: Boolean(updated.isWhiteLabel),
                data: JSON.stringify(updated),
            });
            return updated;
        }
        catch (e) {
            console.error('Appwrite updateTenant error:', e);
            return null;
        }
    }
    // -------------------------------------------------------------
    // Parties (Customers & Vendors)
    // -------------------------------------------------------------
    static async getParties(tenantId) {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.parties, [Query.equal('tenantId', tenantId), Query.limit(500)]);
            return res.documents.map((d) => JSON.parse(d.data));
        }
        catch (e) {
            console.warn('Appwrite getParties error:', e);
            return null;
        }
    }
    static async saveParty(tenantId, party) {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            const scopedParty = { ...party, tenantId };
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.parties, [Query.equal('tenantId', tenantId), Query.equal('partyId', party.id), Query.limit(1)]);
            const payload = {
                tenantId,
                partyId: party.id,
                type: party.type || 'customer',
                name: party.name,
                email: party.email || '',
                phone: party.phone || '',
                taxId: party.taxId || '',
                isArchived: Boolean(party.isArchived),
                data: JSON.stringify(scopedParty),
            };
            if (res.documents.length > 0) {
                await db.updateDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.parties, res.documents[0].$id, payload);
            }
            else {
                await db.createDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.parties, ID.unique(), payload);
            }
            return scopedParty;
        }
        catch (e) {
            console.error('Appwrite saveParty error:', e);
            return null;
        }
    }
    static async deleteParty(tenantId, partyId) {
        if (!isAppwriteConfigured())
            return false;
        const db = getAppwriteDatabases();
        if (!db)
            return false;
        try {
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.parties, [Query.equal('tenantId', tenantId), Query.equal('partyId', partyId), Query.limit(1)]);
            if (res.documents.length > 0) {
                await db.deleteDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.parties, res.documents[0].$id);
                return true;
            }
            return false;
        }
        catch (e) {
            console.error('Appwrite deleteParty error:', e);
            return false;
        }
    }
    // -------------------------------------------------------------
    // Products & Inventory Catalog
    // -------------------------------------------------------------
    static async getProducts(tenantId) {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.products, [Query.equal('tenantId', tenantId), Query.limit(500)]);
            return res.documents.map((d) => JSON.parse(d.data));
        }
        catch (e) {
            console.warn('Appwrite getProducts error:', e);
            return null;
        }
    }
    static async saveProduct(tenantId, product) {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            const scopedProduct = { ...product, tenantId };
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.products, [Query.equal('tenantId', tenantId), Query.equal('productId', product.id), Query.limit(1)]);
            const payload = {
                tenantId,
                productId: product.id,
                name: product.name,
                sku: product.sku || '',
                barcode: product.barcode || '',
                category: product.category || '',
                unitPrice: Number(product.unitPrice) || 0,
                taxRate: Number(product.taxRate) || 0,
                stockQuantity: Number(product.stockQuantity) || 0,
                minStockThreshold: Number(product.minStockThreshold) || 0,
                isArchived: Boolean(product.isArchived),
                data: JSON.stringify(scopedProduct),
            };
            if (res.documents.length > 0) {
                await db.updateDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.products, res.documents[0].$id, payload);
            }
            else {
                await db.createDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.products, ID.unique(), payload);
            }
            return scopedProduct;
        }
        catch (e) {
            console.error('Appwrite saveProduct error:', e);
            return null;
        }
    }
    static async deleteProduct(tenantId, productId) {
        if (!isAppwriteConfigured())
            return false;
        const db = getAppwriteDatabases();
        if (!db)
            return false;
        try {
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.products, [Query.equal('tenantId', tenantId), Query.equal('productId', productId), Query.limit(1)]);
            if (res.documents.length > 0) {
                await db.deleteDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.products, res.documents[0].$id);
                return true;
            }
            return false;
        }
        catch (e) {
            console.error('Appwrite deleteProduct error:', e);
            return false;
        }
    }
    // -------------------------------------------------------------
    // Documents (Invoices, Estimates, Receipts, POs)
    // -------------------------------------------------------------
    static async getDocuments(tenantId) {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.documents, [Query.equal('tenantId', tenantId), Query.orderDesc('issueDate'), Query.limit(500)]);
            return res.documents.map((d) => {
                const doc = JSON.parse(d.data);
                return {
                    ...doc,
                    status: computeEffectiveInvoiceStatus(doc),
                };
            });
        }
        catch (e) {
            console.warn('Appwrite getDocuments error:', e);
            return null;
        }
    }
    static async saveDocument(tenantId, doc, tenantPlan = 'starter') {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            const scopedDoc = { ...doc, tenantId };
            // Enforce trial limit strictly on backend
            const existingList = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.documents, [Query.equal('tenantId', tenantId), Query.limit(100)]);
            const existingDoc = existingList.documents.find((d) => d.docId === doc.id);
            const isNew = !existingDoc;
            if (isNew && tenantPlan === 'starter') {
                const count = existingList.total;
                if (count >= APP_CONFIG.trialInvoiceLimit) {
                    throw new PlanLimitReachedError(`Free trial limit of ${APP_CONFIG.trialInvoiceLimit} invoices reached. Please upgrade to Pro for unlimited creation.`);
                }
            }
            const payload = {
                tenantId,
                docId: doc.id,
                documentNumber: doc.documentNumber || '',
                type: doc.type,
                status: doc.status,
                issueDate: doc.issueDate,
                dueDate: doc.dueDate || '',
                currency: doc.currency || 'INR',
                grandTotal: Number(doc.summary?.grandTotal) || 0,
                amountPaid: Number(doc.summary?.amountPaid) || 0,
                balanceDue: Number(doc.summary?.balanceDue) || 0,
                clientName: doc.client?.name || '',
                data: JSON.stringify(scopedDoc),
            };
            if (existingDoc) {
                await db.updateDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.documents, existingDoc.$id, payload);
            }
            else {
                await db.createDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.documents, ID.unique(), payload);
            }
            return scopedDoc;
        }
        catch (e) {
            if (e instanceof PlanLimitReachedError) {
                throw e;
            }
            console.error('Appwrite saveDocument error:', e);
            return null;
        }
    }
    static async deleteDocument(tenantId, docId) {
        if (!isAppwriteConfigured())
            return false;
        const db = getAppwriteDatabases();
        if (!db)
            return false;
        try {
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.documents, [Query.equal('tenantId', tenantId), Query.equal('docId', docId), Query.limit(1)]);
            if (res.documents.length > 0) {
                await db.deleteDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.documents, res.documents[0].$id);
                return true;
            }
            return false;
        }
        catch (e) {
            console.error('Appwrite deleteDocument error:', e);
            return false;
        }
    }
    // -------------------------------------------------------------
    // Brand Settings
    // -------------------------------------------------------------
    static async getBrandSettings(tenantId) {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.brandSettings, [Query.equal('tenantId', tenantId), Query.limit(1)]);
            if (res.documents.length === 0)
                return null;
            return JSON.parse(res.documents[0].data);
        }
        catch (e) {
            console.warn('Appwrite getBrandSettings error:', e);
            return null;
        }
    }
    static async saveBrandSettings(tenantId, settings) {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            const scopedSettings = { ...settings, tenantId };
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.brandSettings, [Query.equal('tenantId', tenantId), Query.limit(1)]);
            const payload = {
                tenantId,
                primaryColor: settings.primaryColor || '#1D4ED8',
                data: JSON.stringify(scopedSettings),
            };
            if (res.documents.length > 0) {
                await db.updateDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.brandSettings, res.documents[0].$id, payload);
            }
            else {
                await db.createDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.brandSettings, ID.unique(), payload);
            }
            return scopedSettings;
        }
        catch (e) {
            console.error('Appwrite saveBrandSettings error:', e);
            return null;
        }
    }
    // -------------------------------------------------------------
    // Appwrite Storage (Logos & Asset Uploads)
    // -------------------------------------------------------------
    static async uploadAsset(file) {
        if (!isAppwriteConfigured())
            return null;
        const storage = getAppwriteStorage();
        if (!storage)
            return null;
        try {
            const res = await storage.createFile(this.getBucketId(), ID.unique(), file);
            const url = storage.getFileView(this.getBucketId(), res.$id);
            return url.toString();
        }
        catch (e) {
            console.error('Appwrite uploadAsset error:', e);
            return null;
        }
    }
    // -------------------------------------------------------------
    // Audit Logs
    // -------------------------------------------------------------
    static async getAuditLogs(tenantId) {
        if (!isAppwriteConfigured())
            return null;
        const db = getAppwriteDatabases();
        if (!db)
            return null;
        try {
            const res = await db.listDocuments(this.getDatabaseId(), APP_CONFIG.appwrite.collections.auditLogs, [Query.equal('tenantId', tenantId), Query.orderDesc('timestamp'), Query.limit(100)]);
            return res.documents.map((d) => ({
                id: d.$id,
                actor: d.actor,
                action: d.action,
                description: d.details,
                timestamp: d.timestamp,
            }));
        }
        catch (e) {
            console.warn('Appwrite getAuditLogs error:', e);
            return null;
        }
    }
    static async recordAuditLog(tenantId, entry) {
        if (!isAppwriteConfigured())
            return;
        const db = getAppwriteDatabases();
        if (!db)
            return;
        try {
            await db.createDocument(this.getDatabaseId(), APP_CONFIG.appwrite.collections.auditLogs, ID.unique(), {
                tenantId,
                actor: entry.actor || 'System',
                action: entry.action || 'system_event',
                details: entry.description || '',
                timestamp: entry.timestamp || new Date().toISOString(),
            });
        }
        catch (e) {
            console.warn('Appwrite recordAuditLog error:', e);
        }
    }
}
