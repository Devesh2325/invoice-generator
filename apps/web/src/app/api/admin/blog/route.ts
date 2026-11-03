import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type { BlogPost } from '@invoice/core';
import { PlatformStore } from '@/lib/server/platform-store';
import { clientIp, handleErrors, isAdminRequest, json, unauthorized } from '@/lib/server/api-helpers';
import { writeAudit } from '@/lib/server/settings';

const BodySchema = z.object({
  posts: z.array(z.object({ id: z.string(), slug: z.string(), title: z.string(), isPublished: z.boolean() }).passthrough()).max(500),
});

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  return handleErrors(async () => {
    const record = await PlatformStore.get<{ posts: BlogPost[] }>('settings_blog');
    return json({ posts: record?.data.posts ?? null });
  });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) return unauthorized();
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Please check the post.' }, 400);
  return handleErrors(async () => {
    await PlatformStore.put('settings_blog', 'settings', parsed.data);
    await writeAudit('UPDATE_BLOG', `${parsed.data.posts.length} posts`, clientIp(request));
    return json({ ok: true });
  });
}
