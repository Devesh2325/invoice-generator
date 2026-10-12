'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TenantApi } from '@invoice/api';
import { useTenant } from '@/lib/auth/tenant-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Building, Mail, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { refreshTenants } = useTenant();
  const [workspaceName, setWorkspaceName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!workspaceName.trim() || !fullName.trim() || !email.trim() || password.length < 6) {
      setErrorMsg('Please complete all fields (password must be at least 6 characters).');
      return;
    }

    setLoading(true);
    try {
      const userId = `usr_${Date.now()}`;
      const tenantId = `tenant_${Date.now()}`;
      const slug = workspaceName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'workspace';

      const newUser = {
        id: userId,
        email: email.trim().toLowerCase(),
        name: fullName.trim(),
        workspaceName: workspaceName.trim(),
        tenantId,
      };

      if (typeof window !== 'undefined') {
        const existingUsersRaw = window.localStorage.getItem('billcraft_registered_users');
        const existingUsers = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];
        window.localStorage.setItem(
          'billcraft_registered_users',
          JSON.stringify([
            ...existingUsers.filter((u: any) => u.email !== newUser.email),
            { ...newUser, password },
          ])
        );
        window.localStorage.setItem('billcraft_current_user', JSON.stringify(newUser));
        window.localStorage.setItem('billcraft_current_user_id', userId);
        window.localStorage.setItem('billcraft_active_tenant_id', tenantId);
      }

      await TenantApi.createTenant({
        id: tenantId,
        name: workspaceName.trim(),
        slug,
        ownerUserId: userId,
        custom_domain: null,
        is_domain_verified: false,
        role: 'owner',
        currency: 'INR',
        country: 'India',
        gstState: '27 - Maharashtra',
      });

      await TenantApi.updateBrandSettings(tenantId, {
        tenantId,
        businessName: workspaceName.trim(),
        email: email.trim().toLowerCase(),
        primaryColor: '#3157D5',
        secondaryColor: '#0F172A',
        fontFamily: 'sans',
        currency: 'INR',
        country: 'India',
        gstState: '27 - Maharashtra',
      });

      await refreshTenants();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('billcraft-auth-updated'));
      }

      router.push('/onboarding');
    } catch (err: any) {
      console.error('Signup error:', err);
      setErrorMsg(err?.message || 'Unable to register workspace. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-black text-2xl text-primary tracking-tight">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>BillCraft</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">Create your Business Workspace</h2>
          <p className="text-xs text-slate-500">
            Set up isolated multi-tenant GST & financial billing for your company
          </p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Workspace Registration</CardTitle>
            <CardDescription className="text-xs">
              Fill in your details to create your dedicated, private workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Company / Business Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="pl-9 text-xs"
                    placeholder="e.g. Sharma Enterprises Pvt Ltd"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 text-xs"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs"
                    placeholder="rahul@company.in"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-10 shadow-sm mt-2 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  'Creating Workspace...'
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Create Workspace & Continue</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
