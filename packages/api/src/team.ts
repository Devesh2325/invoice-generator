import { TeamMember, TeamInvite, TeamRole, PlanId, PLANS } from '@invoice/core';

export class TeamApi {
  private static getMembersKey(tenantId: string) {
    return `billcraft_team_members_${tenantId}`;
  }

  private static getInvitesKey(tenantId: string) {
    return `billcraft_team_invites_${tenantId}`;
  }

  private static getPlanKey(tenantId: string) {
    return `billcraft_tenant_plan_${tenantId}`;
  }

  static getMembers(tenantId: string): TeamMember[] {
    if (typeof window === 'undefined') {
      return [
        {
          id: 'mem_owner',
          tenantId,
          email: 'admin@acmedesign.io',
          name: 'Acme Admin',
          role: 'owner',
          status: 'active',
          joinedAt: '2026-01-10',
        },
      ];
    }

    try {
      const stored = localStorage.getItem(this.getMembersKey(tenantId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to get team members:', e);
    }

    // Default primary owner
    const defaultList: TeamMember[] = [
      {
        id: `mem_owner_${tenantId}`,
        tenantId,
        email: 'admin@acmedesign.io',
        name: 'Workspace Owner',
        role: 'owner',
        status: 'active',
        joinedAt: '2026-01-10',
      },
    ];

    try {
      localStorage.setItem(this.getMembersKey(tenantId), JSON.stringify(defaultList));
    } catch {}

    return defaultList;
  }

  static getInvites(tenantId: string): TeamInvite[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(this.getInvitesKey(tenantId));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  static inviteMember(
    tenantId: string,
    email: string,
    role: TeamRole,
    invitedBy: string = 'Owner'
  ): { success: boolean; error?: string; invite?: TeamInvite } {
    const currentMembers = this.getMembers(tenantId);
    const plan = this.getTenantPlan(tenantId);
    const planLimits = PLANS[plan];

    if (currentMembers.length >= planLimits.maxMembers) {
      return {
        success: false,
        error: `Your current plan (${planLimits.name}) allows up to ${planLimits.maxMembers} seat(s). Please upgrade to invite more members.`,
      };
    }

    if (currentMembers.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      return {
        success: false,
        error: 'A team member with this email address already belongs to this workspace.',
      };
    }

    const invites = this.getInvites(tenantId);
    if (invites.some((i) => i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending')) {
      return {
        success: false,
        error: 'An active invitation is already pending for this email.',
      };
    }

    const newInvite: TeamInvite = {
      id: `inv_${Date.now()}`,
      tenantId,
      email,
      role,
      invitedBy,
      invitedAt: new Date().toISOString(),
      status: 'pending',
    };

    const updatedInvites = [...invites, newInvite];
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.getInvitesKey(tenantId), JSON.stringify(updatedInvites));
    }

    return { success: true, invite: newInvite };
  }

  static cancelInvite(tenantId: string, inviteId: string): boolean {
    const invites = this.getInvites(tenantId);
    const updated = invites.filter((i) => i.id !== inviteId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.getInvitesKey(tenantId), JSON.stringify(updated));
    }
    return true;
  }

  static removeMember(tenantId: string, memberId: string): boolean {
    const members = this.getMembers(tenantId);
    const target = members.find((m) => m.id === memberId);
    if (target?.role === 'owner') {
      return false; // Cannot remove owner
    }
    const updated = members.filter((m) => m.id !== memberId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.getMembersKey(tenantId), JSON.stringify(updated));
    }
    return true;
  }

  static updateMemberRole(tenantId: string, memberId: string, role: TeamRole): boolean {
    const members = this.getMembers(tenantId);
    const updated = members.map((m) => (m.id === memberId ? { ...m, role } : m));
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.getMembersKey(tenantId), JSON.stringify(updated));
    }
    return true;
  }

  static getTenantPlan(tenantId: string): PlanId {
    if (typeof window === 'undefined') return 'starter';
    try {
      const stored = localStorage.getItem(this.getPlanKey(tenantId));
      if (stored && ['starter', 'pro', 'enterprise'].includes(stored)) {
        return stored as PlanId;
      }
    } catch {}
    return 'starter';
  }

  static updateTenantPlan(tenantId: string, planId: PlanId): boolean {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.getPlanKey(tenantId), planId);
        return true;
      } catch {}
    }
    return false;
  }
}
