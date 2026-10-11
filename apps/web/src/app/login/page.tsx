'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail === 'admin@acmedesign.io') {
        handleDemoSignIn();
        return;
      }

      if (typeof window !== 'undefined') {
        const usersRaw = window.localStorage.getItem('billcraft_registered_users');
        const users = usersRaw ? JSON.parse(usersRaw) : [];
        const matched = users.find((u: any) => u.email === normalizedEmail);

        if (matched) {
          if (matched.password && matched.password !== password) {
            setErrorMsg('Invalid password for this account.');
            setLoading(false);
            return;
          }
          window.localStorage.setItem('billcraft_current_user', JSON.stringify(matched));
          window.localStorage.setItem('billcraft_current_user_id', matched.id);
          if (matched.tenantId) {
            window.localStorage.setItem('billcraft_active_tenant_id', matched.tenantId);
          }
          router.push('/dashboard');
          return;
        }
      }

      setErrorMsg('No account found with this email. Please create a workspace first or use Demo Login.');
      setLoading(false);
    } catch (err: any) {
      setErrorMsg('Authentication error. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      const demoUser = {
        id: 'usr_demo_01',
        email: 'admin@acmedesign.io',
        name: 'Sarah Connor (Studio Director)',
      };
      window.localStorage.setItem('billcraft_current_user', JSON.stringify(demoUser));
      window.localStorage.setItem('billcraft_current_user_id', demoUser.id);
      window.localStorage.setItem(
        'billcraft_active_tenant_id',
        'a0000000-0000-0000-0000-000000000001'
      );
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-black text-2xl text-primary tracking-tight">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>BillCraft</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">Sign in to your Workspace</h2>
          <p className="text-xs text-slate-500">
            Access your private GST & financial documents, customers, and analytics
          </p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Account Credentials</CardTitle>
            <CardDescription className="text-xs">
              Enter your registered email and password or use the demo workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs"
                    placeholder="you@company.in"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    required
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
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-10 shadow-sm"
              >
                {loading ? 'Signing In...' : 'Sign In to Workspace'}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-slate-400">Or Instant Sandbox</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="w-full text-xs h-9 border-dashed border-slate-300 hover:bg-blue-50/50"
            >
              1-Click Demo Login (Acme Design Agency)
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Create a workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
