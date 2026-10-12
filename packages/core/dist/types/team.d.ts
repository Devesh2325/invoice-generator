export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';
export interface TeamMember {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: TeamRole;
    avatarUrl?: string;
    status: 'active' | 'invited';
    joinedAt: string;
}
export interface TeamInvite {
    id: string;
    tenantId: string;
    email: string;
    role: TeamRole;
    invitedBy: string;
    invitedAt: string;
    status: 'pending' | 'accepted' | 'cancelled';
}
export type PlanId = 'starter' | 'pro' | 'enterprise';
export interface PlanLimits {
    id: PlanId;
    name: string;
    priceMonthly: number;
    priceYearly: number;
    maxMembers: number;
    maxInvoicesPerMonth: number;
    hasAllTemplates: boolean;
    canRemoveWatermark: boolean;
    canUseCustomDomain: boolean;
    hasPrioritySupport: boolean;
}
export declare const PLANS: Record<PlanId, PlanLimits>;
