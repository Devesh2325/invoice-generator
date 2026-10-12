import { TeamMember, TeamInvite, TeamRole, PlanId } from '@invoice/core';
export declare class TeamApi {
    private static getMembersKey;
    private static getInvitesKey;
    private static getPlanKey;
    static getMembers(tenantId: string): TeamMember[];
    static getInvites(tenantId: string): TeamInvite[];
    static inviteMember(tenantId: string, email: string, role: TeamRole, invitedBy?: string): {
        success: boolean;
        error?: string;
        invite?: TeamInvite;
    };
    static cancelInvite(tenantId: string, inviteId: string): boolean;
    static removeMember(tenantId: string, memberId: string): boolean;
    static updateMemberRole(tenantId: string, memberId: string, role: TeamRole): boolean;
    static getTenantPlan(tenantId: string): PlanId;
    static updateTenantPlan(tenantId: string, planId: PlanId): boolean;
}
