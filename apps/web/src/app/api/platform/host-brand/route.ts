import { NextResponse, type NextRequest } from 'next/server';
import { listWorkspaces } from '@/lib/server/workspaces';

export const dynamic = 'force-dynamic';

/** The brand for a white-label customer's own domain, so signed-out visitors there see that brand too. */
export async function GET(request: NextRequest) {
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(':')[0].toLowerCase();
  try {
    const match = (await listWorkspaces()).find(
      (workspace) => workspace.isWhiteLabel && workspace.status === 'active' && workspace.branding?.customDomain === host
    );
    if (!match) return NextResponse.json({ brand: null });
    const { customDomain: _domain, ...branding } = match.branding;
    return NextResponse.json({ brand: { name: branding.displayName || match.name, ...branding } });
  } catch {
    return NextResponse.json({ brand: null });
  }
}
