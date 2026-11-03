import { z } from 'zod';
import type { WorkspaceBranding, WorkspaceConfig } from '@invoice/core';
import { PlatformStore, type PlatformRecord } from './platform-store';

/** What the server keeps for a workspace. The password hash never leaves the server. */
export interface WorkspaceRecord extends WorkspaceConfig {
  ownerPasswordHash?: string;
}

const httpsUrl = z.string().trim().max(500).url().refine((value) => value.startsWith('https://'), 'Use an https:// address');

export const BrandingSchema = z
  .object({
    displayName: z.string().trim().max(120),
    logoUrl: z.union([httpsUrl, z.literal('')]),
    primaryColor: z.union([z.string().regex(/^#[0-9a-fA-F]{6}$/), z.literal('')]),
    supportEmail: z.union([z.string().trim().email().max(200), z.literal('')]),
    websiteUrl: z.union([httpsUrl, z.literal('')]),
    footerText: z.string().trim().max(300),
    customDomain: z.union([
      z.string().trim().toLowerCase().max(200).regex(/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/, 'Enter a domain such as billing.example.com'),
      z.literal(''),
    ]),
  })
  .partial();

/** Only the hash format this app creates, at its normal strength, so a stored value can't be weak or slow to check. */
export const PasswordHashSchema = z.string().regex(/^pbkdf2\$210000\$[0-9a-f]{32}\$[0-9a-f]{64}$/);

export const WorkspaceIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,32}$/);

export const recordId = (workspaceId: string) => `ws_${workspaceId}`;

export function toPublicConfig(record: WorkspaceRecord): WorkspaceConfig {
  const { ownerPasswordHash: _hidden, ...config } = record;
  return config;
}

export async function listWorkspaces(): Promise<WorkspaceRecord[]> {
  const records = await PlatformStore.list<WorkspaceRecord>('workspace');
  return records
    .map((record: PlatformRecord<WorkspaceRecord>) => record.data)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findByEmail(email: string): Promise<WorkspaceRecord | null> {
  const normalized = email.trim().toLowerCase();
  return (await listWorkspaces()).find((workspace) => workspace.ownerEmail === normalized) || null;
}

export async function getWorkspace(id: string): Promise<WorkspaceRecord | null> {
  return (await PlatformStore.get<WorkspaceRecord>(recordId(id)))?.data || null;
}

export function saveWorkspace(workspace: WorkspaceRecord): Promise<void> {
  return PlatformStore.put(recordId(workspace.id), 'workspace', workspace, workspace.ownerEmail);
}

export function cleanBranding(branding?: WorkspaceBranding): WorkspaceBranding {
  return Object.fromEntries(Object.entries(branding || {}).filter(([, value]) => Boolean(value)));
}
