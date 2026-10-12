'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TEMPLATES, TEMPLATE_CATEGORIES, DocumentTemplateMeta } from '@invoice/theme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, Palette, ArrowRight, Check } from 'lucide-react';

export default function TemplateGalleryPage() {
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const allTemplates = Object.values(TEMPLATES);
  const filtered = selectedCat === 'all'
    ? allTemplates
    : allTemplates.filter((t) => t.category === selectedCat);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-xl text-primary tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>BillCraft</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/create">
            <Button size="sm" className="text-xs font-bold">Open Generator</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs">Curated Design Gallery</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            17 Financial Document Layout Templates
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            From GST-compliant audit sheets to high-impact creative agency invoices and sleek fintech statements.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCat === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All Templates ({allTemplates.length})
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCat === cat.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((tmpl) => (
            <Card
              key={tmpl.id}
              className="border-border bg-card p-5 rounded-2xl flex flex-col justify-between hover:shadow-xl transition-all group"
            >
              <div className="space-y-3">
                {/* Visual Preview Box */}
                <div
                  className="h-36 rounded-xl p-3 flex flex-col justify-between border transition-transform group-hover:scale-[1.02]"
                  style={{
                    backgroundColor: tmpl.defaultTokens.backgroundColor,
                    borderColor: tmpl.defaultTokens.borderColor,
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div
                      className="h-3.5 w-16 rounded"
                      style={{ backgroundColor: tmpl.defaultTokens.primaryColor }}
                    />
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">
                      #{tmpl.id.slice(0, 4).toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 w-full bg-muted/60 rounded" />
                    <div className="h-2 w-4/5 bg-muted/40 rounded" />
                    <div className="h-2 w-1/2 bg-muted/30 rounded" />
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-muted/40">
                    <div className="text-[9px] font-mono text-muted-foreground">GSTIN • TAX BREAKDOWN</div>
                    <div
                      className="h-2.5 w-10 rounded"
                      style={{ backgroundColor: tmpl.defaultTokens.primaryColor }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">{tmpl.name}</h3>
                  </div>
                  <div className="text-[11px] font-semibold text-primary mt-0.5">
                    {tmpl.competitorStyle}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <Link href={`/create?template=${tmpl.id}`}>
                  <Button size="sm" className="w-full text-xs font-bold shadow-xs">
                    Use This Template <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 BillCraft Template Studio. All templates adapt to Light, Dark, and Print output.
      </footer>
    </div>
  );
}
