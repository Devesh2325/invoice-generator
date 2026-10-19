import { createClient } from '@supabase/supabase-js';
import { computeEffectiveInvoiceStatus, TenantAccessDeniedError, PlanLimitReachedError, APP_CONFIG, isTemplateAllowedForPlan, } from '@invoice/core';
export { TenantAccessDeniedError, PlanLimitReachedError, APP_CONFIG, isTemplateAllowedForPlan };
import { AppwriteAdapter } from './appwrite-adapter';
import { isAppwriteConfigured, getAppwriteConfig, getAppwriteClient, getAppwriteDatabases, getAppwriteStorage, getAppwriteAccount, } from './appwrite';
export { AppwriteAdapter, isAppwriteConfigured, getAppwriteConfig, getAppwriteClient, getAppwriteDatabases, getAppwriteStorage, getAppwriteAccount, };
export * from './types/appwrite-schema';
// 1. Client initialization
let supabaseClient = null;
export function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey || url === 'https://your-project.supabase.co') {
        return null;
    }
    if (!supabaseClient) {
        supabaseClient = createClient(url, anonKey);
    }
    return supabaseClient;
}
// Universal storage persistence (browser localStorage + memory fallback for test/SSR)
const memoryStore = {};
export function resetApiMemoryStore() {
    for (const k in memoryStore) {
        delete memoryStore[k];
    }
}
function getLocalStore(key, fallback) {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallback));
        }
        catch {
            return JSON.parse(JSON.stringify(fallback));
        }
    }
    if (memoryStore[key] !== undefined) {
        try {
            return JSON.parse(memoryStore[key]);
        }
        catch {
            return JSON.parse(JSON.stringify(fallback));
        }
    }
    return JSON.parse(JSON.stringify(fallback));
}
function setLocalStore(key, value) {
    const serialized = JSON.stringify(value);
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem(key, serialized);
        }
        catch (e) {
            console.error('localStorage write error:', e);
        }
    }
    memoryStore[key] = serialized;
}
const DEFAULT_DEMO_BANK_ACCOUNT = {
    id: 'bank_demo_01',
    accountHolderName: 'Acme Design Agency Pvt Ltd',
    bankName: 'Demo Bank',
    accountNumber: '0000000000',
    confirmAccountNumber: '0000000000',
    ifscOrRoutingCode: 'DEMO0000000',
    branchName: 'Main Branch',
    accountType: 'current',
    swiftBicCode: 'DEMOBANK',
    country: 'India',
    isPrimary: true,
};
const DEFAULT_DEMO_PAYMENT_CONFIG = {
    bankAccounts: [DEFAULT_DEMO_BANK_ACCOUNT],
    selectedBankAccountIds: ['bank_demo_01'],
    upiId: 'billing@example.com',
    upiPayeeName: 'Acme Design Agency Pvt Ltd',
    autoGenerateUpiQr: true,
    display: {
        showBankDetails: true,
        showUpiId: true,
        showQrCode: true,
        showPaymentInstructions: true,
        showPaymentTerms: true,
    },
};
// 2. Collections start empty - populating strictly as real users and tenants create data
const DEMO_TENANTS = [];
const DEMO_PARTIES = {};
const DEMO_PRODUCTS = {};
const DEMO_DOCUMENTS = {};
const DEMO_BRAND_SETTINGS = {
    'a0000000-0000-0000-0000-000000000001': {
        tenantId: 'a0000000-0000-0000-0000-000000000001',
        businessName: 'Acme Design Agency Pvt Ltd',
        email: 'billing@acmedesign.io',
        phone: '+91 22 4001 9200',
        currency: 'INR',
        locale: 'en-IN',
        decimalPrecision: 2,
        country: 'India',
        gstState: '27 - Maharashtra',
        taxId: '27AABCU9603R1ZM',
        street: 'Level 8, One BKC, Bandra Kurla Complex',
        city: 'Mumbai',
        postalCode: '400051',
        invoicePrefix: 'INV',
        nextInvoiceNumber: 102,
        defaultDueDays: 15,
        defaultTaxRate: 18,
        enableRoundOff: true,
        roundingMode: 'nearest_integer',
        primaryColor: '#3157D5',
        secondaryColor: '#0F172A',
        fontFamily: 'sans',
        defaultTemplateId: 'cleartax_gst',
        defaultTerms: 'Payment due within 15 days. Subject to Mumbai Jurisdiction.',
        defaultInstructions: 'NEFT / RTGS / UPI accepted. Please mention Invoice No. in transfer reference.',
        footerText: 'Thank you for your business!',
        signatoryName: 'Authorized Director',
        paymentConfig: DEFAULT_DEMO_PAYMENT_CONFIG,
    },
};
// 3. Typed Data Access Service (Strictly User & Tenant Isolated)
export const TenantApi = {
    async getTenants(userId) {
        if (isAppwriteConfigured()) {
            const appwriteTenants = await AppwriteAdapter.getTenants(userId);
            if (appwriteTenants && appwriteTenants.length > 0) {
                return appwriteTenants;
            }
        }
        const supabase = getSupabase();
        if (!supabase) {
            const customTenants = getLocalStore('billcraft_custom_tenants', []);
            const demoOverrides = getLocalStore('billcraft_demo_tenant_overrides', {});
            const mergedDemo = DEMO_TENANTS.map((dt) => ({
                ...dt,
                ...(demoOverrides[dt.id] || {}),
            }));
            const all = [...customTenants, ...mergedDemo];
            if (userId) {
                let currentUserEmail = '';
                if (typeof window !== 'undefined') {
                    try {
                        const uRaw = window.localStorage.getItem('billcraft_current_user');
                        if (uRaw) {
                            const u = JSON.parse(uRaw);
                            currentUserEmail = u?.email?.toLowerCase() || '';
                        }
                    }
                    catch { }
                }
                const userTenants = all.filter((t) => t.ownerUserId === userId ||
                    (currentUserEmail && t.ownerUserId?.toLowerCase() === currentUserEmail));
                if (userTenants.length > 0)
                    return userTenants;
            }
            return all.length > 0 ? all : mergedDemo;
        }
        const { data, error } = await supabase
            .from('tenant_members')
            .select('role, tenants(*)');
        if (error || !data)
            return DEMO_TENANTS;
        return data.map((item) => ({
            ...item.tenants,
            role: item.role,
        }));
    },
    async createTenant(tenant) {
        if (isAppwriteConfigured()) {
            await AppwriteAdapter.createTenant(tenant);
        }
        const customTenants = getLocalStore('billcraft_custom_tenants', []);
        const updated = [tenant, ...customTenants.filter((t) => t.id !== tenant.id)];
        setLocalStore('billcraft_custom_tenants', updated);
        return tenant;
    },
    async updateTenant(tenantId, patch) {
        if (isAppwriteConfigured()) {
            await AppwriteAdapter.updateTenant(tenantId, patch);
        }
        const customTenants = getLocalStore('billcraft_custom_tenants', []);
        const idx = customTenants.findIndex((t) => t.id === tenantId);
        if (idx >= 0) {
            customTenants[idx] = { ...customTenants[idx], ...patch };
            setLocalStore('billcraft_custom_tenants', customTenants);
            return customTenants[idx];
        }
        // Also allow updating demo tenants in local overrides
        const demoTarget = DEMO_TENANTS.find((d) => d.id === tenantId);
        if (demoTarget) {
            const demoOverrides = getLocalStore('billcraft_demo_tenant_overrides', {});
            demoOverrides[tenantId] = { ...(demoOverrides[tenantId] || {}), ...patch };
            setLocalStore('billcraft_demo_tenant_overrides', demoOverrides);
            return { ...demoTarget, ...demoOverrides[tenantId] };
        }
        return null;
    },
    async getTenantById(tenantId) {
        if (isAppwriteConfigured()) {
            const tenant = await AppwriteAdapter.getTenantById(tenantId);
            if (tenant)
                return tenant;
        }
        const tenants = await this.getTenants();
        return tenants.find((t) => t.id === tenantId) || null;
    },
    async getTenantUsage(tenantId) {
        const tenant = await this.getTenantById(tenantId);
        const plan = tenant?.plan || 'starter';
        const docs = await this.getDocuments(tenantId);
        const invoiceCount = docs.length;
        const limit = plan === 'pro' || plan === 'enterprise' ? Infinity : APP_CONFIG.trialInvoiceLimit;
        const isLimitReached = invoiceCount >= limit;
        const remaining = limit === Infinity ? Infinity : Math.max(0, limit - invoiceCount);
        const warningThresholdHit = APP_CONFIG.trialWarningThresholds.includes(invoiceCount);
        return {
            plan,
            invoiceCount,
            invoiceLimit: limit,
            isLimitReached,
            remaining,
            warningThresholdHit,
        };
    },
    async getDocuments(tenantId) {
        if (isAppwriteConfigured()) {
            const appwriteDocs = await AppwriteAdapter.getDocuments(tenantId);
            if (appwriteDocs !== null) {
                return appwriteDocs;
            }
        }
        const supabase = getSupabase();
        if (!supabase) {
            const storeDocs = getLocalStore('billcraft_tenant_documents', DEMO_DOCUMENTS);
            const list = storeDocs[tenantId] || [];
            return list.map((doc) => ({
                ...doc,
                status: computeEffectiveInvoiceStatus(doc),
            }));
        }
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });
        if (error || !data)
            return DEMO_DOCUMENTS[tenantId] || [];
        return data;
    },
    async getDocumentById(tenantId, docId) {
        if (isAppwriteConfigured()) {
            const appwriteDocs = await AppwriteAdapter.getDocuments(tenantId);
            if (appwriteDocs !== null) {
                const matched = appwriteDocs.find((d) => d.id === docId);
                if (matched)
                    return matched;
            }
        }
        const supabase = getSupabase();
        if (supabase) {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('id', docId)
                .single();
            if (error || !data)
                return null;
            if (data.tenant_id !== tenantId) {
                throw new TenantAccessDeniedError(`Access Denied (403): Document ${docId} belongs to another workspace.`);
            }
            return data;
        }
        const storeDocs = getLocalStore('billcraft_tenant_documents', DEMO_DOCUMENTS);
        const tenantDocs = storeDocs[tenantId] || [];
        const matched = tenantDocs.find((d) => d.id === docId);
        if (matched) {
            return {
                ...matched,
                status: computeEffectiveInvoiceStatus(matched),
            };
        }
        // Cross-tenant tamper detection: If the document exists in any other tenant, block access
        for (const [otherTenantId, otherDocs] of Object.entries(storeDocs)) {
            if (otherTenantId !== tenantId) {
                const crossMatch = otherDocs.find((d) => d.id === docId);
                if (crossMatch) {
                    throw new TenantAccessDeniedError(`Access Denied (403): Document ${docId} belongs to another workspace.`);
                }
            }
        }
        return null;
    },
    async deleteDocument(tenantId, docId) {
        if (isAppwriteConfigured()) {
            await AppwriteAdapter.deleteDocument(tenantId, docId);
        }
        const supabase = getSupabase();
        if (supabase) {
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', docId)
                .eq('tenant_id', tenantId);
            return !error;
        }
        const storeDocs = getLocalStore('billcraft_tenant_documents', DEMO_DOCUMENTS);
        if (!storeDocs[tenantId])
            return false;
        const initialLen = storeDocs[tenantId].length;
        storeDocs[tenantId] = storeDocs[tenantId].filter((d) => d.id !== docId);
        setLocalStore('billcraft_tenant_documents', storeDocs);
        return storeDocs[tenantId].length < initialLen;
    },
    async saveDocument(tenantId, doc) {
        const tenant = await this.getTenantById(tenantId);
        const tenantPlan = tenant?.plan || 'starter';
        // 1. Template gating enforcement on backend
        if (doc.templateId && !isTemplateAllowedForPlan(tenantPlan, doc.templateId)) {
            throw new PlanLimitReachedError(`Template "${doc.templateId}" is a Pro/Enterprise feature. Please upgrade your plan to unlock premium templates.`);
        }
        // 2. Free trial 7-invoice creation limit enforcement on backend
        const planConfig = APP_CONFIG.plans[tenantPlan];
        const invoiceLimit = planConfig ? planConfig.invoiceLimit : APP_CONFIG.trialInvoiceLimit;
        if (invoiceLimit !== Infinity) {
            const existingDocs = await this.getDocuments(tenantId);
            const isNew = !existingDocs.some((d) => d.id === doc.id);
            if (isNew && existingDocs.length >= invoiceLimit) {
                throw new PlanLimitReachedError(`Free trial limit reached: ${invoiceLimit}/${invoiceLimit} invoices created. Upgrade to Pro for unlimited invoices.`, invoiceLimit, existingDocs.length);
            }
        }
        const effectiveStatus = computeEffectiveInvoiceStatus(doc);
        const enrichedDoc = {
            ...doc,
            tenantId,
            status: effectiveStatus,
            updatedAt: new Date().toISOString(),
        };
        if (isAppwriteConfigured()) {
            await AppwriteAdapter.saveDocument(tenantId, enrichedDoc, tenantPlan);
        }
        const supabase = getSupabase();
        if (!supabase) {
            const storeDocs = getLocalStore('billcraft_tenant_documents', DEMO_DOCUMENTS);
            if (!storeDocs[tenantId])
                storeDocs[tenantId] = [];
            const idx = storeDocs[tenantId].findIndex((d) => d.id === enrichedDoc.id);
            if (idx >= 0) {
                storeDocs[tenantId][idx] = enrichedDoc;
            }
            else {
                storeDocs[tenantId].unshift(enrichedDoc);
            }
            setLocalStore('billcraft_tenant_documents', storeDocs);
            // Auto-deduct inventory stock for finalized/paid invoices
            if (enrichedDoc.status === 'finalized' || enrichedDoc.status === 'paid') {
                try {
                    await this.deductStockForInvoice(tenantId, enrichedDoc);
                }
                catch { }
            }
            return enrichedDoc;
        }
        const { error } = await supabase
            .from('documents')
            .upsert({
            id: enrichedDoc.id,
            tenant_id: tenantId,
            type: enrichedDoc.type,
            status: enrichedDoc.status,
            document_number: enrichedDoc.documentNumber,
            reference_number: enrichedDoc.referenceNumber,
            issue_date: enrichedDoc.issueDate,
            due_date: enrichedDoc.dueDate,
            currency: enrichedDoc.currency,
            client_snapshot: enrichedDoc.client,
            sender_snapshot: enrichedDoc.sender,
            summary: enrichedDoc.summary,
            template_id: enrichedDoc.templateId,
            notes: enrichedDoc.notes,
            payment_terms: enrichedDoc.paymentTerms,
            payment_instructions: enrichedDoc.paymentInstructions,
        })
            .select()
            .single();
        if (error)
            throw error;
        return enrichedDoc;
    },
    async updateDocumentStatus(tenantId, docId, newStatus) {
        const storeDocs = getLocalStore('billcraft_tenant_documents', DEMO_DOCUMENTS);
        const docs = storeDocs[tenantId] || [];
        const doc = docs.find((d) => d.id === docId);
        if (!doc)
            return null;
        doc.status = newStatus;
        doc.updatedAt = new Date().toISOString();
        if (!doc.auditHistory)
            doc.auditHistory = [];
        doc.auditHistory.unshift({
            id: `aud_${Date.now()}`,
            action: 'STATUS_UPDATED',
            description: `Invoice status updated to ${newStatus.toUpperCase()}`,
            timestamp: doc.updatedAt,
        });
        setLocalStore('billcraft_tenant_documents', storeDocs);
        return doc;
    },
    async getParties(tenantId) {
        if (isAppwriteConfigured()) {
            const appwriteParties = await AppwriteAdapter.getParties(tenantId);
            if (appwriteParties !== null) {
                return appwriteParties;
            }
        }
        const supabase = getSupabase();
        if (!supabase) {
            const storeParties = getLocalStore('billcraft_tenant_parties', DEMO_PARTIES);
            return storeParties[tenantId] || [];
        }
        const { data, error } = await supabase
            .from('parties')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_archived', false);
        if (error || !data)
            return DEMO_PARTIES[tenantId] || [];
        return data;
    },
    async getPartyById(tenantId, partyId) {
        if (isAppwriteConfigured()) {
            const appwriteParties = await AppwriteAdapter.getParties(tenantId);
            if (appwriteParties !== null) {
                const found = appwriteParties.find((p) => p.id === partyId);
                if (found)
                    return found;
            }
        }
        const supabase = getSupabase();
        if (supabase) {
            const { data, error } = await supabase
                .from('parties')
                .select('*')
                .eq('id', partyId)
                .single();
            if (error || !data)
                return null;
            if (data.tenant_id !== tenantId) {
                throw new TenantAccessDeniedError(`Access Denied (403): Customer ${partyId} belongs to another workspace.`);
            }
            return data;
        }
        const storeParties = getLocalStore('billcraft_tenant_parties', DEMO_PARTIES);
        const tenantParties = storeParties[tenantId] || [];
        const matched = tenantParties.find((p) => p.id === partyId);
        if (matched)
            return matched;
        for (const [otherTenantId, otherParties] of Object.entries(storeParties)) {
            if (otherTenantId !== tenantId) {
                const cross = otherParties.find((p) => p.id === partyId);
                if (cross) {
                    throw new TenantAccessDeniedError(`Access Denied (403): Customer ${partyId} belongs to another workspace.`);
                }
            }
        }
        return null;
    },
    async deleteParty(tenantId, partyId) {
        if (isAppwriteConfigured()) {
            await AppwriteAdapter.deleteParty(tenantId, partyId);
        }
        const supabase = getSupabase();
        if (supabase) {
            const { error } = await supabase
                .from('parties')
                .delete()
                .eq('id', partyId)
                .eq('tenant_id', tenantId);
            return !error;
        }
        const storeParties = getLocalStore('billcraft_tenant_parties', DEMO_PARTIES);
        if (!storeParties[tenantId])
            return false;
        const initialLen = storeParties[tenantId].length;
        storeParties[tenantId] = storeParties[tenantId].filter((p) => p.id !== partyId);
        setLocalStore('billcraft_tenant_parties', storeParties);
        return storeParties[tenantId].length < initialLen;
    },
    async saveParty(tenantId, party) {
        const enrichedParty = {
            ...party,
            tenantId,
            updatedAt: new Date().toISOString(),
        };
        if (isAppwriteConfigured()) {
            await AppwriteAdapter.saveParty(tenantId, enrichedParty);
        }
        const storeParties = getLocalStore('billcraft_tenant_parties', DEMO_PARTIES);
        if (!storeParties[tenantId])
            storeParties[tenantId] = [];
        const idx = storeParties[tenantId].findIndex((p) => p.id === enrichedParty.id);
        if (idx >= 0) {
            storeParties[tenantId][idx] = enrichedParty;
        }
        else {
            storeParties[tenantId].push(enrichedParty);
        }
        setLocalStore('billcraft_tenant_parties', storeParties);
        return enrichedParty;
    },
    async importPartiesBatch(tenantId, incomingParties, duplicateStrategy = 'skip') {
        const storeParties = getLocalStore('billcraft_tenant_parties', DEMO_PARTIES);
        if (!storeParties[tenantId])
            storeParties[tenantId] = [];
        const existing = storeParties[tenantId];
        let importedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        for (const candidate of incomingParties) {
            const matchIdx = existing.findIndex((e) => (candidate.email &&
                e.email &&
                e.email.toLowerCase() === candidate.email.toLowerCase()) ||
                (candidate.taxId &&
                    e.taxId &&
                    e.taxId.toUpperCase() === candidate.taxId.toUpperCase()) ||
                e.name.trim().toLowerCase() === candidate.name.trim().toLowerCase());
            if (matchIdx >= 0) {
                if (duplicateStrategy === 'skip') {
                    skippedCount++;
                    continue;
                }
                else if (duplicateStrategy === 'update') {
                    existing[matchIdx] = {
                        ...existing[matchIdx],
                        ...candidate,
                        id: existing[matchIdx].id,
                        updatedAt: new Date().toISOString(),
                    };
                    updatedCount++;
                    continue;
                }
            }
            existing.push({
                ...candidate,
                id: candidate.id || `party_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                createdAt: new Date().toISOString(),
            });
            importedCount++;
        }
        setLocalStore('billcraft_tenant_parties', storeParties);
        return { importedCount, updatedCount, skippedCount };
    },
    async getProducts(tenantId) {
        if (isAppwriteConfigured()) {
            const appwriteProducts = await AppwriteAdapter.getProducts(tenantId);
            if (appwriteProducts !== null) {
                return appwriteProducts;
            }
        }
        const storeProducts = getLocalStore('billcraft_tenant_products', DEMO_PRODUCTS);
        return storeProducts[tenantId] || [];
    },
    async getProductById(tenantId, productId) {
        if (isAppwriteConfigured()) {
            const appwriteProducts = await AppwriteAdapter.getProducts(tenantId);
            if (appwriteProducts !== null) {
                const matched = appwriteProducts.find((p) => p.id === productId);
                if (matched)
                    return matched;
            }
        }
        const storeProducts = getLocalStore('billcraft_tenant_products', DEMO_PRODUCTS);
        const tenantProducts = storeProducts[tenantId] || [];
        const matched = tenantProducts.find((p) => p.id === productId);
        if (matched)
            return matched;
        for (const [otherTenantId, otherProds] of Object.entries(storeProducts)) {
            if (otherTenantId !== tenantId) {
                const cross = otherProds.find((p) => p.id === productId);
                if (cross) {
                    throw new TenantAccessDeniedError(`Access Denied (403): Product ${productId} belongs to another workspace.`);
                }
            }
        }
        return null;
    },
    async deleteProduct(tenantId, productId) {
        if (isAppwriteConfigured()) {
            await AppwriteAdapter.deleteProduct(tenantId, productId);
        }
        const storeProducts = getLocalStore('billcraft_tenant_products', DEMO_PRODUCTS);
        if (!storeProducts[tenantId])
            return false;
        const initialLen = storeProducts[tenantId].length;
        storeProducts[tenantId] = storeProducts[tenantId].filter((p) => p.id !== productId);
        setLocalStore('billcraft_tenant_products', storeProducts);
        return storeProducts[tenantId].length < initialLen;
    },
    async saveProduct(tenantId, product) {
        const enrichedProduct = {
            ...product,
            tenantId,
            stockQuantity: typeof product.stockQuantity === 'number' ? product.stockQuantity : 0,
            minStockThreshold: typeof product.minStockThreshold === 'number' ? product.minStockThreshold : 5,
            updatedAt: new Date().toISOString(),
        };
        if (isAppwriteConfigured()) {
            await AppwriteAdapter.saveProduct(tenantId, enrichedProduct);
        }
        const storeProducts = getLocalStore('billcraft_tenant_products', DEMO_PRODUCTS);
        if (!storeProducts[tenantId])
            storeProducts[tenantId] = [];
        const idx = storeProducts[tenantId].findIndex((p) => p.id === enrichedProduct.id);
        if (idx >= 0) {
            storeProducts[tenantId][idx] = enrichedProduct;
        }
        else {
            storeProducts[tenantId].push(enrichedProduct);
        }
        setLocalStore('billcraft_tenant_products', storeProducts);
        return enrichedProduct;
    },
    async recordStockMovement(tenantId, productId, movement) {
        const product = await this.getProductById(tenantId, productId);
        if (!product)
            return null;
        const previousStock = Number(product.stockQuantity) || 0;
        const qty = Number(movement.quantity) || 0;
        let newStock = previousStock;
        if (movement.type === 'in') {
            newStock = previousStock + qty;
        }
        else if (movement.type === 'out' || movement.type === 'invoice_deduction') {
            newStock = Math.max(0, previousStock - qty);
        }
        else if (movement.type === 'adjustment') {
            newStock = qty;
        }
        const entry = {
            id: `sm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            productId,
            tenantId,
            type: movement.type,
            quantity: qty,
            previousStock,
            newStock,
            reference: movement.reference,
            reason: movement.reason,
            timestamp: new Date().toISOString(),
        };
        const updatedProduct = {
            ...product,
            stockQuantity: newStock,
            stockMovements: [entry, ...(product.stockMovements || [])].slice(0, 50),
            updatedAt: new Date().toISOString(),
        };
        await this.saveProduct(tenantId, updatedProduct);
        return entry;
    },
    async deductStockForInvoice(tenantId, doc) {
        if (!doc.items || !Array.isArray(doc.items))
            return;
        const allProducts = await this.getProducts(tenantId);
        if (allProducts.length === 0)
            return;
        for (const item of doc.items) {
            const match = allProducts.find((p) => p.id === item.productId) ||
                allProducts.find((p) => item.hsnCode && p.sku && p.sku.toLowerCase() === item.hsnCode.toLowerCase()) ||
                allProducts.find((p) => item.description && p.name.toLowerCase() === item.description.trim().toLowerCase());
            if (match) {
                const qty = Number(item.quantity) || 1;
                await this.recordStockMovement(tenantId, match.id, {
                    type: 'invoice_deduction',
                    quantity: qty,
                    reference: `Invoice #${doc.documentNumber}`,
                    reason: `Auto-deducted for ${doc.client?.name || 'Customer'}`,
                });
            }
        }
    },
    async getLowStockProducts(tenantId) {
        const products = await this.getProducts(tenantId);
        return products.filter((p) => !p.isArchived && (Number(p.stockQuantity) || 0) <= (Number(p.minStockThreshold) || 5));
    },
    async getBrandSettings(tenantId) {
        if (isAppwriteConfigured()) {
            const appwriteSettings = await AppwriteAdapter.getBrandSettings(tenantId);
            if (appwriteSettings)
                return appwriteSettings;
        }
        const storeBrand = getLocalStore('billcraft_tenant_brand', DEMO_BRAND_SETTINGS);
        const customTenants = getLocalStore('billcraft_custom_tenants', []);
        const demoOverrides = getLocalStore('billcraft_demo_tenant_overrides', {});
        const tenantObj = customTenants.find((t) => t.id === tenantId) ||
            DEMO_TENANTS.map((d) => ({ ...d, ...(demoOverrides[d.id] || {}) })).find((t) => t.id === tenantId);
        const existing = storeBrand[tenantId];
        const defaultBank = {
            id: `bank_${tenantId.slice(0, 8)}`,
            accountHolderName: existing?.businessName || tenantObj?.name || 'Business Account',
            bankName: 'HDFC Bank Ltd',
            accountNumber: '50200049182731',
            confirmAccountNumber: '50200049182731',
            ifscOrRoutingCode: 'HDFC0000124',
            branchName: tenantObj?.city || 'Main Branch',
            accountType: 'current',
            country: tenantObj?.country || 'India',
            isPrimary: true,
        };
        const fallbackPaymentConfig = {
            bankAccounts: [defaultBank],
            selectedBankAccountIds: [defaultBank.id],
            upiId: '',
            upiPayeeName: existing?.businessName || tenantObj?.name || '',
            autoGenerateUpiQr: true,
            display: {
                showBankDetails: true,
                showUpiId: true,
                showQrCode: false,
                showPaymentInstructions: true,
                showPaymentTerms: true,
            },
        };
        const defaults = {
            tenantId,
            businessName: tenantObj?.name || 'Workspace Business',
            email: tenantObj?.email || '',
            phone: tenantObj?.phone || '',
            currency: tenantObj?.currency || 'INR',
            locale: tenantObj?.locale || (tenantObj?.currency === 'USD' ? 'en-US' : 'en-IN'),
            decimalPrecision: 2,
            country: tenantObj?.country || 'India',
            gstState: tenantObj?.gstState || '27 - Maharashtra',
            taxId: tenantObj?.taxId || '',
            street: tenantObj?.street || '',
            city: tenantObj?.city || '',
            postalCode: tenantObj?.postalCode || '',
            invoicePrefix: tenantObj?.invoicePrefix || 'INV',
            nextInvoiceNumber: 1,
            defaultDueDays: 15,
            defaultTaxRate: 18,
            enableRoundOff: false,
            roundingMode: 'nearest_integer',
            primaryColor: '#3157D5',
            secondaryColor: '#0F172A',
            fontFamily: 'sans',
            defaultTemplateId: 'cleartax_gst',
            defaultTerms: 'Net 15 Days',
            defaultInstructions: 'NEFT / RTGS / IMPS / UPI accepted.',
            footerText: 'Thank you for your business!',
            signatoryName: 'Authorized Signatory',
            paymentConfig: fallbackPaymentConfig,
        };
        return {
            ...defaults,
            ...(existing || {}),
            tenantId,
            paymentConfig: existing?.paymentConfig || fallbackPaymentConfig,
        };
    },
    async updateBrandSettings(tenantId, settings) {
        const storeBrand = getLocalStore('billcraft_tenant_brand', DEMO_BRAND_SETTINGS);
        const existing = await this.getBrandSettings(tenantId);
        const updated = {
            ...existing,
            ...settings,
            paymentConfig: settings.paymentConfig
                ? {
                    ...existing.paymentConfig,
                    ...settings.paymentConfig,
                    display: {
                        ...(existing.paymentConfig?.display || {
                            showBankDetails: true,
                            showUpiId: true,
                            showQrCode: false,
                            showPaymentInstructions: true,
                            showPaymentTerms: true,
                        }),
                        ...(settings.paymentConfig.display || {}),
                    },
                }
                : existing.paymentConfig,
        };
        storeBrand[tenantId] = updated;
        setLocalStore('billcraft_tenant_brand', storeBrand);
        if (isAppwriteConfigured()) {
            await AppwriteAdapter.saveBrandSettings(tenantId, updated);
        }
        // Sync core company/currency fields onto the tenant object as well
        await this.updateTenant(tenantId, {
            name: updated.businessName || undefined,
            currency: updated.currency,
            locale: updated.locale,
            country: updated.country,
            gstState: updated.gstState,
            taxId: updated.taxId,
            street: updated.street,
            city: updated.city,
            postalCode: updated.postalCode,
            email: updated.email,
            phone: updated.phone,
            invoicePrefix: updated.invoicePrefix,
        });
        return updated;
    },
    async uploadAsset(file) {
        if (isAppwriteConfigured()) {
            const url = await AppwriteAdapter.uploadAsset(file);
            if (url)
                return url;
        }
        return new Promise((resolve) => {
            if (typeof window === 'undefined')
                return resolve(null);
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    },
    async recordPayment(tenantId, docId, amount, method, reference, notes, paymentDate) {
        const storeDocs = getLocalStore('billcraft_tenant_documents', DEMO_DOCUMENTS);
        const docs = storeDocs[tenantId] || [];
        const doc = docs.find((d) => d.id === docId);
        if (!doc)
            return null;
        const cleanAmount = Number(Number(amount).toFixed(2));
        if (cleanAmount <= 0)
            return doc;
        const newPayment = {
            id: `pay_${Date.now()}`,
            documentId: docId,
            amount: cleanAmount,
            paymentDate: paymentDate || new Date().toISOString().split('T')[0],
            paymentMethod: method,
            reference,
            notes,
            createdAt: new Date().toISOString(),
        };
        if (!doc.payments)
            doc.payments = [];
        doc.payments.push(newPayment);
        const totalCollected = doc.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const totalRefunded = (doc.refunds || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);
        doc.summary.amountPaid = Number(totalCollected.toFixed(2));
        doc.summary.refundedAmount = Number(totalRefunded.toFixed(2));
        doc.summary.netAmountPaid = Number(Math.max(0, totalCollected - totalRefunded).toFixed(2));
        doc.summary.balanceDue = Number(Math.max(0, doc.summary.grandTotal - doc.summary.amountPaid).toFixed(2));
        if (doc.status === 'draft') {
            doc.status = 'pending';
        }
        doc.status = computeEffectiveInvoiceStatus(doc);
        doc.updatedAt = new Date().toISOString();
        if (!doc.auditHistory)
            doc.auditHistory = [];
        doc.auditHistory.unshift({
            id: `aud_${Date.now()}`,
            action: 'PAYMENT_RECORDED',
            description: `Payment of ${cleanAmount} (${doc.currency}) recorded via ${method.replace('_', ' ')}${reference ? ` [Ref: ${reference}]` : ''}`,
            timestamp: doc.updatedAt,
        });
        setLocalStore('billcraft_tenant_documents', storeDocs);
        return doc;
    },
    async recordRefund(tenantId, docId, amount, method, reason, reference, notes, refundDate) {
        const storeDocs = getLocalStore('billcraft_tenant_documents', DEMO_DOCUMENTS);
        const docs = storeDocs[tenantId] || [];
        const doc = docs.find((d) => d.id === docId);
        if (!doc)
            return null;
        const maxRefundable = Math.max(0, Number(doc.summary.amountPaid || 0) - Number(doc.summary.refundedAmount || 0));
        const cleanRefund = Number(Math.min(maxRefundable, Math.max(0, Number(amount))).toFixed(2));
        if (cleanRefund <= 0)
            return doc;
        const newRefund = {
            id: `ref_${Date.now()}`,
            documentId: docId,
            amount: cleanRefund,
            refundDate: refundDate || new Date().toISOString().split('T')[0],
            refundMethod: method,
            reason,
            reference,
            notes,
            createdAt: new Date().toISOString(),
        };
        if (!doc.refunds)
            doc.refunds = [];
        doc.refunds.push(newRefund);
        const totalCollected = (doc.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const totalRefunded = doc.refunds.reduce((sum, r) => sum + Number(r.amount || 0), 0);
        doc.summary.amountPaid = Number(totalCollected.toFixed(2));
        doc.summary.refundedAmount = Number(totalRefunded.toFixed(2));
        doc.summary.netAmountPaid = Number(Math.max(0, totalCollected - totalRefunded).toFixed(2));
        // Original invoice amount (grandTotal), collected payments (amountPaid), refunded amount (refundedAmount), and remaining unpaid balance (balanceDue) remain distinct
        doc.summary.balanceDue = Number(Math.max(0, doc.summary.grandTotal - doc.summary.amountPaid).toFixed(2));
        doc.status = computeEffectiveInvoiceStatus(doc);
        doc.updatedAt = new Date().toISOString();
        if (!doc.auditHistory)
            doc.auditHistory = [];
        doc.auditHistory.unshift({
            id: `aud_${Date.now()}`,
            action: 'REFUND_ISSUED',
            description: `${totalRefunded >= totalCollected ? 'Full' : 'Partial'} refund of ${cleanRefund} (${doc.currency}) issued via ${method.replace('_', ' ')}${reason ? ` — Reason: ${reason}` : ''}`,
            timestamp: doc.updatedAt,
        });
        setLocalStore('billcraft_tenant_documents', storeDocs);
        return doc;
    },
    async getAuditLogs(tenantId) {
        const docs = await this.getDocuments(tenantId);
        const logs = [];
        docs.forEach((doc) => {
            (doc.auditHistory || []).forEach((entry) => {
                logs.push({
                    ...entry,
                    docNumber: doc.documentNumber,
                });
            });
        });
        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    async deleteTenant(tenantId) {
        const customTenants = getLocalStore('billcraft_custom_tenants', []);
        setLocalStore('billcraft_custom_tenants', customTenants.filter((t) => t.id !== tenantId));
        const storeDocs = getLocalStore('billcraft_tenant_documents', {});
        delete storeDocs[tenantId];
        setLocalStore('billcraft_tenant_documents', storeDocs);
        const storeParties = getLocalStore('billcraft_tenant_parties', {});
        delete storeParties[tenantId];
        setLocalStore('billcraft_tenant_parties', storeParties);
        const storeProducts = getLocalStore('billcraft_tenant_products', {});
        delete storeProducts[tenantId];
        setLocalStore('billcraft_tenant_products', storeProducts);
        const storeBrand = getLocalStore('billcraft_tenant_brand', {});
        delete storeBrand[tenantId];
        setLocalStore('billcraft_tenant_brand', storeBrand);
        return true;
    },
    async getTenantMetrics(tenantId) {
        const docs = await this.getDocuments(tenantId);
        const parties = await this.getParties(tenantId);
        const products = await this.getProducts(tenantId);
        const totalBilled = docs.reduce((sum, d) => sum + Number(d.summary?.grandTotal || 0), 0);
        const totalCollected = docs.reduce((sum, d) => sum + Number(d.summary?.amountPaid || 0), 0);
        const totalOutstanding = docs.reduce((sum, d) => sum + Number(d.summary?.balanceDue || 0), 0);
        return {
            documentsCount: docs.length,
            customersCount: parties.filter((p) => p.type === 'customer').length,
            vendorsCount: parties.filter((p) => p.type === 'vendor').length,
            productsCount: products.length,
            totalBilled: Number(totalBilled.toFixed(2)),
            totalCollected: Number(totalCollected.toFixed(2)),
            totalOutstanding: Number(totalOutstanding.toFixed(2)),
        };
    },
    async searchTenantData(tenantId, query) {
        const q = query.trim().toLowerCase();
        if (!q)
            return { documents: [], customers: [], products: [] };
        const docs = await this.getDocuments(tenantId);
        const parties = await this.getParties(tenantId);
        const products = await this.getProducts(tenantId);
        return {
            documents: docs.filter((d) => d.documentNumber.toLowerCase().includes(q) ||
                d.client.name.toLowerCase().includes(q) ||
                (d.invoiceName && d.invoiceName.toLowerCase().includes(q))),
            customers: parties.filter((p) => p.name.toLowerCase().includes(q) ||
                (p.email && p.email.toLowerCase().includes(q)) ||
                (p.taxId && p.taxId.toLowerCase().includes(q))),
            products: products.filter((p) => p.name.toLowerCase().includes(q) ||
                (p.sku && p.sku.toLowerCase().includes(q))),
        };
    },
};
export * from './blog';
export * from './team';
export * from './admin';
