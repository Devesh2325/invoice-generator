import { promises as fs } from 'fs';
import path from 'path';

/**
 * Data the whole platform shares: enquiries, plan settings and the workspace directory. Unlike the
 * browser storage used elsewhere, every visitor and the super admin see the same records.
 *
 * Production uses Appwrite with a server-only API key. The collection has no public permissions, so
 * nothing here can be read except through the API routes. Local development without Appwrite uses a
 * JSON file, because a file wouldn't survive on Vercel.
 *
 * Use the APPWRITE_* names rather than NEXT_PUBLIC_APPWRITE_*: the public ones would also switch
 * TenantApi to Appwrite in every visitor's browser.
 */
export type RecordKind = 'inquiry' | 'workspace' | 'workspace_item' | 'settings' | 'audit';

export interface PlatformRecord<T = unknown> {
  id: string;
  kind: RecordKind;
  /** An indexed value to find a record by, such as a workspace owner's email. */
  lookup: string;
  data: T;
}

export class StoreUnavailableError extends Error {
  constructor() {
    super('Shared storage is not connected.');
    this.name = 'StoreUnavailableError';
  }
}

interface Driver {
  get(id: string): Promise<PlatformRecord | null>;
  put(record: PlatformRecord): Promise<void>;
  remove(id: string): Promise<void>;
  list(kind: RecordKind, lookup?: string): Promise<PlatformRecord[]>;
}

const COLLECTION_ID = 'platform_records';

function appwriteDriver(endpoint: string, project: string, database: string, key: string): Driver {
  const base = `${endpoint.replace(/\/$/, '')}/databases/${database}/collections/${COLLECTION_ID}/documents`;
  const headers = { 'Content-Type': 'application/json', 'X-Appwrite-Project': project, 'X-Appwrite-Key': key };
  const call = (url: string, init?: RequestInit) => fetch(url, { ...init, headers, cache: 'no-store' });
  const fromDocument = (doc: Record<string, string>): PlatformRecord => ({
    id: doc.$id,
    kind: doc.kind as RecordKind,
    lookup: doc.lookup || '',
    data: JSON.parse(doc.data),
  });
  const fail = (action: string, status: number) => new Error(`Shared storage could not ${action} (${status}).`);

  return {
    async get(id) {
      const res = await call(`${base}/${encodeURIComponent(id)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw fail('read a record', res.status);
      return fromDocument(await res.json());
    },
    async put(record) {
      const data = { kind: record.kind, lookup: record.lookup, data: JSON.stringify(record.data) };
      const updated = await call(`${base}/${encodeURIComponent(record.id)}`, { method: 'PATCH', body: JSON.stringify({ data }) });
      if (updated.ok) return;
      if (updated.status !== 404) throw fail('update a record', updated.status);
      const created = await call(base, { method: 'POST', body: JSON.stringify({ documentId: record.id, data }) });
      if (!created.ok) throw fail('create a record', created.status);
    },
    async remove(id) {
      const res = await call(`${base}/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw fail('delete a record', res.status);
    },
    async list(kind, lookup) {
      const records: PlatformRecord[] = [];
      let cursor: string | undefined;
      // Reads a page at a time until there are no more.
      for (;;) {
        const queries = [
          JSON.stringify({ method: 'equal', attribute: 'kind', values: [kind] }),
          JSON.stringify({ method: 'limit', values: [200] }),
          ...(lookup ? [JSON.stringify({ method: 'equal', attribute: 'lookup', values: [lookup] })] : []),
          ...(cursor ? [JSON.stringify({ method: 'cursorAfter', values: [cursor] })] : []),
        ];
        const params = queries.map((query, index) => `queries[${index}]=${encodeURIComponent(query)}`).join('&');
        const res = await call(`${base}?${params}`);
        if (!res.ok) throw fail('list records', res.status);
        const body = await res.json();
        records.push(...body.documents.map(fromDocument));
        if (body.documents.length < 200) return records;
        cursor = body.documents[body.documents.length - 1].$id;
      }
    },
  };
}

// Next.js bundles each route separately, so the queue lives on globalThis for them all to share.
const shared = globalThis as unknown as { __platformStoreQueue?: Promise<unknown> };

function fileDriver(file: string): Driver {
  // Reads wait their turn too, so one can't catch the file half written and see it as empty.
  const inTurn = <T,>(work: () => Promise<T>): Promise<T> => {
    const run = (shared.__platformStoreQueue || Promise.resolve()).catch(() => {}).then(work);
    shared.__platformStoreQueue = run;
    return run;
  };
  const read = async (): Promise<Record<string, PlatformRecord>> => {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      return {};
    }
  };
  const update = (change: (records: Record<string, PlatformRecord>) => void) =>
    inTurn(async () => {
      const records = await read();
      change(records);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(records, null, 2));
    });
  return {
    get: (id) => inTurn(async () => (await read())[id] || null),
    put: (record) => update((records) => void (records[record.id] = record)),
    remove: (id) => update((records) => void delete records[id]),
    list: (kind, lookup) =>
      inTurn(async () => Object.values(await read()).filter((record) => record.kind === kind && (!lookup || record.lookup === lookup))),
  };
}

let driver: Driver | null = null;

function getDriver(): Driver {
  if (driver) return driver;
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
  const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  const database = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'invoxa_main';
  const key = process.env.APPWRITE_API_KEY || '';

  if (endpoint && project && key) {
    driver = appwriteDriver(endpoint, project, database, key);
  } else if (process.env.NODE_ENV !== 'production') {
    driver = fileDriver(process.env.PLATFORM_STORE_FILE || path.join(process.cwd(), '.data', 'platform-store.json'));
  } else {
    throw new StoreUnavailableError();
  }
  return driver;
}

export const PlatformStore = {
  async get<T>(id: string): Promise<PlatformRecord<T> | null> {
    return (await getDriver().get(id)) as PlatformRecord<T> | null;
  },
  put<T>(id: string, kind: RecordKind, data: T, lookup = ''): Promise<void> {
    return getDriver().put({ id, kind, lookup, data });
  },
  remove(id: string): Promise<void> {
    return getDriver().remove(id);
  },
  async list<T>(kind: RecordKind): Promise<PlatformRecord<T>[]> {
    return (await getDriver().list(kind)) as PlatformRecord<T>[];
  },
  async listByLookup<T>(kind: RecordKind, lookup: string): Promise<PlatformRecord<T>[]> {
    return (await getDriver().list(kind, lookup)) as PlatformRecord<T>[];
  },
};

/** For tests. */
export function resetPlatformStoreForTests() {
  driver = null;
}
