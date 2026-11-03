import {
  AdminUser,
  AdminInquiry,
  AdminSystemAuditLog,
  GeneratorFieldSettings,
  AdminTeam,
  PlanId,
  PlanLimits,
  PLANS,
  APP_CONFIG,
  resolveTemplateId,
} from "@invoice/core";

export class AdminApi {
  // Dashboard KPIs
  static getDashboardMetrics() {
    const users = this.getUsers();
    const activeSubscribers = users.filter((u) => u.plan !== "starter");
    const mrr = activeSubscribers.reduce((acc, u) => {
      return (
        acc +
        (u.plan === "pro"
          ? APP_CONFIG.plans.pro.price
          : APP_CONFIG.plans.enterprise.price)
      );
    }, 0);

    let documentsCount = 0;
    if (typeof window !== "undefined") {
      try {
        const docsRaw = localStorage.getItem("billcraft_tenant_documents");
        if (docsRaw) {
          const byTenant = JSON.parse(docsRaw) as Record<string, unknown[]>;
          documentsCount = Object.values(byTenant).reduce(
            (sum, list) => sum + (Array.isArray(list) ? list.length : 0),
            0,
          );
        }
      } catch { }
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
  static getUsers(): AdminUser[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("billcraft_admin_users");
      let adminUsers: AdminUser[] = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) adminUsers = parsed;
      }

      // Also merge registered users
      const regRaw = localStorage.getItem("billcraft_registered_users");
      if (regRaw) {
        const registered = JSON.parse(regRaw);
        if (Array.isArray(registered) && registered.length > 0) {
          registered.forEach((u: any) => {
            const exists = adminUsers.some(
              (au) =>
                au.id === u.id ||
                (au.email && au.email.toLowerCase() === (u.email || "").toLowerCase())
            );
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
    } catch { }

    return [];
  }

  static updateUser(userId: string, patch: Partial<AdminUser>): boolean {
    const users = this.getUsers();
    const updated = users.map((u) =>
      u.id === userId || (patch.email && u.email === patch.email)
        ? { ...u, ...patch }
        : u,
    );
    if (typeof window !== "undefined") {
      localStorage.setItem("billcraft_admin_users", JSON.stringify(updated));
      // Also update registered users if present
      try {
        const regRaw = localStorage.getItem("billcraft_registered_users");
        if (regRaw) {
          const registered = JSON.parse(regRaw);
          if (Array.isArray(registered)) {
            const regUpdated = registered.map((u: any) =>
              u.id === userId ? { ...u, ...patch } : u
            );
            localStorage.setItem("billcraft_registered_users", JSON.stringify(regUpdated));
          }
        }
      } catch { }
      this.recordAuditLog("UPDATE_USER", `User #${userId}`, "Super Admin");
    }
    return true;
  }

  static banUser(userId: string): boolean {
    return this.updateUser(userId, { status: "banned" });
  }

  static unbanUser(userId: string): boolean {
    return this.updateUser(userId, { status: "active" });
  }

  static deleteUser(userIdOrEmail: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      const target = (userIdOrEmail || "").trim().toLowerCase();
      if (!target) return false;

      // 1. Remove from billcraft_admin_users
      const adminUsers = this.getUsers().filter(
        (u) =>
          (u.id || "").toLowerCase() !== target &&
          (u.email || "").toLowerCase() !== target
      );
      localStorage.setItem("billcraft_admin_users", JSON.stringify(adminUsers));

      // 2. Remove from billcraft_registered_users
      try {
        const regRaw = localStorage.getItem("billcraft_registered_users");
        if (regRaw) {
          const registered = JSON.parse(regRaw);
          if (Array.isArray(registered)) {
            const filtered = registered.filter(
              (u: any) =>
                (u.id || "").toLowerCase() !== target &&
                (u.email || "").toLowerCase() !== target
            );
            localStorage.setItem("billcraft_registered_users", JSON.stringify(filtered));
          }
        }
      } catch { }

      // 3. Remove custom tenants associated with this user
      try {
        const tenantsRaw = localStorage.getItem("billcraft_custom_tenants");
        if (tenantsRaw) {
          const tenants = JSON.parse(tenantsRaw);
          if (Array.isArray(tenants)) {
            const filteredTenants = tenants.filter(
              (t: any) =>
                (t.ownerUserId || "").toLowerCase() !== target &&
                (t.id || "").toLowerCase() !== `tenant_${target}`
            );
            localStorage.setItem("billcraft_custom_tenants", JSON.stringify(filteredTenants));
          }
        }
      } catch { }

      // 4. Clear impersonation session if active for this user
      try {
        const impTargetRaw = localStorage.getItem("billcraft_impersonated_target");
        if (impTargetRaw) {
          const imp = JSON.parse(impTargetRaw);
          if (
            (imp.id || "").toLowerCase() === target ||
            (imp.email || "").toLowerCase() === target
          ) {
            localStorage.removeItem("billcraft_impersonated_target");
            localStorage.removeItem("billcraft_is_impersonating");
          }
        }
      } catch { }

      this.recordAuditLog("DELETE_USER", `User: ${userIdOrEmail}`, "Super Admin");
      return true;
    } catch {
      return false;
    }
  }

  // Plans Management
  static getPlans(): Record<PlanId, PlanLimits> {
    if (typeof window === "undefined") return PLANS;
    try {
      const stored = localStorage.getItem("billcraft_admin_plans");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch { }
    return PLANS;
  }

  static updatePlan(planId: PlanId, limits: Partial<PlanLimits>): boolean {
    const current = this.getPlans();
    if (!current[planId]) return false;
    current[planId] = { ...current[planId], ...limits };
    if (typeof window !== "undefined") {
      localStorage.setItem("billcraft_admin_plans", JSON.stringify(current));
      this.recordAuditLog(
        "UPDATE_PLAN_LIMITS",
        `Plan: ${planId}`,
        "Super Admin",
      );
    }
    return true;
  }

  // Template availability. Only templates switched off are stored.
  static getDisabledTemplateIds(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const parsed = JSON.parse(localStorage.getItem("billcraft_admin_templates") || "[]");
      return parsed
        .filter((t: { enabled?: boolean }) => t.enabled === false)
        .map((t: { id: string }) => resolveTemplateId(t.id));
    } catch {
      return [];
    }
  }

  static setTemplateEnabled(templateId: string, enabled: boolean): void {
    if (typeof window === "undefined") return;
    const disabled = new Set(this.getDisabledTemplateIds());
    if (enabled) disabled.delete(templateId);
    else disabled.add(templateId);
    localStorage.setItem(
      "billcraft_admin_templates",
      JSON.stringify([...disabled].map((id) => ({ id, enabled: false }))),
    );
    window.dispatchEvent(new Event("invoxa-templates-updated"));
    this.recordAuditLog(
      enabled ? "ENABLE_TEMPLATE" : "DISABLE_TEMPLATE",
      `Template: ${templateId}`,
      "Super Admin",
    );
  }

  // Teams & Workspaces Management - Starts empty
  static getTeams(): AdminTeam[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("billcraft_admin_teams");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      // Also check if any custom tenants exist
      const ctRaw = localStorage.getItem("billcraft_custom_tenants");
      if (ctRaw) {
        const ct = JSON.parse(ctRaw);
        if (Array.isArray(ct) && ct.length > 0) {
          return ct.map((t: any) => ({
            id: t.id,
            name: t.name,
            ownerEmail: t.ownerUserId || "owner@workspace.io",
            membersCount: 1,
            invoicesCount: 0,
            plan: "starter" as PlanId,
            status: "active" as const,
            createdAt: new Date().toISOString().split("T")[0],
            isWhiteLabel: Boolean(t.isWhiteLabel),
          }));
        }
      }
    } catch { }
    return [];
  }

  static createTeam(params: {
    name: string;
    ownerEmail: string;
    ownerPassword?: string;
    plan?: PlanId;
    currency?: string;
    isWhiteLabel?: boolean;
    companyDisplayName?: string;
    logoUrl?: string;
    primaryColor?: string;
    supportEmail?: string;
    websiteUrl?: string;
    footerText?: string;
    customDomain?: string;
  }): AdminTeam {
    const teams = this.getTeams();
    const newTeam: AdminTeam = {
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
      primaryColor: params.primaryColor,
      supportEmail: params.supportEmail,
      websiteUrl: params.websiteUrl,
      footerText: params.footerText,
      customDomain: params.customDomain,
      ownerPassword: params.ownerPassword,
    };
    const updated = [newTeam, ...teams];
    if (typeof window !== "undefined") {
      localStorage.setItem("billcraft_admin_teams", JSON.stringify(updated));
      // Mirror to custom tenants for app usage
      try {
        const existingTenantsRaw = localStorage.getItem(
          "billcraft_custom_tenants",
        );
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
        localStorage.setItem(
          "billcraft_custom_tenants",
          JSON.stringify([newTenant, ...existingTenants]),
        );
      } catch { }
      // Store white-label brand settings if provided
      if (
        params.isWhiteLabel &&
        (params.companyDisplayName || params.logoUrl)
      ) {
        try {
          const brands = JSON.parse(localStorage.getItem("billcraft_tenant_brand") || "{}");
          brands[newTeam.id] = {
            tenantId: newTeam.id,
            businessName: params.companyDisplayName || params.name,
            logoUrl: params.logoUrl || "",
            whiteLabelEnabled: true,
            primaryColor: params.primaryColor || "#3B82F6",
            secondaryColor: "#64748B",
            fontFamily: "sans",
            supportEmail: params.supportEmail || "",
            websiteUrl: params.websiteUrl || "",
            footerText: params.footerText,
          };
          localStorage.setItem("billcraft_tenant_brand", JSON.stringify(brands));
        } catch { }
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
        } catch { }
      }
      // Synchronize with registered users so owner can immediately log in at /login
      try {
        const regRaw = localStorage.getItem("billcraft_registered_users");
        const regUsers = regRaw ? JSON.parse(regRaw) : [];
        const normalizedEmail = params.ownerEmail.trim().toLowerCase();
        const existingIdx = regUsers.findIndex(
          (u: any) => u.email === normalizedEmail,
        );
        const userObj = {
          id: existingIdx >= 0 ? regUsers[existingIdx].id : `usr_${Date.now()}`,
          email: normalizedEmail,
          name: params.companyDisplayName || params.name,
          workspaceName: params.name,
          tenantId: newTeam.id,
          password:
            params.ownerPassword ||
            (existingIdx >= 0 ? regUsers[existingIdx].password : ""),
        };
        if (existingIdx >= 0) {
          regUsers[existingIdx] = { ...regUsers[existingIdx], ...userObj };
        } else {
          regUsers.push(userObj);
        }
        localStorage.setItem(
          "billcraft_registered_users",
          JSON.stringify(regUsers),
        );
      } catch { }
      this.recordAuditLog(
        "CREATE_WORKSPACE",
        `Team: ${newTeam.name} (${newTeam.id})${params.isWhiteLabel ? " [White-Label]" : ""}`,
        "Super Admin",
      );
    }
    return newTeam;
  }

