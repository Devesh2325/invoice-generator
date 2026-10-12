'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminApi } from '@invoice/api';
import { AdminTemplateSetting } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Palette,
  Search,
  Sparkles,
  ExternalLink,
  Check,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';

export default function AdminTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<AdminTemplateSetting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadTemplates = () => {
    setTemplates(AdminApi.getTemplates());
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleTogglePro = (id: string, currentIsPro: boolean) => {
    AdminApi.updateTemplate(id, { isPro: !currentIsPro });
    loadTemplates();
    toast({
      title: 'Template Tier Updated',
      description: `Template now designated as ${!currentIsPro ? 'PRO' : 'FREE'}.`,
    });
  };

  const handleToggleEnabled = (id: string, currentEnabled: boolean) => {
    AdminApi.updateTemplate(id, { enabled: !currentEnabled });
    loadTemplates();
    toast({
      title: 'Template Visibility Updated',
      description: `Template is now ${!currentEnabled ? 'Enabled' : 'Disabled'}.`,
    });
  };

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Palette className="h-6 w-6 text-primary" />
            Template Gallery & Tier Gating
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage 17+ invoice layout architectures, toggle Free vs Pro tier locks, and track usage popularity.
          </p>
        </div>
        <Link href="/templates" target="_blank">
          <Button variant="outline" size="sm" className="text-xs bg-slate-900 border-slate-800 text-slate-300 hover:text-white">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View Public Gallery
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search templates by name, style, or identifier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-xs h-9 w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Template Architecture</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Downloads / Usage</th>
                <th className="py-3.5 px-4">Tier Gating</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Quick Toggles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTemplates.map((tpl) => (
                <tr key={tpl.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{tpl.name}</span>
                      {tpl.isPro && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30 text-primary py-0">
                          PRO
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{tpl.id}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-slate-300">{tpl.category}</span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-300">
                    {tpl.downloadsCount.toLocaleString()} exports
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        tpl.isPro
                          ? 'border-indigo-400/40 bg-indigo-500/10 text-indigo-300'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {tpl.isPro ? 'PRO ONLY' : 'FREE / STARTER'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        tpl.enabled
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {tpl.enabled ? 'ACTIVE' : 'DISABLED'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePro(tpl.id, tpl.isPro)}
                        className={`h-7 px-2.5 text-[11px] ${
                          tpl.isPro
                            ? 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
                            : 'bg-primary/20 border-primary/40 text-primary hover:bg-primary/30'
                        }`}
                      >
                        {tpl.isPro ? 'Make Free' : 'Gate to Pro'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleEnabled(tpl.id, tpl.enabled)}
                        className={`h-7 px-2.5 text-[11px] ${
                          tpl.enabled
                            ? 'bg-rose-950/20 border-rose-800/40 text-rose-300 hover:bg-rose-950/40'
                            : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300 hover:bg-emerald-950/40'
                        }`}
                      >
                        {tpl.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
