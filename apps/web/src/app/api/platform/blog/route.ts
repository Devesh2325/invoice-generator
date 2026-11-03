import { NextResponse } from 'next/server';
import type { BlogPost } from '@invoice/core';
import { PlatformStore } from '@/lib/server/platform-store';

export const dynamic = 'force-dynamic';

/** Published posts for visitors. `null` means the admin hasn't changed anything, so the built-in posts apply. */
export async function GET() {
  try {
    const record = await PlatformStore.get<{ posts: BlogPost[] }>('settings_blog');
    return NextResponse.json({ posts: record ? record.data.posts.filter((post) => post.isPublished) : null });
  } catch {
    return NextResponse.json({ posts: null });
  }
}
