'use client';

import React from 'react';
import Link from 'next/link';
import { APP_CONFIG } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowLeft, Home, FilePlus, Search, HelpCircle, Shield } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none max-w-2xl mx-auto my-12">
        <div className="relative mb-6">
          <div className="text-8xl sm:text-9xl font-black text-primary/10 tracking-widest font-mono">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg backdrop-blur-xs">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
          Page Not Found
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
          The requested route, document, or workspace could not be found or has been moved to a new URL.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <Link href="/create">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm">
              <FilePlus className="h-4 w-4 mr-1.5" /> Create Invoice Free
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="font-semibold">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Go to Dashboard
            </Button>
          </Link>
          <Link href="/demo">
            <Button variant="outline" size="sm" className="font-semibold text-indigo-600 border-indigo-200 dark:border-indigo-800">
              Try Interactive Demo
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="font-semibold">
              <Home className="h-4 w-4 mr-1.5" /> Return Home
            </Button>
          </Link>
        </div>

        <div className="w-full max-w-md bg-muted/30 border border-border rounded-xl p-4 text-xs text-muted-foreground flex items-center justify-between">
          <span>Need help finding what you need?</span>
          <Link href="/contact" className="font-bold text-primary hover:underline flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> Contact Support
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground font-mono">
        {APP_CONFIG.brandName} Cloud Engine &bull; HTTP 404 Resource Relocated
      </footer>
    </div>
  );
}
