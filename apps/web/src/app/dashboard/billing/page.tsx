'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TeamApi, TenantApi } from '@invoice/api';
import { PlanId, PLANS } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  CreditCard,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  Download,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function BillingPage() {
  const { activeTenant, refreshTenants } = useTenant();
  const tenantId = activeTenant?.id || 'default_tenant';

  const getResolvedPlan = useCallback((): PlanId => {
    if (activeTenant?.plan && ['starter', 'pro', 'enterprise'].includes(activeTenant.plan.toLowerCase())) {
      return activeTenant.plan.toLowerCase() as PlanId;
    }
    if (tenantId && tenantId !== 'default_tenant') {
      const fromTeam = TeamApi.getTenantPlan(tenantId);
      if (fromTeam && ['starter', 'pro', 'enterprise'].includes(fromTeam)) {
        return fromTeam;
      }
    }
    return 'starter';
  }, [activeTenant?.plan, tenantId]);

  const [currentPlanId, setCurrentPlanId] = useState<PlanId>(getResolvedPlan);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [upgrading, setUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPlanId(getResolvedPlan());
  }, [getResolvedPlan]);

  useEffect(() => {
    const handlePlanUpdate = () => {
      setCurrentPlanId(getResolvedPlan());
    };
    window.addEventListener('billcraft-plan-updated', handlePlanUpdate);
    window.addEventListener('billcraft-auth-updated', handlePlanUpdate);
    return () => {
      window.removeEventListener('billcraft-plan-updated', handlePlanUpdate);
      window.removeEventListener('billcraft-auth-updated', handlePlanUpdate);
    };
  }, [getResolvedPlan]);

  const currentPlan = PLANS[currentPlanId] || PLANS.starter;
  const members = TeamApi.getMembers(tenantId);

  const handleSwitchPlan = async (newPlan: PlanId) => {
    if (newPlan === currentPlanId) return;
    setUpgrading(true);

    try {
      // 1. Sync TeamApi storage
      TeamApi.updateTenantPlan(tenantId, newPlan);

      // 2. Sync TenantApi database/localStorage
      await TenantApi.updateTenant(tenantId, { plan: newPlan });

      // 3. Sync Admin teams table
      if (typeof window !== 'undefined') {
        try {
          const teamsRaw = localStorage.getItem('billcraft_admin_teams');
          if (teamsRaw) {
            const teams = JSON.parse(teamsRaw);
            const updatedTeams = teams.map((t: any) =>
              t.id === tenantId ? { ...t, plan: newPlan } : t
            );
            localStorage.setItem('billcraft_admin_teams', JSON.stringify(updatedTeams));
          }
        } catch {}
      }

      // 4. Update immediate local state
      setCurrentPlanId(newPlan);

      // 5. Refresh tenant context
      await refreshTenants();

      // 6. Broadcast event to header PlanBadge and all listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('billcraft-plan-updated'));
        window.dispatchEvent(new Event('billcraft-auth-updated'));
      }

      setSuccessMsg(`Workspace successfully upgraded to ${PLANS[newPlan].name} plan!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Plan upgrade error:', err);
    } finally {
      setUpgrading(false);
    }
  };

  const invoiceHistory = [
    { id: 'sub_inv_104', date: '2026-03-01', description: `${currentPlan.name} Plan (Monthly)`, amount: currentPlan.priceMonthly, status: 'paid' },
    { id: 'sub_inv_103', date: '2026-02-01', description: `${currentPlan.name} Plan (Monthly)`, amount: currentPlan.priceMonthly, status: 'paid' },
    { id: 'sub_inv_102', date: '2026-01-01', description: `${currentPlan.name} Plan (Monthly)`, amount: currentPlan.priceMonthly, status: 'paid' },
  ];

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Plans & In-App Billing
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your subscription tier, track workspace resource usage, and view payment receipts.
            </p>
          </div>

          {successMsg && (
            <Badge variant="success" className="text-xs py-1 px-3 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> {successMsg}
            </Badge>
          )}
        </div>

        {/* Current Plan Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-border bg-card p-6 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Current Workspace Plan
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-2xl font-black text-foreground">{currentPlan.name}</h2>
                  <Badge variant="default" className="text-[10px] uppercase font-bold">
                    Active
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black font-mono text-primary">
                  ₹{currentPlan.priceMonthly}
                  <span className="text-xs font-normal text-muted-foreground"> / mo</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Next renewal: May 1, 2026</div>
              </div>
            </div>

            {/* Usage Meters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">Team Seats</span>
                  <span className="font-mono text-primary font-bold">
                    {members.length} / {currentPlan.maxMembers === 999 ? 'Unlimited' : currentPlan.maxMembers}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (members.length / (currentPlan.maxMembers === 999 ? 10 : currentPlan.maxMembers)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {currentPlan.maxMembers - members.length > 0
                    ? `${currentPlan.maxMembers - members.length} seat(s) remaining`
                    : 'Seat limit reached'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">Monthly Invoices</span>
                  <span className="font-mono text-primary font-bold">
                    12 / {currentPlan.maxInvoicesPerMonth === 99999 ? 'Unlimited' : currentPlan.maxInvoicesPerMonth}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-1/4" />
                </div>
                <div className="text-[10px] text-muted-foreground">Resets in 18 days</div>
              </div>
            </div>
          </Card>

          {/* Quick Entitlements Card */}
          <Card className="border-border bg-card p-6 rounded-2xl space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Plan Entitlements
            </h3>
            <div className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>All 8+ Layout Templates: {currentPlan.hasAllTemplates ? 'Enabled' : 'Free (3) Only'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Watermark Removed: {currentPlan.canRemoveWatermark ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Custom Domain: {currentPlan.canUseCustomDomain ? 'Supported' : 'Enterprise Only'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Audit Trail: {currentPlan.hasPrioritySupport ? '30 Days' : 'Basic'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Change Plan Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Available Workspace Plans</h2>
              <p className="text-xs text-muted-foreground">Switch plans instantly to adjust team limits</p>
            </div>

            <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-card border border-border text-xs font-semibold">
              <button
                onClick={() => setPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  period === 'monthly' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPeriod('yearly')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  period === 'yearly' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                <span>Yearly</span>
                <span className="rounded bg-emerald-500/20 text-emerald-600 px-1 py-0.2 text-[10px] font-bold">
                  -20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['starter', 'pro', 'enterprise'] as PlanId[]).map((pid) => {
              const p = PLANS[pid];
              const isCurrent = currentPlanId === pid;
              const price = period === 'monthly' ? p.priceMonthly : p.priceYearly;

              return (
                <Card
                  key={pid}
                  className={`border p-6 rounded-2xl flex flex-col justify-between space-y-6 bg-card transition-all ${
                    isCurrent ? 'border-primary ring-2 ring-primary shadow-lg' : 'border-border hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-base text-foreground">{p.name}</h3>
                      {isCurrent && (
                        <Badge variant="default" className="text-[10px] uppercase font-bold">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl font-black text-foreground">
                      ₹{price} <span className="text-xs font-normal text-muted-foreground">/ month</span>
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{p.maxMembers === 999 ? 'Unlimited seats' : `Up to ${p.maxMembers} seats`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{p.hasAllTemplates ? 'All 8+ templates' : '3 core templates'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{p.canRemoveWatermark ? 'No watermark on PDFs' : 'Standard watermark'}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    disabled={isCurrent || upgrading}
                    onClick={() => handleSwitchPlan(pid)}
                    variant={isCurrent ? 'outline' : 'default'}
                    className={`w-full text-xs font-bold transition-all ${
                      isCurrent
                        ? 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-default'
                        : 'bg-primary hover:bg-primary-hover text-white shadow-sm font-extrabold'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : upgrading ? 'Updating...' : `Select ${p.name}`}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Subscription Invoice History */}
        <Card className="border-border bg-card rounded-2xl overflow-hidden shadow-xs">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Subscription Payment History
            </CardTitle>
            <CardDescription className="text-xs">
              Past subscription invoices and charges for this workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground uppercase text-[10px]">
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Billing Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invoiceHistory.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/10">
                    <td className="py-3 px-4 font-mono font-bold">{inv.id}</td>
                    <td className="py-3 px-4 text-muted-foreground">{inv.date}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{inv.description}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">₹{inv.amount}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success" className="text-[10px]">Paid</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => alert(`Receipt #${inv.id} downloaded.`)}
                        className="text-xs h-7 px-2 text-primary"
                      >
                        <Download className="h-3 w-3 mr-1" /> PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </TenantLayout>
  );
}
