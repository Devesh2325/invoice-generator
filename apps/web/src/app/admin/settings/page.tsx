'use client';

import React, { useEffect, useState } from 'react';
import { AdminApi } from '@invoice/api';
import { AdminSiteSettings } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Settings,
  Save,
  AlertTriangle,
  Bell,
  Globe,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(AdminApi.getSiteSettings());
  }, []);

  const handleSave = () => {
    if (!settings) return;
    setSaving(true);
    AdminApi.updateSiteSettings(settings);
    setTimeout(() => {
      setSaving(false);
      toast({
        title: 'Settings Saved',
        description: 'Global site configuration and announcement settings have been updated.',
      });
    }, 300);
  };

  if (!settings) return null;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-primary" />
            Global Site Settings & Operational Controls
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage top announcement banners, maintenance mode flags, public registration controls, and default SEO.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Announcement Banner */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="h-5 w-5 text-amber-400" />
              <div>
                <h2 className="text-base font-bold text-white">Global Announcement Banner</h2>
                <p className="text-xs text-slate-400">Display a persistent alert banner across the landing site and web app.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.announcementBanner.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcementBanner: { ...settings.announcementBanner, enabled: e.target.checked },
                  })
                }
                className="rounded border-slate-700 bg-slate-950 text-primary h-4 w-4"
              />
              Enabled
            </label>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Banner Message Text
              </label>
              <Input
                value={settings.announcementBanner.text}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcementBanner: { ...settings.announcementBanner, text: e.target.value },
                  })
                }
                placeholder="e.g. ⚡ System maintenance scheduled tonight from 2 AM to 3 AM IST."
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Banner Color Style
              </label>
              <select
                value={settings.announcementBanner.variant}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcementBanner: { ...settings.announcementBanner, variant: e.target.value as any },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="info">Info (Primary Indigo)</option>
                <option value="warning">Warning (Amber)</option>
                <option value="success">Success (Emerald)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Access Controls */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-white">System Access & Maintenance</h2>
              <p className="text-xs text-slate-400">Control system availability and new account registrations.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  Maintenance Mode
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Temporarily disable invoice editing for standard users during scheduled database migrations.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-rose-500 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">Allow Public Sign-ups</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  When enabled, new users can create free accounts without an invitation code.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowPublicSignups}
                onChange={(e) => setSettings({ ...settings, allowPublicSignups: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-primary h-4 w-4"
              />
            </label>
          </div>
        </div>

        {/* Localization & Currency Defaults */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <Globe className="h-5 w-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">Localization & System Currency Defaults</h2>
              <p className="text-xs text-slate-400">Default settings applied when a new user signs up without specifying preferences.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Default Currency Code
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="AED">AED (د.إ) - UAE Dirham</option>
                <option value="SGD">SGD (S$) - Singapore Dollar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global SEO Defaults */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Global SEO & Social Graph Defaults</h2>
            <p className="text-xs text-slate-400">Default meta tags rendered when page-specific tags are not defined.</p>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Default Title
              </label>
              <Input
                value={settings.seoDefaults.title}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    seoDefaults: { ...settings.seoDefaults, title: e.target.value },
                  })
                }
                className="bg-slate-950 border-slate-800 text-white text-xs h-9"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Default Description
              </label>
              <textarea
                value={settings.seoDefaults.description}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    seoDefaults: { ...settings.seoDefaults, description: e.target.value },
                  })
                }
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
