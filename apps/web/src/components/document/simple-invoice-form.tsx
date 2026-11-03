'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import {
  CURRENCIES,
  INDIAN_STATES,
  DocumentCalculatedSummary,
  CalculatedLineItem,
  Party,
  formatCurrency,
  getCurrencyTaxProfile,
  validateUpiId,
} from '@invoice/core';
import { ProductCatalogItem } from '@invoice/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Check, ChevronDown, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';

const SELECT =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const INDIA_GST_RATES = [0, 5, 12, 18, 28];

export interface PartyFields {
  name: string;
  email: string;
  phone: string;
  taxId: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface TemplateGroup {
  category: string;
  label: string;
  templates: { id: string; name: string }[];
}

interface SimpleInvoiceFormProps {
  currency: string;
  onCurrencyChange: (currency: string) => void;

  sender: PartyFields & { logo: string };
  onSenderChange: (field: string, value: string) => void;
  onSenderAddressChange: (field: string, value: string) => void;
  onLogoChange: (dataUrl: string) => void;

  client: PartyFields;
  onClientChange: (field: string, value: string) => void;
  onClientAddressChange: (field: string, value: string) => void;
  savedCustomers: Party[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;

  items: any[];
  calculatedItems: CalculatedLineItem[];
  summary: DocumentCalculatedSummary;
  onUpdateItem: (index: number, field: string, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  savedItems: ProductCatalogItem[];
  onAddSavedItem: (id: string) => void;

  docNumber: string;
  onDocNumberChange: (value: string) => void;
  issueDate: string;
  onIssueDateChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;

  upiId: string;
  onUpiIdChange: (value: string) => void;
  bankCount: number;
  onOpenBankSettings: () => void;

  discountType: 'percentage' | 'fixed';
  discountValue: number;
  onDiscountChange: (type: 'percentage' | 'fixed', value: number) => void;
  shippingFee: number;
  onShippingChange: (value: number) => void;
  roundOff: boolean;
  onRoundOffChange: (value: boolean) => void;

  referenceNumber: string;
  onReferenceChange: (value: string) => void;
  invoiceName: string;
  onInvoiceNameChange: (value: string) => void;
  paymentTerms: string;
  onPaymentTermsChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;

  templateId: string;
  templateGroups: TemplateGroup[];
  isTemplateAllowed: (id: string) => boolean;
  onTemplateChange: (id: string) => void;
  accentColor: string;
  colorSwatches: { name: string; hex: string }[];
  onAccentChange: (hex: string) => void;
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactElement; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {React.cloneElement(children, { id })}
    </div>
  );
}

function Step({ number, title, hint, children }: { number: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
          {number}
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Optional({ title, summary, children }: { title: string; summary?: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-border last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">{title}</span>
          {summary && <span className="block truncate text-sm text-muted-foreground">{summary}</span>}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-4 pb-4">{children}</div>
    </details>
  );
}

function numberValue(value: number | string | undefined) {
  return Number(value) === 0 ? '' : (value as number);
}

export const SimpleInvoiceForm: React.FC<SimpleInvoiceFormProps> = (props) => {
  const {
    currency,
    sender,
    client,
    items,
    calculatedItems,
    summary,
    savedCustomers,
    savedItems,
  } = props;

  const profile = getCurrencyTaxProfile(currency);
  const isIndia = profile.isIndiaGst;
  const money = (value: number) => formatCurrency(value, currency);
  const logoInput = useRef<HTMLInputElement>(null);

  // The business card stays open until a name exists, then it collapses to one line.
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showBusinessDetails, setShowBusinessDetails] = useState(false);
  const typedBusinessName = useRef(false);
  useEffect(() => {
    if (!sender.name) setEditingBusiness(true);
    else if (!typedBusinessName.current) setEditingBusiness(false); // Filled in from saved details
  }, [sender.name]);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Logo must be under 2 MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => props.onLogoChange(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const stateField = (value: string, onChange: (value: string) => void) =>
    isIndia ? (
      <select className={SELECT} value={value} onChange={(e) => onChange(e.target.value)}>
        {!INDIAN_STATES.some((s) => s.label === value) && <option value={value}>{value || 'Select state'}</option>}
        {[...INDIAN_STATES]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((s) => (
            <option key={s.code} value={s.label}>
              {s.name}
            </option>
          ))}
      </select>
    ) : (
      <Input className="h-10 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    );

  const stateName = (value: string) => INDIAN_STATES.find((s) => s.label === value)?.name || value;
  const isInterState = summary.gstSupplyType === 'inter';
  const upiStatus = props.upiId ? validateUpiId(props.upiId) : null;

  const missing = [
    !sender.name.trim() && 'your business name',
    !client.name.trim() && 'the customer name',
    !items.some((item) => String(item.description || '').trim() && Number(item.unitPrice) > 0) && 'an item with a price',
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Step number={1} title="Your business" hint={editingBusiness ? 'This appears at the top of the invoice.' : undefined}>
        {!editingBusiness ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex min-w-0 items-center gap-3">
              {sender.logo && <img src={sender.logo} alt="" className="h-9 w-9 shrink-0 rounded object-contain" />}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{sender.name}</div>
                <div className="truncate text-sm text-muted-foreground">
                  {[isIndia ? stateName(sender.state) : sender.country, sender.taxId].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 text-sm" onClick={() => setEditingBusiness(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        ) : (
          <>
            <Field label="Business name">
              <Input
                className="h-10 text-sm"
                value={sender.name}
                onChange={(e) => {
                  typedBusinessName.current = true;
                  props.onSenderChange('name', e.target.value);
                }}
                autoComplete="organization"
              />
            </Field>
            {isIndia && <Field label="State">{stateField(sender.state, (v) => props.onSenderAddressChange('state', v))}</Field>}

            {!showBusinessDetails ? (
              <button type="button" onClick={() => setShowBusinessDetails(true)} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <Plus className="h-4 w-4" /> Add {profile.taxIdLabel}, logo, email or address
              </button>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={profile.taxIdLabel}>
                    <Input className="h-10 text-sm uppercase" value={sender.taxId} onChange={(e) => props.onSenderChange('taxId', e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <Input className="h-10 text-sm" type="email" value={sender.email} onChange={(e) => props.onSenderChange('email', e.target.value)} />
                  </Field>
                  <Field label="Phone">
                    <Input className="h-10 text-sm" type="tel" value={sender.phone} onChange={(e) => props.onSenderChange('phone', e.target.value)} />
                  </Field>
                  <Field label="Address">
                    <Input className="h-10 text-sm" value={sender.street} onChange={(e) => props.onSenderAddressChange('street1', e.target.value)} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="City">
                    <Input className="h-10 text-sm" value={sender.city} onChange={(e) => props.onSenderAddressChange('city', e.target.value)} />
                  </Field>
                  <Field label={isIndia ? 'PIN code' : 'Postal code'}>
                    <Input className="h-10 text-sm" value={sender.postalCode} onChange={(e) => props.onSenderAddressChange('postalCode', e.target.value)} />
                  </Field>
                  <Field label="Country">
                    <Input className="h-10 text-sm" value={sender.country} onChange={(e) => props.onSenderAddressChange('country', e.target.value)} />
                  </Field>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                  {sender.logo && <img src={sender.logo} alt="Business logo" className="h-10 w-10 rounded border border-border object-contain" />}
                  <Button type="button" variant="outline" size="sm" className="h-9 text-sm" onClick={() => logoInput.current?.click()}>
                    <Upload className="mr-1.5 h-3.5 w-3.5" /> {sender.logo ? 'Change logo' : 'Add logo'}
                  </Button>
                  {sender.logo && (
                    <Button type="button" variant="ghost" size="sm" className="h-9 text-sm" onClick={() => props.onLogoChange('')}>
                      <X className="mr-1.5 h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </div>
              </>
            )}
            {sender.name.trim() && (
              <div className="flex justify-end">
                <Button type="button" size="sm" className="h-9 bg-primary text-sm text-white hover:bg-primary-hover" onClick={() => setEditingBusiness(false)}>
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Done
                </Button>
              </div>
            )}
          </>
        )}
      </Step>

      <Step number={2} title="Customer" hint="Who is this invoice for?">
        {savedCustomers.length > 0 && (
          <Field label="Saved customer">
            <select className={SELECT} value={props.selectedCustomerId} onChange={(e) => props.onSelectCustomer(e.target.value)}>
              <option value="">New customer</option>
              {savedCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer name" className={isIndia ? '' : 'sm:col-span-2'}>
            <Input className="h-10 text-sm" value={client.name} onChange={(e) => props.onClientChange('name', e.target.value)} />
          </Field>
          {isIndia && <Field label="State">{stateField(client.state, (v) => props.onClientAddressChange('state', v))}</Field>}
        </div>

        {!showClientDetails ? (
          <button type="button" onClick={() => setShowClientDetails(true)} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <Plus className="h-4 w-4" /> Add {profile.taxIdLabel}, email or address
          </button>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={profile.taxIdLabel}>
                <Input className="h-10 text-sm uppercase" value={client.taxId} onChange={(e) => props.onClientChange('taxId', e.target.value)} />
              </Field>
              <Field label="Email">
                <Input className="h-10 text-sm" type="email" value={client.email} onChange={(e) => props.onClientChange('email', e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input className="h-10 text-sm" type="tel" value={client.phone} onChange={(e) => props.onClientChange('phone', e.target.value)} />
              </Field>
              <Field label="Address">
                <Input className="h-10 text-sm" value={client.street} onChange={(e) => props.onClientAddressChange('street1', e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City">
                <Input className="h-10 text-sm" value={client.city} onChange={(e) => props.onClientAddressChange('city', e.target.value)} />
              </Field>
              <Field label={isIndia ? 'PIN code' : 'Postal code'}>
                <Input className="h-10 text-sm" value={client.postalCode} onChange={(e) => props.onClientAddressChange('postalCode', e.target.value)} />
              </Field>
              <Field label="Country">
                <Input className="h-10 text-sm" value={client.country} onChange={(e) => props.onClientAddressChange('country', e.target.value)} />
              </Field>
            </div>
          </>
        )}
      </Step>

      <Step number={3} title="Items" hint="What are you charging for?">
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id || index} className="rounded-lg border border-border p-3">
              <div className="flex items-start gap-2">
                <Field label="Item or service" className="min-w-0 flex-1">
                  <Input
                    className="h-10 text-sm"
                    value={item.description || ''}
                    onChange={(e) => props.onUpdateItem(index, 'description', e.target.value)}
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => props.onRemoveItem(index)}
                  disabled={items.length <= 1}
                  aria-label={`Remove item ${index + 1}`}
                  className="mt-7 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive disabled:invisible"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className={`mt-3 grid grid-cols-2 gap-3 ${isIndia ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
                <Field label="Qty">
                  <Input
                    className="h-10 text-sm"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => props.onUpdateItem(index, 'quantity', e.target.value)}
                  />
                </Field>
                <Field label="Price">
                  <Input
                    className="h-10 text-sm"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={numberValue(item.unitPrice)}
                    onChange={(e) => props.onUpdateItem(index, 'unitPrice', e.target.value)}
                  />
                </Field>
                <Field label={`${profile.taxLabel} %`}>
                  {isIndia ? (
                    <select className={SELECT} value={Number(item.taxRate) || 0} onChange={(e) => props.onUpdateItem(index, 'taxRate', Number(e.target.value))}>
                      {[...new Set([...INDIA_GST_RATES, Number(item.taxRate) || 0])]
                        .sort((a, b) => a - b)
                        .map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}%
                          </option>
                        ))}
                    </select>
                  ) : (
                    <Input
                      className="h-10 text-sm"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      step="any"
                      value={numberValue(item.taxRate)}
                      onChange={(e) => props.onUpdateItem(index, 'taxRate', e.target.value)}
                    />
                  )}
                </Field>
                {isIndia && (
                  <Field label="HSN/SAC">
                    <Input className="h-10 text-sm" value={item.hsnCode || ''} onChange={(e) => props.onUpdateItem(index, 'hsnCode', e.target.value)} />
                  </Field>
                )}
                <div className="text-right">
                  <span className="mb-1.5 block text-sm font-medium text-foreground">Amount</span>
                  <span className="block py-2.5 text-sm font-medium tabular-nums text-foreground">{money(calculatedItems[index]?.lineNet || 0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" className="h-10 text-sm font-medium" onClick={props.onAddItem}>
            <Plus className="mr-1.5 h-4 w-4" /> Add item
          </Button>
          {savedItems.length > 0 && (
            <select
              className={`${SELECT} sm:max-w-56`}
              aria-label="Add a saved item"
              value=""
              onChange={(e) => e.target.value && props.onAddSavedItem(e.target.value)}
            >
              <option value="">Add a saved item…</option>
              {savedItems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({money(p.unitPrice)})
                </option>
              ))}
            </select>
          )}
        </div>

        <dl className="space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{money(summary.subtotal)}</dd>
          </div>
          {summary.discountTotal > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Discount</dt>
              <dd className="tabular-nums">−{money(summary.discountTotal)}</dd>
            </div>
          )}
          {isIndia ? (
            isInterState ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">IGST</dt>
                <dd className="tabular-nums">{money(summary.igstTotal || 0)}</dd>
              </div>
            ) : (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">CGST</dt>
                  <dd className="tabular-nums">{money(summary.cgstTotal || 0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">SGST</dt>
                  <dd className="tabular-nums">{money(summary.sgstTotal || 0)}</dd>
                </div>
              </>
            )
          ) : (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{profile.taxLabel}</dt>
              <dd className="tabular-nums">{money(summary.totalTax)}</dd>
            </div>
          )}
          {summary.shippingFee > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">{money(summary.shippingFee)}</dd>
            </div>
          )}
          {Boolean(summary.roundOffAmount) && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Round-off</dt>
              <dd className="tabular-nums">{money(summary.roundOffAmount || 0)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(summary.grandTotal)}</dd>
          </div>
          {isIndia && (
            <p className="pt-1 text-sm text-muted-foreground">
              {isInterState
                ? 'Customer is in another state, so IGST applies.'
                : 'Customer is in your state, so CGST and SGST apply.'}
            </p>
          )}
        </dl>
      </Step>

      <Step number={4} title="Invoice details">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Number">
            <Input className="h-10 text-sm" value={props.docNumber} onChange={(e) => props.onDocNumberChange(e.target.value)} />
          </Field>
          <Field label="Currency">
            <select className={SELECT} value={currency} onChange={(e) => props.onCurrencyChange(e.target.value)}>
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} – {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Invoice date">
            <Input className="h-10 text-sm" type="date" value={props.issueDate} onChange={(e) => props.onIssueDateChange(e.target.value)} />
          </Field>
          <Field label="Due date">
            <Input className="h-10 text-sm" type="date" value={props.dueDate} onChange={(e) => props.onDueDateChange(e.target.value)} />
          </Field>
        </div>
      </Step>

      <section className="rounded-xl border border-border bg-card px-4 sm:px-5">
        <h2 className="pb-1 pt-4 text-base font-semibold text-foreground">Optional</h2>

        <Optional
          title="How to get paid"
          summary={[props.upiId && `UPI: ${props.upiId}`, props.bankCount > 0 && `${props.bankCount} bank account${props.bankCount > 1 ? 's' : ''}`].filter(Boolean).join(' · ') || 'Add UPI or bank details'}
        >
          {isIndia && (
            <div>
              <Field label="UPI ID">
                <Input
                  className="h-10 text-sm"
                  value={props.upiId}
                  aria-invalid={Boolean(upiStatus && !upiStatus.valid)}
                  onChange={(e) => props.onUpiIdChange(e.target.value)}
                />
              </Field>
              {upiStatus && !upiStatus.valid ? (
                <p className="mt-1 text-sm text-destructive" role="alert">{upiStatus.error}</p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Adds a QR code with the invoice amount.</p>
              )}
            </div>
          )}
          <Button type="button" variant="outline" className="h-10 text-sm font-medium" onClick={props.onOpenBankSettings}>
            {props.bankCount > 0 ? 'Manage bank details' : 'Add bank details'}
          </Button>
        </Optional>

        <Optional title="Discount and shipping">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Discount">
              <Input
                className="h-10 text-sm"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={numberValue(props.discountValue)}
                onChange={(e) => props.onDiscountChange(props.discountType, Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Discount type">
              <select
                className={SELECT}
                value={props.discountType}
                onChange={(e) => props.onDiscountChange(e.target.value as 'percentage' | 'fixed', props.discountValue)}
              >
                <option value="percentage">Percent (%)</option>
                <option value="fixed">Amount</option>
              </select>
            </Field>
            <Field label="Shipping">
              <Input
                className="h-10 text-sm"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={numberValue(props.shippingFee)}
                onChange={(e) => props.onShippingChange(Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" className="h-4 w-4" checked={props.roundOff} onChange={(e) => props.onRoundOffChange(e.target.checked)} />
            Round the total to a whole number
          </label>
        </Optional>

        <Optional title="Notes and terms">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="PO or reference number">
              <Input className="h-10 text-sm" value={props.referenceNumber} onChange={(e) => props.onReferenceChange(e.target.value)} />
            </Field>
            <Field label="Payment terms">
              <Input className="h-10 text-sm" value={props.paymentTerms} onChange={(e) => props.onPaymentTermsChange(e.target.value)} />
            </Field>
          </div>
          <Field label="Note to customer">
            <Textarea rows={3} className="text-sm" value={props.notes} onChange={(e) => props.onNotesChange(e.target.value)} />
          </Field>
          <Field label="Name for your records">
            <Input className="h-10 text-sm" value={props.invoiceName} onChange={(e) => props.onInvoiceNameChange(e.target.value)} />
          </Field>
        </Optional>

        <Optional title="Template and colour">
          <Field label="Template">
            <select className={SELECT} value={props.templateId} onChange={(e) => props.onTemplateChange(e.target.value)}>
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
          </Field>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-foreground">Colour</span>
            <div className="flex flex-wrap items-center gap-2">
              {props.colorSwatches.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  aria-label={swatch.name}
                  aria-pressed={props.accentColor.toLowerCase() === swatch.hex.toLowerCase()}
                  onClick={() => props.onAccentChange(swatch.hex)}
                  className={`h-8 w-8 rounded-full border border-black/10 ${
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
                className="h-8 w-8 cursor-pointer rounded border border-border bg-background p-0.5"
              />
            </div>
          </div>
        </Optional>
      </section>

      {missing.length > 0 && (
        <p className="px-1 text-sm text-muted-foreground">
          To finish, add {missing.length > 1 ? `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}` : missing[0]}.
        </p>
      )}
    </div>
  );
};
