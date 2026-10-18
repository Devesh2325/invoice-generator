'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTenant } from '@/lib/auth/tenant-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Gem,
  Star,
  Sparkles,
  CheckCircle2,
  Zap,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const PlanBadge: React.FC = () => {
  const { activeTenant } = useTenant();
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Derive active plan
  const plan = activeTenant?.plan || 'starter';

  // For free/starter users — show an upgrade icon (like Image 5 reference)
  if (plan === 'starter' || !plan) {
    return (
      <Link
        href="/dashboard/billing"
        className="px-2.5 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 shadow-xs ring-1 ring-amber-500/20"
        title="Upgrade your plan"
      >
        <Gem className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        <span className="tracking-wide uppercase text-[11px] font-extrabold hidden sm:inline">Upgrade</span>
      </Link>
    );
  }

  // Plan metadata mapping: Silver (Pro), Diamond (Enterprise), Star (VIP/Custom)
  const isDiamond = plan === 'enterprise';
  const isStar = (plan as string) === 'star';
  const isSilver = plan === 'pro' && !isStar;

  const planConfig = isDiamond
    ? {
        name: 'Diamond Tier',
        code: 'Enterprise',
        badgeClass:
          'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 shadow-xs ring-1 ring-cyan-500/20',
        icon: Gem,
        color: '#06B6D4',
        perks: [
          'Unlimited Invoices, POs & Estimates',
          'Full White-Label Branding & Custom Domains',
          'Automated GST CGST/SGST/IGST & E-Way Bill Sync',
          'Multi-Tenant Roles & Unlimited Team Seats',
          '24/7 Dedicated VIP Priority Support',
        ],
      }
    : isStar
    ? {
        name: 'Star VIP',
        code: 'VIP Platinum',
        badgeClass:
          'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 shadow-xs ring-1 ring-amber-500/20',
        icon: Star,
        color: '#F59E0B',
        perks: [
          'Lifetime VIP Access with Custom SLA',
          'Dedicated Account Manager & Concierge Onboarding',
          'Complete Custom Theme Studio & Watermark Removal',
          'Instant High-Speed PDF Rendering Clusters',
        ],
      }
    : {
        name: 'Silver Pro',
        code: 'Professional',
        badgeClass:
          'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400/40 hover:bg-slate-500/25 shadow-xs ring-1 ring-slate-400/20',
        icon: ShieldCheck,
        color: '#64748B',
        perks: [
          'Up to 500 Invoices & Documents / month',
          'Multi-Currency & Instant Scannable UPI QR',
          '5 Team Member Seats Included',
          'Automated Payment Reminders & Webhooks',
        ],
      };

  const IconComponent = planConfig.icon;

  return (
    <>
      <button
        type="button"
        onClick={() => setDetailsOpen(true)}
        className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${planConfig.badgeClass}`}
        title={`Active Subscription: ${planConfig.name} (Click for details)`}
      >
        <IconComponent className="h-3.5 w-3.5 shrink-0" style={{ color: planConfig.color }} />
        <span className="tracking-wide uppercase text-[11px] font-extrabold">{planConfig.name}</span>
      </button>

      {/* Plan Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground p-6 rounded-2xl shadow-2xl z-[100]">
          <DialogHeader>
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${planConfig.color}20` }}
                >
                  <IconComponent className="w-5 h-5" style={{ color: planConfig.color }} />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-foreground">
                    {planConfig.name} Subscription
                  </DialogTitle>
                  <p className="text-[11px] text-muted-foreground">
                    Workspace: <strong>{activeTenant?.name}</strong>
                  </p>
                </div>
              </div>
              <Badge
                className="text-[10px] uppercase font-bold"
                style={{
                  backgroundColor: `${planConfig.color}15`,
                  color: planConfig.color,
                  borderColor: `${planConfig.color}40`,
                }}
              >
                Active
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border flex items-center justify-between text-xs">
              <div>
                <div className="text-[11px] text-muted-foreground font-semibold">Billing Frequency</div>
                <div className="font-bold text-foreground">Monthly Active Plan</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-muted-foreground font-semibold">Status</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-Renews
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Unlocked Plan Privileges
              </div>
              <ul className="space-y-2 text-xs">
                {planConfig.perks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-2 text-foreground/90 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border flex items-center justify-between sm:justify-between w-full">
            <Link href="/dashboard/billing" onClick={() => setDetailsOpen(false)}>
              <Button variant="outline" size="sm" className="text-xs font-bold border-border">
                Manage Billing
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => setDetailsOpen(false)}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
