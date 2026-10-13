import {
  AdminUser,
  AdminInquiry,
  AdminSiteSettings,
  AdminSystemAuditLog,
  AdminTemplateSetting,
  AdminTeam,
  PlanId,
  PlanLimits,
  PLANS,
} from '@invoice/core';

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@billcraft.io';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 mins

export class AdminApi {
  private static getSessionKey() {
    return 'billcraft_admin_session';
  }

  private static getRateLimitKey() {
    return 'billcraft_admin_ratelimit';
  }

  // Rate-Limited Login
  static login(email: string, pass: string): { success: boolean; error?: string } {
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
    } catch {}

    const isMatch =
      email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() &&
      pass === SUPER_ADMIN_PASSWORD;

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
      } catch {}
      return { success: false, error: 'Invalid credentials.' };
    }

    // Successful Login: Reset lockout and create session
    try {
      localStorage.removeItem(this.getRateLimitKey());
      localStorage.setItem(
        this.getSessionKey(),
        JSON.stringify({
          email: SUPER_ADMIN_EMAIL,
          role: 'super_admin',
          authenticatedAt: new Date().toISOString(),
        })
      );
      this.recordAuditLog('SUPER_ADMIN_LOGIN', 'Portal Access', SUPER_ADMIN_EMAIL);
    } catch {}

    return { success: true };
  }

  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem(this.getSessionKey());
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return parsed && parsed.role === 'super_admin';
    } catch {
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
      } catch {}
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
  static getUsers(): AdminUser[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('billcraft_admin_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      // Also check registered users
      const regRaw = localStorage.getItem('billcraft_registered_users');
      if (regRaw) {
        const registered = JSON.parse(regRaw);
        if (Array.isArray(registered) && registered.length > 0) {
          const mapped: AdminUser[] = registered.map((u: any) => ({
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
    } catch {}

    return [];
  }

  static updateUser(userId: string, patch: Partial<AdminUser>): boolean {
    const users = this.getUsers();
    const updated = users.map((u) => (u.id === userId ? { ...u, ...patch } : u));
    if (typeof window !== 'undefined') {
      localStorage.setItem('billcraft_admin_users', JSON.stringify(updated));
      this.recordAuditLog('UPDATE_USER', `User #${userId}`, 'Super Admin');
    }
    return true;
  }

  static banUser(userId: string): boolean {
    return this.updateUser(userId, { status: 'banned' });
  }

  static unbanUser(userId: string): boolean {
    return this.updateUser(userId, { status: 'active' });
  }

  // Plans Management
  static getPlans(): Record<PlanId, PlanLimits> {
    if (typeof window === 'undefined') return PLANS;
    try {
      const stored = localStorage.getItem('billcraft_admin_plans');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return PLANS;
  }

  static updatePlan(planId: PlanId, limits: Partial<PlanLimits>): boolean {
    const current = this.getPlans();
    if (!current[planId]) return false;
    current[planId] = { ...current[planId], ...limits };
    if (typeof window !== 'undefined') {
      localStorage.setItem('billcraft_admin_plans', JSON.stringify(current));
      this.recordAuditLog('UPDATE_PLAN_LIMITS', `Plan: ${planId}`, 'Super Admin');
    }
    return true;
  }

  // Template Management
  static getTemplates(): AdminTemplateSetting[] {
    const seeds: AdminTemplateSetting[] = [
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

    if (typeof window === 'undefined') return seeds;
    try {
      const stored = localStorage.getItem('billcraft_admin_templates');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('billcraft_admin_templates', JSON.stringify(seeds));
    } catch {}
    return seeds;
  }

  static updateTemplate(templateId: string, patch: Partial<AdminTemplateSetting>): boolean {
    const templates = this.getTemplates();
    const updated = templates.map((t) => (t.id === templateId ? { ...t, ...patch } : t));
    if (typeof window !== 'undefined') {
      localStorage.setItem('billcraft_admin_templates', JSON.stringify(updated));
      this.recordAuditLog('UPDATE_TEMPLATE', `Template: ${templateId}`, 'Super Admin');
    }
    return true;
  }

  // Teams & Workspaces Management - Starts empty
  static getTeams(): AdminTeam[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('billcraft_admin_teams');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      // Also check if any custom tenants exist
      const ctRaw = localStorage.getItem('billcraft_custom_tenants');
      if (ctRaw) {
        const ct = JSON.parse(ctRaw);
        if (Array.isArray(ct) && ct.length > 0) {
          return ct.map((t: any) => ({
            id: t.id,
            name: t.name,
            ownerEmail: t.ownerUserId || 'owner@workspace.io',
            membersCount: 1,
            invoicesCount: 0,
            plan: 'starter' as PlanId,
            status: 'active' as const,
            createdAt: new Date().toISOString().split('T')[0],
            isWhiteLabel: Boolean(t.isWhiteLabel),
          }));
        }
      }
    } catch {}
    return [];
  }

  static createTeam(params: {
    name: string;
    ownerEmail: string;
    plan?: PlanId;
    currency?: string;
    isWhiteLabel?: boolean;
  }): AdminTeam {
    const teams = this.getTeams();
    const newTeam: AdminTeam = {
      id: `tm_${Date.now()}`,
      name: params.name,
      ownerEmail: params.ownerEmail,
      membersCount: 1,
      invoicesCount: 0,
      plan: params.plan || 'starter',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      isWhiteLabel: Boolean(params.isWhiteLabel),
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
        };
        localStorage.setItem('billcraft_custom_tenants', JSON.stringify([newTenant, ...existingTenants]));
      } catch {}
      this.recordAuditLog('CREATE_WORKSPACE', `Team: ${newTeam.name} (${newTeam.id})`, 'Super Admin');
    }
    return newTeam;
  }

  static updateTeam(teamId: string, patch: Partial<AdminTeam>): boolean {
    const teams = this.getTeams();
    const updated = teams.map((t) => (t.id === teamId ? { ...t, ...patch } : t));
    if (typeof window !== 'undefined') {
      localStorage.setItem('billcraft_admin_teams', JSON.stringify(updated));
      this.recordAuditLog('UPDATE_WORKSPACE', `Team: ${teamId}`, 'Super Admin');
    }
    return true;
  }

  // Inquiries Management - Starts empty
  static getInquiries(): AdminInquiry[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('billcraft_inquiries');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  static updateInquiry(inquiryId: string, status: 'new' | 'in_progress' | 'resolved', notes?: string): boolean {
    const inquiries = this.getInquiries();
    const updated = inquiries.map((i) =>
      i.id === inquiryId ? { ...i, status, notes: notes !== undefined ? notes : i.notes } : i
    );
    if (typeof window !== 'undefined') {
      localStorage.setItem('billcraft_inquiries', JSON.stringify(updated));
      this.recordAuditLog('UPDATE_INQUIRY', `Inquiry #${inquiryId}`, 'Super Admin');
    }
    return true;
  }

  static deleteInquiry(inquiryId: string): boolean {
    const inquiries = this.getInquiries();
    const filtered = inquiries.filter((i) => i.id !== inquiryId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('billcraft_inquiries', JSON.stringify(filtered));
      this.recordAuditLog('DELETE_INQUIRY', `Inquiry #${inquiryId}`, 'Super Admin');
    }
    return true;
  }

  // Site Settings
  static getSiteSettings(): AdminSiteSettings {
    const defaults: AdminSiteSettings = {
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

    if (typeof window === 'undefined') return defaults;
    try {
      const stored = localStorage.getItem('billcraft_admin_settings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    return defaults;
  }

  static updateSiteSettings(settings: AdminSiteSettings): boolean {
    if (typeof window !== 'undefined') {
      localStorage.setItem('billcraft_admin_settings', JSON.stringify(settings));
      this.recordAuditLog('UPDATE_SITE_SETTINGS', 'Site Configuration', 'Super Admin');
      return true;
    }
    return false;
  }

  // System Audit Logs - Starts empty
  static getSystemAuditLogs(): AdminSystemAuditLog[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('billcraft_admin_audit_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  static recordAuditLog(action: string, target: string, actor: string = 'Super Admin') {
    if (typeof window === 'undefined') return;
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
    } catch {}
  }
}
