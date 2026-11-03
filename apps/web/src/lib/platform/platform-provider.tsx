'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { APP_CONFIG, applyPlanOverrides, type PlanOverrides, type WorkspaceBranding } from '@invoice/core';
import { useTenant } from '@/lib/auth/tenant-context';
import { useToast } from '@/components/ui/use-toast';
import { syncWorkspaceData } from './data-sync';
import { applyWorkspaceConfig } from './workspace-sync';

const PLANS_CACHE_KEY = 'billcraft_platform_plans';
const PlansVersionContext = createContext(0);

export type HostBrand = WorkspaceBranding & { name: string };
const HostBrandContext = createContext<HostBrand | null>(null);

/** The white-label brand when this site is opened on a customer's own domain. */
export function useHostBrand(): HostBrand | null {
  return useContext(HostBrandContext);
}

// On a customer's own domain, our sales pages are replaced by their sign-in page.
const MARKETING_PAGES = ['/', '/features', '/pricing', '/templates', '/integrations', '/white-label', '/about', '/faq', '/blog', '/contact', '/signup'];

interface SiteSettings {
  disabledTemplates?: string[];
  generator?: Record<string, boolean>;
}

/** The app reads these from browser storage, so the server's values are copied there. */
function applySiteSettings(site?: SiteSettings) {
  if (!site) return;
  if (site.disabledTemplates) {
    const next = JSON.stringify(site.disabledTemplates.map((id) => ({ id, enabled: false })));
    if (window.localStorage.getItem('billcraft_admin_templates') !== next) {
      window.localStorage.setItem('billcraft_admin_templates', next);
      window.dispatchEvent(new Event('invoxa-templates-updated'));
    }
  }
  if (site.generator) {
    const next = JSON.stringify(site.generator);
    if (window.localStorage.getItem('invoxa_generator_field_settings') !== next) {
      window.localStorage.setItem('invoxa_generator_field_settings', next);
      window.dispatchEvent(new Event('billcraft-generator-settings-updated'));
    }
  }
}

function useDataSync() {
  const { activeTenant } = useTenant();
  const { toast } = useToast();
  const id = activeTenant?.id;

  useEffect(() => {
    if (!id) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let warned = false;
    const run = async () => {
      const result = await syncWorkspaceData(id);
      if (result === 'signed-out' && !warned) {
        warned = true;
        toast({ title: 'Sign in again to back up your data', description: 'Your invoices are only on this device until you sign out and back in.' });
      }
    };
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(run, 1500);
    };
    run();
    window.addEventListener('billcraft-data-changed', soon);
    window.addEventListener('focus', soon);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('billcraft-data-changed', soon);
      window.removeEventListener('focus', soon);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}

function useHostBrandLoader(): HostBrand | null {
  const [brand, setBrand] = useState<HostBrand | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app')) return;
    fetch('/api/platform/host-brand', { cache: 'no-store' })
      .then((res) => res.json())
      .then((body) => {
        if (!body.brand) return;
        APP_CONFIG.brandName = body.brand.name;
        if (body.brand.supportEmail) APP_CONFIG.supportEmail = body.brand.supportEmail;
        setBrand(body.brand);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (brand && MARKETING_PAGES.includes(pathname || '')) router.replace('/login');
  }, [brand, pathname, router]);

  return brand;
}

/** Call this in a component that shows plan prices or limits, so it updates when the super admin changes them. */
export function usePlatformPlans(): number {
  return useContext(PlansVersionContext);
}

/** Announces that plan settings changed, for pages that hold their own copy. */
export const PLANS_CHANGED_EVENT = 'invoxa-plans-changed';

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  return match ? [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)] : null;
}

function useWhiteLabelTheme(hostBrand: HostBrand | null) {
  const { activeTenant, brandSettings } = useTenant();
  const enabled = Boolean(activeTenant?.isWhiteLabel && brandSettings?.whiteLabelEnabled);
  const rgb = hexToRgb((enabled ? brandSettings?.primaryColor : hostBrand?.primaryColor) || '');
  const name = enabled ? brandSettings?.businessName : hostBrand?.name;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('white-label', Boolean(rgb));
    if (rgb) {
      root.style.setProperty('--brand-primary', rgb.join(' '));
      root.style.setProperty('--brand-primary-hover', rgb.map((value) => Math.round(value * 0.85)).join(' '));
    } else {
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-primary-hover');
    }
  }, [rgb?.join(' ')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (name) document.title = name;
  }, [name]);
}

function useWorkspaceSync() {
  const { activeTenant, signOut } = useTenant();
  const id = activeTenant?.id;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const sync = async () => {
      try {
        const res = await fetch(`/api/workspaces/${encodeURIComponent(id)}/config`, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const { workspace } = await res.json();
        const impersonating = window.localStorage.getItem('billcraft_is_impersonating') === 'true';
        if (workspace.status === 'suspended' && !impersonating) {
          signOut();
          return;
        }
        if (applyWorkspaceConfig(workspace)) {
          window.dispatchEvent(new Event('billcraft-plan-updated'));
          window.dispatchEvent(new Event('billcraft-auth-updated'));
        }
      } catch {
        // Offline or storage not connected: keep what this browser already has.
      }
    };
    sync();
    window.addEventListener('focus', sync);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const apply = (plans: PlanOverrides, site?: SiteSettings) => {
      applyPlanOverrides(plans);
      applySiteSettings(site);
      setVersion((value) => value + 1);
    };
    const load = async () => {
      try {
        const res = await fetch('/api/platform/plans', { cache: 'no-store' });
        if (!res.ok) return;
        const { plans, site } = await res.json();
        window.localStorage.setItem(PLANS_CACHE_KEY, JSON.stringify(plans));
        apply(plans, site);
      } catch {
        // Keep the last known plans.
      }
    };
    try {
      const cached = window.localStorage.getItem(PLANS_CACHE_KEY);
      if (cached) apply(JSON.parse(cached));
    } catch {}
    load();
    window.addEventListener('focus', load);
    window.addEventListener(PLANS_CHANGED_EVENT, load);
    return () => {
      window.removeEventListener('focus', load);
      window.removeEventListener(PLANS_CHANGED_EVENT, load);
    };
  }, []);

  useWorkspaceSync();
  useDataSync();
  const hostBrand = useHostBrandLoader();
  useWhiteLabelTheme(hostBrand);

  return (
    <HostBrandContext.Provider value={hostBrand}>
      <PlansVersionContext.Provider value={version + (hostBrand ? 1 : 0)}>{children}</PlansVersionContext.Provider>
    </HostBrandContext.Provider>
  );
}