  static updateTeam(
    teamId: string,
    patch: Partial<AdminTeam> & {
      ownerPassword?: string;
      companyDisplayName?: string;
      logoUrl?: string;
    },
  ): boolean {
    const teams = this.getTeams();
    const updated = teams.map((t) =>
      t.id === teamId ? { ...t, ...patch } : t,
    );
    if (typeof window !== "undefined") {
      localStorage.setItem("billcraft_admin_teams", JSON.stringify(updated));

      if (patch.plan) {
        try {
          localStorage.setItem(`billcraft_tenant_plan_${teamId}`, patch.plan);
          window.dispatchEvent(new Event("billcraft-plan-updated"));
          window.dispatchEvent(new Event("billcraft-auth-updated"));
        } catch { }
      }

      // Sync custom tenants
      try {
        const existingTenantsRaw = localStorage.getItem(
          "billcraft_custom_tenants",
        );
        if (existingTenantsRaw) {
          const tenants = JSON.parse(existingTenantsRaw);
          const nextTenants = tenants.map((t: any) => {
            if (t.id === teamId) {
              return {
                ...t,
                name: patch.name || t.name,
                isWhiteLabel:
                  patch.isWhiteLabel !== undefined
                    ? patch.isWhiteLabel
                    : t.isWhiteLabel,
                plan: patch.plan || t.plan,
              };
            }
            return t;
          });
          localStorage.setItem(
            "billcraft_custom_tenants",
            JSON.stringify(nextTenants),
          );
        }
      } catch { }

      // Sync brand settings
      try {
        const brands = JSON.parse(localStorage.getItem("billcraft_tenant_brand") || "{}");
        const currentBrand = brands[teamId] || {};
        const updatedBrand = {
          ...currentBrand,
          tenantId: teamId,
          businessName:
            patch.companyDisplayName || patch.name || currentBrand.businessName,
          logoUrl:
            patch.logoUrl !== undefined ? patch.logoUrl : currentBrand.logoUrl,
          whiteLabelEnabled:
            patch.isWhiteLabel !== undefined
              ? patch.isWhiteLabel
              : currentBrand.whiteLabelEnabled,
          primaryColor: patch.primaryColor || currentBrand.primaryColor,
          supportEmail: patch.supportEmail ?? currentBrand.supportEmail,
          websiteUrl: patch.websiteUrl ?? currentBrand.websiteUrl,
          footerText: patch.footerText ?? currentBrand.footerText,
        };
        brands[teamId] = updatedBrand;
        localStorage.setItem("billcraft_tenant_brand", JSON.stringify(brands));
      } catch { }

      // Sync with registered users
      if (
        patch.ownerEmail ||
        patch.ownerPassword ||
        patch.companyDisplayName ||
        patch.name
      ) {
        try {
          const regRaw = localStorage.getItem("billcraft_registered_users");
          if (regRaw) {
            const regUsers = JSON.parse(regRaw);
            const team = teams.find((t) => t.id === teamId);
            const targetEmail = (patch.ownerEmail || team?.ownerEmail || "")
              .trim()
              .toLowerCase();
            const idx = regUsers.findIndex(
              (u: any) => u.tenantId === teamId || u.email === targetEmail,
            );
            if (idx >= 0) {
              if (patch.ownerEmail)
                regUsers[idx].email = patch.ownerEmail.trim().toLowerCase();
              if (patch.ownerPassword)
                regUsers[idx].password = patch.ownerPassword;
              if (patch.companyDisplayName || patch.name)
                regUsers[idx].name = patch.companyDisplayName || patch.name;
              localStorage.setItem(
                "billcraft_registered_users",
                JSON.stringify(regUsers),
              );
            }
          }
        } catch { }
      }

      this.recordAuditLog("UPDATE_WORKSPACE", `Team: ${teamId}`, "Super Admin");
    }
    return true;
  }

