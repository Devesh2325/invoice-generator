'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { TeamApi } from '@invoice/api';
import { canUseIntegrationDocs } from '@invoice/core';
import { useTenant } from '@/lib/auth/tenant-context';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Copy, Lock } from 'lucide-react';
import { EmbedKeyManager } from '@/components/document/embed-key-manager';
import { BACKEND_STACKS, FRONTEND_STACKS, type StackSample } from '@/lib/integration/stacks';

const OPTIONS = [
  ['key', 'Your embed key. Required on your own website.'],
  ['document', 'Fills in the invoice. Every field is optional, as listed below.'],
  ['height', 'Height of the editor, such as "900px". The default is 900px.'],
  ['onReady()', 'The editor has loaded.'],
  ['onChange(invoice)', 'The user edited something. Called shortly after they stop typing.'],
  ['onSave(invoice)', 'The user clicked Save. This is where you store the invoice.'],
  ['onError(message)', 'Your key or website was refused, or the document you passed was rejected. The message says why.'],
];

const FIELDS = [
  ['type', 'invoice, estimate, purchase_order, pro_forma, receipt, credit_note or debit_note'],
  ['number, reference', 'Document number and PO or reference number'],
  ['issueDate, dueDate', 'Dates as YYYY-MM-DD'],
  ['currency', 'Three-letter code, such as USD, EUR, GBP or INR'],
  ['template', 'A free template ID, such as modern, creative, uk-vat or us-sales-tax. A country template also sets its currency if you leave currency out.'],
  ['accentColor', 'A colour such as #9333EA'],
  ['logoUrl', 'An https URL, or a PNG, JPEG or WebP data URL'],
  ['sender, client', '{ name, email, phone, taxId, address: { street, city, state, postalCode, country } }. For GST, use states such as 27 - Maharashtra.'],
  ['items', '[{ description, quantity, unitPrice, taxRate, hsnCode, unit }]. taxRate defaults to the currency’s standard rate.'],
  ['shippingFee, notes, paymentTerms', 'Added to the invoice as given'],
];

const LIMITS = [
  'Totals are always worked out by the editor. Any totals you pass are ignored.',
  'Invoices are not stored by us. Save what you need in onSave, or it is lost when the page closes.',
  'The onSave data comes from the visitor’s browser, so check it on your server before relying on it.',
  'The embedded editor only offers free templates.',
];

