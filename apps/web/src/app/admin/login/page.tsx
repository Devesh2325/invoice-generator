'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminApi } from '@invoice/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldAlert, Lock, Mail, ArrowRight, AlertTriangle, Key } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('dmchaturvedi@gmail.com');
  const [password, setPassword] = useState('Devesh@23251995');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = AdminApi.login(email, password);
    setSubmitting(false);

    if (res.success) {
      router.push('/admin');
    } else {
      setError(res.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center mx-auto shadow-lg">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Super Admin Portal</h1>
          <p className="text-xs text-slate-400">
            Secure, rate-limited administrative authentication
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-2xl rounded-2xl">
          <CardContent className="p-6 sm:p-8 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-slate-800/80 border-slate-700 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Master Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-slate-800/80 border-slate-700 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full font-bold text-xs bg-primary hover:bg-primary-hover text-white h-10 shadow-md"
              >
                {submitting ? 'Authenticating...' : 'Sign In as Super Admin'}
              </Button>
            </form>

            <div className="pt-2 text-center">
              <Link href="/" className="text-[11px] text-slate-500 hover:text-slate-300">
                ← Return to Public Site
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-[10px] text-slate-600 font-mono">
          Security Alert: All access attempts are recorded in the immutable audit log.
        </div>
      </div>
    </div>
  );
}
