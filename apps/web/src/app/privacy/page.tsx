'use client';

import React from 'react';
import Link from 'next/link';
import { APP_CONFIG } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { Button } from '@/components/ui/button';
import { Sparkles, FilePlus, ArrowRight } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-16 space-y-8 text-xs sm:text-sm text-foreground/90 leading-relaxed">
        <div className="space-y-2 border-b border-border pb-6">
          <h1 className="text-3xl font-black text-foreground">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Effective Date: April 1, 2026 • Last Updated: April 1, 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">1. Commitment to Data Ownership</h2>
          <p>
            {APP_CONFIG.brandName} is built with a privacy-first, multi-tenant architecture. When you create documents anonymously or in local mode, your customer lists, item descriptions, and banking information remain strictly within your browser’s IndexedDB storage. We never sell, transmit, or monetize your client data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">2. Cloud Workspace Data Storage & Strict Multi-Tenant Isolation</h2>
          <p>
            When you register an account or create a white-label workspace, all documents, customer records, inventory movements, and settings are isolated by strict workspace boundaries at the database and API level. Cross-tenant queries are blocked with HTTP 403 Access Denied.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">3. Payment & UPI Privacy</h2>
          <p>
            {APP_CONFIG.brandName} generates payment QR codes using client-side algorithms compliant with NPCI specifications. We do not act as an intermediary custodian of your money; payments flow directly between your customer’s bank and your bank.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">4. Contact Information</h2>
          <p>
            For privacy inquiries or data deletion requests, contact our privacy compliance team at {APP_CONFIG.supportEmail}.
          </p>
        </section>

        {/* Clear Next-Step Action Banner */}
        <div className="p-8 rounded-2xl bg-muted/40 border border-border text-center space-y-3">
          <p className="text-xs text-muted-foreground">Ready to try privacy-safe, high-precision invoicing?</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/create">
              <Button size="sm" className="font-bold text-xs bg-primary text-primary-foreground">
                <FilePlus className="w-3.5 h-3.5 mr-1.5" /> Start Free Invoicing
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" size="sm" className="font-bold text-xs">
                Explore Features
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="font-bold text-xs">
                View Pricing
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
