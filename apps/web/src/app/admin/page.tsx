'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminApi } from '@invoice/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  CreditCard,
  TrendingUp,
  FileText,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    setMetrics(AdminApi.getDashboardMetrics());
    setUsers(AdminApi.getUsers());
  }, []);

  if (!metrics) {
    return <div className="p-8 text-xs text-slate-400">Loading metrics...</div>;
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Super Admin Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Platform metrics, subscription MRR, user analytics, and system operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-800 text-xs px-2.5 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
            System Healthy
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/60 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Total Registered Users</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.totalUsers}</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +18.4% this month
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Active Subscriptions</span>
            <CreditCard className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.activeSubscribers}</div>
          <div className="text-[11px] text-slate-400">Pro & Enterprise tiers</div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Monthly Recurring Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{metrics.monthlyRecurringRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-400">+₹4,200 vs last month</div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Invoices Generated</span>
            <FileText className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.invoicesThisMonth}</div>
          <div className="text-[11px] text-slate-400">Past 30 days volume</div>
        </Card>
      </div>

      {/* User Growth Bar Visual */}
      <Card className="border-slate-800 bg-slate-900/60 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white">Platform User Growth Trajectory</h3>
            <p className="text-xs text-slate-400">New registered workspace accounts per month</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">+266% YoY</span>
        </div>

        <div className="grid grid-cols-6 gap-3 items-end h-32 pt-4">
          {metrics.userGrowth.map((g: any, i: number) => {
            const max = Math.max(...metrics.userGrowth.map((x: any) => x.count));
            const pct = (g.count / max) * 100;
            return (
              <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="text-[10px] font-mono text-slate-400">{g.count}</div>
                <div
                  className="w-full bg-primary/70 hover:bg-primary rounded-t-lg transition-all"
                  style={{ height: `${pct}%` }}
                />
                <div className="text-[10px] text-slate-500 font-bold uppercase">{g.month}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Users Table */}
      <Card className="border-slate-800 bg-slate-900/60 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white">Recent Users & Accounts</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Latest registrations and plan assignments
            </CardDescription>
          </div>
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary">
              View All Users <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 uppercase text-[10px] font-semibold">
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Plan Tier</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Invoices</th>
                <th className="py-2.5 px-4">Signed Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.slice(0, 5).map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-white">
                    <div>{u.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                  </td>
                  <td className="py-3 px-4 uppercase font-bold text-primary">{u.plan}</td>
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
                  <td className="py-3 px-4 font-mono">{u.invoicesCount}</td>
                  <td className="py-3 px-4 text-slate-400">{u.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
