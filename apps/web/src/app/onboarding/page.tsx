'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantApi } from '@invoice/api';
import { CURRENCIES, INDIAN_STATES, APP_CONFIG } from '@invoice/core';
import { useTenant } from '@/lib/auth/tenant-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Building, DollarSign, FileCode } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshTenants, refreshBrandSettings } = useTenant();
  const [step, setStep] = useState(1);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Form state (defaulting to India / INR / GST)
  const [businessName, setBusinessName] = useState('Sharma Enterprises Pvt Ltd');
  const [currency, setCurrency] = useState('INR');
  const [country, setCountry] = useState('India');
  const [gstState, setGstState] = useState('27 - Maharashtra');
  const [taxId, setTaxId] = useState('27AABCU9603R1ZM');
  const [street, setStreet] = useState('Plot 42, MIDC Andheri East');
  const [city, setCity] = useState('Mumbai');
  const [prefix, setPrefix] = useState('INV');
  const [paymentTerms, setPaymentTerms] = useState('Net 15 Days');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeId = window.localStorage.getItem('billcraft_active_tenant_id');
      const userRaw = window.localStorage.getItem('billcraft_current_user');
      if (activeId) setTenantId(activeId);
      if (userRaw) {
        try {
          const parsed = JSON.parse(userRaw);
          if (parsed.workspaceName) setBusinessName(parsed.workspaceName);
          if (parsed.tenantId && !activeId) setTenantId(parsed.tenantId);
        } catch {}
      }
    }
  }, []);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const targetTenantId =
        tenantId ||
        (typeof window !== 'undefined'
          ? window.localStorage.getItem('billcraft_active_tenant_id')
          : null);
      if (targetTenantId) {
        await TenantApi.updateTenant(targetTenantId, {
          name: businessName,
          currency,
          country,
          gstState,
          taxId,
          street,
          city,
          invoicePrefix: prefix,
        });
        await TenantApi.updateBrandSettings(targetTenantId, {
          businessName,
          currency,
          country,
          gstState,
          taxId,
          street,
          city,
          invoicePrefix: prefix,
          defaultTerms: paymentTerms,
        });
      }
      await refreshTenants();
      await refreshBrandSettings();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('billcraft-auth-updated'));
      }
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 font-black text-2xl text-primary tracking-tight">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>{APP_CONFIG.brandName} Onboarding</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Configure Your GST & Business Profile</h2>
          <div className="flex items-center justify-center gap-2 pt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step
                    ? 'w-8 bg-primary'
                    : s < step
                    ? 'w-4 bg-emerald-500'
                    : 'w-4 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              {step === 1 && <Building className="h-4 w-4 text-primary" />}
              {step === 2 && <DollarSign className="h-4 w-4 text-primary" />}
              {step === 3 && <FileCode className="h-4 w-4 text-primary" />}
              <span>
                {step === 1 && 'Step 1: Business Identity & Currency'}
                {step === 2 && 'Step 2: GSTIN, State & Registered Address'}
                {step === 3 && 'Step 3: Invoice Numbering & Payment Terms'}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              {step === 1 && 'Define your legal trading name and primary billing currency'}
              {step === 2 && 'Configure your GST State Code for automatic CGST+SGST / IGST calculation'}
              {step === 3 && 'Set sequential invoice prefixes and standard payment terms'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Legal Business Name
                  </label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Default Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
                  >
                    {Object.values(CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Country of Operation
                  </label>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    GSTIN (Goods & Services Tax Identification Number)
                  </label>
                  <Input
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                    placeholder="27AABCU9603R1ZM"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    State / Union Territory (GST State Code)
                  </label>
                  <select
                    value={gstState}
                    onChange={(e) => setGstState(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st.code} value={st.label}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Registered Street Address
                  </label>
                  <Input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    City
                  </label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Invoice Number Prefix
                  </label>
                  <Input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    placeholder="INV"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Example: {prefix}-2026-00001
                  </span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Default Payment Terms
                  </label>
                  <Input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Net 15 Days"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              {step > 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                </Button>
              ) : (
                <span />
              )}

              <Button
                size="sm"
                onClick={handleNext}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
              >
                {step === 3 ? (
                  <>
                    Complete & Enter Dashboard <CheckCircle2 className="h-3.5 w-3.5 ml-1.5" />
                  </>
                ) : (
                  <>
                    Next Step <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
