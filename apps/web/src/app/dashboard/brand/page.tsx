'use client';

import React, { useEffect, useState } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi, TenantBrandSettings } from '@invoice/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Palette, Globe, CheckCircle2, ShieldCheck, Upload, Trash2 } from 'lucide-react';

export default function TenantBrandStudioPage() {
  const { activeTenant, refreshBrandSettings } = useTenant();
  const [brand, setBrand] = useState<TenantBrandSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form fields
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3157D5');
  const [secondaryColor, setSecondaryColor] = useState('#0F172A');
  const [fontFamily, setFontFamily] = useState('sans');
  const [defaultTerms, setDefaultTerms] = useState('Net 30 days');
  const [defaultInstructions, setDefaultInstructions] = useState('Wire to Chase Acct 123456');
  const [footerText, setFooterText] = useState('Thank you for partnering with us.');

  useEffect(() => {
    async function load() {
      if (!activeTenant) return;
      setLoading(true);
      try {
        const b = await TenantApi.getBrandSettings(activeTenant.id);
        setBrand(b);
        setLogoUrl(b.logoUrl || '');
        setPrimaryColor(b.primaryColor);
        setSecondaryColor(b.secondaryColor);
        setFontFamily(b.fontFamily);
        setDefaultTerms(b.defaultTerms || '');
        setDefaultInstructions(b.defaultInstructions || '');
        setFooterText(b.footerText || '');
      } catch (err) {
        console.error('Failed to load brand settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeTenant]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        if (activeTenant) {
          await TenantApi.updateBrandSettings(activeTenant.id, { logoUrl: reader.result });
          await refreshBrandSettings();
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    setSaving(true);
    try {
      await TenantApi.updateBrandSettings(activeTenant.id, {
        logoUrl,
        primaryColor,
        secondaryColor,
        fontFamily,
        defaultTerms,
        defaultInstructions,
        footerText,
      });
      await refreshBrandSettings();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save brand settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Brand Studio & White-Label
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Customize company logo, palette, typography, default terms, and custom domains.
            </p>
          </div>

          {savedSuccess && (
            <Badge variant="success" className="text-xs flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </Badge>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Custom Domains & White-label foundation */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Verified Custom Domain
              </CardTitle>
              <CardDescription className="text-xs">
                Serve your white-label invoice generator under your own branded domain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {activeTenant?.custom_domain || 'billing.yourdomain.com'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    CNAME target: <code className="font-mono text-primary">cname.billcraft.app</code>
                  </div>
                </div>
                {activeTenant?.is_domain_verified ? (
                  <Badge variant="success" className="text-[10px]">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Domain Verified & SSL Active
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-[10px]">
                    Pending DNS CNAME Verification
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Color & Typography Styling */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" /> Company Logo, Brand Palette & Visual Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <img
                        src={logoUrl}
                        alt="Company Logo"
                        className="h-14 max-w-[180px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-24 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-400">
                      No Logo
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-900">Company Logo</div>
                    <p className="text-[11px] text-slate-500">
                      Appears in the header of all invoices, estimates, and receipts.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{logoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLogoUrl('')}
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Primary Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-12 rounded border border-slate-300 cursor-pointer p-0.5"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Secondary Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-9 w-12 rounded border border-slate-300 cursor-pointer p-0.5"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Document Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
                >
                  <option value="sans">Inter / Modern Sans-Serif</option>
                  <option value="serif">Merriweather / Classic Serif</option>
                  <option value="mono">JetBrains / Monospaced Tabular</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Default Terms & Instructions */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Standard Invoicing Terms & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Payment Terms
                </label>
                <Input
                  value={defaultTerms}
                  onChange={(e) => setDefaultTerms(e.target.value)}
                  placeholder="e.g. Net 30 Days"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Payment Instructions / Bank Details
                </label>
                <Textarea
                  rows={3}
                  value={defaultInstructions}
                  onChange={(e) => setDefaultInstructions(e.target.value)}
                  placeholder="Bank details, ACH, Wire numbers..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Document Footer Notice
                </label>
                <Input
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Thank you for your business!"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-6 shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Brand Settings'}
            </Button>
          </div>
        </form>
      </div>
    </TenantLayout>
  );
}
