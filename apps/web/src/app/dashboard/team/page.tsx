'use client';

import React, { useState, useEffect } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TeamApi } from '@invoice/api';
import { TeamMember, TeamInvite, TeamRole, PLANS } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UpgradePlanModal } from '@/components/modals/upgrade-plan-modal';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function TeamManagementPage() {
  const { activeTenant } = useTenant();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('editor');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const tenantId = activeTenant?.id || 'default_tenant';
  const currentPlanId = TeamApi.getTenantPlan(tenantId);
  const currentPlan = PLANS[currentPlanId];

  const loadTeamData = () => {
    setMembers(TeamApi.getMembers(tenantId));
    setInvites(TeamApi.getInvites(tenantId));
  };

  useEffect(() => {
    loadTeamData();
  }, [tenantId]);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    const res = TeamApi.inviteMember(tenantId, inviteEmail, inviteRole);
    if (!res.success) {
      if (res.error?.includes('upgrade')) {
        setInviteModalOpen(false);
        setUpgradeModalOpen(true);
      } else {
        setInviteError(res.error || 'Failed to send invite.');
      }
      return;
    }

    setInviteSuccess(true);
    setInviteEmail('');
    loadTeamData();
    setTimeout(() => {
      setInviteSuccess(false);
      setInviteModalOpen(false);
    }, 1500);
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member from the workspace?')) {
      TeamApi.removeMember(tenantId, memberId);
      loadTeamData();
    }
  };

  const handleCancelInvite = (inviteId: string) => {
    TeamApi.cancelInvite(tenantId, inviteId);
    loadTeamData();
  };

  const roleBadge = (role: TeamRole) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-300">Owner</Badge>;
      case 'admin':
        return <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-300">Admin</Badge>;
      case 'editor':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-300">Editor</Badge>;
      case 'viewer':
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-300">Viewer</Badge>;
    }
  };

  const permissionsMatrix = [
    { action: 'Create & Edit Invoices, POs, Estimates', owner: true, admin: true, editor: true, viewer: false },
    { action: 'Record Payments & Issue Refunds', owner: true, admin: true, editor: true, viewer: false },
    { action: 'View Invoices, Reports & PDFs', owner: true, admin: true, editor: true, viewer: true },
    { action: 'Manage Client & Product Catalog', owner: true, admin: true, editor: true, viewer: false },
    { action: 'Invite & Manage Team Members', owner: true, admin: true, editor: false, viewer: false },
    { action: 'Configure Bank Details & UPI QR', owner: true, admin: true, editor: false, viewer: false },
    { action: 'Manage Workspace Billing & Plan', owner: true, admin: false, editor: false, viewer: false },
  ];

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Team Members & Permissions
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage collaborators, assign role-based permissions, and control team seat limits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => {
                if (members.length >= currentPlan.maxMembers) {
                  setUpgradeModalOpen(true);
                } else {
                  setInviteModalOpen(true);
                }
              }}
              className="text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="h-4 w-4" /> Invite Member
            </Button>
          </div>
        </div>

        {/* Seat Usage Bar */}
        <Card className="border-border bg-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Active Seats:</span>
              <span className="text-xs font-mono font-bold text-primary">
                {members.length} / {currentPlan.maxMembers === 999 ? 'Unlimited' : currentPlan.maxMembers} seats
              </span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold">
                {currentPlan.name} Plan
              </Badge>
            </div>
            <div className="w-48 sm:w-64 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (members.length / (currentPlan.maxMembers === 999 ? 10 : currentPlan.maxMembers)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {currentPlanId === 'starter' && (
            <Link href="/dashboard/billing">
              <Button size="sm" variant="outline" className="text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" /> Upgrade Plan for 5+ Seats
              </Button>
            </Link>
          )}
        </Card>

        {/* Members Table */}
        <Card className="border-border bg-card rounded-2xl overflow-hidden shadow-xs">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Current Team Members ({members.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Collaborators currently active in this workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {m.name[0] || m.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{m.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{roleBadge(m.role)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-[11px]">{m.joinedAt}</td>
                      <td className="py-3 px-4 text-right">
                        {m.role !== 'owner' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(m.id)}
                            className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-semibold">Primary Owner</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {invites.length > 0 && (
          <Card className="border-border bg-card rounded-2xl overflow-hidden shadow-xs">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" /> Pending Invitations ({invites.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground uppercase text-[10px]">
                      <th className="py-3 px-4">Invited Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Invited On</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {invites.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-3 px-4 font-mono font-medium">{inv.email}</td>
                        <td className="py-3 px-4">{roleBadge(inv.role)}</td>
                        <td className="py-3 px-4 text-muted-foreground text-[11px]">
                          {new Date(inv.invitedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelInvite(inv.id)}
                            className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
                          >
                            Cancel
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role Permissions Matrix */}
        <Card className="border-border bg-card rounded-2xl overflow-hidden shadow-xs">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Role-Based Access Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              Understand permissions granted to each workspace member
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground uppercase text-[10px]">
                  <th className="py-2.5 px-4">Platform Capability</th>
                  <th className="py-2.5 px-4 text-center">Owner</th>
                  <th className="py-2.5 px-4 text-center">Admin</th>
                  <th className="py-2.5 px-4 text-center">Editor</th>
                  <th className="py-2.5 px-4 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {permissionsMatrix.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/10">
                    <td className="py-2.5 px-4 text-foreground font-medium">{p.action}</td>
                    <td className="py-2.5 px-4 text-center">
                      <Check className="h-3.5 w-3.5 text-emerald-600 mx-auto" />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {p.admin ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 mx-auto" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {p.editor ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 mx-auto" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {p.viewer ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 mx-auto" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Invite Member Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md p-6 border-border bg-card rounded-2xl">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-base font-bold text-foreground">Invite Team Member</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Send an email invitation to join this workspace
            </DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <div className="font-bold text-sm text-foreground">Invitation Sent!</div>
              <p className="text-xs text-muted-foreground">The member has been added to pending invites.</p>
            </div>
          ) : (
            <form onSubmit={handleSendInvite} className="space-y-4 pt-2 text-xs">
              {inviteError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">
                  {inviteError}
                </div>
              )}

              <div>
                <label className="font-semibold text-foreground block mb-1">Email Address *</label>
                <Input
                  type="email"
                  required
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Workspace Role *</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="admin">Admin (Can manage settings & invite teammates)</option>
                  <option value="editor">Editor (Can create & edit invoices & items)</option>
                  <option value="viewer">Viewer (Read-only access to invoices)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="font-bold text-xs">
                  Send Invitation
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        title="Upgrade to Add More Team Members"
        description={`Your current plan allows up to ${currentPlan.maxMembers} seat(s). Upgrade to Professional for 5 seats or Enterprise for unlimited team collaboration.`}
      />
    </TenantLayout>
  );
}
