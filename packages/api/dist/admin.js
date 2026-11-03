import { PLANS, APP_CONFIG, } from "@invoice/core";
export class AdminApi {
    // Dashboard KPIs
    static getDashboardMetrics() {
        const users = this.getUsers();
        const activeSubscribers = users.filter((u) => u.plan !== "starter");
        const mrr = activeSubscribers.reduce((acc, u) => {
            return (acc +
                (u.plan === "pro"
                    ? APP_CONFIG.plans.pro.price
                    : APP_CONFIG.plans.enterprise.price));
        }, 0);
        let documentsCount = 0;
        if (typeof window !== "undefined") {
            try {
                const docsRaw = localStorage.getItem("billcraft_tenant_documents");
                if (docsRaw) {
                    const byTenant = JSON.parse(docsRaw);
                    documentsCount = Object.values(byTenant).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
                }
            }
            catch { }
        }
        // Signups per month for the last six months, from each user's real signup date.
        const now = new Date();
        const userGrowth = Array.from({ length: 6 }, (_, i) => {
            const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            return {
                month: date.toLocaleDateString("en-IN", { month: "short" }),
                count: users.filter((u) => (u.createdAt || "").startsWith(key)).length,
            };
        });
        return {
            totalUsers: users.length,
            activeSubscribers: activeSubscribers.length,
            monthlyRecurringRevenue: mrr,
            documentsCount,
            userGrowth,
        };
    }
    // Users Management - Starts empty and fills strictly with real signups
    static getUsers() {
        if (typeof window === "undefined")
            return [];
        try {
            const stored = localStorage.getItem("billcraft_admin_users");
            let adminUsers = [];
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed))
                    adminUsers = parsed;
            }
            // Also merge registered users
            const regRaw = localStorage.getItem("billcraft_registered_users");
            if (regRaw) {
                const registered = JSON.parse(regRaw);
                if (Array.isArray(registered) && registered.length > 0) {
                    registered.forEach((u) => {
                        const exists = adminUsers.some((au) => au.id === u.id ||
                            (au.email && au.email.toLowerCase() === (u.email || "").toLowerCase()));
                        if (!exists) {
                            adminUsers.push({
                                id: u.id || `usr_${Date.now()}`,
                                email: u.email,
                                name: u.name || "User",
                                plan: u.plan || "starter",
                                status: "active",
                                createdAt: u.createdAt || new Date().toISOString().split("T")[0],
                                invoicesCount: u.invoicesCount || 0,
                            });
                        }
                    });
                }
            }
            return adminUsers;
        }
        catch { }
        return [];
    }
    static updateUser(userId, patch) {
        const users = this.getUsers();
        const updated = users.map((u) => u.id === userId || (patch.email && u.email === patch.email)
            ? { ...u, ...patch }
            : u);
        if (typeof window !== "undefined") {
            localStorage.setItem("billcraft_admin_users", JSON.stringify(updated));
            // Also update registered users if present
            try {
                const regRaw = localStorage.getItem("billcraft_registered_users");
                if (regRaw) {
                    const registered = JSON.parse(regRaw);
                    if (Array.isArray(registered)) {
                        const regUpdated = registered.map((u) => u.id === userId ? { ...u, ...patch } : u);
                        localStorage.setItem("billcraft_registered_users", JSON.stringify(regUpdated));
                    }
                }
            }
            catch { }
            this.recordAuditLog("UPDATE_USER", `User #${userId}`, "Super Admin");
        }
        return true;
    }
    static banUser(userId) {
        return this.updateUser(userId, { status: "banned" });
    }
    static unbanUser(userId) {
        return this.updateUser(userId, { status: "active" });
    }
    static deleteUser(userIdOrEmail) {
        if (typeof window === "undefined")
            return false;
        try {
            const target = (userIdOrEmail || "").trim().toLowerCase();
            if (!target)
                return false;
            // 1. Remove from billcraft_admin_users
            const adminUsers = this.getUsers().filter((u) => (u.id || "").toLowerCase() !== target &&
                (u.email || "").toLowerCase() !== target);
            localStorage.setItem("billcraft_admin_users", JSON.stringify(adminUsers));
            // 2. Remove from billcraft_registered_users
            try {
                const regRaw = localStorage.getItem("billcraft_registered_users");
                if (regRaw) {
                    const registered = JSON.parse(regRaw);
                    if (Array.isArray(registered)) {
                        const filtered = registered.filter((u) => (u.id || "").toLowerCase() !== target &&
                            (u.email || "").toLowerCase() !== target);
                        localStorage.setItem("billcraft_registered_users", JSON.stringify(filtered));
                    }
                }
            }
            catch { }
            // 3. Remove custom tenants associated with this user
            try {
                const tenantsRaw = localStorage.getItem("billcraft_custom_tenants");
                if (tenantsRaw) {
                    const tenants = JSON.parse(tenantsRaw);
                    if (Array.isArray(tenants)) {
                        const filteredTenants = tenants.filter((t) => (t.ownerUserId || "").toLowerCase() !== target &&
                            (t.id || "").toLowerCase() !== `tenant_${target}`);
                        localStorage.setItem("billcraft_custom_tenants", JSON.stringify(filteredTenants));
                    }
                }
            }
            catch { }
            // 4. Clear impersonation session if active for this user
            try {
                const impTargetRaw = localStorage.getItem("billcraft_impersonated_target");
                if (impTargetRaw) {
                    const imp = JSON.parse(impTargetRaw);
                    if ((imp.id || "").toLowerCase() === target ||
                        (imp.email || "").toLowerCase() === target) {
                        localStorage.removeItem("billcraft_impersonated_target");
                        localStorage.removeItem("billcraft_is_impersonating");
                    }
                }
            }
            catch { }
            this.recordAuditLog("DELETE_USER", `User: ${userIdOrEmail}`, "Super Admin");
            return true;
        }
        catch {
            return false;
        }
    }
    // Plans Management
    static getPlans() {
        if (typeof window === "undefined")
            return PLANS;
        try {
            const stored = localStorage.getItem("billcraft_admin_plans");
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
        if (typeof window !== "undefined") {
            localStorage.setItem("billcraft_admin_plans", JSON.stringify(current));
            this.recordAuditLog("UPDATE_PLAN_LIMITS", `Plan: ${planId}`, "Super Admin");
        }
        return true;
    }
    // Template Management
    static getTemplates() {
        const seeds = [
            {
                id: "cleartax_gst",
                name: "GST Standard",
                category: "GST & Tax Compliant (India)",
                isPro: false,
                enabled: true,
                downloadsCount: 1420,
                description: "Modern GST-compliant tax invoice with HSN/SAC, Place of Supply, and CGST/SGST/IGST split.",
                primaryColor: "#1D4ED8",
            },
            {
                id: "tally_prime",
                name: "GST Ledger Grid",
                category: "GST & Tax Compliant (India)",
                isPro: false,
                enabled: true,
                downloadsCount: 980,
                description: "Traditional Indian accounting bordered box layout with GSTIN, State Code, HSN/SAC & Signatory.",
                primaryColor: "#0F172A",
            },
            {
                id: "vyapar_classic",
                name: "GST Business",
                category: "GST & Tax Compliant (India)",
                isPro: false,
                enabled: true,
                downloadsCount: 1150,
                description: "High-clarity commercial distributor & wholesale GST layout with bold accent header.",
                primaryColor: "#EA580C",
            },
            {
                id: "modern",
                name: "Modern Fintech",
                category: "SaaS & Modern Fintech",
                isPro: false,
                enabled: true,
                downloadsCount: 2340,
                description: "Clean high-contrast layout with elegant colored accents and modern cards.",
                primaryColor: "#3157D5",
            },
            {
                id: "stripe_clean",
                name: "SaaS Billing",
                category: "SaaS & Modern Fintech",
                isPro: true,
                enabled: true,
                downloadsCount: 1890,
                description: "Developer-first, hyper-minimal tech invoice inspired by Stripe Invoicing.",
                primaryColor: "#6366F1",
            },
            {
                id: "zoho_standard",
                name: "Books Standard",
                category: "Corporate & Enterprise",
                isPro: false,
                enabled: true,
                downloadsCount: 1220,
                description: "Classic corporate invoice with formal grid layout and balanced typography.",
                primaryColor: "#0284C7",
            },
            {
                id: "freshbooks_cloud",
                name: "Cloud Retainer",
                category: "Corporate & Enterprise",
                isPro: true,
                enabled: true,
                downloadsCount: 760,
                description: "Friendly, polished freelance & agency billing format with prominent payment terms.",
                primaryColor: "#059669",
            },
            {
                id: "bold_header",
                name: "Bold Color Block Header",
                category: "SaaS & Modern Fintech",
                isPro: true,
                enabled: true,
                downloadsCount: 1040,
                description: "Full-bleed primary color header banner for maximum brand recognition.",
                primaryColor: "#4F46E5",
            },
            {
                id: "professional",
                name: "Executive Professional",
                category: "Corporate & Enterprise",
                isPro: false,
                enabled: true,
                downloadsCount: 1650,
                description: "Conservative, highly structured layout for enterprise B2B vendors.",
                primaryColor: "#1E293B",
            },
            {
                id: "corporate",
                name: "Corporate Standard",
                category: "Corporate & Enterprise",
                isPro: true,
                enabled: true,
                downloadsCount: 890,
                description: "Traditional corporate invoice with full-width section headers and formal ledger table.",
                primaryColor: "#1E40AF",
            },
            {
                id: "classic",
                name: "Classic Heritage Serif",
                category: "Corporate & Enterprise",
                isPro: true,
                enabled: true,
                downloadsCount: 650,
                description: "Timeless black-and-white layout with double borders and classic typography.",
                primaryColor: "#0F172A",
            },
            {
                id: "elegant",
                name: "Luxury Boutique Serif",
                category: "Creative & Agency",
                isPro: true,
                enabled: true,
                downloadsCount: 820,
                description: "Sophisticated editorial aesthetic tailored for high-end consulting and premium brands.",
                primaryColor: "#78350F",
            },
            {
                id: "creative",
                name: "Creative Studio Gradient",
                category: "Creative & Agency",
                isPro: true,
                enabled: true,
                downloadsCount: 1490,
                description: "Vibrant and expressive design for design agencies, video editors, and creators.",
                primaryColor: "#7C3AED",
            },
            {
                id: "canva_studio",
                name: "Canva Studio Agency",
                category: "Creative & Agency",
                isPro: false,
                enabled: true,
                downloadsCount: 1820,
                description: "Contemporary creative agency invoice with rounded soft cards and pastel badges.",
                primaryColor: "#06B6D4",
            },
            {
                id: "agency_retainer",
                name: "Digital Marketing Retainer",
                category: "Creative & Agency",
                isPro: true,
                enabled: true,
                downloadsCount: 1100,
                description: "Multi-service agency retainer layout with milestone tracking and deliverable notes.",
                primaryColor: "#EC4899",
            },
            {
                id: "minimal",
                name: "Minimal Monochrome",
                category: "Minimal & Industry Specialty",
                isPro: false,
                enabled: true,
                downloadsCount: 3100,
                description: "Stripped-back typographic layout with zero visual clutter and maximum whitespace.",
                primaryColor: "#18181B",
            },
            {
                id: "compact",
                name: "Dense Compact Ledger",
                category: "Minimal & Industry Specialty",
                isPro: true,
                enabled: true,
                downloadsCount: 680,
                description: "High-density multi-item invoice layout designed for long item catalogs.",
                primaryColor: "#334155",
            },
            {
                id: "retail",
                name: "Retail POS Receipt",
                category: "Minimal & Industry Specialty",
                isPro: false,
                enabled: true,
                downloadsCount: 920,
                description: "Clean thermal slip receipt format for counter sales, retail stores, and pop-ups.",
                primaryColor: "#059669",
            },
            {
                id: "service_business",
                name: "Trades & Field Services",
                category: "Minimal & Industry Specialty",
                isPro: true,
                enabled: true,
                downloadsCount: 750,
                description: "Job-site and contractor layout with labor vs parts itemization and signature line.",
                primaryColor: "#D97706",
            },
            {
                id: "in-gst",
                name: "Standard Indian GST Tax Invoice",
                category: "GST & Tax Compliant (India)",
                isPro: false,
                enabled: true,
                downloadsCount: 2200,
                description: "Comprehensive Indian tax compliance format with e-invoice QR code and reverse charge notes.",
                primaryColor: "#2563EB",
            },
            {
                id: "uk-vat",
                name: "UK HMRC Compliant VAT",
                category: "Corporate & Enterprise",
                isPro: true,
                enabled: true,
                downloadsCount: 840,
                description: "Standard British VAT invoice format compliant with HMRC Making Tax Digital rules.",
                primaryColor: "#065F46",
            },
            {
                id: "eu-reverse-charge",
                name: "EU Cross-Border Reverse Charge",
                category: "Corporate & Enterprise",
                isPro: true,
                enabled: true,
                downloadsCount: 610,
                description: "European cross-border invoice with intra-community Article 194 VAT reverse charge clause.",
                primaryColor: "#1E3A8A",
            },
            {
                id: "us-sales-tax",
                name: "US Multi-Jurisdiction Sales Tax",
                category: "Corporate & Enterprise",
                isPro: false,
                enabled: true,
                downloadsCount: 1540,
                description: "American corporate invoice supporting combined State, County, and City sales tax lines.",
                primaryColor: "#0284C7",
            },
        ];
        if (typeof window === "undefined")
            return seeds;
        try {
            const stored = localStorage.getItem("billcraft_admin_templates");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Merge seeds that might not exist in parsed to ensure 100% coverage
                    const existingIds = new Set(parsed.map((p) => p.id));
                    const missing = seeds.filter((s) => !existingIds.has(s.id));
                    return [...parsed, ...missing];
                }
            }
            localStorage.setItem("billcraft_admin_templates", JSON.stringify(seeds));
        }
        catch { }
        return seeds;
    }
    static updateTemplate(templateId, patch) {
        const templates = this.getTemplates();
        const updated = templates.map((t) => t.id === templateId ? { ...t, ...patch } : t);
        if (typeof window !== "undefined") {
            localStorage.setItem("billcraft_admin_templates", JSON.stringify(updated));
            window.dispatchEvent(new Event("invoxa-templates-updated"));
            this.recordAuditLog("UPDATE_TEMPLATE", `Template: ${templateId}`, "Super Admin");
        }
        return true;
    }
    static saveTemplate(tpl) {
        const templates = this.getTemplates();
        const existingIndex = templates.findIndex((t) => t.id === tpl.id);
        let updated;
        if (existingIndex >= 0) {
            updated = [...templates];
            updated[existingIndex] = { ...updated[existingIndex], ...tpl };
        }
        else {
            updated = [
                {
                    ...tpl,
                    id: tpl.id || `tpl_${Date.now()}`,
                    downloadsCount: tpl.downloadsCount || 0,
                },
                ...templates,
            ];
        }
        if (typeof window !== "undefined") {
            localStorage.setItem("billcraft_admin_templates", JSON.stringify(updated));
            window.dispatchEvent(new Event("invoxa-templates-updated"));
            this.recordAuditLog("SAVE_TEMPLATE", `Template: ${tpl.id} (${tpl.name})`, "Super Admin");
        }
        return tpl;
    }
    static deleteTemplate(templateId) {
        const templates = this.getTemplates();
        const filtered = templates.filter((t) => t.id !== templateId);
        if (typeof window !== "undefined") {
            localStorage.setItem("billcraft_admin_templates", JSON.stringify(filtered));
            window.dispatchEvent(new Event("invoxa-templates-updated"));
            this.recordAuditLog("DELETE_TEMPLATE", `Deleted Template: ${templateId}`, "Super Admin");
            return true;
        }
        return false;
    }
    // Teams & Workspaces Management - Starts empty
    static getTeams() {
        if (typeof window === "undefined")
            return [];
        try {
            const stored = localStorage.getItem("billcraft_admin_teams");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed))
                    return parsed;
            }
            // Also check if any custom tenants exist
            const ctRaw = localStorage.getItem("billcraft_custom_tenants");
            if (ctRaw) {
                const ct = JSON.parse(ctRaw);
                if (Array.isArray(ct) && ct.length > 0) {
                    return ct.map((t) => ({
                        id: t.id,
                        name: t.name,
                        ownerEmail: t.ownerUserId || "owner@workspace.io",
                        membersCount: 1,
                        invoicesCount: 0,
                        plan: "starter",
                        status: "active",
                        createdAt: new Date().toISOString().split("T")[0],
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
            plan: params.plan || "starter",
            status: "active",
            createdAt: new Date().toISOString().split("T")[0],
            isWhiteLabel: Boolean(params.isWhiteLabel),
            companyDisplayName: params.companyDisplayName,
            logoUrl: params.logoUrl,
            ownerPassword: params.ownerPassword,
        };
        const updated = [newTeam, ...teams];
        if (typeof window !== "undefined") {
            localStorage.setItem("billcraft_admin_teams", JSON.stringify(updated));
            // Mirror to custom tenants for app usage
            try {
                const existingTenantsRaw = localStorage.getItem("billcraft_custom_tenants");
                const existingTenants = existingTenantsRaw
                    ? JSON.parse(existingTenantsRaw)
                    : [];
                const newTenant = {
                    id: newTeam.id,
                    name: newTeam.name,
                    slug: newTeam.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    ownerUserId: newTeam.ownerEmail,
                    role: "owner",
                    currency: params.currency || "INR",
                    isWhiteLabel: Boolean(params.isWhiteLabel),
                    plan: params.plan || "starter",
                };
                localStorage.setItem("billcraft_custom_tenants", JSON.stringify([newTenant, ...existingTenants]));
            }
            catch { }
            // Store white-label brand settings if provided
            if (params.isWhiteLabel &&
                (params.companyDisplayName || params.logoUrl)) {
                try {
                    const brandKey = `billcraft_brand_${newTeam.id}`;
                    const brandSettings = {
                        tenantId: newTeam.id,
                        businessName: params.companyDisplayName || params.name,
                        logoUrl: params.logoUrl || "",
                        whiteLabelEnabled: true,
                        primaryColor: "#3B82F6",
                        secondaryColor: "#64748B",
                        fontFamily: "Inter",
                    };
                    localStorage.setItem(brandKey, JSON.stringify(brandSettings));
                }
                catch { }
            }
            // Store owner credentials if password provided
            if (params.ownerPassword) {
                try {
                    const usersRaw = localStorage.getItem("billcraft_admin_users");
                    const users = usersRaw ? JSON.parse(usersRaw) : [];
                    users.push({
                        id: `usr_${Date.now()}`,
                        name: params.name,
                        email: params.ownerEmail,
                        plan: params.plan || "starter",
                        invoicesCount: 0,
                        status: "active",
                        createdAt: newTeam.createdAt,
                    });
                    localStorage.setItem("billcraft_admin_users", JSON.stringify(users));
                }
                catch { }
            }
            // Synchronize with registered users so owner can immediately log in at /login
            try {
                const regRaw = localStorage.getItem("billcraft_registered_users");
                const regUsers = regRaw ? JSON.parse(regRaw) : [];
                const normalizedEmail = params.ownerEmail.trim().toLowerCase();
                const existingIdx = regUsers.findIndex((u) => u.email === normalizedEmail);
                const userObj = {
                    id: existingIdx >= 0 ? regUsers[existingIdx].id : `usr_${Date.now()}`,
                    email: normalizedEmail,
                    name: params.companyDisplayName || params.name,
                    workspaceName: params.name,
                    tenantId: newTeam.id,
                    password: params.ownerPassword ||
                        (existingIdx >= 0 ? regUsers[existingIdx].password : ""),
                };
                if (existingIdx >= 0) {
                    regUsers[existingIdx] = { ...regUsers[existingIdx], ...userObj };
                }
                else {
                    regUsers.push(userObj);
                }
                localStorage.setItem("billcraft_registered_users", JSON.stringify(regUsers));
            }
            catch { }
            this.recordAuditLog("CREATE_WORKSPACE", `Team: ${newTeam.name} (${newTeam.id})${params.isWhiteLabel ? " [White-Label]" : ""}`, "Super Admin");
        }
        return newTeam;
    }
    static updateTeam(teamId, patch) {
        const teams = this.getTeams();
        const updated = teams.map((t) => t.id === teamId ? { ...t, ...patch } : t);
        if (typeof window !== "undefined") {
            localStorage.setItem("billcraft_admin_teams", JSON.stringify(updated));
            if (patch.plan) {
                try {
                    localStorage.setItem(`billcraft_tenant_plan_${teamId}`, patch.plan);
                    window.dispatchEvent(new Event("billcraft-plan-updated"));
                    window.dispatchEvent(new Event("billcraft-auth-updated"));
                }
                catch { }
            }
            // Sync custom tenants
            try {
                const existingTenantsRaw = localStorage.getItem("billcraft_custom_tenants");
                if (existingTenantsRaw) {
                    const tenants = JSON.parse(existingTenantsRaw);
                    const nextTenants = tenants.map((t) => {
                        if (t.id === teamId) {
                            return {
                                ...t,
                                name: patch.name || t.name,
                                isWhiteLabel: patch.isWhiteLabel !== undefined
                                    ? patch.isWhiteLabel
                                    : t.isWhiteLabel,
                                plan: patch.plan || t.plan,
                            };
                        }
                        return t;
                    });
                    localStorage.setItem("billcraft_custom_tenants", JSON.stringify(nextTenants));
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
                    whiteLabelEnabled: patch.isWhiteLabel !== undefined
                        ? patch.isWhiteLabel
                        : currentBrand.whiteLabelEnabled,
                };
                localStorage.setItem(brandKey, JSON.stringify(updatedBrand));
            }
            catch { }
            // Sync with registered users
            if (patch.ownerEmail ||
                patch.ownerPassword ||
                patch.companyDisplayName ||
                patch.name) {
                try {
                    const regRaw = localStorage.getItem("billcraft_registered_users");
                    if (regRaw) {
                        const regUsers = JSON.parse(regRaw);
                        const team = teams.find((t) => t.id === teamId);
                        const targetEmail = (patch.ownerEmail || team?.ownerEmail || "")
                            .trim()
                            .toLowerCase();
                        const idx = regUsers.findIndex((u) => u.tenantId === teamId || u.email === targetEmail);
                        if (idx >= 0) {
                            if (patch.ownerEmail)
                                regUsers[idx].email = patch.ownerEmail.trim().toLowerCase();
                            if (patch.ownerPassword)
                                regUsers[idx].password = patch.ownerPassword;
                            if (patch.companyDisplayName || patch.name)
                                regUsers[idx].name = patch.companyDisplayName || patch.name;
                            localStorage.setItem("billcraft_registered_users", JSON.stringify(regUsers));
                        }
                    }
                }
                catch { }
            }
            this.recordAuditLog("UPDATE_WORKSPACE", `Team: ${teamId}`, "Super Admin");
        }
        return true;
    }
    // Inquiries Management - Starts empty
    static getInquiries() {
        if (typeof window === "undefined")
            return [];
        try {
            const stored = localStorage.getItem("billcraft_inquiries");
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
        const updated = inquiries.map((i) => i.id === inquiryId
            ? { ...i, status, notes: notes !== undefined ? notes : i.notes }
            : i);
        if (typeof window !== "undefined") {
            localStorage.setItem("billcraft_inquiries", JSON.stringify(updated));
            this.recordAuditLog("UPDATE_INQUIRY", `Inquiry #${inquiryId}`, "Super Admin");
        }
        return true;
    }
    static deleteInquiry(inquiryId) {
        const inquiries = this.getInquiries();
        const filtered = inquiries.filter((i) => i.id !== inquiryId);
        if (typeof window !== "undefined") {
            localStorage.setItem("billcraft_inquiries", JSON.stringify(filtered));
            this.recordAuditLog("DELETE_INQUIRY", `Inquiry #${inquiryId}`, "Super Admin");
        }
        return true;
    }
    // Site Settings
    static getSiteSettings() {
        const defaults = {
            announcementBanner: {
                enabled: true,
                text: "⚡ New: Real ISO/IEC 18004 UPI QR codes and 8+ Structural Layout Templates live!",
                variant: "info",
            },
            maintenanceMode: false,
            defaultCurrency: "INR",
            allowPublicSignups: true,
            seoDefaults: {
                title: "BillCraft — Professional Invoicing Studio",
                description: "Decimal-safe calculations, India GST engine, and verified UPI QR codes.",
            },
        };
        if (typeof window === "undefined")
            return defaults;
        try {
            const stored = localStorage.getItem("billcraft_admin_settings");
            if (stored) {
                return JSON.parse(stored);
            }
        }
        catch { }
        return defaults;
    }
    static updateSiteSettings(settings) {
        if (typeof window !== "undefined") {
            localStorage.setItem("billcraft_admin_settings", JSON.stringify(settings));
            this.recordAuditLog("UPDATE_SITE_SETTINGS", "Site Configuration", "Super Admin");
            return true;
        }
        return false;
    }
    // System Audit Logs - Starts empty
    static getSystemAuditLogs() {
        if (typeof window === "undefined")
            return [];
        try {
            const stored = localStorage.getItem("billcraft_admin_audit_logs");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed))
                    return parsed;
            }
        }
        catch { }
        return [];
    }
    static recordAuditLog(action, target, actor = "Super Admin") {
        if (typeof window === "undefined")
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
            localStorage.setItem("billcraft_admin_audit_logs", JSON.stringify(logs.slice(0, 100)));
        }
        catch { }
    }
    // Generator Field Visibility Controls (Description, Qty, Unit, Price, Amount default)
    static getGeneratorSettings() {
        const defaults = {
            showHsnColumn: false,
            showTaxRateColumn: false,
            showUnitColumn: true,
            showDiscountColumn: false,
        };
        if (typeof window === "undefined")
            return defaults;
        try {
            const stored = localStorage.getItem("invoxa_generator_field_settings");
            if (stored) {
                return { ...defaults, ...JSON.parse(stored) };
            }
        }
        catch { }
        return defaults;
    }
    static updateGeneratorSettings(settings) {
        const current = this.getGeneratorSettings();
        const updated = { ...current, ...settings };
        if (typeof window !== "undefined") {
            localStorage.setItem("invoxa_generator_field_settings", JSON.stringify(updated));
            window.dispatchEvent(new Event("invoxa-generator-settings-updated"));
            window.dispatchEvent(new Event("billcraft-generator-settings-updated"));
            this.recordAuditLog("UPDATE_GENERATOR_FIELDS", "Generator Field Settings", "Super Admin");
        }
        return updated;
    }
}
