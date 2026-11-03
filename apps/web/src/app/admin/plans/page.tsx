'use client';

import React, { useEffect, useState } from 'react';
import { AdminApi } from '@invoice/api';
import { DEFAULT_PLANS, PlanId, PlanLimits, PLANS, APP_CONFIG, UNLIMITED_DOCUMENTS, applyPlanOverrides, type PlanOverrides } from '@invoice/core';
import { adminRequest } from '@/lib/platform/admin-client';
import { PLANS_CHANGED_EVENT } from '@/lib/platform/platform-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Save, RotateCcw, Check, Users, FileText, Sparkles, ShieldCheck, Code2, Layers } from 'lucide-react';

export default function AdminPlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Record<PlanId, PlanLimits>>(PLANS);
  const [savingPlan, setSavingPlan] = useState<PlanId | null>(null);

  useEffect(() => {
    fetch('/api/platform/plans', { cache: 'no-store' })
      .then((res) => res.json())
      .then((body) => {
        applyPlanOverrides(body.plans || {});
        setPlans(JSON.parse(JSON.stringify(PLANS)));
      })
      .catch(() => setPlans(AdminApi.getPlans()));
  }, []);

  /** Saves every plan together, so visitors never see one plan's new values with another's old ones. */
  const publish = async (next: Record<PlanId, PlanLimits>) => {
    const editable = (plan: PlanLimits) => ({
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      maxMembers: plan.maxMembers,
      maxInvoicesPerMonth: plan.maxInvoicesPerMonth,
      hasAllTemplates: plan.hasAllTemplates,
      canRemoveWatermark: plan.canRemoveWatermark,
      hasPrioritySupport: plan.hasPrioritySupport,
      hasIntegrationDocs: plan.hasIntegrationDocs,
      hasWhiteLabel: plan.hasWhiteLabel,
    });
    const body: PlanOverrides = { starter: editable(next.starter), pro: editable(next.pro), enterprise: editable(next.enterprise) };
    const result = await adminRequest('/api/admin/plans', { method: 'PUT', body: JSON.stringify(body) });
    if (result.ok) {
      applyPlanOverrides(body);
      window.dispatchEvent(new Event(PLANS_CHANGED_EVENT));
    }
    return result;
  };

  const handleChange = (planId: PlanId, field: keyof PlanLimits, value: any) => {
    setPlans((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (planId: PlanId) => {
    setSavingPlan(planId);
    const result = await publish(plans);
    setSavingPlan(null);
    if (!result.ok) {
      toast({
        title: 'Plan not saved',
        description: result.offline ? 'Shared storage is not connected, so visitors would not see this change.' : result.error,
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Plan Updated',
      description: `${plans[planId].name} is now live on the website.`,
    });
  };

  const handleReset = async (planId: PlanId) => {
    const next = { ...plans, [planId]: { ...DEFAULT_PLANS[planId] } };
    const result = await publish(next);
    if (!result.ok) {
      toast({ title: 'Plan not reset', description: result.error, variant: 'destructive' });
      return;
    }
    setPlans(next);
    toast({
      title: 'Plan Reset',
      description: `${DEFAULT_PLANS[planId].name} restored to its original settings.`,
    });
  };

  const planIds: PlanId[] = ['starter', 'pro', 'enterprise'];

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-primary" />
            Plan Limits & Pricing Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure monthly & yearly subscription fees, seat caps, document allowances, and feature entitlements.
          </p>
        </div>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {planIds.map((id) => {
          const plan = plans[id];
          const isProPlan = id === 'pro';
          const isEntPlan = id === 'enterprise';

          return (
            <div
              key={id}
              className={`rounded-xl border p-6 flex flex-col justify-between transition-all ${
                isProPlan
                  ? 'bg-card border-primary/50 ring-1 ring-primary/30 shadow-lg shadow-primary/5'
                  : isEntPlan
                  ? 'bg-card border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                  : 'bg-card border-border'
              }`}
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
                    <span className="text-xs text-muted-foreground tabular-nums">tier: {id}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      isProPlan
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : isEntPlan
                        ? 'border-indigo-400/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                        : 'border-border bg-muted text-foreground'
                    }`}
                  >
                    {id.toUpperCase()}
                  </Badge>
                </div>

                {/* Pricing Fields */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="text-xs font-bold text-foreground">Pricing (INR)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Monthly (₹)</label>
                      <Input
                        type="number"
                        value={plan.priceMonthly}
                        onChange={(e) => handleChange(id, 'priceMonthly', Number(e.target.value))}
                        className="bg-background border-border text-foreground text-xs h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Yearly / mo (₹)</label>
                      <Input
                        type="number"
                        value={plan.priceYearly}
                        onChange={(e) => handleChange(id, 'priceYearly', Number(e.target.value))}
                        className="bg-background border-border text-foreground text-xs h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Quotas & Capacity */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="text-xs font-bold text-foreground">Quotas & Seats</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Max Seats
                      </label>
                      <Input
                        type="number"
                        value={plan.maxMembers}
                        onChange={(e) => handleChange(id, 'maxMembers', Number(e.target.value))}
                        className="bg-background border-border text-foreground text-xs h-9"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Documents ({UNLIMITED_DOCUMENTS} = unlimited)
                      </label>
                      <Input
                        type="number"
                        value={plan.maxInvoicesPerMonth}
                        onChange={(e) => handleChange(id, 'maxInvoicesPerMonth', Number(e.target.value))}
                        className="bg-background border-border text-foreground text-xs h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="text-xs font-bold text-foreground">Feature Entitlements</div>
                  
                  <label className="flex items-center justify-between text-xs text-foreground p-2 rounded-lg bg-background border border-border cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      All Design Templates
                    </span>
                    <input
                      type="checkbox"
                      checked={plan.hasAllTemplates}
                      onChange={(e) => handleChange(id, 'hasAllTemplates', e.target.checked)}
                      className="rounded border-border bg-card text-primary h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-foreground p-2 rounded-lg bg-background border border-border cursor-pointer">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                      Remove {APP_CONFIG.brandName} Watermark
                    </span>
                    <input
                      type="checkbox"
                      checked={plan.canRemoveWatermark}
                      onChange={(e) => handleChange(id, 'canRemoveWatermark', e.target.checked)}
                      className="rounded border-border bg-card text-primary h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-foreground p-2 rounded-lg bg-background border border-border cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Code2 className="h-3.5 w-3.5 text-violet-700 dark:text-violet-400" />
                      Integration Docs
                    </span>
                    <input
                      type="checkbox"
                      checked={plan.hasIntegrationDocs}
                      onChange={(e) => handleChange(id, 'hasIntegrationDocs', e.target.checked)}
                      className="rounded border-border bg-card text-primary h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-foreground p-2 rounded-lg bg-background border border-border cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-400" />
                      White-label branding
                    </span>
                    <input
                      type="checkbox"
                      checked={plan.hasWhiteLabel}
                      onChange={(e) => handleChange(id, 'hasWhiteLabel', e.target.checked)}
                      className="rounded border-border bg-card text-primary h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-foreground p-2 rounded-lg bg-background border border-border cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-sky-700 dark:text-sky-400" />
                      Priority support
                    </span>
                    <input
                      type="checkbox"
                      checked={plan.hasPrioritySupport}
                      onChange={(e) => handleChange(id, 'hasPrioritySupport', e.target.checked)}
                      className="rounded border-border bg-card text-primary h-4 w-4"
                    />
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-border mt-6 flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReset(id)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave(id)}
                  disabled={savingPlan === id}
                  className="text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-sm"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {savingPlan === id ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
