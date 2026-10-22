'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { TEMPLATES, TEMPLATE_CATEGORIES, DocumentTemplateMeta } from '@invoice/theme';
import { APP_CONFIG, isTemplateAllowedForPlan, AdminTemplateSetting } from '@invoice/core';
import { AdminApi } from '@invoice/api';
import { PublicHeader } from '@/components/layout/public-header';
import { UpgradePlanModal } from '@/components/modals/upgrade-plan-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  ArrowRight,
  Check,
  Lock,
  ChevronRight,
  Home,
  FileText,
  SlidersHorizontal,
  ExternalLink,
  Layers,
} from 'lucide-react';

export default function TemplateGalleryPage() {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('');
  const [adminTemplates, setAdminTemplates] = useState<AdminTemplateSetting[]>(() =>
    AdminApi.getTemplates()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setAdminTemplates(AdminApi.getTemplates());
    };
    window.addEventListener('invoxa-templates-updated', handleUpdate);
    return () => window.removeEventListener('invoxa-templates-updated', handleUpdate);
  }, []);

  const disabledIds = useMemo(() => {
    return new Set(adminTemplates.filter((t) => t.enabled === false).map((t) => t.id));
  }, [adminTemplates]);

  const activeTemplates = useMemo(() => {
    return Object.values(TEMPLATES).filter((t) => !disabledIds.has(t.id));
  }, [disabledIds]);

  const filtered = useMemo(() => {
    if (selectedCat === 'all') return activeTemplates;
    if (selectedCat === 'free') {
      return activeTemplates.filter((t) => isTemplateAllowedForPlan('starter', t.id));
    }
    if (selectedCat === 'pro') {
      return activeTemplates.filter((t) => !isTemplateAllowedForPlan('starter', t.id));
    }
    return activeTemplates.filter((t) => t.category === selectedCat);
  }, [activeTemplates, selectedCat]);

  const handleUseTemplate = (tmpl: DocumentTemplateMeta) => {
    const isAllowed = isTemplateAllowedForPlan('starter', tmpl.id);
    if (!isAllowed) {
      setUpgradeReason(
        `The "${tmpl.name}" layout is an exclusive Pro & Enterprise template. Upgrade your account to unlock this design.`
      );
      setUpgradeModalOpen(true);
      return;
    }
    window.location.href = `/create?template=${tmpl.id}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 md:py-14 space-y-10 flex-1 w-full">
        {/* Breadcrumb matching Image 2 */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link
            href="/"
            className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Free invoice templates
          </span>
        </nav>

        {/* Hero Header matching Image 2 */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Free invoice templates
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Send a polished invoice in minutes. Choose from our collection of customizable invoice templates.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/create">
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-full text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2">
                <span>Fill in an invoice online</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              No credit card or software install required
            </span>
          </div>
        </div>

        {/* Category & Plan Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedCat === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Templates ({activeTemplates.length})
          </button>
          <button
            onClick={() => setSelectedCat('free')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedCat === 'free'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Free Included
          </button>
          <button
            onClick={() => setSelectedCat('pro')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedCat === 'pro'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🔒 Pro & Enterprise
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCat === cat.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template Cards Grid matching Image 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tmpl) => {
            const isFree = isTemplateAllowedForPlan('starter', tmpl.id);
            const primaryColor = tmpl.defaultTokens.primaryColor || '#1D4ED8';

            return (
              <div
                key={tmpl.id}
                className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all"
              >
                {/* Visual Invoice Miniature Preview */}
                <Link
                  href={`/templates/${tmpl.id}`}
                  className="block p-5 bg-slate-100/70 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-950"
                >
                  <div className="bg-white text-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 h-52 flex flex-col justify-between overflow-hidden relative group-hover:scale-[1.01] transition-transform">
                    {/* Top colored accent header */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: primaryColor }}
                          />
                          <span className="font-extrabold text-[11px] tracking-tight text-slate-800 uppercase">
                            INVOICE
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          #INV-2026-001
                        </span>
                      </div>

                      {/* Miniature address lines */}
                      <div className="flex justify-between text-[8px] text-slate-400 pt-0.5">
                        <div className="space-y-0.5">
                          <div className="h-1.5 w-14 bg-slate-300 rounded" />
                          <div className="h-1.5 w-10 bg-slate-200 rounded" />
                        </div>
                        <div className="space-y-0.5 text-right">
                          <div className="h-1.5 w-12 bg-slate-300 rounded ml-auto" />
                          <div className="h-1.5 w-8 bg-slate-200 rounded ml-auto" />
                        </div>
                      </div>
                    </div>

                    {/* Miniature clean 4-column table */}
                    <div className="space-y-1.5 my-auto">
                      <div
                        className="h-4 rounded px-1.5 flex items-center justify-between text-[8px] font-bold text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <span>Description</span>
                        <span>Qty</span>
                        <span>Price</span>
                        <span>Amount</span>
                      </div>
                      <div className="space-y-1 px-1">
                        <div className="flex justify-between items-center text-[7px] text-slate-600 border-b border-slate-100 pb-0.5">
                          <span className="truncate max-w-[90px]">Design & Consulting</span>
                          <span>1</span>
                          <span>₹8,500</span>
                          <span className="font-bold">₹8,500</span>
                        </div>
                        <div className="flex justify-between items-center text-[7px] text-slate-600 border-b border-slate-100 pb-0.5">
                          <span className="truncate max-w-[90px]">Platform Retainer</span>
                          <span>1</span>
                          <span>₹3,950</span>
                          <span className="font-bold">₹3,950</span>
                        </div>
                      </div>
                    </div>

                    {/* Miniature summary footer */}
                    <div className="border-t border-slate-100 pt-1.5 flex justify-between items-center text-[9px]">
                      <span className="text-slate-400 font-medium">Balance Due</span>
                      <span className="font-black text-slate-900 font-mono">₹12,450.00</span>
                    </div>

                    {/* Plan Badge Overlay */}
                    <div className="absolute top-2 right-2">
                      {isFree ? (
                        <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                          FREE
                        </span>
                      ) : (
                        <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> PRO
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Card Title & Actions matching Image 2 */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <Link
                      href={`/templates/${tmpl.id}`}
                      className="font-bold text-base text-slate-900 dark:text-white hover:text-primary transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4"
                    >
                      {tmpl.name}
                    </Link>
                    <div className="text-[11px] font-semibold text-primary mt-1">
                      {tmpl.competitorStyle}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <Link
                      href={`/templates/${tmpl.id}`}
                      className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <span>View details & formats</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>

                    {isFree ? (
                      <Link href={`/create?template=${tmpl.id}`}>
                        <Button
                          size="sm"
                          className="h-8 text-xs font-bold bg-primary text-primary-foreground shadow-xs cursor-pointer"
                        >
                          Use Free <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUseTemplate(tmpl)}
                        className="h-8 text-xs font-bold border-indigo-300 text-indigo-600 dark:border-indigo-800 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                      >
                        <Lock className="h-3 w-3 mr-1" /> Unlock Pro
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Need a custom corporate template?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            {APP_CONFIG.brandName} Enterprise accounts include custom branded layouts tailored to your exact regulatory and aesthetic specifications.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/create">
              <Button size="sm" className="font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
                Start Free Invoicing
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

      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
        © 2026 {APP_CONFIG.brandName} Template Studio. All templates adapt seamlessly to Light, Dark, and Print output.
      </footer>
    </div>
  );
}
