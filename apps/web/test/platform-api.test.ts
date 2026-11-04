// @vitest-environment node
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { ADMIN_COOKIE, WORKSPACE_COOKIE, createAdminSession, createWorkspaceSession, readWorkspaceSession } from '../src/lib/auth/admin-session';
import { hashPassword } from '../src/lib/auth/password';
import { resetPlatformStoreForTests } from '../src/lib/server/platform-store';
import { POST as submitInquiry } from '../src/app/api/inquiries/route';
import { GET as listInquiries } from '../src/app/api/admin/inquiries/route';
import { GET as readPlans } from '../src/app/api/platform/plans/route';
import { PUT as savePlans } from '../src/app/api/admin/plans/route';
import { GET as listWorkspaces, PATCH as patchWorkspace, POST as createWorkspace } from '../src/app/api/admin/workspaces/route';
import { POST as register } from '../src/app/api/workspaces/register/route';
import { POST as login } from '../src/app/api/workspaces/login/route';
import { GET as workspaceConfig } from '../src/app/api/workspaces/[id]/config/route';
import { GET as getData, POST as postData } from '../src/app/api/workspaces/[id]/data/route';
import { POST as shareDoc } from '../src/app/api/workspaces/[id]/share/route';
import { GET as openShare } from '../src/app/api/share/route';
import { POST as createKey } from '../src/app/api/workspaces/[id]/embed-key/route';
import { GET as verifyKey } from '../src/app/api/embed/verify/route';
import { POST as requestPlan } from '../src/app/api/workspaces/[id]/plan-request/route';
import { PUT as saveBlog } from '../src/app/api/admin/blog/route';
import { GET as readBlog } from '../src/app/api/platform/blog/route';
import { PUT as saveSettings } from '../src/app/api/admin/settings/route';
import { GET as readAudit } from '../src/app/api/admin/audit/route';

const dir = mkdtempSync(join(tmpdir(), 'invoxa-store-'));
let counter = 0;
let cookie = '';

const request = (url: string, body?: unknown, method = body ? 'POST' : 'GET', admin = false) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'x-forwarded-for': `10.0.0.${++counter}`,
      ...(admin ? { cookie: `${ADMIN_COOKIE}=${cookie}` } : {}),
    },
  });

