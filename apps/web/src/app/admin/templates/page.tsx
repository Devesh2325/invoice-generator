'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminApi } from '@invoice/api';
import { GeneratorFieldSettings, getCurrencyTaxProfile, isTemplateAllowedForPlan } from '@invoice/core';
import { getTemplatesByCategory } from '@invoice/theme';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ExternalLink, Palette, SlidersHorizontal } from 'lucide-react';

const COLUMNS: { field: keyof GeneratorFieldSettings; label: string; hint: string }[] = [
  { field: 'showHsnColumn', label: 'HSN / SAC code', hint: 'For INR invoices' },
  { field: 'showTaxRateColumn', label: 'Tax rate', hint: 'Rate and tax on each line' },
  { field: 'showUnitColumn', label: 'Unit', hint: 'Such as PCS, HRS or KGS' },
  { field: 'showDiscountColumn', label: 'Discount', hint: 'Discount on each line' },
];

// A template can't be switched off while it's a currency's default: new invoices in that currency would have nothing to fall back on.
const CURRENCY_DEFAULTS = new Set(
  ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'SGD', 'AED', 'CHF', 'KWD'].map((code) => getCurrencyTaxProfile(code).defaultTemplateId)
);

export default function AdminTemplatesPage() {
  const { toast } = useToast();
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<GeneratorFieldSettings>(() => AdminApi.getGeneratorSettings());

  useEffect(() => setDisabled(new Set(AdminApi.getDisabledTemplateIds())), []);

  const handleToggleColumn = (field: keyof GeneratorFieldSettings) => {
    const updated = { ...columns, [field]: !columns[field] };
    AdminApi.updateGeneratorSettings(updated);
    setColumns(updated);
    window.dispatchEvent(new Event('billcraft-generator-settings-updated'));
  };

  const handleToggleTemplate = (id: string, name: string) => {
    const enable = disabled.has(id);
    AdminApi.setTemplateEnabled(id, enable);
    setDisabled(new Set(AdminApi.getDisabledTemplateIds()));
    toast({ title: enable ? `${name} is now available` : `${name} is now hidden` });
  };

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-foreground">
          <Palette className="h-6 w-6 text-primary" />
          Templates
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose which templates can be used, and which line columns show by default.</p>
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          These settings are saved in this browser only, so they don’t reach your customers yet. That needs a shared database behind the admin area.
        </p>
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Default line columns
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map(({ field, label, hint }) => (
            <label key={field} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
              <span>
                <span className="block text-sm font-medium text-foreground">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={columns[field]} onChange={() => handleToggleColumn(field)} />
            </label>
          ))}
        </div>
      </section>

      {getTemplatesByCategory().map((group) => (
        <section key={group.category}>
          <h2 className="mb-3 text-sm font-bold text-foreground">{group.label}</h2>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {group.templates.map((template) => {
              const isDefault = CURRENCY_DEFAULTS.has(template.id);
              const available = !disabled.has(template.id);
              return (
                <div key={template.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: template.defaultTokens.primaryColor }} aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                        {template.name}
                        <Badge variant="outline" className="text-xs">
                          {isTemplateAllowedForPlan('starter', template.id) ? 'Free' : 'Paid plans'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={`/templates/${template.id}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      View <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    {isDefault ? (
                      <span className="w-24 text-right text-xs text-muted-foreground">Currency default</span>
                    ) : (
                      <label className="flex w-24 cursor-pointer items-center justify-end gap-2 text-sm text-foreground">
                        Available
                        <input type="checkbox" className="h-4 w-4 accent-primary" checked={available} onChange={() => handleToggleTemplate(template.id, template.name)} />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
