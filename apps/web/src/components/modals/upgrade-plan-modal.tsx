'use client';

import React from 'react';
import Link from 'next/link';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  open,
  onOpenChange,
  title = 'Upgrade to Professional',
  description = 'Unlock all 8+ structural layout templates, team seats, automated payment reminders, and custom domain support.',
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 border-border bg-card rounded-2xl shadow-2xl text-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border border-border text-left space-y-2 text-xs">
          <div className="font-bold text-foreground text-[11px] uppercase tracking-wider mb-1">
            Included in Professional (₹799/mo):
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>All 8+ Structural Designer Templates</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Up to 5 Team Members with Granular Roles</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Remove BillCraft Watermark on PDFs</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Payment Reminders & Refund History</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link href="/dashboard/billing" onClick={() => onOpenChange(false)}>
            <Button className="w-full text-xs font-bold bg-primary text-primary-foreground shadow-sm">
              View Billing & Upgrade <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
