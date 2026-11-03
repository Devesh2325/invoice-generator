/**
 * Keeps a workspace's invoices, customers, products and settings the same on all of its owner's
 * devices. The app keeps reading browser storage, and this compares it with what was last synced, so
 * every kind of change is picked up without each save having to report itself.
 *
 * If the same record changed on two devices, the last one to sync wins.
 */
type Collection = 'documents' | 'parties' | 'products' | 'brand' | 'tenant' | 'members' | 'invites';

interface RemoteItem {
  collection: Collection;
  id: string;
  updatedAt: string;
  deleted?: boolean;
  data?: unknown;
}

export type SyncResult = 'synced' | 'signed-out' | 'unavailable' | 'busy';

const MAX_BATCH_ITEMS = 50;
const MAX_BATCH_BYTES = 2_500_000;
const MAX_ITEM_BYTES = 3_000_000;

// The server decides these, so a device can't set them for itself by syncing.
const SERVER_OWNED: Record<string, string[]> = {
  tenant: ['plan', 'isWhiteLabel'],
  brand: ['whiteLabelEnabled', 'supportEmail', 'websiteUrl'],
};

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => window.localStorage.setItem(key, JSON.stringify(value));

function hash(value: unknown): string {
  const text = JSON.stringify(value) ?? '';
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${text.length}:${h}`;
}

const strip = (collection: string, value: unknown) => {
  const owned = SERVER_OWNED[collection];
  if (!owned || !value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !owned.includes(key)));
};

const LIST_STORES: Record<string, (tenantId: string) => { key: string; byTenant: boolean }> = {
  documents: () => ({ key: 'billcraft_tenant_documents', byTenant: true }),
  parties: () => ({ key: 'billcraft_tenant_parties', byTenant: true }),
  products: () => ({ key: 'billcraft_tenant_products', byTenant: true }),
  members: (id) => ({ key: `billcraft_team_members_${id}`, byTenant: false }),
  invites: (id) => ({ key: `billcraft_team_invites_${id}`, byTenant: false }),
};

function collect(tenantId: string): Map<string, { collection: Collection; id: string; data: unknown }> {
  const items = new Map<string, { collection: Collection; id: string; data: unknown }>();
  const add = (collection: Collection, id: string, data: unknown) => items.set(`${collection}:${id}`, { collection, id, data: strip(collection, data) });

  for (const [collection, store] of Object.entries(LIST_STORES)) {
    const { key, byTenant } = store(tenantId);
    const list = byTenant ? read<Record<string, { id: string }[]>>(key, {})[tenantId] : read<{ id: string }[]>(key, []);
    (list || []).forEach((item) => item?.id && add(collection as Collection, item.id, item));
  }
  const brand = read<Record<string, unknown>>('billcraft_tenant_brand', {})[tenantId];
  if (brand) add('brand', 'brand', brand);
  const tenant = read<{ id: string }[]>('billcraft_custom_tenants', []).find((entry) => entry.id === tenantId);
  if (tenant) add('tenant', 'tenant', tenant);
  return items;
}

function applyRemote(tenantId: string, item: RemoteItem) {
  const data = item.data as ({ id?: string } & Record<string, unknown>) | undefined;
  if (item.collection === 'brand') {
    const brands = read<Record<string, Record<string, unknown>>>('billcraft_tenant_brand', {});
    if (item.deleted) delete brands[tenantId];
    else brands[tenantId] = { ...brands[tenantId], ...data };
    write('billcraft_tenant_brand', brands);
    return;
  }
  if (item.collection === 'tenant') {
    if (item.deleted) return;
    const tenants = read<{ id: string }[]>('billcraft_custom_tenants', []);
    write('billcraft_custom_tenants', tenants.map((entry) => (entry.id === tenantId ? { ...entry, ...data, id: tenantId } : entry)));
    return;
  }
  const { key, byTenant } = LIST_STORES[item.collection](tenantId);
  const whole = byTenant ? read<Record<string, { id: string }[]>>(key, {}) : null;
  const list = (whole ? whole[tenantId] : read<{ id: string }[]>(key, [])) || [];
  const others = list.filter((entry) => entry.id !== item.id);
  const next = item.deleted ? others : [...others, data as { id: string }];
  if (whole) {
    whole[tenantId] = next;
    write(key, whole);
  } else {
    write(key, next);
  }
}

const running = new Set<string>();

export async function syncWorkspaceData(tenantId: string): Promise<SyncResult> {
  if (running.has(tenantId)) return 'busy';
  running.add(tenantId);
  try {
    const baseKey = `billcraft_sync_base_${tenantId}`;
    const sinceKey = `billcraft_sync_since_${tenantId}`;
    const base = read<Record<string, string>>(baseKey, {});
    const since = window.localStorage.getItem(sinceKey);
    const url = `/api/workspaces/${encodeURIComponent(tenantId)}/data`;

    const pulled = await fetch(since ? `${url}?since=${encodeURIComponent(since)}` : url, { cache: 'no-store' });
    if (pulled.status === 401) return 'signed-out';
    if (!pulled.ok) return 'unavailable';
    const { items: remote, serverTime } = (await pulled.json()) as { items: RemoteItem[]; serverTime: string };

    // Remote changes apply unless this device also changed that record, in which case this device's goes up below.
    let current = collect(tenantId);
    let changedHere = false;
    for (const item of remote) {
      const key = `${item.collection}:${item.id}`;
      const local = current.get(key);
      const unchangedHere = base[key] !== undefined ? (local ? hash(local.data) === base[key] : false) : !local;
      if (!unchangedHere) continue;
      applyRemote(tenantId, item);
      changedHere = true;
      if (item.deleted) delete base[key];
      else base[key] = hash(strip(item.collection, item.data));
    }
    write(baseKey, base);
    current = collect(tenantId);

    const outgoing: { key: string; collection: Collection; id: string; data?: unknown; deleted?: boolean; size: number }[] = [];
    current.forEach((item, key) => {
      if (base[key] === hash(item.data)) return;
      const size = JSON.stringify(item.data).length;
      if (size <= MAX_ITEM_BYTES) outgoing.push({ key, ...item, size });
      else console.warn(`Not backed up, because it is too large: ${key}`);
    });
    Object.keys(base).forEach((key) => {
      if (current.has(key)) return;
      const [collection, ...rest] = key.split(':');
      outgoing.push({ key, collection: collection as Collection, id: rest.join(':'), deleted: true, size: 100 });
    });

    let index = 0;
    while (index < outgoing.length) {
      const batch: typeof outgoing = [];
      let bytes = 0;
      while (index < outgoing.length && batch.length < MAX_BATCH_ITEMS && (batch.length === 0 || bytes + outgoing[index].size <= MAX_BATCH_BYTES)) {
        batch.push(outgoing[index]);
        bytes += outgoing[index].size;
        index += 1;
      }
      const sent = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: batch.map(({ collection, id, data, deleted }) => ({ collection, id, data, deleted })) }),
      });
      if (sent.status === 401) return 'signed-out';
      if (!sent.ok) return 'unavailable';
      const { rejected = [] } = (await sent.json()) as { rejected?: string[] };
      batch.forEach((item) => {
        if (rejected.includes(item.key)) return;
        if (item.deleted) delete base[item.key];
        else base[item.key] = hash(item.data);
      });
      write(baseKey, base);
    }

    window.localStorage.setItem(sinceKey, serverTime);
    if (changedHere) {
      window.dispatchEvent(new Event('billcraft-data-synced'));
      window.dispatchEvent(new Event('billcraft-auth-updated'));
    }
    return 'synced';
  } catch {
    return 'unavailable';
  } finally {
    running.delete(tenantId);
  }
}
