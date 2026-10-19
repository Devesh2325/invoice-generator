import * as NodeAppwrite from 'node-appwrite';
import { getAppwriteConfig } from './appwrite';

let serverClient: NodeAppwrite.Client | null = null;

export function getAppwriteServerClient(): NodeAppwrite.Client | null {
  const cfg = getAppwriteConfig();
  if (!cfg.projectId || !cfg.apiKey) return null;

  if (!serverClient) {
    serverClient = new NodeAppwrite.Client()
      .setEndpoint(cfg.endpoint)
      .setProject(cfg.projectId)
      .setKey(cfg.apiKey);
  }
  return serverClient;
}

export function getAppwriteServerDatabases(): NodeAppwrite.Databases | null {
  const client = getAppwriteServerClient();
  return client ? new NodeAppwrite.Databases(client) : null;
}

export function getAppwriteServerStorage(): NodeAppwrite.Storage | null {
  const client = getAppwriteServerClient();
  return client ? new NodeAppwrite.Storage(client) : null;
}

export function getAppwriteServerUsers(): NodeAppwrite.Users | null {
  const client = getAppwriteServerClient();
  return client ? new NodeAppwrite.Users(client) : null;
}
