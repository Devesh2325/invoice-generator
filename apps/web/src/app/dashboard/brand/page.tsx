'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTenant } from '@/lib/auth/tenant-context';
import { DocumentPreview } from '@/components/document/document-preview';
import { TenantApi } from '@invoice/api';
import {
  DocumentModel,
  calculateDocument,
  getCurrencyTaxProfile,
  isTemplateAllowedForPlan,
  resolveTemplateId,
} from '@invoice/core';
import { TEMPLATES, getTemplatesByCategory } from '@invoice/theme';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Palette, Trash2, Upload } from 'lucide-react';

const SAMPLE_ITEMS = [
  { id: 'a', description: 'Website design', hsnCode: '998314', unit: 'NOS', quantity: 1, unitPrice: 75000 },
  { id: 'b', description: 'Monthly support', hsnCode: '998313', unit: 'NOS', quantity: 2, unitPrice: 12500 },
];

export default function TenantBrandStudioPage() {
  const { activeTenant, brandSettings, refreshBrandSettings } = useTenant();
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1D4ED8');
  const [defaultTemplateId, setDefaultTemplateId] = useState('in-gst');

  useEffect(() => {
    if (!brandSettings) return;
    setLogoUrl(brandSettings.logoUrl || '');
    setPrimaryColor(brandSettings.primaryColor || '#1D4ED8');
    const saved = resolveTemplateId(brandSettings.defaultTemplateId || 'in-gst');
    setDefaultTemplateId(TEMPLATES[saved] ? saved : 'in-gst');
  }, [brandSettings]);

  const plan = activeTenant?.plan || 'starter';
  const currency = brandSettings?.currency || activeTenant?.currency || 'INR';

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Your logo must be under 2 MB.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setLogoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!activeTenant) return;
    setSaving(true);
    setError(null);
    try {
      await TenantApi.updateBrandSettings(activeTenant.id, { logoUrl, primaryColor, defaultTemplateId });
      await refreshBrandSettings();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save brand settings:', err);
      setError('Your brand settings could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // The real invoice renderer and calculation engine, so this is what customers will see.
  const previewDocument = useMemo(() => {
    const profile = getCurrencyTaxProfile(currency);
    const state = brandSettings?.gstState || (profile.isIndiaGst ? '27 - Maharashtra' : profile.defaultState);
    const { items, summary } = calculateDocument({
      currency,
      senderState: state,
      clientState: state,
      items: SAMPLE_ITEMS.map((item) => ({ ...item, taxRate: profile.defaultTaxRate })),
    });
    return {
      id: 'brand-preview',
      type: 'invoice',
      status: 'draft',
      documentNumber: 'INV-2026-00042',
      issueDate: new Date().toISOString().split('T')[0],
      currency,
      sender: {
        name: brandSettings?.businessName || activeTenant?.name || 'Your business',
        logoUrl,
        address: { street1: '', city: '', state, postalCode: '', country: profile.defaultCountry },
      },
      client: {
        id: 'sample',
        type: 'customer',
        name: 'Sample Customer',
        billingAddress: { street1: '', city: '', state, postalCode: '', country: profile.defaultCountry },
      },
      items,
      summary,
      templateId: defaultTemplateId,
      customTheme: { primaryColor },
    } as unknown as DocumentModel;
  }, [activeTenant?.name, brandSettings?.businessName, brandSettings?.gstState, currency, defaultTemplateId, logoUrl, primaryColor]);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-10">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Brand Studio</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Set how your new invoices look. Business details and payment terms are in{' '}
              <Link href="/dashboard/settings" className="font-medium text-primary hover:underline">
                Settings
              </Link>
              .
            </p>
          </div>
          <div className="flex items-center gap-2">
            {savedSuccess && (
              <Badge variant="success" className="flex items-center gap-1 text-xs" role="status">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
              </Badge>
            )}
            <Button type="button" onClick={handleSave} disabled={saving} className="brand-gradient px-5 text-sm font-semibold text-white">
              {saving ? 'Saving…' : 'Save Brand Settings'}
            </Button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <Card className="lg:col-span-4">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Palette className="h-4 w-4 text-primary" /> Your brand
              </CardTitle>
              <CardDescription className="text-xs">Used on every new invoice. You can still change the template and colour on each one.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-5">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground">Logo</span>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-14 w-24 items-center justify-center rounded-lg border border-border bg-white p-1.5">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Your logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs text-slate-500">No logo</span>
                    )}
                  </div>
                  <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-input bg-background px-3 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-accent">
                    <Upload className="h-3.5 w-3.5" />
                    {logoUrl ? 'Replace' : 'Upload'}
                    <input type="file" accept="image/*" onChange={handleLogoFileChange} className="sr-only" />
                  </label>
                  {logoUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl('')} className="h-9 text-sm text-destructive">
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="brand-colour" className="mb-1.5 block text-sm font-medium text-foreground">
                  Colour
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="brand-colour"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-input bg-background p-0.5"
                  />
                  <Input aria-label="Colour code" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 text-sm uppercase tabular-nums" />
                </div>
              </div>

              <div>
                <label htmlFor="brand-template" className="mb-1.5 block text-sm font-medium text-foreground">
                  Default template
                </label>
                <select
                  id="brand-template"
                  value={defaultTemplateId}
                  onChange={(e) => setDefaultTemplateId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {getTemplatesByCategory().map((group) => (
                    <optgroup key={group.category} label={group.label}>
                      {group.templates.map((template) => {
                        const allowed = isTemplateAllowedForPlan(plan, template.id);
                        return (
                          <option key={template.id} value={template.id} disabled={!allowed}>
                            {template.name}
                            {allowed ? '' : ' (paid plans)'}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <section aria-label="Invoice preview" className="min-w-0 lg:col-span-8">
            <h2 className="mb-3 text-sm font-bold text-foreground">Preview with sample details</h2>
            <DocumentPreview document={previewDocument} captureId="brand-preview-capture" hideToolbar />
          </section>
        </div>
      </div>
    </>
  );
}
