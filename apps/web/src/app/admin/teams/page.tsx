'use client';

import React, { useEffect, useState } from 'react';
import { AdminApi } from '@invoice/api';
import { AdminTeam, PlanId } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Building,
  Search,
  Users,
  FileText,
  ShieldAlert,
  CheckCircle,
  MoreVertical,
  Briefcase,
} from 'lucide-react';

export default function AdminTeamsPage() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTeams = () => {
    setTeams(AdminApi.getTeams());
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleChangePlan = (teamId: string, newPlan: PlanId) => {
    AdminApi.updateTeam(teamId, { plan: newPlan });
    loadTeams();
    toast({
      title: 'Workspace Plan Changed',
      description: `Team workspace subscription upgraded to ${newPlan.toUpperCase()}.`,
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
            Monitor multi-tenant workspaces, team seat capacities, volume allowances, and organization plans.
          </p>
        </div>
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
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Paid Workspaces (Pro/Ent)</div>
          <div className="text-2xl font-black text-primary mt-2">
            {teams.filter((t) => t.plan !== 'starter').length}
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

      {/* Workspaces Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Workspace</th>
                <th className="py-3.5 px-4">Owner Email</th>
                <th className="py-3.5 px-4">Team Members</th>
                <th className="py-3.5 px-4">Invoices Created</th>
                <th className="py-3.5 px-4">Current Plan</th>
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
                      <span className="flex items-center gap-1 text-slate-300">
                        <Users className="h-3 w-3 text-slate-400" /> {team.membersCount} seats
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                      <span className="flex items-center gap-1 text-slate-300">
                        <FileText className="h-3 w-3 text-slate-400" /> {team.invoicesCount} docs
                      </span>
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
