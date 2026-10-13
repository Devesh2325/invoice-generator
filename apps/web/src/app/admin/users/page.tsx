'use client';

import React, { useState, useEffect } from 'react';
import { AdminApi } from '@invoice/api';
import { AdminUser, PlanId } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Ban, CheckCircle, UserCheck, Shield, Users } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  const loadUsers = () => {
    setUsers(AdminApi.getUsers());
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handlePlanChange = (userId: string, plan: PlanId) => {
    AdminApi.updateUser(userId, { plan });
    loadUsers();
  };

  const handleToggleBan = (user: AdminUser) => {
    if (user.status === 'active') {
      AdminApi.banUser(user.id);
    } else {
      AdminApi.unbanUser(user.id);
    }
    loadUsers();
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
        <h1 className="text-2xl font-black text-white tracking-tight">Users & Subscriptions</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage registered workspace accounts, manually adjust tiers, and manage account access
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search users by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white text-xs"
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-md text-xs px-3 py-1.5 w-full sm:w-auto"
        >
          <option value="all">All Plans</option>
          <option value="starter">Starter / Free</option>
          <option value="pro">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <Card className="border-slate-800 bg-slate-900 rounded-2xl overflow-hidden shadow-xs">
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400 border border-slate-700">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-white">No Registered Users Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Users who register via the sign-up page or get invited by team workspaces will appear here in real time.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No users matching your search filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 uppercase text-[10px] font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Current Plan</th>
                  <th className="py-3 px-4">Invoices</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-white">
                    <div>{u.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.plan}
                      onChange={(e) => handlePlanChange(u.id, e.target.value as PlanId)}
                      className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                    >
                      <option value="starter">Starter</option>
                      <option value="pro">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 font-mono">{u.invoicesCount}</td>
                  <td className="py-3 px-4">
                    <Badge
                      className={
                        u.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-800 text-[10px]'
                          : 'bg-rose-500/10 text-rose-400 border-rose-800 text-[10px]'
                      }
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{u.createdAt}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleBan(u)}
                        className={`text-xs h-7 px-2 ${
                          u.status === 'active' ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400'
                        }`}
                      >
                        {u.status === 'active' ? 'Ban User' : 'Unban'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => alert(`Impersonating session for ${u.email}...`)}
                        className="text-xs text-slate-400 hover:text-white h-7 px-2"
                      >
                        Impersonate
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
