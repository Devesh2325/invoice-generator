'use client';

import React from 'react';
import { CURRENCIES, getCurrencyTaxProfile } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Landmark, Sparkles } from 'lucide-react';

const SELECT =
  'h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring';
const LABEL = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground';

interface TemplateOption {
  id: string;
  name: string;
  accent?: string;
}

interface InvoiceOptionsBarProps {
  currency: string;
  onCurrencyChange: (currency: string) => void;
  templateId: string;
  templateGroups: { category: string; label: string; templates: TemplateOption[] }[];
  isTemplateAllowed: (id: string) => boolean;
  onTemplateChange: (id: string) => void;
  accentColor: string;
  colorSwatches: { name: string; hex: string }[];
  onAccentChange: (hex: string) => void;
  invoiceName: string;
  onInvoiceNameChange: (value: string) => void;
  roundOff: boolean;
  onRoundOffChange: (value: boolean) => void;
  onOpenPaymentSettings: () => void;
}

/** Settings that have no natural place on the invoice paper. */
export const InvoiceOptionsBar: React.FC<InvoiceOptionsBarProps> = (props) => {
  // The currency's own template, then the free designs that work anywhere.
  const currencyTemplateId = getCurrencyTaxProfile(props.currency).defaultTemplateId;
  const anyBusiness = props.templateGroups.find((group) => group.category === 'style')?.templates || [];
  const currencyTemplate = props.templateGroups.flatMap((group) => group.templates).filter((template) => template.id === currencyTemplateId);
  const freeTemplates = [...currencyTemplate, ...anyBusiness.filter((template) => template.id !== currencyTemplateId)].filter((template) =>
    props.isTemplateAllowed(template.id)
  );
  const isListed = props.templateGroups.some((group) => group.templates.some((template) => template.id === props.templateId));

  return (
    <section aria-label="Invoice options" className="glass-card rounded-2xl p-4 sm:p-5">
      {freeTemplates.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Free templates
          </span>
          {freeTemplates.map((template) => {
            const selected = template.id === props.templateId;
            return (
              <button
                key={template.id}
                type="button"
                aria-pressed={selected}
                onClick={() => props.onTemplateChange(template.id)}
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-all ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-background text-foreground hover:-translate-y-px hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                {selected ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: template.accent || 'currentColor' }} aria-hidden="true" />
                )}
                {template.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="block">
          <span className={LABEL}>Currency</span>
          <select className={SELECT} value={props.currency} onChange={(e) => props.onCurrencyChange(e.target.value)}>
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} – {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={LABEL}>All templates</span>
          <select className={SELECT} value={props.templateId} onChange={(e) => props.onTemplateChange(e.target.value)}>
            {!isListed && <option value={props.templateId}>Older design (this invoice)</option>}
            {props.templateGroups.map((group) => (
              <optgroup key={group.category} label={group.label.replace(/^[^\p{L}]+/u, '')}>
                {group.templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                    {props.isTemplateAllowed(template.id) ? '' : ' (paid plans)'}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={LABEL}>Name for your records</span>
          <Input className="h-10 rounded-xl text-sm" value={props.invoiceName} onChange={(e) => props.onInvoiceNameChange(e.target.value)} />
        </label>

        <div>
          <span className={LABEL}>How to get paid</span>
          <Button type="button" variant="outline" className="h-10 w-full rounded-xl text-sm font-medium" onClick={props.onOpenPaymentSettings}>
            <Landmark className="mr-1.5 h-4 w-4" /> UPI and bank
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colour</span>
          {props.colorSwatches.map((swatch) => (
            <button
              key={swatch.hex}
              type="button"
              aria-label={swatch.name}
              aria-pressed={props.accentColor.toLowerCase() === swatch.hex.toLowerCase()}
              onClick={() => props.onAccentChange(swatch.hex)}
              className={`h-7 w-7 rounded-full border border-black/10 transition-transform hover:scale-110 dark:border-white/20 ${
                props.accentColor.toLowerCase() === swatch.hex.toLowerCase() ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''
              }`}
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
          <input
            type="color"
            aria-label="Custom colour"
            value={props.accentColor}
            onChange={(e) => props.onAccentChange(e.target.value)}
            className="h-7 w-7 cursor-pointer rounded-lg border border-border bg-background p-0.5"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" className="h-4 w-4 accent-primary" checked={props.roundOff} onChange={(e) => props.onRoundOffChange(e.target.checked)} />
          Round the total to a whole number
        </label>
      </div>
    </section>
  );
};
