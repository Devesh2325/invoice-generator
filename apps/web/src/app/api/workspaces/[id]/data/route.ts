import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { canAccessWorkspace, handleErrors, json } from '@/lib/server/api-helpers';
import { DATA_COLLECTIONS, listItems, putItem } from '@/lib/server/workspace-data';

export const dynamic = 'force-dynamic';

const MAX_ITEM_BYTES = 3_000_000;
const WriteSchema = z.object({
  items: z
    .array(
      z.object({
        collection: z.enum(DATA_COLLECTIONS),
        id: z.string().min(1).max(200),
        deleted: z.boolean().optional(),
        data: z.unknown().optional(),
      })
    )
    .max(100),
});

/** Everything changed since the last sync. Takes the time first, so a change made during the read isn't missed next time. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await canAccessWorkspace(request, params.id))) return json({ error: 'Please sign in.' }, 401);
  return handleErrors(async () => {
    const serverTime = new Date().toISOString();
    const since = new URL(request.url).searchParams.get('since') || undefined;
    return json({ items: await listItems(params.id, since), serverTime });
  });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await canAccessWorkspace(request, params.id))) return json({ error: 'Please sign in.' }, 401);
  const parsed = WriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Invalid data.' }, 400);
  return handleErrors(async () => {
    const updatedAt = new Date().toISOString();
    const rejected: string[] = [];
    for (const item of parsed.data.items) {
      if (!item.deleted && JSON.stringify(item.data ?? null).length > MAX_ITEM_BYTES) {
        rejected.push(`${item.collection}:${item.id}`);
        continue;
      }
      await putItem(params.id, {
        collection: item.collection,
        id: item.id,
        updatedAt,
        ...(item.deleted ? { deleted: true } : { data: item.data }),
      });
    }
    return json({ ok: true, rejected });
  });
}
