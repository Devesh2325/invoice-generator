'use client';

import React, { useEffect, useState } from 'react';
import { AdminApi } from '@invoice/api';
import { AdminTeam, PlanId } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
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
  Layers,
  Edit3,
} from 'lucide-react';

export default function AdminTeamsPage() {
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
  const [newCompanyDisplayName, setNewCompanyDisplayName] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');

  // Edit Workspace form state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState('');
  const [editTeamName, setEditTeamName] = useState('');
  const [editOwnerEmail, setEditOwnerEmail] = useState('');
  const [editPlan, setEditPlan] = useState<PlanId>('starter');
  const [editIsWhiteLabel, setEditIsWhiteLabel] = useState(false);
  const [editCompanyDisplayName, setEditCompanyDisplayName] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editOwnerPassword, setEditOwnerPassword] = useState('');

  const loadTeams = () => {
    setTeams(AdminApi.getTeams());
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newOwnerEmail.trim()) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please provide both workspace name and owner email.',
        variant: 'destructive',
      });
      return;
    }

    AdminApi.createTeam({
      name: newTeamName.trim(),
      ownerEmail: newOwnerEmail.trim().toLowerCase(),
      plan: newPlan,
      isWhiteLabel,
      ...(newOwnerPassword.trim() && { ownerPassword: newOwnerPassword.trim() }),
      ...(newCompanyDisplayName.trim() && { companyDisplayName: newCompanyDisplayName.trim() }),
      ...(newLogoUrl.trim() && { logoUrl: newLogoUrl.trim() }),
    });

    loadTeams();
    setCreateModalOpen(false);
    setNewTeamName('');
    setNewOwnerEmail('');
    setNewOwnerPassword('');
    setNewPlan('starter');
    setIsWhiteLabel(false);
    setNewCompanyDisplayName('');
    setNewLogoUrl('');

    toast({
      title: 'Workspace Created',
      description: `Workspace "${newTeamName}" has been successfully initialized${
        isWhiteLabel ? ' with White-Label enabled' : ''
      }.`,
    });
  };

  const handleChangePlan = (teamId: string, newPlanChoice: PlanId) => {
    AdminApi.updateTeam(teamId, { plan: newPlanChoice });
    loadTeams();
    toast({
      title: 'Workspace Plan Changed',
      description: `Team workspace subscription upgraded to ${newPlanChoice.toUpperCase()}.`,
    });
  };

  const handleToggleStatus = (teamId: string, currentStatus: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    AdminApi.updateTeam(teamId, { status: nextStatus });
    loadTeams();
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
    setEditCompanyDisplayName(team.companyDisplayName || team.name);
    setEditLogoUrl(team.logoUrl || '');
    setEditOwnerPassword(team.ownerPassword || '');
    setEditModalOpen(true);
  };

  const handleSaveEditWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeamName.trim() || !editOwnerEmail.trim()) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please provide both workspace name and owner email.',
        variant: 'destructive',
      });
      return;
    }

    AdminApi.updateTeam(editingTeamId, {
      name: editTeamName.trim(),
      ownerEmail: editOwnerEmail.trim().toLowerCase(),
      plan: editPlan,
      isWhiteLabel: editIsWhiteLabel,
      companyDisplayName: editCompanyDisplayName.trim(),
      logoUrl: editLogoUrl.trim(),
      ...(editOwnerPassword.trim() && { ownerPassword: editOwnerPassword.trim() }),
    });

    loadTeams();
    setEditModalOpen(false);
    toast({
      title: 'Workspace Updated',
      description: `Workspace "${editTeamName}" and white-label settings updated successfully.`,
    });
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
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Building className="h-6 w-6 text-primary" />
            Teams & Workspaces Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
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

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Workspaces</div>
          <div className="text-2xl font-black text-white mt-2">{teams.length}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Teams</div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {teams.filter((t) => t.status === 'active').length}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">White-Label Orgs</div>
          <div className="text-2xl font-black text-indigo-400 mt-2">
            {teams.filter((t) => t.isWhiteLabel).length}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search workspaces by company name or owner email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-xs h-9 w-full"
          />
        </div>
      </div>

      {/* Workspaces Table / Empty State */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {teams.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400 border border-slate-700">
              <Building className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Workspaces Created Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
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
          <div className="p-8 text-center text-xs text-slate-400">
            No workspaces matched &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
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
              <tbody className="divide-y divide-slate-800/60">
                {filteredTeams.map((team) => {
                  const isActive = team.status === 'active';
                  return (
                    <tr key={team.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary shrink-0" />
                          <span>{team.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{team.id}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                        {team.ownerEmail}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-slate-300">
                            <Users className="h-3 w-3 text-slate-400" /> {team.membersCount}
                          </span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <FileText className="h-3 w-3 text-slate-400" /> {team.invoicesCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={team.plan}
                          onChange={(e) => handleChangePlan(team.id, e.target.value as PlanId)}
                          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                        >
                          <option value="starter">Starter (Free)</option>
                          <option value="pro">Pro (₹799/mo)</option>
                          <option value="enterprise">Enterprise (₹2499/mo)</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {team.isWhiteLabel ? (
                          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-800 text-[10px] font-bold">
                            WHITE-LABEL
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-500">Standard</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            isActive
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
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
                            onClick={() => handleOpenEditModal(team)}
                            className="h-7 px-2.5 text-[11px] bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Edit3 className="h-3 w-3 mr-1 text-primary" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(team.id, team.status)}
                            className={`h-7 px-2.5 text-[11px] ${
                              isActive
                                ? 'bg-rose-950/20 border-rose-800/40 text-rose-300 hover:bg-rose-950/40'
                                : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300 hover:bg-emerald-950/40'
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
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white z-[100]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Create Multi-Tenant Workspace
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateWorkspace} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Workspace / Company Name</label>
              <Input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Acme Studio Pvt Ltd"
                required
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Owner Email Address</label>
              <Input
                type="email"
                value={newOwnerEmail}
                onChange={(e) => setNewOwnerEmail(e.target.value)}
                placeholder="e.g. founder@acmestudio.io"
                required
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Owner Password</label>
              <Input
                type="password"
                value={newOwnerPassword}
                onChange={(e) => setNewOwnerPassword(e.target.value)}
                placeholder="Set initial login password"
                autoComplete="new-password"
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
              <p className="text-[10px] text-slate-500">
                Initial password. Workspace owner will sign in at <span className="font-mono text-indigo-400 font-semibold">/login</span>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Subscription Tier</label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value as PlanId)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="starter">Starter — Free</option>
                <option value="pro">Pro Plan — ₹799/month</option>
                <option value="enterprise">Enterprise Plan — ₹2,499/month</option>
              </select>
            </div>

            {/* Set as White-Label Toggle */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWhiteLabel}
                  onChange={(e) => setIsWhiteLabel(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-primary h-4 w-4"
                />
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Set as White-Label Workspace
                </span>
              </label>
              <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                When enabled, all &ldquo;Powered by BillCraft&rdquo; watermarks, logos, and public tags are removed, and custom workspace branding is used across invoices, PDFs, and client emails.
              </p>
            </div>

            {/* White-Label Branding Fields — show when toggled on */}
            {isWhiteLabel && (
              <div className="space-y-3 p-3.5 rounded-xl border border-indigo-800/40 bg-indigo-950/20">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  White-Label Brand Settings
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Company Display Name</label>
                  <Input
                    value={newCompanyDisplayName}
                    onChange={(e) => setNewCompanyDisplayName(e.target.value)}
                    placeholder="e.g. Acme Invoicing"
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                  <p className="text-[10px] text-slate-500">Replaces &ldquo;BillCraft&rdquo; everywhere in the app for this workspace.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Logo URL</label>
                  <Input
                    type="url"
                    value={newLogoUrl}
                    onChange={(e) => setNewLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                  <p className="text-[10px] text-slate-500">Direct link to the company logo (PNG/SVG, max 512×512px recommended).</p>
                </div>

                {newLogoUrl.trim() && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <img
                      src={newLogoUrl}
                      alt="Logo preview"
                      className="h-10 w-10 object-contain rounded border border-slate-700"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="text-[11px] text-slate-400">Logo preview</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
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
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white z-[100]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit Workspace &amp; White-Label
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEditWorkspace} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Workspace / Company Name</label>
              <Input
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                placeholder="e.g. Acme Studio Pvt Ltd"
                required
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Owner Email Address</label>
              <Input
                type="email"
                value={editOwnerEmail}
                onChange={(e) => setEditOwnerEmail(e.target.value)}
                placeholder="e.g. founder@acmestudio.io"
                required
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
              <p className="text-[10px] text-slate-500">
                Workspace owner logs in at <span className="font-mono text-indigo-400 font-semibold">/login</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Owner Password (Optional Update)</label>
              <Input
                type="password"
                value={editOwnerPassword}
                onChange={(e) => setEditOwnerPassword(e.target.value)}
                placeholder="Leave blank to keep existing password"
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
              <p className="text-[10px] text-slate-500">
                Used to authenticate the account at the workspace login portal.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Subscription Tier</label>
              <select
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value as PlanId)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="starter">Starter — Free</option>
                <option value="pro">Pro Plan — ₹799/month</option>
                <option value="enterprise">Enterprise Plan — ₹2,499/month</option>
              </select>
            </div>

            {/* Set as White-Label Toggle */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsWhiteLabel}
                  onChange={(e) => setEditIsWhiteLabel(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-primary h-4 w-4"
                />
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  White-Label Workspace Active
                </span>
              </label>
              <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                When enabled, BillCraft branding is replaced by the custom company display name and logo across invoices, PDFs, and client emails.
              </p>
            </div>

            {/* White-Label Branding Fields */}
            {editIsWhiteLabel && (
              <div className="space-y-3 p-3.5 rounded-xl border border-indigo-800/40 bg-indigo-950/20">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  White-Label Brand Settings
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Company Display Name</label>
                  <Input
                    value={editCompanyDisplayName}
                    onChange={(e) => setEditCompanyDisplayName(e.target.value)}
                    placeholder="e.g. Acme Invoicing"
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                  <p className="text-[10px] text-slate-500">Replaces &ldquo;BillCraft&rdquo; everywhere in the app for this workspace.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Logo URL</label>
                  <Input
                    type="url"
                    value={editLogoUrl}
                    onChange={(e) => setEditLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                  <p className="text-[10px] text-slate-500">Direct link to the company logo (PNG/SVG, max 512×512px recommended).</p>
                </div>

                {editLogoUrl.trim() && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <img
                      src={editLogoUrl}
                      alt="Logo preview"
                      className="h-10 w-10 object-contain rounded border border-slate-700"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="text-[11px] text-slate-400">Logo preview</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
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
