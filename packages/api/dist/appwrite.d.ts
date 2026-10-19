import { Client as BrowserClient, Databases as BrowserDatabases, Storage as BrowserStorage, Account as BrowserAccount, Functions as BrowserFunctions, Query, ID, Permission, Role, Models } from 'appwrite';
export { Query, ID, Permission, Role };
export type { Models };
export interface AppwriteRuntimeConfig {
    endpoint: string;
    projectId: string;
    databaseId: string;
    bucketId: string;
    apiKey?: string;
}
export declare function getAppwriteConfig(): AppwriteRuntimeConfig;
export declare function isAppwriteConfigured(): boolean;
export declare function getAppwriteClient(): BrowserClient | null;
export declare function getAppwriteDatabases(): BrowserDatabases | null;
export declare function getAppwriteStorage(): BrowserStorage | null;
export declare function getAppwriteAccount(): BrowserAccount | null;
export declare function getAppwriteFunctions(): BrowserFunctions | null;
