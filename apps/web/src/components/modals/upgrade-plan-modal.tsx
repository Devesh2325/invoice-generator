'use client';

import React from 'react';
import Link from 'next/link';
import { APP_CONFIG } from '@invoice/core';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  reason?: string;
  currentCount?: number;
  maxCount?: number;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  open,
  onOpenChange,
  title = 'Upgrade Your Plan',
  description = `Scale your financial workflow with unlimited invoices, all premium templates, and white-label branding on ${APP_CONFIG.brandName}.`,
  reason,
  currentCount,
  maxCount = APP_CONFIG.trialInvoiceLimit,
}) => {
  const effectiveDescription = reason || description;
  const isLimitReached = typeof currentCount === 'number' && currentCount >= maxCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-6 sm:p-8 border-border bg-card rounded-2xl shadow-2xl space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
            {isLimitReached ? (
              <Lock className="h-6 w-6 text-primary" />
            ) : (
              <Sparkles className="h-6 w-6 text-primary" />
            )}
          </div>

          <h3 className="text-xl font-black text-foreground tracking-tight">
            {isLimitReached ? `Free Trial Limit Reached (${maxCount}/${maxCount})` : title}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {isLimitReached && !reason
              ? `You have reached the maximum allowance of ${maxCount} free trial invoices. Upgrade to Pro or Enterprise for unlimited generation and inventory control.`
              : effectiveDescription}
          </p>
        </div>

        {/* Plan Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pro Plan */}
          <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 relative space-y-3">
            <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
              Most Popular
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-wider text-primary">
                {APP_CONFIG.plans.pro.name}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-foreground">
                  ₹{APP_CONFIG.plans.pro.price}
                </span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-foreground">Unlimited Invoices & Quotes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>All 10+ Premium PDF Templates</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Products & Barcode Inventory</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Remove {APP_CONFIG.brandName} Watermark</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Instant WhatsApp & Email Share</span>
              </li>
            </ul>

            <Link href="/dashboard/billing" onClick={() => onOpenChange(false)}>
              <Button className="w-full text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-sm mt-2">
                Upgrade to Pro <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-foreground">
                {APP_CONFIG.plans.enterprise.name}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-foreground">
                  ₹{APP_CONFIG.plans.enterprise.price}
                </span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span className="font-semibold text-foreground">Full White-Label Multi-Tenant</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Custom Domain & Logo Portal</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Tenant Isolation & Sub-accounts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Dedicated Priority Support</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Automated Stock Deductions</span>
              </li>
            </ul>

            <Link href="/dashboard/billing" onClick={() => onOpenChange(false)}>
              <Button variant="outline" className="w-full text-xs font-bold border-border shadow-xs mt-2">
                Choose Enterprise
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-[11px] text-muted-foreground">
            Cancel anytime • Secure payment via UPI, Cards, NetBanking
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
