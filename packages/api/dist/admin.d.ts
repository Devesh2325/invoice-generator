import { AdminUser, AdminInquiry, AdminSiteSettings, AdminSystemAuditLog, AdminTemplateSetting, AdminTeam, PlanId, PlanLimits } from "@invoice/core";
export declare class AdminApi {
    private static getSessionKey;
    private static getRateLimitKey;
    static login(email: string, pass: string): {
        success: boolean;
        error?: string;
    };
    static isAuthenticated(): boolean;
    static logout(): void;
    static getDashboardMetrics(): {
        totalUsers: number;
        activeSubscribers: number;
        monthlyRecurringRevenue: number;
        invoicesThisMonth: number;
        userGrowth: {
            month: string;
            count: number;
        }[];
    };
    static getUsers(): AdminUser[];
    static updateUser(userId: string, patch: Partial<AdminUser>): boolean;
    static banUser(userId: string): boolean;
    static unbanUser(userId: string): boolean;
    static getPlans(): Record<PlanId, PlanLimits>;
    static updatePlan(planId: PlanId, limits: Partial<PlanLimits>): boolean;
    static getTemplates(): AdminTemplateSetting[];
    static updateTemplate(templateId: string, patch: Partial<AdminTemplateSetting>): boolean;
    static getTeams(): AdminTeam[];
    static createTeam(params: {
        name: string;
        ownerEmail: string;
        ownerPassword?: string;
        plan?: PlanId;
        currency?: string;
        isWhiteLabel?: boolean;
        companyDisplayName?: string;
        logoUrl?: string;
    }): AdminTeam;
    static updateTeam(teamId: string, patch: Partial<AdminTeam> & {
        ownerPassword?: string;
        companyDisplayName?: string;
        logoUrl?: string;
    }): boolean;
    static getInquiries(): AdminInquiry[];
    static updateInquiry(inquiryId: string, status: "new" | "in_progress" | "resolved", notes?: string): boolean;
    static deleteInquiry(inquiryId: string): boolean;
    static getSiteSettings(): AdminSiteSettings;
    static updateSiteSettings(settings: AdminSiteSettings): boolean;
    static getSystemAuditLogs(): AdminSystemAuditLog[];
    static recordAuditLog(action: string, target: string, actor?: string): void;
}
