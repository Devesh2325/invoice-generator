import { AdminApi } from '@invoice/api';
import type { AdminTeam, WorkspaceConfig } from '@invoice/core';

export type AdminResult<T> = { ok: true; data: T } | { ok: false; error: string; offline: boolean };

export async function adminRequest<T>(url: string, init?: RequestInit): Promise<AdminResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: body as T };
    return { ok: false, error: body.error || 'Something went wrong.', offline: res.status === 503 };
  } catch {
    return { ok: false, error: 'Could not reach the server.', offline: true };
  }
}

export const toTeam = (workspace: WorkspaceConfig): AdminTeam => ({
  id: workspace.id,
  name: workspace.name,
  ownerEmail: workspace.ownerEmail,
  membersCount: 1,
  invoicesCount: 0,
  plan: workspace.plan,
  status: workspace.status,
  createdAt: workspace.createdAt.split('T')[0],
  isWhiteLabel: workspace.isWhiteLabel,
  companyDisplayName: workspace.branding?.displayName,
  logoUrl: workspace.branding?.logoUrl,
  primaryColor: workspace.branding?.primaryColor,
  supportEmail: workspace.branding?.supportEmail,
  websiteUrl: workspace.branding?.websiteUrl,
  footerText: workspace.branding?.footerText,
  customDomain: workspace.branding?.customDomain,
});

export const brandingOf = (team: Partial<AdminTeam>) => ({
  displayName: team.companyDisplayName || '',
  logoUrl: team.logoUrl || '',
  primaryColor: team.primaryColor || '',
  supportEmail: team.supportEmail || '',
  websiteUrl: team.websiteUrl || '',
  footerText: team.footerText || '',
  customDomain: team.customDomain || '',
});

/**
 * Loads workspaces from the server and copies them to this browser, which the rest of the admin
 * reads from. Workspaces that only exist in this browser are uploaded once, so none are lost.
 */
export async function syncWorkspaces(): Promise<{ teams: AdminTeam[]; connected: boolean }> {
  const local = AdminApi.getTeams();
  const first = await adminRequest<{ workspaces: WorkspaceConfig[] }>('/api/admin/workspaces');
  if (!first.ok) return { teams: local, connected: false };

  const known = new Set(first.data.workspaces.map((workspace) => workspace.id));
  const missing = local.filter((team) => !known.has(team.id));
  await Promise.all(
    missing.map((team) =>
      adminRequest('/api/admin/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          id: team.id,
          name: team.name,
          ownerEmail: team.ownerEmail,
          plan: team.plan,
          status: team.status,
          isWhiteLabel: Boolean(team.isWhiteLabel),
          branding: brandingOf(team),
          ...(team.ownerPassword?.startsWith('pbkdf2$210000$') && { ownerPasswordHash: team.ownerPassword }),
        }),
      })
    )
  );

  const latest = missing.length
    ? await adminRequest<{ workspaces: WorkspaceConfig[] }>('/api/admin/workspaces')
    : first;
  if (!latest.ok) return { teams: local, connected: false };

  const teams = latest.data.workspaces.map(toTeam);
  window.localStorage.setItem('billcraft_admin_teams', JSON.stringify(teams));

  // Signups from other browsers also appear in the Users list and dashboard counts.
  const users = AdminApi.getUsers();
  const merged = [...users];
  for (const team of teams) {
    const index = merged.findIndex((user) => user.email?.toLowerCase() === team.ownerEmail);
    const entry = {
      plan: team.plan,
      status: team.status === 'suspended' ? ('banned' as const) : ('active' as const),
    };
    if (index >= 0) merged[index] = { ...merged[index], ...entry };
    else merged.push({ id: `usr_${team.id}`, email: team.ownerEmail, name: team.name, invoicesCount: 0, createdAt: team.createdAt, ...entry });
  }
  window.localStorage.setItem('billcraft_admin_users', JSON.stringify(merged));

  return { teams, connected: true };
}

export function updateWorkspace(id: string, patch: Record<string, unknown>) {
  return adminRequest<{ workspace: WorkspaceConfig }>('/api/admin/workspaces', {
    method: 'PATCH',
    body: JSON.stringify({ id, ...patch }),
  });
}

/** Finds the workspace an owner's email belongs to, for changes made from the Users list. */
export function workspaceIdForEmail(email: string): string | undefined {
  return AdminApi.getTeams().find((team) => team.ownerEmail.toLowerCase() === email.toLowerCase())?.id;
}
