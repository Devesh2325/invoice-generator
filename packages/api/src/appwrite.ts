import {
  Client as BrowserClient,
  Databases as BrowserDatabases,
  Storage as BrowserStorage,
  Account as BrowserAccount,
  Functions as BrowserFunctions,
  Query,
  ID,
  Permission,
  Role,
  Models,
} from 'appwrite';
import { APP_CONFIG } from '@invoice/core';

export { Query, ID, Permission, Role };
export type { Models };

export interface AppwriteRuntimeConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  bucketId: string;
  apiKey?: string;
}

export function getAppwriteConfig(): AppwriteRuntimeConfig {
  const endpoint =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
    process.env.APPWRITE_ENDPOINT ||
    APP_CONFIG.appwrite.defaultEndpoint;

  const projectId =
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
    process.env.APPWRITE_PROJECT_ID ||
    '';

  const databaseId =
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
    process.env.APPWRITE_DATABASE_ID ||
    APP_CONFIG.appwrite.defaultDatabaseId;

  const bucketId =
    process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID ||
    process.env.APPWRITE_BUCKET_ID ||
    APP_CONFIG.appwrite.buckets.assets;

  const apiKey = process.env.APPWRITE_API_KEY || '';

  return {
    endpoint,
    projectId,
    databaseId,
    bucketId,
    apiKey,
  };
}

export function isAppwriteConfigured(): boolean {
  const cfg = getAppwriteConfig();
  return Boolean(
    cfg.projectId &&
      cfg.projectId !== 'your-project-id' &&
      cfg.projectId.trim().length > 0 &&
      cfg.endpoint &&
      cfg.endpoint.trim().length > 0
  );
}

// -------------------------------------------------------------
// Client-side Browser SDK Singletons
// -------------------------------------------------------------
let browserClient: BrowserClient | null = null;
let browserDatabases: BrowserDatabases | null = null;
let browserStorage: BrowserStorage | null = null;
let browserAccount: BrowserAccount | null = null;
let browserFunctions: BrowserFunctions | null = null;

export function getAppwriteClient(): BrowserClient | null {
  if (!isAppwriteConfigured()) return null;

  if (!browserClient) {
    const cfg = getAppwriteConfig();
    browserClient = new BrowserClient().setEndpoint(cfg.endpoint).setProject(cfg.projectId);
  }
  return browserClient;
}

export function getAppwriteDatabases(): BrowserDatabases | null {
  const client = getAppwriteClient();
  if (!client) return null;
  if (!browserDatabases) {
    browserDatabases = new BrowserDatabases(client);
  }
  return browserDatabases;
}

export function getAppwriteStorage(): BrowserStorage | null {
  const client = getAppwriteClient();
  if (!client) return null;
  if (!browserStorage) {
    browserStorage = new BrowserStorage(client);
  }
  return browserStorage;
}

export function getAppwriteAccount(): BrowserAccount | null {
  const client = getAppwriteClient();
  if (!client) return null;
  if (!browserAccount) {
    browserAccount = new BrowserAccount(client);
  }
  return browserAccount;
}

export function getAppwriteFunctions(): BrowserFunctions | null {
  const client = getAppwriteClient();
  if (!client) return null;
  if (!browserFunctions) {
    browserFunctions = new BrowserFunctions(client);
  }
  return browserFunctions;
}
