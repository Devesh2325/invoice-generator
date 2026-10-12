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

export const PLANS: Record<PlanId, PlanLimits> = {
  starter: {
    id: 'starter',
    name: 'Starter / Free',
    priceMonthly: 0,
    priceYearly: 0,
    maxMembers: 1,
    maxInvoicesPerMonth: 50,
    hasAllTemplates: false,
    canRemoveWatermark: false,
    canUseCustomDomain: false,
    hasPrioritySupport: false,
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    priceMonthly: 799,
    priceYearly: 639,
    maxMembers: 5,
    maxInvoicesPerMonth: 500,
    hasAllTemplates: true,
    canRemoveWatermark: true,
    canUseCustomDomain: false,
    hasPrioritySupport: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 2499,
    priceYearly: 1999,
    maxMembers: 999,
    maxInvoicesPerMonth: 99999,
    hasAllTemplates: true,
    canRemoveWatermark: true,
    canUseCustomDomain: true,
    hasPrioritySupport: true,
  },
};
