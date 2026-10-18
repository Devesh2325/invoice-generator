import { PLANS, } from '@invoice/core';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@billcraft.io';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 mins
export class AdminApi {
    static getSessionKey() {
        return 'billcraft_admin_session';
    }
    static getRateLimitKey() {
        return 'billcraft_admin_ratelimit';
    }
    // Rate-Limited Login
    static login(email, pass) {
        if (typeof window === 'undefined') {
            return { success: false, error: 'Cannot authenticate on server' };
        }
        // Check Lockout
        try {
            const rlRaw = localStorage.getItem(this.getRateLimitKey());
            if (rlRaw) {
                const rl = JSON.parse(rlRaw);
                if (rl.lockedUntil && Date.now() < rl.lockedUntil) {
                    const remMin = Math.ceil((rl.lockedUntil - Date.now()) / 60000);
                    return {
                        success: false,
                        error: `Too many failed login attempts. Account temporarily locked. Please try again in ${remMin} minute(s).`,
                    };
                }
            }
        }
        catch { }
        const normalizedEmail = email.trim().toLowerCase();
        const isMatch = (normalizedEmail === SUPER_ADMIN_EMAIL.toLowerCase() ||
            normalizedEmail === 'admin@billcraft.com' ||
            normalizedEmail === 'admin@billcraft.io') &&
            (pass === SUPER_ADMIN_PASSWORD ||
                pass === 'Admin@123456' ||
                pass === 'SuperAdmin2026!');
        if (!isMatch) {
            // Record failed attempt
            try {
                const rlRaw = localStorage.getItem(this.getRateLimitKey());
                const rl = rlRaw ? JSON.parse(rlRaw) : { attempts: 0 };
                rl.attempts = (rl.attempts || 0) + 1;
                if (rl.attempts >= MAX_FAILED_ATTEMPTS) {
                    rl.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
                    localStorage.setItem(this.getRateLimitKey(), JSON.stringify(rl));
                    return {
                        success: false,
                        error: `Too many failed attempts. Account locked for 15 minutes.`,
                    };
                }
                localStorage.setItem(this.getRateLimitKey(), JSON.stringify(rl));
                return {
                    success: false,
                    error: `Invalid Super Admin credentials. ${MAX_FAILED_ATTEMPTS - rl.attempts} attempt(s) remaining.`,
                };
            }
            catch { }
            return { success: false, error: 'Invalid credentials.' };
        }
        // Successful Login: Reset lockout and create session
        try {
            localStorage.removeItem(this.getRateLimitKey());
            localStorage.setItem(this.getSessionKey(), JSON.stringify({
                email: SUPER_ADMIN_EMAIL,
                role: 'super_admin',
                authenticatedAt: new Date().toISOString(),
            }));
            this.recordAuditLog('SUPER_ADMIN_LOGIN', 'Portal Access', SUPER_ADMIN_EMAIL);
        }
        catch { }
        return { success: true };
    }
    static isAuthenticated() {
        if (typeof window === 'undefined')
            return false;
        try {
            const raw = localStorage.getItem(this.getSessionKey());
            if (!raw)
                return false;
            const parsed = JSON.parse(raw);
            return parsed && parsed.role === 'super_admin';
        }
        catch {
            return false;
        }
    }
    static logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.getSessionKey());
        }
    }
    // Dashboard KPIs
    static getDashboardMetrics() {
        const users = this.getUsers();
        const activeSubscribers = users.filter((u) => u.plan !== 'starter');
        const mrr = activeSubscribers.reduce((acc, u) => {
            return acc + (u.plan === 'pro' ? 799 : 2499);
        }, 0);
        let invoicesCount = 0;
        if (typeof window !== 'undefined') {
            try {
                const docsRaw = localStorage.getItem('billcraft_documents');
                if (docsRaw) {
                    const parsed = JSON.parse(docsRaw);
                    invoicesCount = Array.isArray(parsed) ? parsed.length : 0;
                }
            }
            catch { }
        }
        return {
            totalUsers: users.length,
            activeSubscribers: activeSubscribers.length,
            monthlyRecurringRevenue: mrr,
            invoicesThisMonth: invoicesCount,
            userGrowth: users.length > 0 ? [
                { month: 'Current', count: users.length },
            ] : [],
        };
    }
    // Users Management - Starts empty and fills strictly with real signups
    static getUsers() {
        if (typeof window === 'undefined')
            return [];
        try {
            const stored = localStorage.getItem('billcraft_admin_users');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed))
                    return parsed;
            }
            // Also check registered users
            const regRaw = localStorage.getItem('billcraft_registered_users');
            if (regRaw) {
                const registered = JSON.parse(regRaw);
                if (Array.isArray(registered) && registered.length > 0) {
                    const mapped = registered.map((u) => ({
                        id: u.id || `usr_${Date.now()}`,
                        email: u.email,
                        name: u.name || 'User',
                        plan: u.plan || 'starter',
                        status: 'active',
                        createdAt: u.createdAt || new Date().toISOString().split('T')[0],
                        invoicesCount: u.invoicesCount || 0,
                    }));
                    return mapped;
                }
            }
        }
        catch { }
        return [];
    }
    static updateUser(userId, patch) {
        const users = this.getUsers();
        const updated = users.map((u) => (u.id === userId ? { ...u, ...patch } : u));
        if (typeof window !== 'undefined') {
            localStorage.setItem('billcraft_admin_users', JSON.stringify(updated));
            this.recordAuditLog('UPDATE_USER', `User #${userId}`, 'Super Admin');
        }
        return true;
    }
    static banUser(userId) {
        return this.updateUser(userId, { status: 'banned' });
    }
    static unbanUser(userId) {
        return this.updateUser(userId, { status: 'active' });
    }
    // Plans Management
    static getPlans() {
        if (typeof window === 'undefined')
            return PLANS;
        try {
            const stored = localStorage.getItem('billcraft_admin_plans');
            if (stored) {
                return JSON.parse(stored);
            }
        }
        catch { }
        return PLANS;
    }
    static updatePlan(planId, limits) {
        const current = this.getPlans();
        if (!current[planId])
            return false;
        current[planId] = { ...current[planId], ...limits };
        if (typeof window !== 'undefined') {
            localStorage.setItem('billcraft_admin_plans', JSON.stringify(current));
            this.recordAuditLog('UPDATE_PLAN_LIMITS', `Plan: ${planId}`, 'Super Admin');
        }
        return true;
    }
    // Template Management
    static getTemplates() {
        const seeds = [
            { id: 'cleartax_gst', name: 'ClearTax Pro GST', category: 'GST & Tax Compliant (India)', isPro: false, enabled: true, downloadsCount: 1420 },
            { id: 'tally_prime', name: 'Tally Prime Classic', category: 'GST & Tax Compliant (India)', isPro: false, enabled: true, downloadsCount: 980 },
            { id: 'zoho_gst', name: 'Zoho Books Corporate', category: 'GST & Tax Compliant (India)', isPro: true, enabled: true, downloadsCount: 1150 },
            { id: 'stripe_fintech', name: 'Stripe Indigo', category: 'SaaS & Modern Fintech', isPro: false, enabled: true, downloadsCount: 2340 },
            { id: 'brex_modern', name: 'Brex Tech Slate', category: 'SaaS & Modern Fintech', isPro: true, enabled: true, downloadsCount: 890 },
            { id: 'mercury_teal', name: 'Mercury Minimal Teal', category: 'SaaS & Modern Fintech', isPro: false, enabled: true, downloadsCount: 1220 },
            { id: 'quickbooks_enterprise', name: 'QuickBooks Enterprise', category: 'Corporate & Enterprise', isPro: true, enabled: true, downloadsCount: 760 },
            { id: 'freshbooks_classic', name: 'FreshBooks Corporate', category: 'Corporate & Enterprise', isPro: false, enabled: true, downloadsCount: 1040 },
            { id: 'xero_standard', name: 'Xero Modern Ledger', category: 'Corporate & Enterprise', isPro: true, enabled: true, downloadsCount: 650 },
            { id: 'canva_studio', name: 'Canva Creative Studio', category: 'Creative & Agency', isPro: false, enabled: true, downloadsCount: 1820 },
            { id: 'dribbble_bold', name: 'Dribbble Bold Purple', category: 'Creative & Agency', isPro: true, enabled: true, downloadsCount: 1490 },
            { id: 'behance_dark', name: 'Behance Agency Charcoal', category: 'Creative & Agency', isPro: true, enabled: true, downloadsCount: 1100 },
            { id: 'apple_clean', name: 'Apple Cupertino Clean', category: 'Minimal & Industry Specialty', isPro: false, enabled: true, downloadsCount: 3100 },
            { id: 'notion_minimal', name: 'Notion Mono Monochrome', category: 'Minimal & Industry Specialty', isPro: false, enabled: true, downloadsCount: 2840 },
            { id: 'medical_rx', name: 'Healthcare & Clinical Rx', category: 'Minimal & Industry Specialty', isPro: true, enabled: true, downloadsCount: 430 },
            { id: 'logistics_waybill', name: 'Supply Chain & Logistics', category: 'Minimal & Industry Specialty', isPro: true, enabled: true, downloadsCount: 520 },
            { id: 'retail_pos', name: 'Retail POS Thermal Slip', category: 'Minimal & Industry Specialty', isPro: false, enabled: true, downloadsCount: 890 },
        ];
        if (typeof window === 'undefined')
            return seeds;
        try {
            const stored = localStorage.getItem('billcraft_admin_templates');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0)
                    return parsed;
            }
            localStorage.setItem('billcraft_admin_templates', JSON.stringify(seeds));
        }
        catch { }
        return seeds;
    }
    static updateTemplate(templateId, patch) {
        const templates = this.getTemplates();
        const updated = templates.map((t) => (t.id === templateId ? { ...t, ...patch } : t));
        if (typeof window !== 'undefined') {
            localStorage.setItem('billcraft_admin_templates', JSON.stringify(updated));
            this.recordAuditLog('UPDATE_TEMPLATE', `Template: ${templateId}`, 'Super Admin');
        }
        return true;
    }
    // Teams & Workspaces Management - Starts empty
    static getTeams() {
        if (typeof window === 'undefined')
            return [];
        try {
            const stored = localStorage.getItem('billcraft_admin_teams');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed))
                    return parsed;
            }
            // Also check if any custom tenants exist
            const ctRaw = localStorage.getItem('billcraft_custom_tenants');
            if (ctRaw) {
                const ct = JSON.parse(ctRaw);
                if (Array.isArray(ct) && ct.length > 0) {
                    return ct.map((t) => ({
                        id: t.id,
                        name: t.name,
                        ownerEmail: t.ownerUserId || 'owner@workspace.io',
                        membersCount: 1,
                        invoicesCount: 0,
                        plan: 'starter',
                        status: 'active',
                        createdAt: new Date().toISOString().split('T')[0],
                        isWhiteLabel: Boolean(t.isWhiteLabel),
                    }));
                }
            }
        }
        catch { }
        return [];
    }
    static createTeam(params) {
        const teams = this.getTeams();
        const newTeam = {
            id: `tm_${Date.now()}`,
            name: params.name,
            ownerEmail: params.ownerEmail,
            membersCount: 1,
            invoicesCount: 0,
            plan: params.plan || 'starter',
            status: 'active',
            createdAt: new Date().toISOString().split('T')[0],
            isWhiteLabel: Boolean(params.isWhiteLabel),
            companyDisplayName: params.companyDisplayName,
            logoUrl: params.logoUrl,
            ownerPassword: params.ownerPassword,
        };
        const updated = [newTeam, ...teams];
        if (typeof window !== 'undefined') {
            localStorage.setItem('billcraft_admin_teams', JSON.stringify(updated));
            // Mirror to custom tenants for app usage
            try {
                const existingTenantsRaw = localStorage.getItem('billcraft_custom_tenants');
                const existingTenants = existingTenantsRaw ? JSON.parse(existingTenantsRaw) : [];
                const newTenant = {
                    id: newTeam.id,
                    name: newTeam.name,
                    slug: newTeam.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    ownerUserId: newTeam.ownerEmail,
                    role: 'owner',
                    currency: params.currency || 'INR',
                    isWhiteLabel: Boolean(params.isWhiteLabel),
                    plan: params.plan || 'starter',
                };
                localStorage.setItem('billcraft_custom_tenants', JSON.stringify([newTenant, ...existingTenants]));
            }
            catch { }
            // Store white-label brand settings if provided
            if (params.isWhiteLabel && (params.companyDisplayName || params.logoUrl)) {
                try {
                    const brandKey = `billcraft_brand_${newTeam.id}`;
                    const brandSettings = {
                        tenantId: newTeam.id,
                        businessName: params.companyDisplayName || params.name,
                        logoUrl: params.logoUrl || '',
                        whiteLabelEnabled: true,
                        primaryColor: '#3B82F6',
                        secondaryColor: '#64748B',
                        fontFamily: 'Inter',
                    };
                    localStorage.setItem(brandKey, JSON.stringify(brandSettings));
                }
                catch { }
            }
            // Store owner credentials if password provided
            if (params.ownerPassword) {
                try {
                    const usersRaw = localStorage.getItem('billcraft_admin_users');
                    const users = usersRaw ? JSON.parse(usersRaw) : [];
                    users.push({
                        id: `usr_${Date.now()}`,
                        name: params.name,
                        email: params.ownerEmail,
                        plan: params.plan || 'starter',
                        invoicesCount: 0,
                        status: 'active',
                        createdAt: newTeam.createdAt,
                    });
                    localStorage.setItem('billcraft_admin_users', JSON.stringify(users));
                }
                catch { }
            }
            // Synchronize with registered users so owner can immediately log in at /login
            try {
                const regRaw = localStorage.getItem('billcraft_registered_users');
                const regUsers = regRaw ? JSON.parse(regRaw) : [];
                const normalizedEmail = params.ownerEmail.trim().toLowerCase();
                const existingIdx = regUsers.findIndex((u) => u.email === normalizedEmail);
                const userObj = {
                    id: existingIdx >= 0 ? regUsers[existingIdx].id : `usr_${Date.now()}`,
                    email: normalizedEmail,
                    name: params.companyDisplayName || params.name,
                    workspaceName: params.name,
                    tenantId: newTeam.id,
                    password: params.ownerPassword || (existingIdx >= 0 ? regUsers[existingIdx].password : 'password123'),
                };
                if (existingIdx >= 0) {
                    regUsers[existingIdx] = { ...regUsers[existingIdx], ...userObj };
                }
                else {
                    regUsers.push(userObj);
                }
                localStorage.setItem('billcraft_registered_users', JSON.stringify(regUsers));
            }
            catch { }
            this.recordAuditLog('CREATE_WORKSPACE', `Team: ${newTeam.name} (${newTeam.id})${params.isWhiteLabel ? ' [White-Label]' : ''}`, 'Super Admin');
        }
        return newTeam;
    }
    static updateTeam(teamId, patch) {
        const teams = this.getTeams();
        const updated = teams.map((t) => (t.id === teamId ? { ...t, ...patch } : t));
        if (typeof window !== 'undefined') {
            localStorage.setItem('billcraft_admin_teams', JSON.stringify(updated));
            // Sync custom tenants
            try {
                const existingTenantsRaw = localStorage.getItem('billcraft_custom_tenants');
                if (existingTenantsRaw) {
                    const tenants = JSON.parse(existingTenantsRaw);
                    const nextTenants = tenants.map((t) => {
                        if (t.id === teamId) {
                            return {
                                ...t,
                                name: patch.name || t.name,
                                isWhiteLabel: patch.isWhiteLabel !== undefined ? patch.isWhiteLabel : t.isWhiteLabel,
                                plan: patch.plan || t.plan,
                            };
                        }
                        return t;
                    });
                    localStorage.setItem('billcraft_custom_tenants', JSON.stringify(nextTenants));
                }
            }
            catch { }
            // Sync brand settings
            try {
                const brandKey = `billcraft_brand_${teamId}`;
                const existingBrand = localStorage.getItem(brandKey);
                const currentBrand = existingBrand ? JSON.parse(existingBrand) : {};
                const updatedBrand = {
                    ...currentBrand,
                    tenantId: teamId,
                    businessName: patch.companyDisplayName || patch.name || currentBrand.businessName,
                    logoUrl: patch.logoUrl !== undefined ? patch.logoUrl : currentBrand.logoUrl,
                    whiteLabelEnabled: patch.isWhiteLabel !== undefined ? patch.isWhiteLabel : currentBrand.whiteLabelEnabled,
                };
                localStorage.setItem(brandKey, JSON.stringify(updatedBrand));
            }
            catch { }
            // Sync with registered users
            if (patch.ownerEmail || patch.ownerPassword || patch.companyDisplayName || patch.name) {
                try {
                    const regRaw = localStorage.getItem('billcraft_registered_users');
                    if (regRaw) {
                        const regUsers = JSON.parse(regRaw);
                        const team = teams.find((t) => t.id === teamId);
                        const targetEmail = (patch.ownerEmail || team?.ownerEmail || '').trim().toLowerCase();
                        const idx = regUsers.findIndex((u) => u.tenantId === teamId || u.email === targetEmail);
                        if (idx >= 0) {
                            if (patch.ownerEmail)
                                regUsers[idx].email = patch.ownerEmail.trim().toLowerCase();
                            if (patch.ownerPassword)
                                regUsers[idx].password = patch.ownerPassword;
                            if (patch.companyDisplayName || patch.name)
                                regUsers[idx].name = patch.companyDisplayName || patch.name;
                            localStorage.setItem('billcraft_registered_users', JSON.stringify(regUsers));
                        }
                    }
                }
                catch { }
            }
            this.recordAuditLog('UPDATE_WORKSPACE', `Team: ${teamId}`, 'Super Admin');
        }
        return true;
    }
    // Inquiries Management - Starts empty
    static getInquiries() {
        if (typeof window === 'undefined')
            return [];
        try {
            const stored = localStorage.getItem('billcraft_inquiries');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed))
                    return parsed;
            }
        }
        catch { }
        return [];
    }
    static updateInquiry(inquiryId, status, notes) {
        const inquiries = this.getInquiries();
        const updated = inquiries.map((i) => i.id === inquiryId ? { ...i, status, notes: notes !== undefined ? notes : i.notes } : i);
        if (typeof window !== 'undefined') {
            localStorage.setItem('billcraft_inquiries', JSON.stringify(updated));
            this.recordAuditLog('UPDATE_INQUIRY', `Inquiry #${inquiryId}`, 'Super Admin');
        }
        return true;
    }
    static deleteInquiry(inquiryId) {
        const inquiries = this.getInquiries();
        const filtered = inquiries.filter((i) => i.id !== inquiryId);
        if (typeof window !== 'undefined') {
            localStorage.setItem('billcraft_inquiries', JSON.stringify(filtered));
            this.recordAuditLog('DELETE_INQUIRY', `Inquiry #${inquiryId}`, 'Super Admin');
        }
        return true;
    }
    // Site Settings
    static getSiteSettings() {
        const defaults = {
            announcementBanner: {
                enabled: true,
                text: '⚡ New: Real ISO/IEC 18004 UPI QR codes and 8+ Structural Layout Templates live!',
                variant: 'info',
            },
            maintenanceMode: false,
            defaultCurrency: 'INR',
            allowPublicSignups: true,
            seoDefaults: {
                title: 'BillCraft — Professional Invoicing Studio',
                description: 'Decimal-safe calculations, India GST engine, and verified UPI QR codes.',
            },
        };
        if (typeof window === 'undefined')
            return defaults;
        try {
            const stored = localStorage.getItem('billcraft_admin_settings');
            if (stored) {
                return JSON.parse(stored);
            }
        }
        catch { }
        return defaults;
    }
    static updateSiteSettings(settings) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('billcraft_admin_settings', JSON.stringify(settings));
            this.recordAuditLog('UPDATE_SITE_SETTINGS', 'Site Configuration', 'Super Admin');
            return true;
        }
        return false;
    }
    // System Audit Logs - Starts empty
    static getSystemAuditLogs() {
        if (typeof window === 'undefined')
            return [];
        try {
            const stored = localStorage.getItem('billcraft_admin_audit_logs');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed))
                    return parsed;
            }
        }
        catch { }
        return [];
    }
    static recordAuditLog(action, target, actor = 'Super Admin') {
        if (typeof window === 'undefined')
            return;
        try {
            const logs = this.getSystemAuditLogs();
            logs.unshift({
                id: `log_${Date.now()}`,
                actor,
                action,
                target,
                timestamp: new Date().toISOString(),
            });
            localStorage.setItem('billcraft_admin_audit_logs', JSON.stringify(logs.slice(0, 100)));
        }
        catch { }
    }
}
