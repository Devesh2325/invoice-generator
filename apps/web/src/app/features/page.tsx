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
    title: 'GST worked out for you',
    body: 'Compares your state with your customer’s, then applies CGST and SGST or IGST. HSN and SAC codes can appear on each line.',
  },
  {
    icon: Calculator,
    title: 'Accurate totals',
    body: 'Handles line and invoice discounts, tax-inclusive prices, shipping and round-off, using rounding suited to each currency.',
  },
  {
    icon: QrCode,
    title: 'UPI QR codes',
    body: 'Adds a scannable QR code with your UPI ID and the invoice amount, once you have entered a valid UPI ID and payee name.',
  },
  {
    icon: Printer,
    title: 'PDF and print',
    body: 'Download an A4 PDF or print directly from your browser.',
  },
  {
    icon: Share2,
    title: 'Easy sharing',
    body: 'Send invoices by WhatsApp or email, or share a link your customer can open.',
  },
  {
    icon: Files,
    title: `${Object.keys(DEFAULT_NUMBERING_RULES).length} document types`,
    body: 'Invoices, estimates, purchase orders, receipts, credit notes, debit notes and pro forma invoices.',
  },
  {
    icon: Palette,
    title: `${Object.keys(TEMPLATES).length} templates`,
    body: 'Choose a layout, then add your logo and brand colour. Some templates need a paid plan.',
  },
  {
    icon: Globe,
    title: `${Object.keys(CURRENCIES).length} currencies`,
    body: 'Bill in INR, USD, GBP, EUR and more, with tax labels and defaults set for each one.',
  },
  {
    icon: CreditCard,
    title: 'Payment tracking',
    body: 'Record full or partial payments and refunds, and see which invoices are paid, pending or overdue.',
  },
  {
    icon: Users,
    title: 'Customer records',
    body: 'Save customers and see what each one has been invoiced, has paid and still owes.',
  },
  {
    icon: Package,
    title: 'Products and stock',
    body: 'On paid plans, keep a product list with SKUs and tax rates, track stock and see low-stock items.',
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

        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-semibold">{title}</h2>
              <p className="mt-1 leading-relaxed text-muted-foreground">{body}</p>
            </div>
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