  // Inquiries Management - Starts empty
  static getInquiries(): AdminInquiry[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("billcraft_inquiries");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { }
    return [];
  }

  static updateInquiry(
    inquiryId: string,
    status: "new" | "in_progress" | "resolved",
    notes?: string,
  ): boolean {
    const inquiries = this.getInquiries();
    const updated = inquiries.map((i) =>
      i.id === inquiryId
        ? { ...i, status, notes: notes !== undefined ? notes : i.notes }
        : i,
    );
    if (typeof window !== "undefined") {
      localStorage.setItem("billcraft_inquiries", JSON.stringify(updated));
      this.recordAuditLog(
        "UPDATE_INQUIRY",
        `Inquiry #${inquiryId}`,
        "Super Admin",
      );
    }
    return true;
  }

  static deleteInquiry(inquiryId: string): boolean {
    const inquiries = this.getInquiries();
    const filtered = inquiries.filter((i) => i.id !== inquiryId);
    if (typeof window !== "undefined") {
      localStorage.setItem("billcraft_inquiries", JSON.stringify(filtered));
      this.recordAuditLog(
        "DELETE_INQUIRY",
        `Inquiry #${inquiryId}`,
        "Super Admin",
      );
    }
    return true;
  }

  // System Audit Logs - Starts empty
  static getSystemAuditLogs(): AdminSystemAuditLog[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("billcraft_admin_audit_logs");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { }
    return [];
  }

