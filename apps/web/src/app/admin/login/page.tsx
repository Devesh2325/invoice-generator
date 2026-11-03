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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        AdminApi.recordAuditLog('SUPER_ADMIN_LOGIN', 'Portal Access', email.trim().toLowerCase());
        router.replace('/admin');
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error || 'Could not sign in. Please try again.');
    } catch {
      setError('Could not reach the server. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center mx-auto shadow-lg">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Super Admin Portal</h1>
          <p className="text-xs text-muted-foreground">
            Sign in to manage users, plans and content
          </p>
        </div>

        <Card className="border-border bg-card backdrop-blur-md shadow-2xl rounded-xl">
          <CardContent className="p-6 sm:p-8 space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
              <div>
                <label className="text-foreground font-semibold block mb-1">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@yourcompany.com"
                    className="pl-9 bg-muted border-border text-foreground tabular-nums text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-foreground font-semibold block mb-1">Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-9 bg-muted border-border text-foreground tabular-nums text-xs"
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
              <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
                ← Return to Public Site
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