/** Code for one stack at a time, with tabs to switch. */
function StackTabs({ label, stacks, origin, embedKey }: { label: string; stacks: StackSample[]; origin: string; embedKey?: string }) {
  const [activeId, setActiveId] = useState(stacks[0].id);
  const [copied, setCopied] = useState(false);
  const active = stacks.find((stack) => stack.id === activeId) || stacks[0];
  const code = active.code(origin).replace(/YOUR_EMBED_KEY/g, embedKey || 'YOUR_EMBED_KEY');

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="mb-3 flex flex-wrap gap-2">
        {stacks.map((stack) => (
          <button
            key={stack.id}
            type="button"
            role="tab"
            aria-selected={stack.id === active.id}
            onClick={() => setActiveId(stack.id)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              stack.id === active.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-primary/50'
            }`}
          >
            {stack.name}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-t-2xl bg-slate-900 px-5 py-2 text-sm text-slate-300">
        <span className="font-mono">{active.file}</span>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded px-2 py-1 hover:bg-slate-800">
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre translate="no" className="overflow-x-auto rounded-b-2xl bg-slate-950 p-5 text-sm leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Rows({ rows }: { rows: string[][] }) {
  return (
    <dl className="glass-card divide-y divide-border rounded-2xl">
      {rows.map(([name, description]) => (
        <div key={name} className="grid gap-1 p-4 sm:grid-cols-[14rem_1fr] sm:gap-4">
          <dt className="break-words font-mono text-sm font-semibold text-primary">{name}</dt>
          <dd className="text-sm leading-relaxed text-muted-foreground">{description}</dd>
        </div>
      ))}
    </dl>
  );
}

function Guide({ tenantId }: { tenantId: string }) {
  const [embedKey, setEmbedKey] = useState<string>();
  const demo = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    const sdk = (window as unknown as { Invoxa?: { mount: Function } }).Invoxa;
    if (!scriptLoaded || !sdk || !demo.current) return;
    const instance = sdk.mount(demo.current, {
      height: '820px',
      document: {
        template: 'creative',
        sender: { name: 'Sample Studio' },
        client: { name: 'Globex', address: { state: '29 - Karnataka' } },
        items: [{ description: 'Website design', quantity: 1, unitPrice: 75000 }],
      },
      onSave: (invoice: { documentNumber: string; summary: { grandTotal: number } }) =>
        setLastSaved(`${invoice.documentNumber}: grand total ${invoice.summary.grandTotal}`),
    });
    return () => instance.destroy();
  }, [scriptLoaded]);

  return (
    <>
      <Script src="/embed.js" onReady={() => setScriptLoaded(true)} />

      <EmbedKeyManager tenantId={tenantId} onKey={setEmbedKey} />

      <section>
        <h2 className="text-2xl font-bold tracking-tight">Step 1: Show the editor</h2>
        <p className="mb-4 mt-1 text-muted-foreground">Choose your framework. Each sample shows the editor in your page and passes it some starting details.</p>
        <StackTabs label="Browser frameworks" stacks={FRONTEND_STACKS} origin={origin} embedKey={embedKey} />
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight">Step 2: Save the invoice on your server</h2>
        <p className="mb-4 mt-1 text-muted-foreground">When your user clicks Save, onSave gives you the invoice. Send it to your server and store it. db, InvoiceStore and similar names stand for your own database code.</p>
        <StackTabs label="Server languages" stacks={BACKEND_STACKS} origin={origin} />
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight">Try it</h2>
        <p className="mb-4 mt-1 text-muted-foreground">This is the embed running on this page. Click Save to see what your app receives.</p>
        {lastSaved && (
          <p role="status" className="mb-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
            onSave received {lastSaved}
          </p>
        )}
        <div ref={demo} className="paper-shadow overflow-hidden rounded-2xl border border-border" />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Options</h2>
        <Rows rows={OPTIONS} />
        <p className="mt-3 text-sm text-muted-foreground">
          <code className="font-mono">Invoxa.mount</code> returns an object with <code className="font-mono">getDocument()</code> and <code className="font-mono">destroy()</code>.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Document fields</h2>
        <Rows rows={FIELDS} />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Good to know</h2>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground">
          {LIMITS.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Locked() {
  return (
    <section className="glass-card rounded-3xl p-8 text-center sm:p-12">
      <span className="brand-gradient mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-2xl font-bold tracking-tight">Integrations are a premium feature</h2>
      <p className="mx-auto mt-2 max-w-xl leading-relaxed text-muted-foreground">
        Upgrade to Pro or Enterprise for the setup guide, code samples and a live demo of the invoice editor inside your own product.
      </p>
      <Link href="/dashboard/billing" className="mt-6 inline-block">
        <Button size="lg" className="brand-gradient h-12 px-6 text-base font-semibold text-white">
          See plans <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </section>
  );
}

export default function IntegrationDocsPage() {
  const { activeTenant } = useTenant();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!activeTenant?.id) return;
    const check = () => setAllowed(canUseIntegrationDocs(TeamApi.getTenantPlan(activeTenant.id)));
    check();
    window.addEventListener('billcraft-plan-updated', check);
    return () => window.removeEventListener('billcraft-plan-updated', check);
  }, [activeTenant?.id]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 p-6 lg:p-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Integration <span className="brand-text">Docs</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Put the invoice editor inside your own product, and get the finished invoice back as data.
        </p>
      </header>
      {allowed === true && activeTenant && <Guide tenantId={activeTenant.id} />}
      {allowed === false && <Locked />}
    </div>
  );
}
