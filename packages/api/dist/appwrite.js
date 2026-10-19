import { Client as BrowserClient, Databases as BrowserDatabases, Storage as BrowserStorage, Account as BrowserAccount, Functions as BrowserFunctions, Query, ID, Permission, Role, } from 'appwrite';
import { APP_CONFIG } from '@invoice/core';
export { Query, ID, Permission, Role };
export function getAppwriteConfig() {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
        process.env.APPWRITE_ENDPOINT ||
        APP_CONFIG.appwrite.defaultEndpoint;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
        process.env.APPWRITE_PROJECT_ID ||
        '';
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
        process.env.APPWRITE_DATABASE_ID ||
        APP_CONFIG.appwrite.defaultDatabaseId;
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID ||
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
export function isAppwriteConfigured() {
    const cfg = getAppwriteConfig();
    return Boolean(cfg.projectId &&
        cfg.projectId !== 'your-project-id' &&
        cfg.projectId.trim().length > 0 &&
        cfg.endpoint &&
        cfg.endpoint.trim().length > 0);
}
// -------------------------------------------------------------
// Client-side Browser SDK Singletons
// -------------------------------------------------------------
let browserClient = null;
let browserDatabases = null;
let browserStorage = null;
let browserAccount = null;
let browserFunctions = null;
export function getAppwriteClient() {
    if (!isAppwriteConfigured())
        return null;
    if (!browserClient) {
        const cfg = getAppwriteConfig();
        browserClient = new BrowserClient().setEndpoint(cfg.endpoint).setProject(cfg.projectId);
    }
    return browserClient;
}
export function getAppwriteDatabases() {
    const client = getAppwriteClient();
    if (!client)
        return null;
    if (!browserDatabases) {
        browserDatabases = new BrowserDatabases(client);
    }
    return browserDatabases;
}
export function getAppwriteStorage() {
    const client = getAppwriteClient();
    if (!client)
        return null;
    if (!browserStorage) {
        browserStorage = new BrowserStorage(client);
    }
    return browserStorage;
}
export function getAppwriteAccount() {
    const client = getAppwriteClient();
    if (!client)
        return null;
    if (!browserAccount) {
        browserAccount = new BrowserAccount(client);
    }
    return browserAccount;
}
export function getAppwriteFunctions() {
    const client = getAppwriteClient();
    if (!client)
        return null;
    if (!browserFunctions) {
        browserFunctions = new BrowserFunctions(client);
    }
    return browserFunctions;
}
