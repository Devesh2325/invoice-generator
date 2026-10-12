import { PLANS } from '@invoice/core';
export class TeamApi {
    static getMembersKey(tenantId) {
        return `billcraft_team_members_${tenantId}`;
    }
    static getInvitesKey(tenantId) {
        return `billcraft_team_invites_${tenantId}`;
    }
    static getPlanKey(tenantId) {
        return `billcraft_tenant_plan_${tenantId}`;
    }
    static getMembers(tenantId) {
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
                if (Array.isArray(parsed) && parsed.length > 0)
                    return parsed;
            }
        }
        catch (e) {
            console.error('Failed to get team members:', e);
        }
        // Default primary owner
        const defaultList = [
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
        }
        catch { }
        return defaultList;
    }
    static getInvites(tenantId) {
        if (typeof window === 'undefined')
            return [];
        try {
            const stored = localStorage.getItem(this.getInvitesKey(tenantId));
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed))
                    return parsed;
            }
        }
        catch (e) { }
        return [];
    }
    static inviteMember(tenantId, email, role, invitedBy = 'Owner') {
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
        const newInvite = {
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
    static cancelInvite(tenantId, inviteId) {
        const invites = this.getInvites(tenantId);
        const updated = invites.filter((i) => i.id !== inviteId);
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.getInvitesKey(tenantId), JSON.stringify(updated));
        }
        return true;
    }
    static removeMember(tenantId, memberId) {
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
    static updateMemberRole(tenantId, memberId, role) {
        const members = this.getMembers(tenantId);
        const updated = members.map((m) => (m.id === memberId ? { ...m, role } : m));
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.getMembersKey(tenantId), JSON.stringify(updated));
        }
        return true;
    }
    static getTenantPlan(tenantId) {
        if (typeof window === 'undefined')
            return 'starter';
        try {
            const stored = localStorage.getItem(this.getPlanKey(tenantId));
            if (stored && ['starter', 'pro', 'enterprise'].includes(stored)) {
                return stored;
            }
        }
        catch { }
        return 'starter';
    }
    static updateTenantPlan(tenantId, planId) {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(this.getPlanKey(tenantId), planId);
                return true;
            }
            catch { }
        }
        return false;
    }
}
