'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TEMPLATES, TEMPLATE_CATEGORIES, DocumentTemplateMeta } from '@invoice/theme';
import { APP_CONFIG, isTemplateAllowedForPlan } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { UpgradePlanModal } from '@/components/modals/upgrade-plan-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, Palette, ArrowRight, Check, Lock, ShieldCheck, Zap, FilePlus } from 'lucide-react';

export default function TemplateGalleryPage() {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('');

  const allTemplates = Object.values(TEMPLATES);
  const filtered = selectedCat === 'all'
    ? allTemplates
    : selectedCat === 'free'
    ? allTemplates.filter((t) => isTemplateAllowedForPlan('starter', t.id))
    : selectedCat === 'pro'
    ? allTemplates.filter((t) => !isTemplateAllowedForPlan('starter', t.id))
    : allTemplates.filter((t) => t.category === selectedCat);

  const handleUseTemplate = (tmpl: DocumentTemplateMeta) => {
    const isAllowed = isTemplateAllowedForPlan('starter', tmpl.id);
    if (!isAllowed) {
      setUpgradeReason(`The "${tmpl.name}" layout is an exclusive Pro & Enterprise template. Upgrade your account to unlock this design.`);
      setUpgradeModalOpen(true);
      return;
    }
    window.location.href = `/create?template=${tmpl.id}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs">Curated Design Gallery</Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            17 Financial Document Layout Templates
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Free trial users can start with 3 core compliance designs, with 14 additional designer layouts unlocked on Pro.
          </p>
        </div>

        {/* Category & Plan Filter Pills */}
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
          <button
            onClick={() => setSelectedCat('free')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCat === 'free'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Free Included (3)
          </button>
          <button
            onClick={() => setSelectedCat('pro')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCat === 'pro'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            🔒 Pro & Enterprise (14)
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tmpl) => {
            const isFree = isTemplateAllowedForPlan('starter', tmpl.id);
            return (
              <Card
                key={tmpl.id}
                className="border-border bg-card p-5 rounded-2xl flex flex-col justify-between group hover:shadow-xl transition-all relative overflow-hidden"
              >
                {!isFree && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-sm">
                    <Lock className="w-3 h-3" />
                    <span>PRO</span>
                  </div>
                )}
                {isFree && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-sm">
                    <Check className="w-3 h-3" />
                    <span>FREE</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Miniature Skeleton Preview */}
                  <div
                    className="h-36 rounded-xl p-3 flex flex-col justify-between border transition-transform group-hover:scale-[1.02] relative"
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
                  {isFree ? (
                    <Link href={`/create?template=${tmpl.id}`}>
                      <Button size="sm" className="w-full text-xs font-bold shadow-xs bg-primary text-primary-foreground">
                        Use Template Free <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUseTemplate(tmpl)}
                      className="w-full text-xs font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40 gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock with Pro</span>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Clear Next-Step Action Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-muted/30 border border-border text-center space-y-4">
          <h2 className="text-2xl font-black text-foreground">Need a custom corporate template?</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {APP_CONFIG.brandName} Enterprise accounts include custom branded layouts tailored to your exact regulatory and aesthetic specifications.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/create">
              <Button size="sm" className="font-bold text-xs bg-primary text-primary-foreground">
                <FilePlus className="w-3.5 h-3.5 mr-1.5" /> Start Free Invoicing
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="font-bold text-xs">
                Compare All Plans
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <UpgradePlanModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        reason={upgradeReason}
      />

      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 {APP_CONFIG.brandName} Template Studio. All templates adapt seamlessly to Light, Dark, and Print output.
      </footer>
    </div>
  );
}
