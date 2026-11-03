'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, Search } from 'lucide-react';
import { APP_CONFIG } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

const FAQS = [
  {
    q: 'Do I need an account to create an invoice?',
    a: 'No. You can create and download an invoice straight away. Create a free account to save your customers, items and invoice history.',
  },
  {
    q: `Is ${APP_CONFIG.brandName} free?`,
    a: `The free plan includes ${APP_CONFIG.trialInvoiceLimit} documents and a starter set of templates. Paid plans add unlimited documents, every template and more.`,
  },
  {
    q: 'How is tax worked out?',
    a: 'Each currency has its own tax label and default rate, and you can change the rate on any line. In India, we also compare your state with your customer’s to split tax into CGST and SGST or charge IGST. You remain responsible for your tax filings, so please check invoices with your accountant if you are unsure.',
  },
  {
    q: 'How does the UPI QR code work in India?',
    a: 'Enter your UPI ID and payee name, and the invoice can show a QR code with the amount filled in. Your customer pays from their UPI app, and the money goes straight to your account.',
  },
  {
    q: 'Can I turn an estimate into an invoice?',
    a: 'Yes. Open the estimate and choose Convert to Invoice. The customer, items and prices carry over to a new invoice.',
  },
  {
    q: 'Can I add my logo and brand colours?',
    a: 'Yes. Upload your logo and choose your brand colour in the generator or in Brand Studio.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Invoices created without an account are stored in your browser. They stay on that device and are lost if you clear your browser data, so download a copy of anything you need to keep.',
  },
];

export default function FaqPage() {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return FAQS.filter((f) => !query || f.q.toLowerCase().includes(query) || f.a.toLowerCase().includes(query));
  }, [search]);

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <PublicHeader />

      <main className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight">Frequently asked questions</h1>

        <div className="relative mt-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Search questions"
            placeholder="Search questions"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpenIndex(null);
            }}
            className="h-10 pl-9 text-sm"
          />
        </div>

        <div className="mt-6 divide-y divide-border border-y border-border">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No questions match “{search}”.</p>
          ) : (
            filtered.map((item, index) => {
              const open = openIndex === index;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenIndex(open ? null : index)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left font-medium"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && <p className="pb-4 leading-relaxed text-muted-foreground">{item.a}</p>}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold">Still have a question?</h2>
          <p className="mt-1 text-muted-foreground">Send us a message and we’ll help you out.</p>
          <Link href="/contact" className="mt-4 inline-block">
            <Button variant="outline" className="h-10 font-medium">
              Contact us
            </Button>
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
