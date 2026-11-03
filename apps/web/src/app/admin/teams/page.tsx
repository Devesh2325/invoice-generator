'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminApi, TeamApi, TenantApi } from '@invoice/api';
import { AdminTeam, PlanId, APP_CONFIG, PLANS } from '@invoice/core';
import { BrandingFields, EMPTY_BRAND, type BrandForm } from '@/components/admin/branding-fields';
import { adminRequest, brandingOf, syncWorkspaces, updateWorkspace } from '@/lib/platform/admin-client';
import { usePlatformPlans } from '@/lib/platform/platform-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { hashPassword } from '@/lib/auth/password';
import {
  Building,
  Search,
  Users,
  FileText,
  ShieldAlert,
  CheckCircle,
  Briefcase,
  Plus,
  Sparkles,
  Edit3,
  UserCog,
} from 'lucide-react';

/** Lists the plans with their current prices, so these never drift from the Plans page. */
function PlanOptions() {
  const price = (id: PlanId) => (PLANS[id].priceMonthly ? ` — ₹${PLANS[id].priceMonthly.toLocaleString('en-IN')}/month` : ' — Free');
  return (
    <>
      <option value="starter">Starter{price('starter')}</option>
      <option value="pro">Pro{price('pro')}</option>
      <option value="enterprise">Enterprise{price('enterprise')}</option>
    </>
  );
}

