'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  APP_CONFIG,
  CURRENCIES,
  PLANS,
  calculateDocument,
  detectCurrency,
  getCurrencyTaxProfile,
  formatCurrency,
  isTemplateAllowedForPlan,
} from '@invoice/core';
import { TEMPLATES } from '@invoice/theme';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { useTenant } from '@/lib/auth/tenant-context';
import { usePlatformPlans } from '@/lib/platform/platform-provider';
import {
  ArrowRight,
  Calculator,
  Check,
  ChevronDown,
  CreditCard,
  Download,
  Globe,
  QrCode,
  Users,
} from 'lucide-react';

// Sample invoices calculated by the same engine as real ones, so visitors see how each country looks.
const SAMPLE_COUNTRIES = [
  { currency: 'USD', label: 'USA', taxRate: 8, unit: 1 },
  { currency: 'GBP', label: 'UK', taxRate: 20, unit: 1 },
  { currency: 'INR', label: 'India', taxRate: 18, unit: 50 },
  { currency: 'SGD', label: 'Singapore', taxRate: 9, unit: 1 },
];

const STEPS = [
  { title: 'Add your details', body: 'Enter your business, your customer and the items you are billing for.' },
  { title: 'Let tax work itself out', body: 'Totals and tax update as you type, using GST, VAT or sales tax for your country.' },
  { title: 'Download or share', body: 'Save a PDF, print it, or send your customer a link to view it.' },
];

const FEATURES = [
  {
    icon: Calculator,
    title: 'Automatic tax',
    body: 'Works out GST, VAT or sales tax for your country, including the CGST, SGST and IGST split in India.',
    cta: 'Create an invoice',
    href: '/create',
  },
  {
    icon: QrCode,
    title: 'Payment details and QR codes',
    body: 'Show your bank details in your country’s format, and add a payment QR code to make paying easy.',
    cta: 'Add payment details',
    href: '/create',
  },
  {
    icon: Download,
    title: 'PDF, Excel and more',
    body: 'Download as PDF, Excel, CSV or PNG, or print directly from your browser.',
    cta: 'Download an invoice',
    href: '/create',
  },
  {
    icon: Globe,
    title: 'Multiple currencies',
    body: `Bill in ${Object.keys(CURRENCIES).length} currencies, with tax labels and rounding set for each one.`,
    cta: 'Pick your currency',
    href: '/create',
  },
  {
    icon: CreditCard,
    title: 'Payment tracking',
    body: 'Record full or partial payments and refunds, and see what is still outstanding.',
    cta: 'Create a free account',
    href: '/signup',
  },
  {
    icon: Users,
    title: 'Customers and items',
    body: 'Save customers and products once, then reuse them on every new invoice.',
    cta: 'Create a free account',
    href: '/signup',
  },
];

const FAQS = [
  {
    q: 'Do I need an account to create an invoice?',
    a: 'No. You can create and download an invoice straight away. Create a free account to save your customers, items and invoice history.',
  },
  {
    q: 'What does the free plan include?',
    a: `The free plan includes ${APP_CONFIG.trialInvoiceLimit} documents and a starter set of templates. Upgrade to a paid plan for unlimited documents and every template.`,
  },
  {
    q: 'How is tax worked out?',
    a: 'Each currency has its own tax label and default rate, and you can change the rate on any line. In India, we also compare your state with your customer’s to split tax into CGST and SGST or charge IGST. Please check invoices with your accountant, as you remain responsible for your tax filings.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Invoices created without an account are stored in your browser. They stay on that device, so download a copy of anything you need to keep.',
  },
];

