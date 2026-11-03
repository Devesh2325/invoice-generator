/**
 * Creates the private Appwrite collection for platform data: enquiries, plan settings and workspaces.
 * It has no public permissions, so only the server's API key can read it. Safe to run more than once.
 *
 *   pnpm setup:platform
 *
 * Reads settings from the environment, or from .env.local and apps/web/.env.local.
 * The API key needs databases, collections, attributes, indexes and documents read and write scopes.
 */
import { existsSync, readFileSync } from 'fs';

for (const file of ['apps/web/.env.local', '.env.local']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
  }
}

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const database = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'invoxa_main';
const key = process.env.APPWRITE_API_KEY;
const COLLECTION = 'platform_records';

if (!endpoint || !project || !key) {
  console.error('Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID and APPWRITE_API_KEY first.');
  process.exit(1);
}

const headers = { 'Content-Type': 'application/json', 'X-Appwrite-Project': project, 'X-Appwrite-Key': key };
const api = (path: string, method = 'GET', body?: unknown) =>
  fetch(`${endpoint.replace(/\/$/, '')}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });

/** Creates something, treating "already exists" as success. */
async function ensure(label: string, path: string, body: unknown) {
  const res = await api(path, 'POST', body);
  if (res.ok) return console.log(`Created ${label}`);
  if (res.status === 409) return console.log(`Already there: ${label}`);
  const detail = await res.json().catch(() => ({}));
  throw new Error(`Could not create ${label} (${res.status}): ${detail.message || res.statusText}`);
}

async function main() {
  const root = `/databases/${database}/collections`;
  const check = await api(`/databases/${database}`);
  if (check.status === 404) await ensure(`database ${database}`, '/databases', { databaseId: database, name: 'Invoxa' });
  else if (!check.ok) throw new Error(`The API key was refused (${check.status}). Check its scopes and project.`);

  await ensure(`collection ${COLLECTION}`, root, {
    collectionId: COLLECTION,
    name: 'Platform records',
    permissions: [],
    documentSecurity: false,
  });
  const attributes = `${root}/${COLLECTION}/attributes`;
  await ensure('attribute kind', `${attributes}/string`, { key: 'kind', size: 32, required: true });
  await ensure('attribute lookup', `${attributes}/string`, { key: 'lookup', size: 320, required: false });
  await ensure('attribute data', `${attributes}/string`, { key: 'data', size: 4000000, required: true });

  // Appwrite builds attributes in the background, and an index can't be created until they're ready.
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await api(attributes);
    const body = await res.json();
    if (body.attributes?.every((attribute: { status: string }) => attribute.status === 'available')) break;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  await ensure('index on kind', `${root}/${COLLECTION}/indexes`, { key: 'by_kind', type: 'key', attributes: ['kind'] });
  await ensure('index on kind and lookup', `${root}/${COLLECTION}/indexes`, { key: 'by_kind_lookup', type: 'key', attributes: ['kind', 'lookup'] });
  console.log('Platform storage is ready.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
