import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, Shield, Heart, Zap, Globe, Lock } from 'lucide-react';

export const metadata = {
  title: 'About BillCraft — Privacy-First Invoicing Studio',
  description:
    'Learn about BillCraft: our mission to give modern businesses decimal-safe financial tools, native GST automation, and zero-fee UPI payments.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-xl text-primary tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>BillCraft</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/create">
            <Button size="sm" className="text-xs font-bold">Create Invoice</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-16 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-xs">Our Mission</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Precision Invoicing Without Complexity or Gatekeeping
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We built BillCraft because existing invoicing tools were either clunky legacy software from the 1990s or bloated subscription traps that lock your own data behind paywalls.
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-foreground/90 space-y-4 leading-relaxed">
          <p>
            BillCraft combines true mathematical rigor with modern product design. We believe invoicing is the front door of your business: when you send an invoice to a client, it should reflect the high standard of your work.
          </p>
          <p>
            Whether you bill in Indian Rupees under GST, US Dollars, Euros, or Pounds, every calculation is executed using decimal-safe arbitrary precision arithmetic, eliminating the subtle rounding errors that plague spreadsheet formulas.
          </p>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <Card className="border-border bg-card p-6 rounded-2xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Privacy-First Architecture</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your financial data belongs to you. BillCraft works 100% offline using IndexedDB, never selling client or item data.
            </p>
          </Card>

          <Card className="border-border bg-card p-6 rounded-2xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Zero Friction Payments</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We empower businesses with direct peer-to-peer payment rails like verified UPI QR codes, bypassing high gateway processing fees.
            </p>
          </Card>

          <Card className="border-border bg-card p-6 rounded-2xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Design Excellence</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our 8+ structural templates are crafted by seasoned typographers to guarantee pixel-perfect PDF export and clean print output.
            </p>
          </Card>
        </div>

        <div className="p-8 rounded-3xl bg-muted/40 border border-border text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">Ready to start invoicing with confidence?</h2>
          <Link href="/create">
            <Button size="sm" className="font-bold text-xs">
              Open Invoice Studio Free
            </Button>
          </Link>
        </div>
      </main>

      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 BillCraft Invoicing. Crafted with care for global commerce.
      </footer>
    </div>
  );
}
