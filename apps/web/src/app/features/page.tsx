'use client';

import React from 'react';
import Link from 'next/link';
import { CURRENCIES, DEFAULT_NUMBERING_RULES } from '@invoice/core';
import { TEMPLATES } from '@invoice/theme';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Calculator,
  CreditCard,
  FileCheck,
  Globe,
  Package,
  Palette,
  Printer,
  QrCode,
  Share2,
  Users,
  Files,
} from 'lucide-react';

const FEATURES = [
  {
    icon: FileCheck,
    title: 'Tax worked out for you',
    body: 'GST, VAT or sales tax with the right labels for your country, including the CGST, SGST and IGST split in India.',
    cta: 'Create an invoice',
    href: '/create',
  },
  {
    icon: Calculator,
    title: 'Accurate totals',
    body: 'Handles line and invoice discounts, tax-inclusive prices, shipping and round-off, using rounding suited to each currency.',
    cta: 'Try it now',
    href: '/create',
  },
  {
    icon: QrCode,
    title: 'Payment details and QR codes',
    body: 'Show your bank details in your country’s format, upload a payment QR code, or generate a UPI QR code in India.',
    cta: 'Add payment details',
    href: '/create',
  },
  {
    icon: Printer,
    title: 'PDF, Excel and print',
    body: 'Download as PDF, Excel, CSV or PNG, or print directly from your browser.',
    cta: 'Download an invoice',
    href: '/create',
  },
  {
    icon: Share2,
    title: 'Easy sharing',
    body: 'Send invoices by WhatsApp or email, or share a link your customer can open.',
    cta: 'Start sharing',
    href: '/signup',
  },
  {
    icon: Files,
    title: `${Object.keys(DEFAULT_NUMBERING_RULES).length} document types`,
    body: 'Invoices, estimates, purchase orders, receipts, credit notes, debit notes and pro forma invoices.',
    cta: 'Choose a document',
    href: '/create',
  },
  {
    icon: Palette,
    title: `${Object.keys(TEMPLATES).length} templates`,
    body: 'Choose a layout, then add your logo and brand colour. Some templates need a paid plan.',
    cta: 'See templates',
    href: '/templates',
  },
  {
    icon: Globe,
    title: `${Object.keys(CURRENCIES).length} currencies`,
    body: 'Bill in USD, EUR, GBP, INR and more, with tax labels and defaults set for each one.',
    cta: 'Pick your currency',
    href: '/create',
  },
  {
    icon: CreditCard,
    title: 'Payment tracking',
    body: 'Record full or partial payments and refunds, and see which invoices are paid, pending or overdue.',
    cta: 'Create a free account',
    href: '/signup',
  },
  {
    icon: Users,
    title: 'Customer records',
    body: 'Save customers and see what each one has been invoiced, has paid and still owes.',
    cta: 'Create a free account',
    href: '/signup',
  },
  {
    icon: Package,
    title: 'Products and stock',
    body: 'On paid plans, keep a product list with SKUs and tax rates, track stock and see low-stock items.',
    cta: 'Compare plans',
    href: '/pricing',
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Everything you need to bill customers and get paid
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Create tax-ready documents, keep track of who has paid, and spend less time on paperwork.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body, cta, href }) => (
            <article key={title} className="card-3d">
              <span className="card-3d__icon">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-1.5 mb-1 leading-relaxed text-muted-foreground">{body}</p>
              <Link href={href} className="card-3d__cta" aria-label={`${cta}: ${title}`}>
                {cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-3 sm:flex-row">
          <Link href="/create">
            <Button size="lg" className="h-12 w-full bg-primary px-6 text-base font-medium text-white hover:bg-primary-hover sm:w-auto">
              Create an invoice <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="h-12 w-full px-6 text-base font-medium sm:w-auto">
              Compare plans
            </Button>
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
