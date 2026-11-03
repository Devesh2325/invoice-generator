'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminApi } from '@invoice/api';
import { syncWorkspaces } from '@/lib/platform/admin-client';
import { Badge } from '@/components/ui/badge';
import { Users, CreditCard, TrendingUp, FileText, ArrowRight, Info } from 'lucide-react';

interface Metrics {
  totalUsers: number;
  activeSubscribers: number;
  monthlyRecurringRevenue: number;
  documentsCount: number;
  userGrowth: { month: string; count: number }[];
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const show = () => {
      setMetrics(AdminApi.getDashboardMetrics());
      setUsers(AdminApi.getUsers());
    };
    show();
    // Counts signups from every browser once the shared list has loaded.
    syncWorkspaces().then(show);
  }, []);

  if (!metrics) {
    return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  }

  const kpis = [
    { label: 'Registered users', value: metrics.totalUsers.toLocaleString('en-IN'), hint: 'All accounts', icon: Users },
    { label: 'Paid subscriptions', value: metrics.activeSubscribers.toLocaleString('en-IN'), hint: 'Pro and Enterprise', icon: CreditCard },
    {
      label: 'Monthly recurring revenue',
      value: `₹${metrics.monthlyRecurringRevenue.toLocaleString('en-IN')}`,
      hint: 'From current paid plans',
      icon: TrendingUp,
    },
    { label: 'Documents created', value: metrics.documentsCount.toLocaleString('en-IN'), hint: 'All workspaces', icon: FileText },
  ];

  const maxSignups = Math.max(...metrics.userGrowth.map((g) => g.count));

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Users, subscriptions and revenue at a glance.</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3 text-sm text-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        <p>Users and plans include every browser once shared storage is connected. Document counts only cover this browser.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2 text-sm text-muted-foreground">
              <span>{label}</span>
              <Icon className="h-4 w-4 shrink-0" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">New signups</h2>
        <p className="text-sm text-muted-foreground">Last 6 months</p>

        {maxSignups === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No signups in the last 6 months.</p>
        ) : (
          <div className="mt-4 grid h-40 grid-cols-6 items-end gap-2 sm:gap-4">
            {metrics.userGrowth.map((g) => (
              <div key={g.month} className="flex h-full flex-col items-center justify-end gap-1.5">
                <div className="text-xs tabular-nums text-foreground">{g.count}</div>
                <div
                  className="w-full max-w-14 rounded-t bg-primary"
                  style={{ height: `${Math.max((g.count / maxSignups) * 100, g.count ? 4 : 1)}%` }}
                />
                <div className="text-xs text-muted-foreground">{g.month}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4 sm:px-6">
          <h2 className="text-base font-semibold text-foreground">Recent users</h2>
          <Link href="/admin/users" className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {users.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No users yet</p>
            <p className="mt-0.5 text-sm text-muted-foreground">New accounts will appear here when people sign up.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 font-medium sm:px-6">User</th>
                  <th className="px-4 py-2.5 font-medium">Plan</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {users.slice(0, 5).map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="font-medium text-foreground">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{u.plan}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          u.status === 'active'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-xs capitalize text-emerald-700 dark:text-emerald-400'
                            : 'border-rose-500/30 bg-rose-500/10 text-xs capitalize text-rose-700 dark:text-rose-400'
                        }
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
