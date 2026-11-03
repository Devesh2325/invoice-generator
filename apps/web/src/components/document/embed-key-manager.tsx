'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, Copy, KeyRound } from 'lucide-react';

interface Access {
  allowed: boolean;
  hasKey: boolean;
  last4?: string;
  origins: string[];
}

export function EmbedKeyManager({ tenantId, onKey }: { tenantId: string; onKey: (key: string) => void }) {
  const url = `/api/workspaces/${encodeURIComponent(tenantId)}/embed-key`;
  const [access, setAccess] = useState<Access | null>(null);
  const [websites, setWebsites] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  useEffect(() => {
    fetch(url, { cache: 'no-store' })
      .then(async (res) => {
        if (res.status === 401) return setUnavailable('Please sign out and sign in again to create a key.');
        if (!res.ok) return setUnavailable('Keys can’t be created until shared storage is connected.');
        const body = (await res.json()) as Access;
        setAccess(body);
        setWebsites(body.origins.join('\n'));
      })
      .catch(() => setUnavailable('Keys can’t be created right now. Please try again.'));
  }, [url]);

  const send = async (method: 'POST' | 'PATCH') => {
    setBusy(true);
    setMessage(null);
    const origins = websites.split(/[\s,]+/).filter(Boolean);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origins }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ text: body.error || 'Please enter at least one website.', error: true });
        return;
      }
      setWebsites(body.origins.join('\n'));
      if (body.key) {
        setNewKey(body.key);
        onKey(body.key);
        setAccess((current) => current && { ...current, hasKey: true, last4: body.key.slice(-4), origins: body.origins });
        setMessage({ text: 'Copy your key now. For your security, it won’t be shown again.', error: false });
      } else {
        setMessage({ text: 'Your approved websites were updated.', error: false });
      }
    } catch {
      setMessage({ text: 'Please try again.', error: true });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight">Your embed key</h2>
      <p className="mb-4 mt-1 text-muted-foreground">
        The editor only opens on websites you approve here. Any other site is blocked by the browser, even if it copies your key.
      </p>
      <div className="glass-card space-y-4 rounded-2xl p-5">
        {unavailable ? (
          <p role="status" className="text-sm text-muted-foreground">{unavailable}</p>
        ) : !access ? (
          <p role="status" className="text-sm text-muted-foreground">Loading...</p>
        ) : !access.allowed ? (
          <p className="text-sm text-muted-foreground">Your plan doesn’t include integrations.</p>
        ) : (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Approved websites, one per line</span>
              <Textarea
                rows={3}
                value={websites}
                onChange={(e) => setWebsites(e.target.value)}
                placeholder={'https://www.example.com\nhttp://localhost:5173'}
                className="font-mono text-sm"
              />
            </label>
            {access.hasKey && !newKey && <p className="text-sm text-muted-foreground">Your current key ends in <code translate="no" className="font-mono">{access.last4}</code>.</p>}
            {newKey && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-950 p-3 text-sm text-slate-100">
                <code translate="no" className="min-w-0 flex-1 break-all font-mono">{newKey}</code>
                <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded px-2 py-1 hover:bg-slate-800">
                  {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
            {message && (
              <p role={message.error ? 'alert' : 'status'} className={`text-sm ${message.error ? 'text-destructive' : 'text-muted-foreground'}`}>
                {message.text}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={busy} onClick={() => send('POST')} className="brand-gradient font-semibold text-white">
                <KeyRound className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {access.hasKey ? 'Replace key' : 'Create key'}
              </Button>
              {access.hasKey && (
                <Button type="button" variant="outline" disabled={busy} onClick={() => send('PATCH')}>
                  Save websites
                </Button>
              )}
            </div>
            {access.hasKey && <p className="text-sm text-muted-foreground">Replacing your key stops the old one working straight away.</p>}
          </>
        )}
      </div>
    </section>
  );
}
