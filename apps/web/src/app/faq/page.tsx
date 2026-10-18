'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sparkles, Search, ChevronDown, MessageSquare, FilePlus } from 'lucide-react';
import { APP_CONFIG } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';

export default function FaqPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems = [
    {
      category: 'General & Pricing',
      q: `Is ${APP_CONFIG.brandName} really free to try?`,
      a: `Yes! Free trial accounts include up to ${APP_CONFIG.trialInvoiceLimit} complete invoices with India GST calculation, verified UPI QR generation, and full PDF export without requiring a credit card. Pro and Enterprise upgrades provide unlimited invoices and multi-tenant white-label power.`,
    },
    {
      category: 'GST & Taxes',
      q: 'How does India GST auto-calculation work?',
      a: `${APP_CONFIG.brandName} cross-references the Supplier State against the Customer Place of Supply. When states match, Intra-State tax (CGST + SGST split equally) is levied. When states differ, Inter-State tax (IGST) is levied. Indian state codes (e.g., 27 - Maharashtra) and HSN/SAC codes are printed accurately.`,
    },
    {
      category: 'Payments & UPI',
      q: 'How does the UPI QR code work on generated invoices?',
      a: `${APP_CONFIG.brandName} encodes your verified UPI ID, registered payee name, invoice number, and exact balance due into a standardized NPCI URI (upi://pay) formatted as an ISO/IEC 18004 SVG QR code. Clients scanning with Google Pay, PhonePe, Paytm, or BHIM have the exact payment amount pre-filled.`,
    },
    {
      category: 'Workflow & Conversion',
      q: 'Can I convert an Estimate or Quote to an Invoice?',
      a: `Yes. Every estimate features a one-click "Convert to Invoice" action. ${APP_CONFIG.brandName} duplicates all client information, items, pricing, and taxes into a new sequential Tax Invoice automatically.`,
    },
    {
      category: 'Data & Privacy',
      q: 'Is my client and financial data secure?',
      a: 'Yes. Offline invoices never leave your computer. For cloud workspaces, all data is isolated using PostgreSQL Row Level Security (RLS) and encrypted in transit with TLS 1.3 and at rest with AES-256.',
    },
    {
      category: 'Customization & PDF',
      q: 'Can I upload my company logo and brand colors?',
      a: 'Yes. You can upload your high-resolution company logo, select your primary brand color or enter custom HEX codes, and choose between modern sans, executive serif, or technical mono typography.',
    },
    {
      category: 'Team & Collaboration',
      q: 'How do team permissions work?',
      a: `${APP_CONFIG.brandName} features 4 granular roles: Owner (full administrative & billing control), Admin (can invite members & change settings), Editor (can create and edit invoices, items, and clients), and Viewer (read-only access to documents and reports).`,
    },
  ];

  const categories = ['all', 'General & Pricing', 'GST & Taxes', 'Payments & UPI', 'Workflow & Conversion', 'Data & Privacy', 'Customization & PDF', 'Team & Collaboration'];

  const filtered = useMemo(() => {
    return faqItems.filter((f) => {
      const matchCat = selectedCategory === 'all' || f.category === selectedCategory;
      const matchSearch =
        search === '' ||
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, search]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <Badge variant="outline" className="text-xs">Help & Documentation</Badge>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Find immediate answers regarding tax compliance, payment settings, templates, and multi-tenant teams.
          </p>

          <div className="relative max-w-md mx-auto pt-3">
            <Search className="absolute left-3 top-5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search help topics (e.g. GST, UPI QR, PDF)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat === 'all' ? 'All Questions' : cat}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border rounded-2xl">
              No matching help articles found for "{search}".
            </div>
          ) : (
            filtered.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i} className="border border-border rounded-xl bg-card overflow-hidden">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex justify-between items-center p-4 text-left font-bold text-xs sm:text-sm text-foreground hover:bg-muted/30 transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Help Banner */}
        <div className="p-6 rounded-2xl bg-muted/30 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold text-sm text-foreground">Still need assistance?</h3>
            <p className="text-xs text-muted-foreground">Our support team is available during business hours to assist you.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/create">
              <Button size="sm" className="text-xs font-bold bg-primary text-primary-foreground">
                <FilePlus className="h-3.5 w-3.5 mr-1.5" /> Start Free
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="sm" variant="outline" className="text-xs font-semibold">
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Submit Support Ticket
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 {APP_CONFIG.brandName} Help Center & Support. All rights reserved.
      </footer>
    </div>
  );
}
