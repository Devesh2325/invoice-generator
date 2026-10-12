import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — BillCraft',
  description: 'BillCraft Terms of Service governing platform usage, team subscriptions, and document generation.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-xl text-primary tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>BillCraft</span>
        </Link>
        <Link href="/" className="text-xs font-semibold hover:underline">Back to Home</Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-16 space-y-8 text-xs sm:text-sm text-foreground/90 leading-relaxed">
        <div className="space-y-2 border-b border-border pb-6">
          <h1 className="text-3xl font-black text-foreground">Terms of Service</h1>
          <p className="text-xs text-muted-foreground">Effective Date: April 1, 2026 • Last Updated: April 1, 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>
            By accessing or utilizing BillCraft, you agree to comply with and be legally bound by these Terms of Service. If you disagree with any portion of these terms, please do not use the application.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">2. Responsible Use & Accuracy</h2>
          <p>
            You are solely responsible for ensuring the accuracy of all taxpayer identification numbers (GSTIN, PAN, VAT, SSN/EIN), billing amounts, and bank account information entered on invoices generated through BillCraft.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">3. Subscriptions & Billing</h2>
          <p>
            Paid plans are billed on a recurring monthly or annual basis. You may cancel your subscription at any time through the in-app Billing dashboard. Upon cancellation, access remains active until the end of your billing cycle.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">4. Limitation of Liability</h2>
          <p>
            BillCraft is provided "as is" without warranty of any kind. In no event shall BillCraft be liable for tax penalties, missed payments, or commercial disputes arising from invoice inaccuracies.
          </p>
        </section>
      </main>

      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 BillCraft Invoicing.
      </footer>
    </div>
  );
}
