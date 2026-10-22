'use client';

import React from 'react';
import Link from 'next/link';
import { APP_CONFIG } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, Shield, Heart, Zap, Globe, Lock, ArrowRight, LayoutDashboard, FilePlus } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-16 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-xs">Our Mission</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Precision Invoicing Built for Modern Financial Independence
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            We built {APP_CONFIG.brandName} to eliminate the bloated subscription traps and calculation errors typical of legacy billing software. High-precision math, native inventory control, and multi-tenant white-label power.
          </p>
        </div>

        <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-foreground/90 space-y-4 leading-relaxed">
          <p>
            {APP_CONFIG.brandName} combines true mathematical rigor with modern product design. We believe invoicing is the front door of your business: when you send an invoice to a client, it must reflect the high standard of your work.
          </p>
          <p>
            Whether you bill under India GST, US Dollars, Euros, or British Pounds, every calculation is executed using decimal-safe arbitrary precision arithmetic, eliminating the subtle rounding errors that plague spreadsheet formulas.
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
              Your financial data belongs exclusively to you. {APP_CONFIG.brandName} provides multi-tenant isolation, database-level security, and zero tracking.
            </p>
          </Card>

          <Card className="border-border bg-card p-6 rounded-2xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Zero-Fee Payment Rails</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Direct peer-to-peer settlement rails including verified UPI QR codes and structured bank wire details, avoiding intermediary processor fees.
            </p>
          </Card>

          <Card className="border-border bg-card p-6 rounded-2xl space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Designer Aesthetics</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Carefully engineered templates guaranteed to deliver pixel-perfect PDF rendering and clean print formatting across all devices.
            </p>
          </Card>
        </div>

        {/* Clear Next-Step CTA Section */}
        <div className="p-8 sm:p-10 rounded-3xl bg-primary/5 border border-primary/20 text-center space-y-5">
          <h2 className="text-2xl font-black text-foreground">Ready to elevate your financial operations?</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Generate your first verified invoice in seconds with full GST compliance and zero fees.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/create">
              <Button size="sm" className="font-bold text-xs bg-primary text-primary-foreground shadow-sm">
                <FilePlus className="w-4 h-4 mr-1.5" /> Create Invoice Free
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="font-bold text-xs">
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
