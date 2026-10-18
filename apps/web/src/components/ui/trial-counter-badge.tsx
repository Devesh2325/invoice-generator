'use client';

import React from 'react';
import { APP_CONFIG } from '@invoice/core';
import { Sparkles, AlertTriangle, Lock } from 'lucide-react';

interface TrialCounterBadgeProps {
  invoiceCount: number;
  invoiceLimit?: number;
  plan?: string;
  onUpgradeClick?: () => void;
  className?: string;
  compact?: boolean;
}

export const TrialCounterBadge: React.FC<TrialCounterBadgeProps> = ({
  invoiceCount,
  invoiceLimit = APP_CONFIG.trialInvoiceLimit,
  plan = 'starter',
  onUpgradeClick,
  className = '',
  compact = false,
}) => {
  const isPaid = plan === 'pro' || plan === 'enterprise';

  if (isPaid) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 ${className}`}
      >
        <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="capitalize">{plan}</span>
        <span className="text-[10px] opacity-75 font-normal">· Unlimited</span>
      </div>
    );
  }

  const limit = invoiceLimit;
  const count = Math.min(invoiceCount, limit);
  const percentage = Math.min(100, Math.round((invoiceCount / limit) * 100));
  const isLimitReached = invoiceCount >= limit;
  const isWarning = APP_CONFIG.trialWarningThresholds.includes(invoiceCount);
  const remaining = Math.max(0, limit - invoiceCount);

  // Compact variant for header bars
  if (compact) {
    return (
      <button
        type="button"
        onClick={onUpgradeClick}
        title={
          isLimitReached
            ? 'Trial invoice limit reached (7/7). Click to upgrade.'
            : `${count} of ${limit} trial invoices used`
        }
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all hover:shadow-xs cursor-pointer ${
          isLimitReached
            ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
            : isWarning
            ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200'
            : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
        } ${className}`}
      >
        {isLimitReached ? (
          <Lock className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        ) : isWarning ? (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
        )}

        <span className="font-mono font-bold text-[11px]">
          {invoiceCount} / {limit}
        </span>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">invoices used</span>

        <span className="text-[10px] font-bold uppercase tracking-wider text-primary underline underline-offset-2 ml-0.5">
          {isLimitReached ? 'Upgrade' : isWarning ? `Only ${remaining} left` : 'Get Pro'}
        </span>
      </button>
    );
  }

  // Full card widget for dashboard and modals
  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        isLimitReached
          ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/60'
          : isWarning
          ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/60'
          : 'bg-card border-border'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {isLimitReached ? (
            <Lock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          ) : isWarning ? (
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" />
          )}
          <span className="text-xs font-bold text-foreground">
            {isLimitReached
              ? 'Free Trial Limit Reached'
              : isWarning
              ? 'Free Trial Ending Soon'
              : 'Free Trial Usage'}
          </span>
        </div>

        <span className="text-xs font-mono font-bold text-foreground">
          {invoiceCount} / {limit} invoices
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2.5">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isLimitReached
              ? 'bg-rose-600'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">
          {isLimitReached
            ? 'Upgrade to Pro for unlimited invoices & templates'
            : isWarning
            ? `Only ${remaining} invoice${remaining === 1 ? '' : 's'} remaining in trial`
            : `${remaining} free invoice${remaining === 1 ? '' : 's'} remaining`}
        </span>

        {onUpgradeClick && (
          <button
            type="button"
            onClick={onUpgradeClick}
            className="font-bold text-primary hover:underline underline-offset-2 ml-2 shrink-0 cursor-pointer"
          >
            {isLimitReached ? 'Upgrade Now →' : 'Upgrade →'}
          </button>
        )}
      </div>
    </div>
  );
};
