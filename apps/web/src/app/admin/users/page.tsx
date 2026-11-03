'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminApi } from '@invoice/api';
import { adminRequest, syncWorkspaces, updateWorkspace, workspaceIdForEmail } from '@/lib/platform/admin-client';
import { AdminUser, PlanId } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Search, Ban, CheckCircle, UserCheck, Shield, Users, UserCog, Trash2 } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  const loadUsers = () => {
    setUsers(AdminApi.getUsers());
  };

  useEffect(() => {
    syncWorkspaces().finally(loadUsers);
  }, []);

  const handlePlanChange = async (userId: string, plan: PlanId) => {
    AdminApi.updateUser(userId, { plan });
    const email = users.find((user) => user.id === userId)?.email || '';
    const workspaceId = workspaceIdForEmail(email);
    if (workspaceId) {
      const result = await updateWorkspace(workspaceId, { plan });
      if (!result.ok) toast({ title: 'Plan not saved', description: result.error, variant: 'destructive' });
    }
    await syncWorkspaces();
    loadUsers();
  };

  const handleToggleBan = async (user: AdminUser) => {
    const banning = user.status === 'active';
    if (banning) {
      AdminApi.banUser(user.id);
    } else {
      AdminApi.unbanUser(user.id);
    }
    const workspaceId = workspaceIdForEmail(user.email);
    if (workspaceId) await updateWorkspace(workspaceId, { status: banning ? 'suspended' : 'active' });
    await syncWorkspaces();
    loadUsers();
  };

  const handleDeleteUser = (u: AdminUser) => {
    if (typeof window === 'undefined') return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete user "${u.name}" (${u.email})?\n\nThis will remove their registered account, active session, and custom workspace data. This action cannot be undone.`
    );
    if (!confirmed) return;

    const workspaceId = workspaceIdForEmail(u.email);
    if (workspaceId) void adminRequest(`/api/admin/workspaces?id=${encodeURIComponent(workspaceId)}`, { method: 'DELETE' });
    const ok = AdminApi.deleteUser(u.id);
    AdminApi.deleteUser(u.email);

    if (ok) {
      toast({
        title: 'User Deleted',
        description: `Account for ${u.email} has been permanently deleted.`,
      });
      loadUsers();
    } else {
      toast({
        title: 'Error Deleting User',
        description: 'Failed to delete user account.',
        variant: 'destructive',
      });
    }
  };

  const handleImpersonate = (u: AdminUser) => {
    if (typeof window === 'undefined') return;
    try {
      // 1. Save backup of current Super Admin session
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
          id: u.id,
          email: u.email,
          name: u.name,
          plan: u.plan,
        })
      );

      // 2. Check if user already exists in registered users or find/create a tenant
      const tenantId = `tenant_${u.id}`;
      const customTenantsRaw = window.localStorage.getItem('billcraft_custom_tenants');
      let customTenants = customTenantsRaw ? JSON.parse(customTenantsRaw) : [];
      let userTenant = customTenants.find((t: any) => t.ownerUserId === u.id || t.id === tenantId);

      if (!userTenant) {
        userTenant = {
          id: tenantId,
          name: `${u.name}'s Workspace`,
          ownerUserId: u.id,
          createdAt: new Date().toISOString(),
          currency: 'INR',
          plan: u.plan || 'starter',
          isWhiteLabel: u.plan === 'enterprise',
        };
        customTenants.push(userTenant);
        window.localStorage.setItem('billcraft_custom_tenants', JSON.stringify(customTenants));
      }

      const impersonatedUser = {
        id: u.id,
        email: u.email,
        name: u.name,
        tenantId: userTenant.id,
        plan: u.plan || 'starter',
      };

      window.localStorage.setItem('billcraft_current_user', JSON.stringify(impersonatedUser));
      window.localStorage.setItem('billcraft_current_user_id', u.id);
      window.localStorage.setItem('billcraft_active_tenant_id', userTenant.id);

      window.dispatchEvent(new Event('billcraft-auth-updated'));
      window.dispatchEvent(new Event('billcraft-plan-updated'));

      toast({
        title: 'Impersonation Mode Active',
        description: `Now viewing workspace as ${u.name} (${u.email}). Redirecting to Dashboard...`,
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

  const filtered = users.filter((u) => {
    const matchSearch =
      search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Users & Subscriptions</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage registered workspace accounts, manually adjust tiers, and manage account access
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted border-border text-foreground text-xs"
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-muted border border-border text-foreground rounded-md text-xs px-3 py-1.5 w-full sm:w-auto"
        >
          <option value="all">All Plans</option>
          <option value="starter">Starter / Free</option>
          <option value="pro">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <Card className="border-border bg-card rounded-xl overflow-hidden shadow-xs">
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto text-muted-foreground border border-border">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No Registered Users Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Users who register via the sign-up page or get invited by team workspaces will appear here in real time.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No users matching your search filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted text-muted-foreground uppercase text-xs font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Current Plan</th>
                  <th className="py-3 px-4">Invoices</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-accent">
                  <td className="py-3 px-4 font-semibold text-foreground">
                    <div>{u.name}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.plan}
                      onChange={(e) => handlePlanChange(u.id, e.target.value as PlanId)}
                      className="bg-muted border border-border text-foreground rounded px-2 py-1 text-xs"
                    >
                      <option value="starter">Starter</option>
                      <option value="pro">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 tabular-nums">{u.invoicesCount}</td>
                  <td className="py-3 px-4">
                    <Badge
                      className={
                        u.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 text-xs'
                      }
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{u.createdAt}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleBan(u)}
                        className={`text-xs h-7 px-2 ${
                          u.status === 'active' ? 'text-muted-foreground hover:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {u.status === 'active' ? 'Ban' : 'Unban'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleImpersonate(u)}
                        className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 px-2 font-semibold flex items-center gap-1"
                        title={`Impersonate ${u.name} and view dashboard`}
                      >
                        <UserCog className="h-3 w-3" /> Impersonate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteUser(u)}
                        className="text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 h-7 px-2 font-semibold flex items-center gap-1"
                        title={`Permanently delete ${u.name} (${u.email})`}
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
