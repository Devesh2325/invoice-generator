import { NextResponse } from 'next/server';
import { handleErrors, json } from '@/lib/server/api-helpers';
import { WorkspaceIdSchema, getWorkspace, toPublicConfig } from '@/lib/server/workspaces';

export const dynamic = 'force-dynamic';

/**
 * Plan, status and branding for one workspace, read by its owner's browser and by shared invoice
 * pages. Shared pages have no sign-in, so nothing here is private: no password hash is returned.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = WorkspaceIdSchema.safeParse(params.id);
  if (!id.success) return json({ error: 'Invalid workspace.' }, 400);
  return handleErrors(async () => {
    const workspace = await getWorkspace(id.data);
    if (!workspace) return json({ error: 'Workspace not found.' }, 404);
    const { ownerEmail: _email, ...config } = toPublicConfig(workspace);
    return NextResponse.json({ workspace: config }, { headers: { 'Cache-Control': 'no-store' } });
  });
}
