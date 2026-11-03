import type { WorkspaceConfig } from '@invoice/core';

/** Copies what the server knows about a workspace into the browser storage the app reads from. */

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => window.localStorage.setItem(key, JSON.stringify(value));

export type SyncedWorkspace = Omit<WorkspaceConfig, 'ownerEmail'> & { ownerEmail?: string };

/** Returns true if anything changed, so the caller only refreshes the screen when it needs to. */
export function applyWorkspaceConfig(config: SyncedWorkspace): boolean {
  const syncedKey = `billcraft_workspace_synced_${config.id}`;
  const tenants = read<Record<string, unknown>[]>('billcraft_custom_tenants', []);
  const local = tenants.find((tenant) => tenant.id === config.id);
  // A plan edited in this browser doesn't last: the server's plan always wins.
  const planMatches = !local || (local.plan === config.plan && Boolean(local.isWhiteLabel) === config.isWhiteLabel);
  if (window.localStorage.getItem(syncedKey) === config.updatedAt && planMatches) return false;

  const nextTenants = tenants.map((tenant) =>
    tenant.id === config.id ? { ...tenant, plan: config.plan, isWhiteLabel: config.isWhiteLabel } : tenant
  );
  write('billcraft_custom_tenants', nextTenants);
  window.localStorage.setItem(`billcraft_tenant_plan_${config.id}`, config.plan);

  const brands = read<Record<string, Record<string, unknown>>>('billcraft_tenant_brand', {});
  const current = brands[config.id] || {};
  const { displayName, logoUrl, primaryColor, supportEmail, websiteUrl, footerText } = config.branding || {};
  brands[config.id] = {
    ...current,
    tenantId: config.id,
    whiteLabelEnabled: config.isWhiteLabel,
    ...(config.isWhiteLabel && {
      businessName: displayName || current.businessName || config.name,
      logoUrl: logoUrl ?? current.logoUrl ?? '',
      primaryColor: primaryColor || current.primaryColor,
      footerText: footerText ?? current.footerText,
      supportEmail: supportEmail || '',
      websiteUrl: websiteUrl || '',
    }),
  };
  write('billcraft_tenant_brand', brands);

  window.localStorage.setItem(syncedKey, config.updatedAt);
  return true;
}

/** Sets up this browser for someone who signed in with an account stored on the server. */
export function adoptWorkspace(workspace: WorkspaceConfig, passwordHash: string) {
  const userId = `usr_${workspace.id}`;
  const email = workspace.ownerEmail;
  const user = {
    id: userId,
    email,
    name: workspace.branding?.displayName || workspace.name,
    workspaceName: workspace.name,
    tenantId: workspace.id,
  };

  const users = read<{ email: string }[]>('billcraft_registered_users', []).filter((u) => u.email !== email);
  write('billcraft_registered_users', [...users, { ...user, password: passwordHash }]);

  const tenants = read<{ id: string }[]>('billcraft_custom_tenants', []);
  if (!tenants.some((tenant) => tenant.id === workspace.id)) {
    write('billcraft_custom_tenants', [
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        ownerUserId: email,
        role: 'owner',
        currency: 'USD',
        plan: workspace.plan,
        isWhiteLabel: workspace.isWhiteLabel,
      },
      ...tenants,
    ]);
  }

  window.localStorage.removeItem(`billcraft_workspace_synced_${workspace.id}`);
  applyWorkspaceConfig(workspace);

  write('billcraft_current_user', user);
  window.localStorage.setItem('billcraft_current_user_id', userId);
  window.localStorage.setItem('billcraft_active_tenant_id', workspace.id);
}
