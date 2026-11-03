import { NextResponse, type NextRequest } from 'next/server';
import { originsForKey } from '@/lib/server/embed-keys';

export const dynamic = 'force-dynamic';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };

/**
 * Called by middleware to set frame-ancestors on /embed, and by embed.js to explain a refusal.
 * The approved websites aren't secret: browsers can already read them from that header.
 */
export async function GET(request: NextRequest) {
  const key = new URL(request.url).searchParams.get('key') || '';
  try {
    const origins = await originsForKey(key);
    return NextResponse.json({ ok: origins.length > 0, origins }, { headers: CORS });
  } catch {
    // Fails closed: without storage, only this site can show the editor.
    return NextResponse.json({ ok: false, origins: [] }, { headers: CORS });
  }
}
