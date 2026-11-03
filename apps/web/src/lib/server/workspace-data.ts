import { PlatformStore } from './platform-store';

/** One customer, invoice or similar record belonging to a workspace. A deleted one stays as a marker, so other devices remove it too. */
export interface WorkspaceItem {
  collection: string;
  id: string;
  updatedAt: string;
  deleted?: boolean;
  data?: unknown;
}

export const DATA_COLLECTIONS = ['documents', 'parties', 'products', 'brand', 'tenant', 'members', 'invites'] as const;

async function recordId(workspaceId: string, collection: string, id: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${workspaceId}:${collection}:${id}`));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `wi_${hex.slice(0, 32)}`;
}

export async function listItems(workspaceId: string, since?: string): Promise<WorkspaceItem[]> {
  const records = await PlatformStore.listByLookup<WorkspaceItem>('workspace_item', workspaceId);
  const items = records.map((record) => record.data);
  return since ? items.filter((item) => item.updatedAt > since) : items;
}

export async function getItem(workspaceId: string, collection: string, id: string): Promise<WorkspaceItem | null> {
  const record = await PlatformStore.get<WorkspaceItem>(await recordId(workspaceId, collection, id));
  return record?.data || null;
}

export async function putItem(workspaceId: string, item: WorkspaceItem): Promise<void> {
  await PlatformStore.put(await recordId(workspaceId, item.collection, item.id), 'workspace_item', item, workspaceId);
}
