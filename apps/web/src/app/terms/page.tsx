'use client';

import React from 'react';
import Link from 'next/link';
import { APP_CONFIG } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { Button } from '@/components/ui/button';
import { Sparkles, FilePlus, ArrowRight } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-16 space-y-8 text-xs sm:text-sm text-foreground/90 leading-relaxed">
        <div className="space-y-2 border-b border-border pb-6">
          <h1 className="text-3xl font-black text-foreground">Terms of Service</h1>
          <p className="text-xs text-muted-foreground">Effective Date: April 1, 2026 • Last Updated: April 1, 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or utilizing {APP_CONFIG.brandName}, you agree to comply with and be legally bound by these Terms of Service. If you disagree with any portion of these terms, please discontinue using the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">2. Responsible Use & Accuracy</h2>
          <p>
            You are solely responsible for ensuring the accuracy of all taxpayer identification numbers (GSTIN, PAN, VAT, SSN/EIN), billing rates, quantities, and bank account information entered on invoices generated through {APP_CONFIG.brandName}.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">3. Subscriptions, Invoicing Limits & White-Label Provisions</h2>
          <p>
            Free trial accounts are subject to a maximum allowance of {APP_CONFIG.trialInvoiceLimit} generated invoices. Pro and Enterprise subscribers enjoy unlimited document creation, full inventory management, and white-label multi-tenant workspace isolation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">4. Limitation of Liability</h2>
          <p>
            {APP_CONFIG.brandName} is provided "as is" without warranty of any kind. In no event shall {APP_CONFIG.brandName} be liable for tax penalties, missed payments, or commercial disputes arising from invoice inaccuracies.
          </p>
        </section>

        {/* Clear Next-Step Action Banner */}
        <div className="p-8 rounded-2xl bg-muted/40 border border-border text-center space-y-3">
          <p className="text-xs text-muted-foreground">Ready to start invoicing with precision and style?</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/create">
              <Button size="sm" className="font-bold text-xs bg-primary text-primary-foreground">
                <FilePlus className="w-3.5 h-3.5 mr-1.5" /> Start Free Invoicing
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="sm" className="font-bold text-xs">
                Interactive Sandbox Demo
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="font-bold text-xs">
                View Pricing & Plans
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 {APP_CONFIG.brandName} Cloud Technologies. All rights reserved.
      </footer>
    </div>
  );
}
