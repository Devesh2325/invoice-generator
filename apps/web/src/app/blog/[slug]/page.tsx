'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { BlogApi, SEEDED_BLOG_POSTS } from '@invoice/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  ArrowLeft,
  Clock,
  Share2,
  Bookmark,
  CheckCircle2,
  FileText,
  Copy,
} from 'lucide-react';

export default function BlogPostPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug as string);

  const post = useMemo(() => {
    try {
      return BlogApi.getPostBySlug(slug) || SEEDED_BLOG_POSTS.find((p) => p.slug === slug);
    } catch {
      return SEEDED_BLOG_POSTS.find((p) => p.slug === slug);
    }
  }, [slug]);

  if (!post) {
    notFound();
  }

  const relatedPosts = useMemo(() => {
    return SEEDED_BLOG_POSTS.filter((p) => p.id !== post.id).slice(0, 2);
  }, [post.id]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/blog" className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-primary tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>BillCraft</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare} className="text-xs">
            <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share
          </Button>
          <Link href="/create">
            <Button size="sm" className="text-xs font-bold">Create Invoice</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-10">
        {/* Article Header */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Badge variant="outline" className="text-xs font-semibold text-primary">{post.category}</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {post.readingTimeMinutes} min read
            </span>
            <span className="text-xs text-muted-foreground">• Published {post.publishedAt}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
            {post.title}
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <div className="h-10 w-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
              {post.author.name[0]}
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-foreground">{post.author.name}</div>
              <div className="text-muted-foreground">{post.author.role}</div>
            </div>
          </div>
        </div>

        {/* Article Body */}
        <article className="prose dark:prose-invert max-w-none text-sm text-foreground/90 leading-relaxed space-y-6 border-y border-border py-8">
          <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
            {post.content}
          </div>
        </article>

        {/* In-Article Conversion Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold text-base text-foreground">
              Put this knowledge to work with BillCraft
            </h3>
            <p className="text-xs text-muted-foreground">
              Generate 100% compliant GST invoices with automated CGST/SGST splits and scannable UPI QR codes in 60 seconds.
            </p>
          </div>
          <Link href="/create" className="shrink-0">
            <Button size="sm" className="font-bold text-xs px-5 shadow-sm">
              Create Invoice Now
            </Button>
          </Link>
        </div>

        {/* Related Articles */}
        <div className="space-y-4 pt-6">
          <h3 className="font-bold text-lg text-foreground">Related Guides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedPosts.map((rel) => (
              <Card key={rel.id} className="p-4 rounded-xl border-border bg-card space-y-2 hover:border-primary/50 transition-colors">
                <span className="text-[10px] font-bold text-primary uppercase">{rel.category}</span>
                <Link href={`/blog/${rel.slug}`}>
                  <h4 className="font-bold text-xs text-foreground hover:underline line-clamp-2">
                    {rel.title}
                  </h4>
                </Link>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{rel.excerpt}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 BillCraft Knowledge Hub. Educational tax and business resources.
      </footer>
    </div>
  );
}
