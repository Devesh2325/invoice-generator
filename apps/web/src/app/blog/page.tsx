'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { BlogApi, SEEDED_BLOG_POSTS } from '@invoice/api';
import { BlogPost } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Search, Clock, ArrowRight, User, FilePlus } from 'lucide-react';
import { APP_CONFIG } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { loadPublishedBlog } from '@/lib/platform/blog-sync';

export default function BlogIndexPage() {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    try {
      return BlogApi.getPublishedPosts();
    } catch {
      return SEEDED_BLOG_POSTS;
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const refresh = () => {
      try {
        setPosts(BlogApi.getPublishedPosts());
      } catch {}
    };
    refresh();
    void loadPublishedBlog();
    window.addEventListener('invoxa-blog-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('invoxa-blog-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const categories = ['all', 'GST & Taxes', 'Fintech & Payments', 'Billing Guides', 'Business Growth'];

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        search === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [posts, selectedCategory, search]);

  const featured = posts.find((p) => p.featured) || posts[0];

  return (
    <div className="min-h-screen text-foreground flex flex-col font-sans">
      <PublicHeader />

      <main className="w-full min-w-0 max-w-6xl mx-auto px-4 sm:px-8 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-sm">{APP_CONFIG.brandName} Knowledge Base</Badge>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
            Invoicing, Tax Compliance & Fintech Guides
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Practical insights on GST law, digital payment rails, multi-currency accounting, and business cash-flow management.
          </p>
        </div>

        {/* Featured Post Card */}
        {featured && (
          <div className="rounded-xl border border-border bg-card p-6 sm:p-10 shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-2.5">
                <Badge variant="default" className="text-sm font-bold">
                  Featured Guide
                </Badge>
                <span className="text-sm text-primary font-semibold">{featured.category}</span>
                <span className="text-sm text-muted-foreground">• {featured.readingTimeMinutes} min read</span>
              </div>

              <Link href={`/blog/${featured.slug}`}>
                <h2 className="text-2xl sm:text-3xl font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {featured.title}
                </h2>
              </Link>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {featured.excerpt}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-7 w-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                    {featured.author.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{featured.author.name}</div>
                    <div className="text-sm text-muted-foreground">{featured.author.role}</div>
                  </div>
                </div>

                <Link href={`/blog/${featured.slug}`}>
                  <Button size="sm" className="text-sm font-bold">
                    Read Article <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat === 'all' ? 'All Guides' : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guides, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="border-border bg-card rounded-xl hover:shadow-lg transition-all flex flex-col justify-between group p-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-primary">{post.category}</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {post.readingTimeMinutes}m
                  </span>
                </div>

                <Link href={`/blog/${post.slug}`}>
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                    {post.title}
                  </h3>
                </Link>

                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-sm">
                <div className="text-muted-foreground text-sm">
                  By {post.author.name}
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-primary font-bold flex items-center gap-1 group-hover:underline text-sm"
                >
                  Read <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Clear Next-Step Action Banner */}
        <div className="p-8 sm:p-10 rounded-xl bg-muted/30 border border-border text-center space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Put these guides into practice</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Create high-precision GST invoices with automatic tax splitting and verified UPI QR codes right now.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/create">
              <Button size="sm" className="font-bold text-sm bg-primary text-primary-foreground">
                <FilePlus className="w-3.5 h-3.5 mr-1.5" /> Create Invoice Free
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="outline" size="sm" className="font-bold text-sm">
                Browse Templates
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
