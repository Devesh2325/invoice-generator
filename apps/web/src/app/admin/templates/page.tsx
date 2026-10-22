'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminApi } from '@invoice/api';
import { AdminTemplateSetting, GeneratorFieldSettings } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Palette,
  Search,
  Sparkles,
  ExternalLink,
  Check,
  ShieldAlert,
  ArrowUpDown,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Plus,
  X,
  FileCode,
  Layers,
  Save,
  SlidersHorizontal,
} from 'lucide-react';

export default function AdminTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<AdminTemplateSetting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<'all' | 'free' | 'pro'>('all');
  const [generatorSettings, setGeneratorSettings] = useState<GeneratorFieldSettings>(() =>
    AdminApi.getGeneratorSettings()
  );

  const handleToggleGeneratorField = (field: keyof GeneratorFieldSettings) => {
    const updated = {
      ...generatorSettings,
      [field]: !generatorSettings[field],
    };
    AdminApi.updateGeneratorSettings(updated);
    setGeneratorSettings(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billcraft-generator-settings-updated'));
    }
    toast({
      title: 'Generator Settings Saved',
      description: `Default column "${String(field)}" is now ${updated[field] ? 'VISIBLE' : 'HIDDEN'} on generator.`,
    });
  };

  // Modals state
  const [editingTemplate, setEditingTemplate] = useState<AdminTemplateSetting | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<AdminTemplateSetting | null>(null);

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

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete template "${name}" (${id})?`)) {
      AdminApi.deleteTemplate(id);
      loadTemplates();
      toast({
        title: 'Template Deleted',
        description: `Template "${name}" has been removed from the registry.`,
      });
    }
  };

  const handleOpenEdit = (tpl: AdminTemplateSetting) => {
    setEditingTemplate({ ...tpl });
    setIsCreatingNew(false);
  };

  const handleOpenCreate = () => {
    const newTpl: AdminTemplateSetting = {
      id: `custom_tpl_${Date.now()}`,
      name: 'New Custom Template',
      category: 'SaaS & Modern Fintech',
      isPro: false,
      enabled: true,
      downloadsCount: 0,
      description: 'Custom corporate invoice layout design.',
      primaryColor: '#3157D5',
      fontFamily: 'sans',
    };
    setEditingTemplate(newTpl);
    setIsCreatingNew(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    if (!editingTemplate.name.trim() || !editingTemplate.id.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template Name and Template ID are required.',
        variant: 'destructive',
      });
      return;
    }

    AdminApi.saveTemplate(editingTemplate);
    loadTemplates();
    setEditingTemplate(null);
    toast({
      title: isCreatingNew ? 'Template Created' : 'Template Updated',
      description: `"${editingTemplate.name}" configuration saved successfully.`,
    });
  };

  const handleDownloadFormat = (tpl: AdminTemplateSetting) => {
    const schemaPayload = {
      specVersion: '2.0.0',
      generator: 'Invoxa Design System',
      template: {
        id: tpl.id,
        name: tpl.name,
        category: tpl.category,
        tier: tpl.isPro ? 'pro' : 'free',
        enabled: tpl.enabled,
        tokens: {
          primaryColor: tpl.primaryColor || '#3157D5',
          fontFamily: tpl.fontFamily || 'sans',
        },
        description: tpl.description || '',
        createdAt: new Date().toISOString(),
      },
      supportedExportFormats: ['pdf', 'png', 'svg', 'html', 'json'],
    };

    const blob = new Blob([JSON.stringify(schemaPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoxa-template-${tpl.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template Format Exported',
      description: `Downloaded JSON specification for "${tpl.name}".`,
    });
  };

  const handleDownloadAllTemplates = () => {
    const exportBundle = {
      generator: 'Invoxa Enterprise Platform',
      version: '2026.4',
      exportedAt: new Date().toISOString(),
      totalTemplates: templates.length,
      templates,
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoxa-all-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Complete Template Suite Exported',
      description: `Downloaded ${templates.length} templates in Invoxa bundle format.`,
    });
  };

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesTier =
      selectedTier === 'all' || (selectedTier === 'pro' ? t.isPro : !t.isPro);
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesTier && matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Palette className="h-6 w-6 text-primary" />
            Template Manager & Design System
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage all 18+ live templates, configure free vs pro tiers, edit attributes, preview layouts, and export template formats.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAllTemplates}
            className="text-xs bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export All Formats (JSON)
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="text-xs bg-primary hover:bg-primary-hover text-white font-bold"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add New Template
          </Button>
          <Link href="/templates" target="_blank">
            <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Super Admin Control: Generator Default Field Visibility */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Invoice Generator Default Line Columns
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Control which line item columns appear on the live invoice generator by default. Users will see Description, Qty, and Price only when extras are hidden.
            </p>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono border-slate-700 text-slate-300 w-fit">
            Live Platform Default
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">HSN / SAC Code</div>
              <div className="text-[10px] text-slate-400">Show HSN/SAC column by default</div>
            </div>
            <button
              onClick={() => handleToggleGeneratorField('showHsnColumn')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                generatorSettings.showHsnColumn
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {generatorSettings.showHsnColumn ? 'ENABLED' : 'HIDDEN'}
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Tax Rate / GST %</div>
              <div className="text-[10px] text-slate-400">Show Tax column per item row</div>
            </div>
            <button
              onClick={() => handleToggleGeneratorField('showTaxRateColumn')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                generatorSettings.showTaxRateColumn
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {generatorSettings.showTaxRateColumn ? 'ENABLED' : 'HIDDEN'}
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Unit of Measure</div>
              <div className="text-[10px] text-slate-400">Show Unit (PCS/HRS/KGS)</div>
            </div>
            <button
              onClick={() => handleToggleGeneratorField('showUnitColumn')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                generatorSettings.showUnitColumn
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {generatorSettings.showUnitColumn ? 'ENABLED' : 'HIDDEN'}
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Discount %</div>
              <div className="text-[10px] text-slate-400">Show item discount column</div>
            </div>
            <button
              onClick={() => handleToggleGeneratorField('showDiscountColumn')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                generatorSettings.showDiscountColumn
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {generatorSettings.showDiscountColumn ? 'ENABLED' : 'HIDDEN'}
            </button>
          </div>
        </div>
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
          {/* Tier Selector */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
          >
            <option value="all">All Tiers (Free & Pro)</option>
            <option value="free">Free / Starter Only</option>
            <option value="pro">Pro Only</option>
          </select>

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
                <th className="py-3.5 px-4">Exports / Usage</th>
                <th className="py-3.5 px-4">Tier Gating</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
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
                    {(tpl.downloadsCount || 0).toLocaleString()} exports
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleTogglePro(tpl.id, tpl.isPro)}
                      className="cursor-pointer"
                      title="Click to toggle tier"
                    >
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold cursor-pointer ${
                          tpl.isPro
                            ? 'border-indigo-400/40 bg-indigo-500/10 text-indigo-300'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {tpl.isPro ? 'PRO ONLY' : 'FREE / STARTER'}
                      </Badge>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleToggleEnabled(tpl.id, tpl.enabled)}
                      className="cursor-pointer"
                      title="Click to toggle visibility"
                    >
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold cursor-pointer ${
                          tpl.enabled
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {tpl.enabled ? 'ACTIVE' : 'DISABLED'}
                      </Badge>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Preview Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewTemplate(tpl)}
                        className="h-7 px-2 text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-950/30"
                        title="Live Preview Template"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                      </Button>

                      {/* Download Format */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFormat(tpl)}
                        className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                        title="Download JSON/Schema Format"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" /> Format
                      </Button>

                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(tpl)}
                        className="h-7 px-2 text-xs text-primary hover:text-primary-hover hover:bg-primary/10"
                        title="Edit Template"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tpl.id, tpl.name)}
                        className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                        title="Delete Template"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Template Modal */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-xl bg-slate-900 border border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center justify-between">
                <span>{isCreatingNew ? 'Register New Invoice Template' : `Edit Template — ${editingTemplate.name}`}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Configure template categorization, gating tier, default accents, and metadata.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Template Identifier (ID) *
                  </label>
                  <Input
                    value={editingTemplate.id}
                    disabled={!isCreatingNew}
                    onChange={(e) =>
                      setEditingTemplate((prev) =>
                        prev ? { ...prev, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') } : null
                      )
                    }
                    className="bg-slate-950 border-slate-800 text-white font-mono text-xs h-9"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Template Display Name *
                  </label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) =>
                      setEditingTemplate((prev) => (prev ? { ...prev, name: e.target.value } : null))
                    }
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Design Category
                </label>
                <select
                  value={editingTemplate.category}
                  onChange={(e) =>
                    setEditingTemplate((prev) => (prev ? { ...prev, category: e.target.value } : null))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="GST & Tax Compliant (India)">GST & Tax Compliant (India)</option>
                  <option value="SaaS & Modern Fintech">SaaS & Modern Fintech</option>
                  <option value="Corporate & Enterprise">Corporate & Enterprise</option>
                  <option value="Creative & Agency">Creative & Agency</option>
                  <option value="Minimal & Industry Specialty">Minimal & Industry Specialty</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Description / Suitable For
                </label>
                <Input
                  value={editingTemplate.description || ''}
                  onChange={(e) =>
                    setEditingTemplate((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                  placeholder="e.g. Modern GST-compliant tax invoice with HSN/SAC breakdown."
                  className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingTemplate.primaryColor || '#3157D5'}
                      onChange={(e) =>
                        setEditingTemplate((prev) => (prev ? { ...prev, primaryColor: e.target.value } : null))
                      }
                      className="h-8 w-10 rounded border border-slate-700 cursor-pointer bg-slate-950"
                    />
                    <Input
                      value={editingTemplate.primaryColor || '#3157D5'}
                      onChange={(e) =>
                        setEditingTemplate((prev) => (prev ? { ...prev, primaryColor: e.target.value } : null))
                      }
                      className="bg-slate-950 border-slate-800 text-white font-mono text-xs h-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Typography Font Family
                  </label>
                  <select
                    value={editingTemplate.fontFamily || 'sans'}
                    onChange={(e) =>
                      setEditingTemplate((prev) => (prev ? { ...prev, fontFamily: e.target.value } : null))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white h-8"
                  >
                    <option value="sans">Inter / Modern Sans</option>
                    <option value="serif">Merriweather / Classic Serif</option>
                    <option value="mono">JetBrains / Monospaced Tabular</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTemplate.isPro}
                    onChange={(e) =>
                      setEditingTemplate((prev) => (prev ? { ...prev, isPro: e.target.checked } : null))
                    }
                    className="rounded border-slate-700 bg-slate-900 text-primary h-4 w-4"
                  />
                  <span className="font-semibold text-slate-200">Gate to Pro Plan</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTemplate.enabled}
                    onChange={(e) =>
                      setEditingTemplate((prev) => (prev ? { ...prev, enabled: e.target.checked } : null))
                    }
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-200">Active & Visible in Generator</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTemplate(null)}
                  className="bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveTemplate}
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-4"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Save Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Live Preview Template Modal */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-2xl bg-slate-900 border border-slate-800 text-slate-100 p-6 space-y-4">
            <DialogHeader className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base font-black text-white flex items-center gap-2">
                    <Eye className="h-4 w-4 text-sky-400" />
                    Template Preview — {previewTemplate.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    Category: {previewTemplate.category} • Identifier: <code className="text-primary">{previewTemplate.id}</code>
                  </DialogDescription>
                </div>
                <Badge
                  variant="outline"
                  className={
                    previewTemplate.isPro
                      ? 'border-indigo-400/40 bg-indigo-500/10 text-indigo-300'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  }
                >
                  {previewTemplate.isPro ? 'PRO TIER' : 'FREE TIER'}
                </Badge>
              </div>
            </DialogHeader>

            {/* Mock Rendered Invoice Card */}
            <div
              className={`p-6 rounded-2xl bg-white text-slate-900 shadow-xl space-y-4 ${
                previewTemplate.fontFamily === 'serif'
                  ? 'font-serif'
                  : previewTemplate.fontFamily === 'mono'
                  ? 'font-mono'
                  : 'font-sans'
              }`}
            >
              {/* Header */}
              <div
                className="flex items-start justify-between pb-3 border-b-2"
                style={{ borderColor: previewTemplate.primaryColor || '#3157D5' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm"
                    style={{ backgroundColor: previewTemplate.primaryColor || '#3157D5' }}
                  >
                    IX
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Invoxa Global Technologies</h3>
                    <p className="text-[10px] text-slate-500">27AABCU9603R1ZM • Maharashtra</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase"
                    style={{ backgroundColor: previewTemplate.primaryColor || '#3157D5' }}
                  >
                    {previewTemplate.name.toUpperCase()}
                  </span>
                  <div className="font-mono text-xs font-bold text-slate-800 mt-1">INV-2026-0089</div>
                </div>
              </div>

              {/* Items */}
              <div className="rounded-lg border border-slate-200 overflow-hidden text-[11px]">
                <div
                  className="grid grid-cols-12 p-2 font-bold text-[10px] text-white"
                  style={{ backgroundColor: previewTemplate.primaryColor || '#3157D5' }}
                >
                  <div className="col-span-8">ITEM DESCRIPTION</div>
                  <div className="col-span-2 text-center">QTY</div>
                  <div className="col-span-2 text-right">TOTAL</div>
                </div>
                <div className="grid grid-cols-12 p-2 border-b border-slate-100 text-slate-700">
                  <div className="col-span-8 font-medium">Enterprise Retainer & Invoicing Engine</div>
                  <div className="col-span-2 text-center">1</div>
                  <div className="col-span-2 text-right font-mono">$1,200.00</div>
                </div>
                <div className="grid grid-cols-12 p-2 text-slate-700">
                  <div className="col-span-8 font-medium">Custom Template Design & Print Pipeline</div>
                  <div className="col-span-2 text-center">1</div>
                  <div className="col-span-2 text-right font-mono">$450.00</div>
                </div>
              </div>

              {/* Total Banner */}
              <div className="flex justify-end">
                <div
                  className="px-4 py-2 rounded-xl text-white font-extrabold text-xs flex items-center gap-4 shadow-sm"
                  style={{ backgroundColor: previewTemplate.primaryColor || '#3157D5' }}
                >
                  <span>Grand Total Due</span>
                  <span className="font-mono text-base">$1,650.00</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadFormat(previewTemplate)}
                className="text-xs bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download Template Format
              </Button>
              <Button
                size="sm"
                onClick={() => setPreviewTemplate(null)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close Preview
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
