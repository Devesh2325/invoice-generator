import { DEFAULT_PLANS, type PlanId, type PlanLimits, type PlanOverrides } from '@invoice/core';
import { PlatformStore } from './platform-store';

/** A plan's feature as the super admin has set it. Server checks use this, because `PLANS` reflects the browser's copy. */
export async function planFeature(plan: PlanId, feature: 'hasIntegrationDocs' | 'hasWhiteLabel'): Promise<boolean> {
  const overrides = (await PlatformStore.get<PlanOverrides>('settings_plans'))?.data;
  const value = overrides?.[plan]?.[feature as keyof PlanOverrides[PlanId]] as PlanLimits[typeof feature] | undefined;
  return value ?? DEFAULT_PLANS[plan][feature];
}

export interface SiteSettings {
  disabledTemplates?: string[];
  generator?: Record<string, boolean>;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return (await PlatformStore.get<SiteSettings>('settings_site'))?.data || {};
}

export async function writeAudit(action: string, target: string, ipAddress?: string): Promise<void> {
  const id = `aud_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  await PlatformStore.put(id, 'audit', { id, actor: 'Super Admin', action, target, timestamp: new Date().toISOString(), ipAddress });
}