export default function AdminTeamsPage() {
  usePlatformPlans();
  const router = useRouter();
  const { toast } = useToast();
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Workspace form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [newPlan, setNewPlan] = useState<PlanId>('starter');
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);
  const [newBrand, setNewBrand] = useState<BrandForm>(EMPTY_BRAND);
  const [connected, setConnected] = useState(true);

  // Edit Workspace form state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState('');
  const [editTeamName, setEditTeamName] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');
  const [editPlan, setEditPlan] = useState<PlanId>('starter');
  const [editIsWhiteLabel, setEditIsWhiteLabel] = useState(false);
  const [editBrand, setEditBrand] = useState<BrandForm>(EMPTY_BRAND);
  const [editOwnerPassword, setEditOwnerPassword] = useState('');

  const loadTeams = async () => {
    const result = await syncWorkspaces();
    setTeams(result.teams);
    setConnected(result.connected);
  };

  /** The server decides what visitors see, so a failed save has to be visible. */
  const reportFailure = (error: string) =>
    toast({ title: 'Not saved to the website', description: error, variant: 'destructive' });

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newOwnerEmail.trim() || newOwnerPassword.length < 8) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please provide a workspace name, owner email and a password of at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (teams.some((team) => team.ownerEmail === newOwnerEmail.trim().toLowerCase())) {
      toast({ title: 'Email already used', description: 'This owner email already has a workspace.', variant: 'destructive' });
      return;
    }

    const ownerPassword = await hashPassword(newOwnerPassword);
    const created = AdminApi.createTeam({
      name: newTeamName.trim(),
      ownerEmail: newOwnerEmail.trim().toLowerCase(),
      plan: newPlan,
      isWhiteLabel,
      ownerPassword,
      ...(isWhiteLabel && {
        companyDisplayName: newBrand.companyDisplayName.trim() || undefined,
        logoUrl: newBrand.logoUrl.trim() || undefined,
        primaryColor: newBrand.primaryColor || undefined,
        supportEmail: newBrand.supportEmail.trim() || undefined,
        websiteUrl: newBrand.websiteUrl.trim() || undefined,
        footerText: newBrand.footerText.trim() || undefined,
        customDomain: newBrand.customDomain.trim().toLowerCase() || undefined,
      }),
    });

    const saved = await adminRequest('/api/admin/workspaces', {
      method: 'POST',
      body: JSON.stringify({
        id: created.id,
        name: created.name,
        ownerEmail: created.ownerEmail,
        plan: created.plan,
        isWhiteLabel,
        ownerPasswordHash: ownerPassword,
        branding: isWhiteLabel ? brandingOf(created) : {},
      }),
    });
    if (!saved.ok) reportFailure(saved.error);

    await loadTeams();
    setCreateModalOpen(false);
    setNewTeamName('');
    setNewOwnerEmail('');
    setNewOwnerPassword('');
    setNewPlan('starter');
    setIsWhiteLabel(false);
    setNewBrand(EMPTY_BRAND);

    toast({
      title: 'Workspace Created',
      description: `Workspace "${newTeamName}" has been successfully initialized${
        isWhiteLabel ? ' with White-Label enabled' : ''
      }.`,
    });
  };

  const handleChangePlan = async (teamId: string, newPlanChoice: PlanId) => {
    AdminApi.updateTeam(teamId, { plan: newPlanChoice });
    TeamApi.updateTenantPlan(teamId, newPlanChoice);
    await TenantApi.updateTenant(teamId, { plan: newPlanChoice });
    const saved = await updateWorkspace(teamId, { plan: newPlanChoice });
    if (!saved.ok) reportFailure(saved.error);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billcraft-plan-updated'));
      window.dispatchEvent(new Event('billcraft-auth-updated'));
    }
    loadTeams();
    toast({
      title: 'Workspace Plan Changed',
      description: `This workspace is now on ${PLANS[newPlanChoice].name}. The owner sees it the next time their page loads.`,
    });
  };

  const handleToggleStatus = async (teamId: string, currentStatus: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    AdminApi.updateTeam(teamId, { status: nextStatus });
    const saved = await updateWorkspace(teamId, { status: nextStatus });
    if (!saved.ok) reportFailure(saved.error);
    await loadTeams();
    toast({
      title: 'Workspace Status Updated',
      description: `Workspace is now marked as ${nextStatus}.`,
      variant: nextStatus === 'suspended' ? 'destructive' : 'default',
    });
  };

  const handleOpenEditModal = (team: AdminTeam) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
    setEditOwnerEmail(team.ownerEmail);
    setEditPlan(team.plan);
    setEditIsWhiteLabel(Boolean(team.isWhiteLabel));
    setEditBrand({
      companyDisplayName: team.companyDisplayName || team.name,
      logoUrl: team.logoUrl || '',
      primaryColor: team.primaryColor || '',
      supportEmail: team.supportEmail || '',
      websiteUrl: team.websiteUrl || '',
      footerText: team.footerText || '',
      customDomain: team.customDomain || '',
    });
    setEditOwnerPassword('');
    setEditModalOpen(true);
  };

  const handleSaveEditWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeamName.trim() || !editOwnerEmail.trim()) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please provide both workspace name and owner email.',
        variant: 'destructive',
      });
      return;
    }

    const ownerPassword = editOwnerPassword ? await hashPassword(editOwnerPassword) : undefined;
    const brand = {
      companyDisplayName: editBrand.companyDisplayName.trim(),
      logoUrl: editBrand.logoUrl.trim(),
      primaryColor: editBrand.primaryColor,
      supportEmail: editBrand.supportEmail.trim(),
      websiteUrl: editBrand.websiteUrl.trim(),
      footerText: editBrand.footerText.trim(),
      customDomain: editBrand.customDomain.trim().toLowerCase(),
    };

    const saved = await updateWorkspace(editingTeamId, {
      name: editTeamName.trim(),
      ownerEmail: editOwnerEmail.trim().toLowerCase(),
      plan: editPlan,
      isWhiteLabel: editIsWhiteLabel,
      branding: brandingOf(brand),
      ...(ownerPassword && { ownerPasswordHash: ownerPassword }),
    });
    if (!saved.ok && !saved.offline) {
      reportFailure(saved.error);
      return;
    }
    if (!saved.ok) reportFailure(saved.error);

    AdminApi.updateTeam(editingTeamId, {
      name: editTeamName.trim(),
      ownerEmail: editOwnerEmail.trim().toLowerCase(),
      plan: editPlan,
      isWhiteLabel: editIsWhiteLabel,
      ...brand,
      ...(ownerPassword && { ownerPassword }),
    });

    TeamApi.updateTenantPlan(editingTeamId, editPlan);
    await TenantApi.updateTenant(editingTeamId, { plan: editPlan });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billcraft-plan-updated'));
      window.dispatchEvent(new Event('billcraft-auth-updated'));
    }

    await loadTeams();
    setEditModalOpen(false);
    toast({
      title: 'Workspace Updated',
      description: `Workspace "${editTeamName}" and white-label settings updated successfully.`,
    });
  };

  const handleImpersonateTeam = (team: AdminTeam) => {
    if (typeof window === 'undefined') return;
    try {
      const backup = {
        user: window.localStorage.getItem('billcraft_current_user'),
        userId: window.localStorage.getItem('billcraft_current_user_id'),
        activeTenantId: window.localStorage.getItem('billcraft_active_tenant_id'),
        adminEmail: 'dmchaturvedi@gmail.com',
        timestamp: Date.now(),
      };
      window.localStorage.setItem('billcraft_impersonator_backup', JSON.stringify(backup));
      window.localStorage.setItem('billcraft_is_impersonating', 'true');
      window.localStorage.setItem(
        'billcraft_impersonated_target',
        JSON.stringify({
          id: team.id,
          email: team.ownerEmail,
          name: team.name,
          plan: team.plan,
        })
      );

      // Ensure tenant exists in custom tenants
      const customTenantsRaw = window.localStorage.getItem('billcraft_custom_tenants');
      let customTenants = customTenantsRaw ? JSON.parse(customTenantsRaw) : [];
      let found = customTenants.find((t: any) => t.id === team.id);
      if (!found) {
        found = {
          id: team.id,
          name: team.name,
          ownerUserId: team.ownerEmail,
          createdAt: team.createdAt || new Date().toISOString(),
          currency: 'INR',
          plan: team.plan,
          isWhiteLabel: Boolean(team.isWhiteLabel),
        };
        customTenants.push(found);
        window.localStorage.setItem('billcraft_custom_tenants', JSON.stringify(customTenants));
      }

      const impersonatedUser = {
        id: team.id,
        email: team.ownerEmail,
        name: team.name,
        tenantId: team.id,
        plan: team.plan,
      };

      window.localStorage.setItem('billcraft_current_user', JSON.stringify(impersonatedUser));
      window.localStorage.setItem('billcraft_current_user_id', team.id);
      window.localStorage.setItem('billcraft_active_tenant_id', team.id);

      window.dispatchEvent(new Event('billcraft-auth-updated'));
      window.dispatchEvent(new Event('billcraft-plan-updated'));

      toast({
        title: 'Impersonation Mode Active',
        description: `Now viewing "${team.name}" workspace. Redirecting to Dashboard...`,
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 350);
    } catch (e: any) {
      toast({
        title: 'Impersonation Failed',
        description: e.message || 'Unable to establish impersonation session.',
        variant: 'destructive',
      });
    }
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2.5">
            <Building className="h-6 w-6 text-primary" />
            Teams & Workspaces Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor multi-tenant workspaces, team seat capacities, volume allowances, and white-label branding.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2 h-9 px-4 rounded-xl shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>Create Workspace</span>
        </Button>
      </div>

      {!connected && (
        <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          Shared storage is not connected. Workspaces shown here exist only in this browser, and changes won&apos;t reach their owners.
        </p>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="text-xs text-muted-foreground font-semibold">Total Workspaces</div>
          <div className="text-2xl font-semibold text-foreground mt-2">{teams.length}</div>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="text-xs text-muted-foreground font-semibold">Active Teams</div>
          <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400 mt-2">
            {teams.filter((t) => t.status === 'active').length}
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="text-xs text-muted-foreground font-semibold">White-Label Orgs</div>
          <div className="text-2xl font-semibold text-indigo-700 dark:text-indigo-400 mt-2">
            {teams.filter((t) => t.isWhiteLabel).length}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workspaces by company name or owner email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground text-xs h-9 w-full"
          />
        </div>
      </div>

      {/* Workspaces Table / Empty State */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {teams.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center mx-auto text-muted-foreground border border-border">
              <Building className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">No Workspaces Created Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Start by creating your first multi-tenant workspace with custom team seats or white-label branding.
              </p>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Workspace
            </Button>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No workspaces matched &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-foreground">
              <thead className="bg-background text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Workspace</th>
                  <th className="py-3.5 px-4">Owner Email</th>
                  <th className="py-3.5 px-4">Seats & Docs</th>
                  <th className="py-3.5 px-4">Current Plan</th>
                  <th className="py-3.5 px-4">White-Label</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTeams.map((team) => {
                  const isActive = team.status === 'active';
                  return (
                    <tr key={team.id} className="hover:bg-accent transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary shrink-0" />
                          <span>{team.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums mt-0.5">{team.id}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-foreground">
                        {team.ownerEmail}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap tabular-nums">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-foreground">
                            <Users className="h-3 w-3 text-muted-foreground" /> {team.membersCount}
                          </span>
                          <span className="flex items-center gap-1 text-foreground">
                            <FileText className="h-3 w-3 text-muted-foreground" /> {team.invoicesCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={team.plan}
                          onChange={(e) => handleChangePlan(team.id, e.target.value as PlanId)}
                          className="bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground"
                        >
                          <PlanOptions />
                        </select>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {team.isWhiteLabel ? (
                          <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 text-xs font-bold">
                            WHITE-LABEL
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Standard</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${
                            isActive
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {team.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleImpersonateTeam(team)}
                            className="h-7 px-2.5 text-xs bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:text-amber-200 hover:bg-amber-500/10 font-semibold"
                            title={`Impersonate ${team.name} workspace`}
                          >
                            <UserCog className="h-3 w-3 mr-1 text-amber-700 dark:text-amber-400" /> Impersonate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(team)}
                            className="h-7 px-2.5 text-xs bg-background border-border text-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Edit3 className="h-3 w-3 mr-1 text-primary" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(team.id, team.status)}
                            className={`h-7 px-2.5 text-xs ${
                              isActive
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {isActive ? 'Suspend' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground z-[100]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Create Multi-Tenant Workspace
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateWorkspace} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Workspace / Company Name</label>
              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Acme Studio"
                required
                className="bg-background border-border text-foreground text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Owner Email Address</label>
              <Input
                type="email"
                value={newOwnerEmail}
                onChange={(e) => setNewOwnerEmail(e.target.value)}
                placeholder="e.g. founder@acmestudio.io"
                required
                className="bg-background border-border text-foreground text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Owner Password</label>
              <Input
                type="password"
                value={newOwnerPassword}
                onChange={(e) => setNewOwnerPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
                className="bg-background border-border text-foreground text-xs h-9"
              />
              <p className="text-xs text-muted-foreground">
                Initial password. Workspace owner will sign in at <span className="tabular-nums text-indigo-700 dark:text-indigo-400 font-semibold">/login</span>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Subscription Tier</label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value as PlanId)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground"
              >
                <PlanOptions />
              </select>
            </div>

            {/* Set as White-Label Toggle */}
            <div className="p-3 rounded-xl bg-background border border-border space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWhiteLabel}
                  onChange={(e) => setIsWhiteLabel(e.target.checked)}
                  className="rounded border-border bg-card text-primary h-4 w-4"
                />
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                  Set as White-Label Workspace
                </span>
              </label>
              <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                When enabled, the owner&apos;s dashboard and shared invoices show their brand instead of {APP_CONFIG.brandName}.
              </p>
            </div>

            {isWhiteLabel && <BrandingFields value={newBrand} onChange={setNewBrand} />}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="border-border text-foreground hover:bg-accent text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold"
              >
                Create Workspace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Workspace & White-Label Settings Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground z-[100]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit Workspace &amp; White-Label
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEditWorkspace} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Workspace / Company Name</label>
              <Input
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                placeholder="e.g. Acme Studio"
                required
                className="bg-background border-border text-foreground text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Owner Email Address</label>
              <Input
                type="email"
                value={editOwnerEmail}
                onChange={(e) => setEditOwnerEmail(e.target.value)}
                placeholder="e.g. founder@acmestudio.io"
                required
                className="bg-background border-border text-foreground text-xs h-9"
              />
              <p className="text-xs text-muted-foreground">
                Workspace owner logs in at <span className="tabular-nums text-indigo-700 dark:text-indigo-400 font-semibold">/login</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Owner Password (Optional Update)</label>
              <Input
                type="password"
                value={editOwnerPassword}
                onChange={(e) => setEditOwnerPassword(e.target.value)}
                placeholder="Leave blank to keep existing password"
                className="bg-background border-border text-foreground text-xs h-9"
              />
              <p className="text-xs text-muted-foreground">
                Used to authenticate the account at the workspace login portal.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Subscription Tier</label>
              <select
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value as PlanId)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground"
              >
                <PlanOptions />
              </select>
            </div>

            {/* Set as White-Label Toggle */}
            <div className="p-3 rounded-xl bg-background border border-border space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsWhiteLabel}
                  onChange={(e) => setEditIsWhiteLabel(e.target.checked)}
                  className="rounded border-border bg-card text-primary h-4 w-4"
                />
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                  White-Label Workspace Active
                </span>
              </label>
              <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                When enabled, the owner&apos;s dashboard and shared invoices show their brand instead of {APP_CONFIG.brandName}.
              </p>
            </div>

            {editIsWhiteLabel && <BrandingFields value={editBrand} onChange={setEditBrand} />}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="border-border text-foreground hover:bg-accent text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