function formatPrice(price: number) {
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function LandingPage() {
  const { user } = useTenant();
  usePlatformPlans();
  const [sample, setSample] = useState(SAMPLE_COUNTRIES[0]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Starts on the same sample as the server's HTML, then moves to the visitor's own country.
  useEffect(() => {
    const local = detectCurrency(Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.language);
    const match = SAMPLE_COUNTRIES.find((country) => country.currency === local);
    if (match) setSample(match);
  }, []);

  const sampleItems = useMemo(
    () => [
      { id: 'a', description: 'Website design', quantity: 1, unitPrice: 1500 * sample.unit, taxRate: sample.taxRate },
      { id: 'b', description: 'Security audit', quantity: 2, unitPrice: 500 * sample.unit, taxRate: sample.taxRate },
    ],
    [sample]
  );
  const { summary } = useMemo(
    () => calculateDocument({ currency: sample.currency, items: sampleItems }),
    [sample, sampleItems]
  );
  const sampleProfile = getCurrencyTaxProfile(sample.currency);

  const featuredTemplates = useMemo(
    () =>
      Object.values(TEMPLATES)
        .sort(
          (a, b) =>
            Number(isTemplateAllowedForPlan('starter', b.id)) -
            Number(isTemplateAllowedForPlan('starter', a.id))
        )
        .slice(0, 8),
    []
  );

  const plans = [
    {
      name: 'Free',
      price: formatPrice(0),
      note: 'Get started',
      features: [
        `${APP_CONFIG.trialInvoiceLimit} documents`,
        'Starter templates',
        'GST, VAT and sales tax',
        `${PLANS.starter.maxMembers} user`,
      ],
      cta: 'Start free',
      href: '/signup',
      featured: false,
    },
    {
      name: 'Pro',
      price: formatPrice(APP_CONFIG.plans.pro.price),
      note: 'For growing businesses',
      features: ['Unlimited documents', 'All templates', 'Inventory tracking', 'Integrations for any code stack', `Up to ${PLANS.pro.maxMembers} users`],
      cta: 'Choose Pro',
      href: '/signup',
      featured: true,
    },
    {
      name: 'Enterprise',
      price: formatPrice(APP_CONFIG.plans.enterprise.price),
      note: 'For your own brand',
      features: ['Everything in Pro', 'White-label branding', 'Unlimited users'],
      cta: 'Choose Enterprise',
      href: '/signup',
      featured: false,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Free to start, with PDF and Excel downloads
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Invoices for any country, <span className="brand-text">without the paperwork</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Add your items and {APP_CONFIG.brandName} works out GST, VAT or sales tax in your currency and gives you an invoice ready to send.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/create">
                <Button size="lg" className="brand-gradient h-12 w-full px-6 text-base font-semibold text-white sm:w-auto">
                  Create an invoice <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={user ? '/dashboard' : '/templates'}>
                <Button size="lg" variant="outline" className="h-12 w-full px-6 text-base font-medium sm:w-auto">
                  {user ? 'Go to dashboard' : 'See templates'}
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">No account needed to get started.</p>
          </div>

          {/* Live sample, calculated by the same engine as real invoices */}
          <div className="glass-card min-w-0 rounded-3xl p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Sample invoice</div>
                <div className="text-sm text-muted-foreground">INV-2026-00042</div>
              </div>
              <div
                className="inline-flex rounded-lg bg-muted p-1 text-sm"
                role="group"
                aria-label="Sample country"
              >
                {SAMPLE_COUNTRIES.map((option) => (
                  <button
                    key={option.currency}
                    type="button"
                    aria-pressed={sample.currency === option.currency}
                    onClick={() => setSample(option)}
                    className={`rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                      sample.currency === option.currency
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">From</div>
                <div className="font-medium">Sample Studio</div>
                <div className="text-muted-foreground">{sampleProfile.defaultCountry}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Bill to</div>
                <div className="font-medium">Sample Client</div>
                <div className="text-muted-foreground">{sampleProfile.defaultCountry}</div>
              </div>
            </div>

            <table className="mt-5 w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 text-right font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sampleItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/60">
                    <td className="py-2.5">{item.description}</td>
                    <td className="py-2.5 text-right tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 text-right tabular-nums">
                      {formatCurrency(item.quantity * item.unitPrice, sample.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="ml-auto mt-4 space-y-1.5 text-sm sm:max-w-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatCurrency(summary.taxableSubtotal, sample.currency)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{sampleProfile.taxLabel} ({sample.taxRate}%)</dt>
                <dd className="tabular-nums">{formatCurrency(summary.totalTax, sample.currency)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCurrency(summary.grandTotal, sample.currency)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-border bg-muted/30 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">Your invoice in three steps</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <div className="text-sm font-semibold text-primary">Step {index + 1}</div>
                  <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Everything you need to get paid</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body, cta, href }) => (
              <article key={title} className="card-3d">
                <span className="card-3d__icon">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 mb-1 leading-relaxed text-muted-foreground">{body}</p>
                <Link href={href} className="card-3d__cta" aria-label={`${cta}: ${title}`}>
                  {cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Templates */}
        <section id="templates" className="scroll-mt-20 border-y border-border bg-muted/30 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">Templates for every kind of business</h2>
                <p className="mt-2 text-muted-foreground">Pick a layout, then add your own logo and colours.</p>
              </div>
              <Link href="/templates" className="flex shrink-0 items-center gap-1 font-medium text-primary hover:underline">
                See all templates <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {featuredTemplates.map((template) => {
                const accent = template.defaultTokens.primaryColor;
                const free = isTemplateAllowedForPlan('starter', template.id);
                return (
                  <Link
                    key={template.id}
                    href={`/create?template=${template.id}`}
                    className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary"
                  >
                    <div className="space-y-2 bg-white p-4" aria-hidden="true">
                      <div className="h-2 w-1/2 rounded-sm" style={{ backgroundColor: accent }} />
                      <div className="h-1.5 w-3/4 rounded-sm bg-slate-200" />
                      <div className="h-4 rounded-sm" style={{ backgroundColor: accent, opacity: 0.85 }} />
                      <div className="h-1.5 rounded-sm bg-slate-200" />
                      <div className="h-1.5 rounded-sm bg-slate-200" />
                      <div className="ml-auto h-2 w-1/3 rounded-sm" style={{ backgroundColor: accent }} />
                    </div>
                    <div className="border-t border-border p-3">
                      <div className="text-sm font-medium group-hover:text-primary">{template.name}</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">{free ? 'Free' : 'Paid plans'}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* For developers */}
        <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <div className="brand-gradient flex flex-col items-start justify-between gap-6 rounded-3xl p-8 text-white sm:p-10 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight">Add invoicing to your own platform</h2>
              <p className="mt-2 leading-relaxed text-white/85">
                On paid plans, embed the {APP_CONFIG.brandName} invoice editor with one script tag and get the finished invoice back in your app.
              </p>
            </div>
            <Link href="/pricing" className="shrink-0">
              <Button size="lg" className="h-12 bg-white px-6 text-base font-semibold text-slate-900 hover:bg-white/90">
                See plans <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Simple pricing</h2>
          <p className="mt-2 text-muted-foreground">Start free and upgrade when you need more.</p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-xl border bg-card p-6 ${
                  plan.featured ? 'border-2 border-primary' : 'border-border'
                }`}
              >
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.note}</p>
                <div className="mt-4 text-3xl font-semibold tabular-nums">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground"> / month</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className="mt-6">
                  <Button
                    variant={plan.featured ? 'default' : 'outline'}
                    className={`h-11 w-full font-medium ${plan.featured ? 'bg-primary text-white hover:bg-primary-hover' : ''}`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm">
            <Link href="/pricing" className="font-medium text-primary hover:underline">
              Compare plans and yearly pricing
            </Link>
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-border bg-muted/30 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight">Common questions</h2>
            <div className="mt-8 divide-y divide-border border-y border-border">
              {FAQS.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div key={faq.q}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="flex w-full items-center justify-between gap-4 py-4 text-left font-medium"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && <p className="pb-4 leading-relaxed text-muted-foreground">{faq.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final call to action */}
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Ready to send your next invoice?</h2>
          <Link href="/create" className="mt-6 inline-block">
            <Button size="lg" className="brand-gradient h-12 px-6 text-base font-semibold text-white">
              Create an invoice <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