beforeEach(async () => {
  process.env.PLATFORM_STORE_FILE = join(dir, `store-${++counter}.json`);
  process.env.ADMIN_SESSION_SECRET = 'x'.repeat(40);
  // Tests must never reach a real database, whatever this machine has configured.
  delete process.env.MONGODB_URI;
  delete process.env.APPWRITE_API_KEY;
  resetPlatformStoreForTests();
  cookie = await createAdminSession(process.env.ADMIN_SESSION_SECRET);
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('enquiries', () => {
  const valid = { name: 'Sam', email: 'SAM@example.com', message: 'Hello' };

  it('shows a website enquiry to the admin', async () => {
    expect((await submitInquiry(request('/api/inquiries', valid))).status).toBe(201);
    const { inquiries } = await (await listInquiries(request('/api/admin/inquiries', undefined, 'GET', true))).json();
    expect(inquiries).toHaveLength(1);
    expect(inquiries[0]).toMatchObject({ name: 'Sam', email: 'sam@example.com', status: 'new' });
  });

  it('keeps enquiries from anyone who is not the admin', async () => {
    expect((await listInquiries(request('/api/admin/inquiries'))).status).toBe(401);
  });

  it('rejects bad input and bots', async () => {
    expect((await submitInquiry(request('/api/inquiries', { ...valid, email: 'nope' }))).status).toBe(400);
    expect((await submitInquiry(request('/api/inquiries', { ...valid, website: 'spam.example' }))).status).toBe(400);
  });
});

describe('plans', () => {
  it('publishes admin changes to the public endpoint', async () => {
    const saved = await savePlans(request('/api/admin/plans', { pro: { priceMonthly: 999 } }, 'PUT', true));
    expect(saved.status).toBe(200);
    const { plans } = await (await readPlans()).json();
    expect(plans.pro.priceMonthly).toBe(999);
  });

  it('only lets the admin change them, and only with sensible values', async () => {
    expect((await savePlans(request('/api/admin/plans', { pro: { priceMonthly: 1 } }, 'PUT'))).status).toBe(401);
    expect((await savePlans(request('/api/admin/plans', { pro: { priceMonthly: -5 } }, 'PUT', true))).status).toBe(400);
  });
});

describe('workspaces', () => {
  const account = async (email = 'owner@example.com') => ({
    id: `tenant_${++counter}`,
    name: 'Acme',
    ownerEmail: email,
    ownerPasswordHash: await hashPassword('correct-password'),
  });

  it('signs an owner in from any browser, without exposing the password hash', async () => {
    await register(request('/api/workspaces/register', await account()));
    const res = await login(request('/api/workspaces/login', { email: 'OWNER@example.com', password: 'correct-password' }));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('owner@example.com');
    expect(text).not.toContain('pbkdf2');
    expect((await login(request('/api/workspaces/login', { email: 'owner@example.com', password: 'wrong' }))).status).toBe(401);
  });

  it('always starts a public signup on the free plan, whatever it asks for', async () => {
    const res = await register(request('/api/workspaces/register', { ...(await account()), plan: 'enterprise', isWhiteLabel: true }));
    const { workspace } = await res.json();
    expect(workspace.plan).toBe('starter');
    expect(workspace.isWhiteLabel).toBe(false);
  });

  it('refuses a second signup with the same email, so accounts can not be taken over', async () => {
    await register(request('/api/workspaces/register', await account()));
    expect((await register(request('/api/workspaces/register', await account()))).status).toBe(409);
  });

  it('accepts only properly hashed passwords', async () => {
    const weak = { ...(await account()), ownerPasswordHash: 'plain-text' };
    expect((await register(request('/api/workspaces/register', weak))).status).toBe(400);
  });

  it('passes admin plan and white-label changes to the owner', async () => {
    const created = await account();
    await register(request('/api/workspaces/register', created));
    const patched = await patchWorkspace(
      request('/api/admin/workspaces', { id: created.id, plan: 'enterprise', isWhiteLabel: true, branding: { displayName: 'Acme Billing', primaryColor: '#112233' } }, 'PATCH', true)
    );
    expect(patched.status).toBe(200);
    const res = await workspaceConfig(new Request('http://localhost'), { params: { id: created.id } });
    const { workspace } = await res.json();
    expect(workspace).toMatchObject({ plan: 'enterprise', isWhiteLabel: true, branding: { displayName: 'Acme Billing', primaryColor: '#112233' } });
    expect(workspace.ownerEmail).toBeUndefined();
    expect(workspace.ownerPasswordHash).toBeUndefined();
  });

  it('blocks suspended owners', async () => {
    const created = await account();
    await register(request('/api/workspaces/register', created));
    await patchWorkspace(request('/api/admin/workspaces', { id: created.id, status: 'suspended' }, 'PATCH', true));
    expect((await login(request('/api/workspaces/login', { email: created.ownerEmail, password: 'correct-password' }))).status).toBe(403);
  });

  it('keeps the workspace list and changes admin-only', async () => {
    expect((await listWorkspaces(request('/api/admin/workspaces'))).status).toBe(401);
    expect((await createWorkspace(request('/api/admin/workspaces', { id: 'a', name: 'A', ownerEmail: 'a@b.co' }))).status).toBe(401);
    expect((await patchWorkspace(request('/api/admin/workspaces', { id: 'a', plan: 'pro' }, 'PATCH'))).status).toBe(401);
  });

  it('rejects logo and website links that are not https', async () => {
    const created = await account();
    await register(request('/api/workspaces/register', created));
    const res = await patchWorkspace(request('/api/admin/workspaces', { id: created.id, branding: { logoUrl: 'javascript:alert(1)' } }, 'PATCH', true));
    expect(res.status).toBe(400);
  });
});

describe('workspace data', () => {
  const setup = async () => {
    const account = { id: `tenant_${++counter}`, name: 'Acme', ownerEmail: `o${counter}@example.com`, ownerPasswordHash: await hashPassword('correct-password') };
    const res = await register(request('/api/workspaces/register', account));
    const session = res.cookies.get(WORKSPACE_COOKIE)?.value as string;
    return { account, session };
  };
  const asOwner = (url: string, session: string, body?: unknown, method = body ? 'POST' : 'GET') =>
    new NextRequest(`http://localhost${url}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'x-forwarded-for': `10.1.0.${++counter}`, cookie: `${WORKSPACE_COOKIE}=${session}` },
    });
  const route = (id: string) => ({ params: { id } });
  const doc = { collection: 'documents', id: 'doc1', data: { id: 'doc1', documentNumber: 'INV-1', tenantId: 'x' } };

  it('gives an owner their data on another device', async () => {
    const { account, session } = await setup();
    const url = `/api/workspaces/${account.id}/data`;
    expect((await postData(asOwner(url, session, { items: [doc] }), route(account.id))).status).toBe(200);
    const { items } = await (await getData(asOwner(url, session), route(account.id))).json();
    expect(items).toHaveLength(1);
    expect(items[0].data.documentNumber).toBe('INV-1');
  });

  it('never gives one business another business’s data', async () => {
    const first = await setup();
    const second = await setup();
    const url = `/api/workspaces/${first.account.id}/data`;
    await postData(asOwner(url, first.session, { items: [doc] }), route(first.account.id));
    expect((await getData(asOwner(url, second.session), route(first.account.id))).status).toBe(401);
    expect((await postData(asOwner(url, second.session, { items: [doc] }), route(first.account.id))).status).toBe(401);
    expect((await getData(request(url), route(first.account.id))).status).toBe(401);
  });

  it('rejects a forged session', async () => {
    const { account } = await setup();
    const url = `/api/workspaces/${account.id}/data`;
    const forged = await createWorkspaceSession(account.id, 'y'.repeat(40));
    expect((await getData(asOwner(url, forged), route(account.id))).status).toBe(401);
  });

  it('does not accept an admin session token as an owner, or the reverse', async () => {
    const { account, session } = await setup();
    expect(await readWorkspaceSession(cookie, process.env.ADMIN_SESSION_SECRET as string)).toBeNull();
    expect((await listWorkspaces(new NextRequest('http://localhost/api/admin/workspaces', { headers: { cookie: `${ADMIN_COOKIE}=${session}` } }))).status).toBe(401);
    expect(account.id).toBeTruthy();
  });

  it('cuts off a suspended owner straight away', async () => {
    const { account, session } = await setup();
    await patchWorkspace(request('/api/admin/workspaces', { id: account.id, status: 'suspended' }, 'PATCH', true));
    expect((await getData(asOwner(`/api/workspaces/${account.id}/data`, session), route(account.id))).status).toBe(401);
  });

  it('passes deletions on to other devices', async () => {
    const { account, session } = await setup();
    const url = `/api/workspaces/${account.id}/data`;
    await postData(asOwner(url, session, { items: [doc] }), route(account.id));
    await postData(asOwner(url, session, { items: [{ collection: 'documents', id: 'doc1', deleted: true }] }), route(account.id));
    const { items } = await (await getData(asOwner(url, session), route(account.id))).json();
    expect(items[0].deleted).toBe(true);
    expect(items[0].data).toBeUndefined();
  });

  it('opens a signed share link with no sign-in, and refuses a forged or edited one', async () => {
    const { account, session } = await setup();
    await postData(asOwner(`/api/workspaces/${account.id}/data`, session, { items: [doc] }), route(account.id));
    const made = await shareDoc(asOwner(`/api/workspaces/${account.id}/share`, session, { documentId: 'doc1' }), route(account.id));
    const { token } = await made.json();
    const opened = await openShare(request(`/api/share?token=${encodeURIComponent(token)}`));
    expect(opened.status).toBe(200);
    expect((await opened.json()).document.documentNumber).toBe('INV-1');
    expect((await openShare(request(`/api/share?token=${encodeURIComponent(token + 'x')}`))).status).toBe(404);
    const unsigned = Buffer.from(`${account.id}:doc1`).toString('base64url');
    expect((await openShare(request(`/api/share?token=${unsigned}`))).status).toBe(404);
    const stranger = await setup();
    expect((await shareDoc(asOwner(`/api/workspaces/${account.id}/share`, stranger.session, { documentId: 'doc1' }), route(account.id))).status).toBe(401);
  });

  it('only issues embed keys on plans that include them, and locks them when the plan drops', async () => {
    const { account, session } = await setup();
    const url = `/api/workspaces/${account.id}/embed-key`;
    const body = { origins: ['https://shop.example.com'] };
    expect((await createKey(asOwner(url, session, body), route(account.id))).status).toBe(403);
    await patchWorkspace(request('/api/admin/workspaces', { id: account.id, plan: 'pro' }, 'PATCH', true));
    const made = await createKey(asOwner(url, session, body), route(account.id));
    expect(made.status).toBe(201);
    const { key } = await made.json();
    const check = async () => (await verifyKey(request(`/api/embed/verify?key=${key}`))).json();
    expect(await check()).toEqual({ ok: true, origins: ['https://shop.example.com'] });
    await patchWorkspace(request('/api/admin/workspaces', { id: account.id, plan: 'starter' }, 'PATCH', true));
    expect((await check()).ok).toBe(false);
  });

  it('stops an old key working once it is replaced, and refuses insecure websites', async () => {
    const { account, session } = await setup();
    await patchWorkspace(request('/api/admin/workspaces', { id: account.id, plan: 'pro' }, 'PATCH', true));
    const url = `/api/workspaces/${account.id}/embed-key`;
    const { key: oldKey } = await (await createKey(asOwner(url, session, { origins: ['https://a.example.com'] }), route(account.id))).json();
    await createKey(asOwner(url, session, { origins: ['https://a.example.com'] }), route(account.id));
    expect((await (await verifyKey(request(`/api/embed/verify?key=${oldKey}`))).json()).ok).toBe(false);
    expect((await createKey(asOwner(url, session, { origins: ['http://a.example.com'] }), route(account.id))).status).toBe(400);
  });

  it('turns a plan request into an inbox message without changing the plan', async () => {
    const { account, session } = await setup();
    const res = await requestPlan(asOwner(`/api/workspaces/${account.id}/plan-request`, session, { plan: 'enterprise' }), route(account.id));
    expect(res.status).toBe(201);
    const { inquiries } = await (await listInquiries(request('/api/admin/inquiries', undefined, 'GET', true))).json();
    expect(inquiries[0].subject).toContain('enterprise');
    const { workspace } = await (await workspaceConfig(new Request('http://localhost'), route(account.id))).json();
    expect(workspace.plan).toBe('starter');
    expect((await requestPlan(request(`/api/workspaces/${account.id}/plan-request`, { plan: 'pro' }), route(account.id))).status).toBe(401);
  });
});

describe('admin content on the server', () => {
  const posts = [{ id: 'p1', slug: 'hello', title: 'Hello', isPublished: true }, { id: 'p2', slug: 'draft', title: 'Draft', isPublished: false }];

  it('publishes blog posts to visitors, without drafts', async () => {
    expect((await saveBlog(request('/api/admin/blog', { posts }, 'PUT'))).status).toBe(401);
    expect((await saveBlog(request('/api/admin/blog', { posts }, 'PUT', true))).status).toBe(200);
    const body = await (await readBlog()).json();
    expect(body.posts.map((post: { slug: string }) => post.slug)).toEqual(['hello']);
  });

  it('shares hidden templates, and records admin changes in the audit log', async () => {
    expect((await saveSettings(request('/api/admin/settings', { disabledTemplates: ['dark-tech'] }, 'PUT'))).status).toBe(401);
    await saveSettings(request('/api/admin/settings', { disabledTemplates: ['dark-tech'] }, 'PUT', true));
    const { site } = await (await readPlans()).json();
    expect(site.disabledTemplates).toEqual(['dark-tech']);
    expect((await readAudit(request('/api/admin/audit'))).status).toBe(401);
    const { logs } = await (await readAudit(request('/api/admin/audit', undefined, 'GET', true))).json();
    expect(logs.some((log: { action: string }) => log.action === 'UPDATE_SITE_SETTINGS')).toBe(true);
  });
});
