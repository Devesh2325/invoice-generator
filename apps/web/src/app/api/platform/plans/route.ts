import { NextResponse } from 'next/server';
import type { PlanOverrides } from '@invoice/core';
import { PlatformStore, StoreUnavailableError } from '@/lib/server/platform-store';
import { getSiteSettings } from '@/lib/server/settings';

export const dynamic = 'force-dynamic';

/** Public on purpose: the pricing page reads it. It holds only what the pricing page shows and the limits it describes. */
export async function GET() {
  try {
    const record = await PlatformStore.get<PlanOverrides>('settings_plans');
    return NextResponse.json({ plans: record?.data || {}, site: await getSiteSettings() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (!(error instanceof StoreUnavailableError)) console.error('Could not read plan settings:', error);
    // The site still works with its built-in plans.
    return NextResponse.json({ plans: {} }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
