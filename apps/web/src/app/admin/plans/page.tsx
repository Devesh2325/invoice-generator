'use client';

import React, { useEffect, useState } from 'react';
import { AdminApi } from '@invoice/api';
import { PlanId, PlanLimits, PLANS, APP_CONFIG } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Save, RotateCcw, Check, Users, FileText, Sparkles, ShieldCheck } from 'lucide-react';

export default function AdminPlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Record<PlanId, PlanLimits>>(PLANS);
  const [savingPlan, setSavingPlan] = useState<PlanId | null>(null);

  useEffect(() => {
    setPlans(AdminApi.getPlans());
  }, []);

  const handleChange = (planId: PlanId, field: keyof PlanLimits, value: any) => {
    setPlans((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value,
      },
    }));
  };

  const handleSave = (planId: PlanId) => {
    setSavingPlan(planId);
    AdminApi.updatePlan(planId, plans[planId]);
    setTimeout(() => {
      setSavingPlan(null);
      toast({
        title: 'Plan Updated',
        description: `Configuration and limits for ${plans[planId].name} have been updated.`,
      });
    }, 300);
  };

  const handleReset = (planId: PlanId) => {
    setPlans((prev) => ({
      ...prev,
      [planId]: { ...PLANS[planId] },
    }));
    AdminApi.updatePlan(planId, PLANS[planId]);
    toast({
      title: 'Plan Reset',
      description: `${PLANS[planId].name} restored to system defaults.`,
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
                        <FileText className="h-3 w-3" /> Invoices/mo
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
                      All 17+ Design Templates
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
