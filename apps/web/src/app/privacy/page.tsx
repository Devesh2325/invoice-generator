'use client';

import React from 'react';
import Link from 'next/link';
import { APP_CONFIG } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';
import { Sparkles, FilePlus, ArrowRight } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen text-foreground flex flex-col font-sans">
      <PublicHeader />

      <main className="w-full min-w-0 max-w-3xl mx-auto px-4 sm:px-8 py-16 space-y-8 text-sm text-foreground/90 leading-relaxed">
        <div className="space-y-2 border-b border-border pb-6">
          <h1 className="text-3xl font-semibold text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Effective Date: April 1, 2026 • Last Updated: April 1, 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">1. Your data</h2>
          <p>
            {APP_CONFIG.brandName} lets you create documents without an account. When you do, your customer lists, item descriptions and banking information are stored in your browser. We do not sell your data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">2. Accounts and workspaces</h2>
          <p>
            When you create an account or workspace, your documents, customer records, stock history and settings are saved with that workspace.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">3. Payments and UPI</h2>
          <p>
            {APP_CONFIG.brandName} creates payment QR codes in your browser. We do not hold your money: UPI payments go directly from your customer’s bank to yours.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">4. Contact Information</h2>
          <p>
            For privacy inquiries or data deletion requests, contact us at {APP_CONFIG.supportEmail}.
          </p>
        </section>

        {/* Clear Next-Step Action Banner */}
        <div className="p-8 rounded-xl bg-muted/40 border border-border text-center space-y-3">
          <p className="text-sm text-muted-foreground">Ready to create an invoice?</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/create">
              <Button size="sm" className="font-bold text-sm bg-primary text-primary-foreground">
                <FilePlus className="w-3.5 h-3.5 mr-1.5" /> Start Free Invoicing
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" size="sm" className="font-bold text-sm">
                Explore Features
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="font-bold text-sm">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
