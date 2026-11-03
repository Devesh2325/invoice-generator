import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { PlatformStore } from '@/lib/server/platform-store';
import { clientIp, handleErrors, isAdminRequest, json, unauthorized } from '@/lib/server/api-helpers';
import { writeAudit } from '@/lib/server/settings';
import { getEmbedAccess } from '@/lib/server/embed-keys';
import {
  BrandingSchema,
  PasswordHashSchema,
  WorkspaceIdSchema,
  cleanBranding,
  findByEmail,
  getWorkspace,
  listWorkspaces,
  recordId,
  saveWorkspace,
  toPublicConfig,
  type WorkspaceRecord,
} from '@/lib/server/workspaces';

const Fields = z.object({
  name: z.string().trim().min(1).max(120),
  ownerEmail: z.string().trim().email().max(200).transform((value) => value.toLowerCase()),
  plan: z.enum(['starter', 'pro', 'enterprise']),
  status: z.enum(['active', 'suspended']),
  isWhiteLabel: z.boolean(),
  branding: BrandingSchema,
  ownerPasswordHash: PasswordHashSchema,
});
const CreateSchema = Fields.partial({ plan: true, status: true, isWhiteLabel: true, branding: true, ownerPasswordHash: true }).extend({
  id: WorkspaceIdSchema,
});
const PatchSchema = Fields.partial().extend({ id: WorkspaceIdSchema });

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  return handleErrors(async () => json({ workspaces: (await listWorkspaces()).map(toPublicConfig) }));
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const parsed = CreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Please check the workspace details.' }, 400);
  return handleErrors(async () => {
    const owner = await findByEmail(parsed.data.ownerEmail);
    if (owner && owner.id !== parsed.data.id) return json({ error: 'This owner email already has a workspace.' }, 409);
    if (await getWorkspace(parsed.data.id)) return json({ error: 'This workspace already exists.' }, 409);
    const now = new Date().toISOString();
    const workspace: WorkspaceRecord = {
      id: parsed.data.id,
      name: parsed.data.name,
      ownerEmail: parsed.data.ownerEmail,
      plan: parsed.data.plan || 'starter',
      status: parsed.data.status || 'active',
      isWhiteLabel: Boolean(parsed.data.isWhiteLabel),
      branding: cleanBranding(parsed.data.branding),
      ownerPasswordHash: parsed.data.ownerPasswordHash,
      createdAt: now,
      updatedAt: now,
    };
    await saveWorkspace(workspace);
    await writeAudit('CREATE_WORKSPACE', `${workspace.name} (${workspace.id})`, clientIp(request));
    return json({ workspace: toPublicConfig(workspace) }, 201);
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Please check the workspace details.' }, 400);
  return handleErrors(async () => {
    const { id, branding, ...patch } = parsed.data;
    const existing = await getWorkspace(id);
    if (!existing) return json({ error: 'Workspace not found.' }, 404);
    if (branding?.customDomain) {
      const taken = (await listWorkspaces()).some((other) => other.id !== id && other.branding?.customDomain === branding.customDomain);
      if (taken) return json({ error: 'Another workspace already uses this domain.' }, 409);
    }
    if (patch.ownerEmail && patch.ownerEmail !== existing.ownerEmail) {
      const owner = await findByEmail(patch.ownerEmail);
      if (owner && owner.id !== id) return json({ error: 'This owner email already has a workspace.' }, 409);
    }
    const workspace: WorkspaceRecord = {
      ...existing,
      ...patch,
      branding: branding ? cleanBranding(branding) : existing.branding,
      updatedAt: new Date().toISOString(),
    };
    await saveWorkspace(workspace);
    await writeAudit('UPDATE_WORKSPACE', `${workspace.name} (${Object.keys(parsed.data).filter((key) => key !== 'id' && key !== 'ownerPasswordHash').join(', ')})`, clientIp(request));
    return json({ workspace: toPublicConfig(workspace) });
  });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const parsed = WorkspaceIdSchema.safeParse(new URL(request.url).searchParams.get('id'));
  if (!parsed.success) return json({ error: 'Invalid workspace.' }, 400);
  return handleErrors(async () => {
    // Deleting a workspace also deletes its invoices, customers and embed key.
    const items = await PlatformStore.listByLookup('workspace_item', parsed.data);
    await Promise.all(items.map((item) => PlatformStore.remove(item.id)));
    const access = await getEmbedAccess(parsed.data);
    if (access) {
      await PlatformStore.remove(`ek_${access.keyHash.slice(0, 32)}`);
      await PlatformStore.remove(`ea_${parsed.data}`);
    }
    await PlatformStore.remove(recordId(parsed.data));
    await writeAudit('DELETE_WORKSPACE', parsed.data, clientIp(request));
    return json({ ok: true });
  });
}
