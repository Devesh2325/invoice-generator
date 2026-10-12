import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowLeft, Home, FilePlus, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-6">
        <div className="text-8xl sm:text-9xl font-black text-primary/10 tracking-widest">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg backdrop-blur-xs">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-2">
        Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
        The document, route, or resource you are looking for does not exist or has been relocated. Check the URL or use the quick links below.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button variant="outline" size="sm" className="text-xs font-semibold">
            <Home className="h-3.5 w-3.5 mr-1.5" /> Landing Page
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="text-xs font-semibold">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Workspace Dashboard
          </Button>
        </Link>
        <Link href="/create">
          <Button size="sm" className="text-xs font-semibold shadow-xs">
            <FilePlus className="h-3.5 w-3.5 mr-1.5" /> Create Invoice
          </Button>
        </Link>
      </div>

      <div className="mt-12 text-[11px] text-muted-foreground/60 font-mono">
        BillCraft Invoicing Engine • Error Code 404_NOT_FOUND
      </div>
    </div>
  );
}
