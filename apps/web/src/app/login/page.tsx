'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/auth/tenant-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Lock, Mail, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '@invoice/core';
import { hashPassword, isHashedPassword, verifyPassword } from '@/lib/auth/password';

export default function LoginPage() {
  const router = useRouter();
  const { refreshTenants } = useTenant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (typeof window !== 'undefined') {
        const usersRaw = window.localStorage.getItem('billcraft_registered_users');
        const users = usersRaw ? JSON.parse(usersRaw) : [];
        let matched = users.find((u: any) => u.email === normalizedEmail);

        // If not found in registered_users, check workspaces created in Super Admin
        if (!matched) {
          const teamsRaw = window.localStorage.getItem('billcraft_admin_teams');
          const teams = teamsRaw ? JSON.parse(teamsRaw) : [];
          const foundTeam = teams.find((t: any) => t.ownerEmail?.trim().toLowerCase() === normalizedEmail);

          if (foundTeam) {
            matched = {
              id: `usr_${foundTeam.id}`,
              email: normalizedEmail,
              name: foundTeam.companyDisplayName || foundTeam.name,
              workspaceName: foundTeam.name,
              tenantId: foundTeam.id,
              password: foundTeam.ownerPassword || '',
            };
            users.push(matched);
            window.localStorage.setItem('billcraft_registered_users', JSON.stringify(users));
          }
        }

        if (matched) {
          if (!(await verifyPassword(matched.password || '', password))) {
            setErrorMsg('Incorrect email or password.');
            setLoading(false);
            return;
          }

          // Upgrade accounts still stored with a readable password
          if (!isHashedPassword(matched.password)) {
            matched.password = await hashPassword(password);
            const updatedUsers = users.map((u: any) => (u.email === normalizedEmail ? matched : u));
            window.localStorage.setItem('billcraft_registered_users', JSON.stringify(updatedUsers));
          }

          // The signed-in user record never holds the password
          const { password: _password, ...sessionUser } = matched;
          window.localStorage.setItem('billcraft_current_user', JSON.stringify(sessionUser));
          window.localStorage.setItem('billcraft_current_user_id', matched.id);
          if (matched.tenantId) {
            window.localStorage.setItem('billcraft_active_tenant_id', matched.tenantId);
          }
          await refreshTenants();
          window.dispatchEvent(new Event('billcraft-auth-updated'));
          const redirectParam = new URLSearchParams(window.location.search).get('redirect');
          router.push(redirectParam || '/dashboard');
          return;
        }
      }

      setErrorMsg('Incorrect email or password.');
      setLoading(false);
    } catch (err: any) {
      setErrorMsg('Authentication error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-2xl text-primary tracking-tight">
            <FileText className="h-6 w-6 text-primary" />
            <span>{APP_CONFIG.brandName}</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Sign in to your Workspace</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Access your invoices, customers and reports
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">Account Credentials</CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              Enter your registered email and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-sm bg-transparent"
                    placeholder="you@company.in"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-sm bg-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold text-sm h-10 shadow-sm"
              >
                {loading ? 'Signing In...' : 'Sign In to Workspace'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-slate-500">
          Don't have an account yet?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Create a workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
