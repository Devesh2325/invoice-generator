'use client';

import React from 'react';
import { APP_CONFIG } from '@invoice/core';
import { Input } from '@/components/ui/input';
import { Layers } from 'lucide-react';

export interface BrandForm {
  companyDisplayName: string;
  logoUrl: string;
  primaryColor: string;
  supportEmail: string;
  websiteUrl: string;
  footerText: string;
  customDomain: string;
}

export const EMPTY_BRAND: BrandForm = {
  companyDisplayName: '',
  logoUrl: '',
  primaryColor: '',
  supportEmail: '',
  websiteUrl: '',
  footerText: '',
  customDomain: '',
};

const INPUT = 'bg-background border-border text-foreground text-xs h-9';

export function BrandingFields({ value, onChange }: { value: BrandForm; onChange: (next: BrandForm) => void }) {
  const set = (field: keyof BrandForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: e.target.value });

  return (
    <div className="space-y-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5">
      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
        <Layers className="h-3.5 w-3.5" />
        White-Label Brand Settings
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Company Display Name</label>
        <Input value={value.companyDisplayName} onChange={set('companyDisplayName')} placeholder="e.g. Acme Invoicing" className={INPUT} />
        <p className="text-xs text-muted-foreground">Replaces &ldquo;{APP_CONFIG.brandName}&rdquo; in this workspace&apos;s dashboard and on its shared invoices.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Logo URL</label>
        <Input type="url" value={value.logoUrl} onChange={set('logoUrl')} placeholder="https://example.com/logo.png" className={INPUT} />
        <p className="text-xs text-muted-foreground">An https link to a PNG or SVG. A square image works best.</p>
        {value.logoUrl.trim().startsWith('https://') && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.logoUrl}
              alt="Logo preview"
              className="h-10 w-10 rounded border border-border object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-xs text-muted-foreground">Logo preview</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Brand Colour</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Brand colour"
            value={/^#[0-9a-fA-F]{6}$/.test(value.primaryColor) ? value.primaryColor : '#5b4bff'}
            onChange={set('primaryColor')}
            className="h-9 w-11 cursor-pointer rounded-lg border border-border bg-background p-1"
          />
          <Input value={value.primaryColor} onChange={set('primaryColor')} placeholder="#5B4BFF" pattern="^#[0-9a-fA-F]{6}$" className={INPUT} />
        </div>
        <p className="text-xs text-muted-foreground">Used for buttons and highlights in this workspace&apos;s dashboard.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Support Email</label>
          <Input type="email" value={value.supportEmail} onChange={set('supportEmail')} placeholder="help@acme.com" className={INPUT} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Website</label>
          <Input type="url" value={value.websiteUrl} onChange={set('websiteUrl')} placeholder="https://acme.com" className={INPUT} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Shown to customers at the bottom of shared invoices.</p>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Footer Text</label>
        <Input value={value.footerText} onChange={set('footerText')} placeholder="Thank you for your business!" maxLength={300} className={INPUT} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">Custom Domain</label>
        <Input value={value.customDomain} onChange={set('customDomain')} placeholder="billing.acme.com" className={INPUT} />
        <p className="text-xs text-muted-foreground">
          Visitors there see only this brand. To finish, add the domain in Vercel under Settings, Domains, and point its DNS as Vercel shows.
        </p>
      </div>
    </div>
  );
}
