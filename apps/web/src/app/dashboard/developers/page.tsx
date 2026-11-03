'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { TeamApi } from '@invoice/api';
import { APP_CONFIG, canUseIntegrationDocs } from '@invoice/core';
import { useTenant } from '@/lib/auth/tenant-context';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lock } from 'lucide-react';

const QUICK_START = (origin: string) => `<div id="invoice"></div>

<script src="${origin}/embed.js"></script>
<script>
  Invoxa.mount('#invoice', {
    document: {
      currency: 'INR',
      template: 'creative',
      sender: { name: 'Your Customer Ltd' },
      client: { name: 'Globex', address: { state: '29 - Karnataka' } },
      items: [{ description: 'Website design', quantity: 1, unitPrice: 75000 }],
    },
    onSave: function (invoice) {
      // Send it to your own server here.
      console.log(invoice.documentNumber, invoice.summary.grandTotal);
    },
  });
</script>`;

const OPTIONS = [
  ['document', 'Fills in the invoice. Every field is optional, as listed below.'],
  ['height', 'Height of the editor, such as "900px". The default is 900px.'],
  ['onReady()', 'The editor has loaded.'],
  ['onChange(invoice)', 'The user edited something. Called shortly after they stop typing.'],
  ['onSave(invoice)', 'The user clicked Save. This is where you store the invoice.'],
  ['onError(message)', 'The document you passed was rejected, and says which field is wrong.'],
];

const FIELDS = [
  ['type', 'invoice, estimate, purchase_order, pro_forma, receipt, credit_note or debit_note'],
  ['number, reference', 'Document number and PO or reference number'],
  ['issueDate, dueDate', 'Dates as YYYY-MM-DD'],
  ['currency', 'Three-letter code, such as INR, USD or GBP'],
  ['template', 'A free template ID, such as in-gst, modern, creative or uk-vat. Other values use the default.'],
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

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-5 text-sm leading-relaxed text-slate-100">
      <code>{children}</code>
    </pre>
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

function Guide() {
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

      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Quick start</h2>
        <Code>{QUICK_START(origin)}</Code>
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
      <h2 className="mt-5 text-2xl font-bold tracking-tight">Integration Docs are on paid plans</h2>
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
          Put the {APP_CONFIG.brandName} invoice editor inside your own product, and get the finished invoice back as data.
        </p>
      </header>
      {allowed === true && <Guide />}
      {allowed === false && <Locked />}
    </div>
  );
}
