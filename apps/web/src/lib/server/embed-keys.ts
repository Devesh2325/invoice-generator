import { PlatformStore } from './platform-store';
import { planFeature } from './settings';
import { getWorkspace } from './workspaces';

/**
 * An embed key is visible in the host site's page source, so it isn't secret by itself. What protects
 * it is the list of approved websites, which browsers enforce through frame-ancestors on /embed.
 */
export interface EmbedAccess {
  keyHash: string;
  last4: string;
  origins: string[];
  createdAt: string;
}

export function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const keyRecord = (hash: string) => `ek_${hash.slice(0, 32)}`;
const accessRecord = (workspaceId: string) => `ea_${workspaceId}`;

export async function getEmbedAccess(workspaceId: string): Promise<EmbedAccess | null> {
  return (await PlatformStore.get<EmbedAccess>(accessRecord(workspaceId)))?.data || null;
}

/** Creates a key, replacing any earlier one. The key itself is only returned here and never stored. */
export async function issueEmbedKey(workspaceId: string, origins: string[]): Promise<string> {
  const existing = await getEmbedAccess(workspaceId);
  if (existing) await PlatformStore.remove(keyRecord(existing.keyHash));
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const key = `ek_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  const keyHash = await sha256(key);
  await PlatformStore.put(keyRecord(keyHash), 'settings', { workspaceId });
  await PlatformStore.put<EmbedAccess>(accessRecord(workspaceId), 'settings', {
    keyHash,
    last4: key.slice(-4),
    origins,
    createdAt: new Date().toISOString(),
  });
  return key;
}

export async function setEmbedOrigins(workspaceId: string, origins: string[]): Promise<boolean> {
  const existing = await getEmbedAccess(workspaceId);
  if (!existing) return false;
  await PlatformStore.put<EmbedAccess>(accessRecord(workspaceId), 'settings', { ...existing, origins });
  return true;
}

/** The websites a key may be used on, or nothing if the key is wrong or the plan no longer includes it. */
export async function originsForKey(key: string): Promise<string[]> {
  if (!/^ek_[0-9a-f]{48}$/.test(key)) return [];
  const keyHash = await sha256(key);
  const owner = await PlatformStore.get<{ workspaceId: string }>(keyRecord(keyHash));
  if (!owner) return [];
  const workspace = await getWorkspace(owner.data.workspaceId);
  if (!workspace || workspace.status !== 'active') return [];
  if (!(await planFeature(workspace.plan, 'hasIntegrationDocs'))) return [];
  const access = await getEmbedAccess(workspace.id);
  return access?.keyHash === keyHash ? access.origins : [];
}
