import type { BlogPost } from '@invoice/core';

const KEY = 'billcraft_blog_posts';

/** Copies the blog from the server into the storage BlogApi reads, then tells open pages to refresh. */
export async function loadPublishedBlog(): Promise<void> {
  try {
    const res = await fetch('/api/platform/blog', { cache: 'no-store' });
    const { posts } = (await res.json()) as { posts: BlogPost[] | null };
    if (!posts) return;
    const next = JSON.stringify(posts);
    if (window.localStorage.getItem(KEY) !== next) {
      window.localStorage.setItem(KEY, next);
      window.dispatchEvent(new Event('invoxa-blog-updated'));
    }
  } catch {
    // Keep what this browser has.
  }
}
