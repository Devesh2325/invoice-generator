import * as NodeAppwrite from 'node-appwrite';
import { getAppwriteConfig } from './appwrite';
let serverClient = null;
export function getAppwriteServerClient() {
    const cfg = getAppwriteConfig();
    if (!cfg.projectId || !cfg.apiKey)
        return null;
    if (!serverClient) {
        serverClient = new NodeAppwrite.Client()
            .setEndpoint(cfg.endpoint)
            .setProject(cfg.projectId)
            .setKey(cfg.apiKey);
    }
    return serverClient;
}
export function getAppwriteServerDatabases() {
    const client = getAppwriteServerClient();
    return client ? new NodeAppwrite.Databases(client) : null;
}
export function getAppwriteServerStorage() {
    const client = getAppwriteServerClient();
    return client ? new NodeAppwrite.Storage(client) : null;
}
export function getAppwriteServerUsers() {
    const client = getAppwriteServerClient();
    return client ? new NodeAppwrite.Users(client) : null;
}