  static recordAuditLog(
    action: string,
    target: string,
    actor: string = "Super Admin",
  ) {
    if (typeof window === "undefined") return;
    try {
      const logs = this.getSystemAuditLogs();
      logs.unshift({
        id: `log_${Date.now()}`,
        actor,
        action,
        target,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(
        "billcraft_admin_audit_logs",
        JSON.stringify(logs.slice(0, 100)),
      );
    } catch { }
  }

  // Generator Field Visibility Controls (Description, Qty, Unit, Price, Amount default)
  static getGeneratorSettings(): GeneratorFieldSettings {
    const defaults: GeneratorFieldSettings = {
      showHsnColumn: false,
      showTaxRateColumn: false,
      showUnitColumn: true,
      showDiscountColumn: false,
    };
    if (typeof window === "undefined") return defaults;
    try {
      const stored = localStorage.getItem("invoxa_generator_field_settings");
      if (stored) {
        return { ...defaults, ...JSON.parse(stored) };
      }
    } catch { }
    return defaults;
  }

  static updateGeneratorSettings(
    settings: Partial<GeneratorFieldSettings>,
  ): GeneratorFieldSettings {
    const current = this.getGeneratorSettings();
    const updated = { ...current, ...settings };
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "invoxa_generator_field_settings",
        JSON.stringify(updated),
      );
      window.dispatchEvent(new Event("invoxa-generator-settings-updated"));
      window.dispatchEvent(new Event("billcraft-generator-settings-updated"));
      this.recordAuditLog(
        "UPDATE_GENERATOR_FIELDS",
        "Generator Field Settings",
        "Super Admin",
      );
    }
    return updated;
  }
}
