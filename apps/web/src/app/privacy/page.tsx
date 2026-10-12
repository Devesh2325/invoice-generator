import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — BillCraft',
  description: 'BillCraft Privacy Policy detailing local storage, encryption, and zero third-party tracking commitments.',
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-black text-foreground">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Effective Date: April 1, 2026 • Last Updated: April 1, 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">1. Commitment to Data Ownership</h2>
          <p>
            BillCraft is built with an offline-first architecture. When you create documents anonymously, your customer lists, item descriptions, and banking information remain strictly within your browser’s IndexedDB storage. We do not transmit, analyze, or sell this data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">2. Cloud Workspace Data Storage</h2>
          <p>
            When you register an account, your workspace metadata, team member emails, and synced documents are stored in secure cloud databases with Row Level Security (RLS). Every workspace is strictly isolated.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">3. Payment & UPI Privacy</h2>
          <p>
            BillCraft generates payment QR codes using client-side algorithms based on the NPCI specifications. We do not act as an intermediary custodian of your money; payments flow directly between your customer’s bank and your bank.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">4. Contact Information</h2>
          <p>
            For privacy inquiries or data deletion requests, contact our compliance officer at privacy@billcraft.io.
          </p>
        </section>
      </main>

      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 BillCraft Invoicing.
      </footer>
    </div>
  );
}
