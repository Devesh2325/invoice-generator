'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BlogApi } from '@invoice/api';
import { BlogPost, APP_CONFIG } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle,
  FileText,
  Sparkles,
  Save,
  Image as ImageIcon,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Table,
  Link2,
  Minus,
  Tag,
  User as UserIcon,
} from 'lucide-react';

export default function AdminBlogPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'preview' | 'seo'>('content');

  const loadPosts = () => {
    setPosts(BlogApi.getPosts());
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const COVER_PRESETS = [
    { label: 'Fintech & Cards', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Accounting & Tax', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Modern Office', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Cloud Tech', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80' },
  ];

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('blog-content-textarea') as HTMLTextAreaElement | null;
    if (!textarea || !editingPost) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editingPost.content.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent =
      editingPost.content.substring(0, start) + replacement + editingPost.content.substring(end);
    setEditingPost({ ...editingPost, content: newContent });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected || 'text').length
      );
    }, 50);
  };

  const handleCreateNew = () => {
    const newPost: BlogPost = {
      id: `post_${Date.now()}`,
      slug: '',
      title: '',
      excerpt: '',
      category: 'GST & Taxes',
      tags: ['Invoicing'],
      author: {
        name: `${APP_CONFIG.brandName} Editorial`,
        role: 'Tax & Product Specialist',
      },
      publishedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      readingTimeMinutes: 5,
      isPublished: true,
      featured: false,
      seo: {
        metaTitle: '',
        metaDescription: '',
        keywords: [],
      },
      content: '# New Article Title\n\nWrite your informative post content in Markdown here...',
    };
    setEditingPost(newPost);
    setIsCreatingNew(true);
    setActiveTab('content');
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost({ ...post });
    setIsCreatingNew(false);
    setActiveTab('content');
  };

  const handleSave = () => {
    if (!editingPost) return;
    if (!editingPost.title.trim() || !editingPost.slug.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Post Title and URL Slug are required.',
        variant: 'destructive',
      });
      return;
    }

    // Auto-fill SEO if empty
    const sanitizedPost: BlogPost = {
      ...editingPost,
      seo: {
        metaTitle: editingPost.seo?.metaTitle || editingPost.title,
        metaDescription: editingPost.seo?.metaDescription || editingPost.excerpt,
        keywords: editingPost.seo?.keywords || editingPost.tags,
      },
    };

    BlogApi.savePost(sanitizedPost);
    loadPosts();
    setEditingPost(null);
    toast({
      title: 'Post Saved',
      description: `"${sanitizedPost.title}" has been saved.`,
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      BlogApi.deletePost(id);
      loadPosts();
      toast({
        title: 'Post Deleted',
        description: 'The blog article has been removed.',
      });
    }
  };

  const handleTitleChange = (title: string) => {
    if (!editingPost) return;
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    setEditingPost((prev) =>
      prev
        ? {
            ...prev,
            title,
            slug: isCreatingNew || !prev.slug ? generatedSlug : prev.slug,
          }
        : null
    );
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-primary" />
            Blog & Content Manager
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Author and publish educational guides, GST tutorials, release notes, and SEO articles.
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Blog Post
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search articles by title, category, or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-xs h-9 w-full"
          />
        </div>
        <Badge variant="outline" className="text-xs bg-slate-950 border-slate-800 text-slate-400">
          {filteredPosts.length} Articles
        </Badge>
      </div>

      {/* Posts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Title & Excerpt</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Author</th>
                <th className="py-3.5 px-4">Published</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{post.title}</span>
                      {post.featured && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-300 py-0">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                      /blog/{post.slug}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge variant="outline" className="text-[11px] bg-slate-800 border-slate-700 text-slate-300">
                      {post.category}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-300">{post.author?.name || 'Staff'}</div>
                    <div className="text-[10px] text-slate-500">{post.readingTimeMinutes || 5} min read</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                    {post.publishedAt}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        post.isPublished
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {post.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-400 hover:text-white">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(post)}
                        className="h-7 px-2 text-xs text-primary hover:text-primary-hover"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(post.id, post.title)}
                        className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {editingPost && (
        <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center justify-between">
                <span>{isCreatingNew ? 'Create New Article' : 'Edit Article'}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPost.isPublished}
                      onChange={(e) =>
                        setEditingPost((prev) => (prev ? { ...prev, isPublished: e.target.checked } : null))
                      }
                      className="rounded border-slate-700 bg-slate-950 text-primary h-4 w-4"
                    />
                    Published
                  </label>
                  <label className="flex items-center gap-2 text-xs text-amber-300 cursor-pointer ml-3">
                    <input
                      type="checkbox"
                      checked={editingPost.featured}
                      onChange={(e) =>
                        setEditingPost((prev) => (prev ? { ...prev, featured: e.target.checked } : null))
                      }
                      className="rounded border-slate-700 bg-slate-950 text-amber-500 h-4 w-4"
                    />
                    Featured
                  </label>
                </div>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Craft markdown articles with custom categories, authors, and SEO meta tags.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'content'
                      ? 'bg-primary text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Article Editor
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-primary text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Preview Formatted Content
                </button>
                <button
                  onClick={() => setActiveTab('seo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'seo'
                      ? 'bg-primary text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SEO & Meta Fields
                </button>
              </div>

              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Article Title *
                      </label>
                      <Input
                        value={editingPost.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g. Master GST Invoicing in 2026"
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        URL Slug *
                      </label>
                      <Input
                        value={editingPost.slug}
                        onChange={(e) =>
                          setEditingPost((prev) => (prev ? { ...prev, slug: e.target.value } : null))
                        }
                        placeholder="master-gst-invoicing-2026"
                        className="bg-slate-950 border-slate-800 text-white font-mono text-xs h-9"
                      />
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-primary" />
                        Article Cover Hero Image
                      </label>
                      <span className="text-[10px] text-slate-500">Unsplash or Custom URL</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingPost.coverImage || ''}
                        onChange={(e) =>
                          setEditingPost((prev) => (prev ? { ...prev, coverImage: e.target.value } : null))
                        }
                        placeholder="https://images.unsplash.com/photo-..."
                        className="bg-slate-900 border-slate-700 text-white text-xs h-8 flex-1"
                      />
                      {editingPost.coverImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingPost((prev) => (prev ? { ...prev, coverImage: '' } : null))}
                          className="h-8 text-[11px] text-rose-400 hover:bg-rose-950/30"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400">Quick Presets:</span>
                      {COVER_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditingPost((prev) => (prev ? { ...prev, coverImage: p.url } : null))}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    {editingPost.coverImage && (
                      <div className="h-28 w-full rounded-lg overflow-hidden border border-slate-800 mt-2">
                        <img src={editingPost.coverImage} alt="Cover Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Category
                      </label>
                      <select
                        value={editingPost.category}
                        onChange={(e) =>
                          setEditingPost((prev) => (prev ? { ...prev, category: e.target.value as any } : null))
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      >
                        <option value="GST & Taxes">GST & Taxes</option>
                        <option value="Fintech & Payments">Fintech & Payments</option>
                        <option value="Billing Guides">Billing Guides</option>
                        <option value="Business Growth">Business Growth</option>
                        <option value="Accounting">Accounting</option>
                        <option value="Product Updates">Product Updates</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Author Name
                      </label>
                      <Input
                        value={editingPost.author?.name || ''}
                        onChange={(e) =>
                          setEditingPost((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  author: { ...prev.author, name: e.target.value, role: prev.author?.role || 'Author' },
                                }
                              : null
                          )
                        }
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Author Role
                      </label>
                      <Input
                        value={editingPost.author?.role || ''}
                        onChange={(e) =>
                          setEditingPost((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  author: { ...prev.author, role: e.target.value },
                                }
                              : null
                          )
                        }
                        placeholder="e.g. Head of Tax Policy"
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Tags (comma separated)
                      </label>
                      <Input
                        value={editingPost.tags?.join(', ') || ''}
                        onChange={(e) => {
                          const tagList = e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean);
                          setEditingPost((prev) => (prev ? { ...prev, tags: tagList } : null));
                        }}
                        placeholder="GST, Invoicing, Tax, Fintech"
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Reading Time (Minutes)
                      </label>
                      <Input
                        type="number"
                        value={editingPost.readingTimeMinutes || 5}
                        onChange={(e) =>
                          setEditingPost((prev) =>
                            prev ? { ...prev, readingTimeMinutes: Number(e.target.value) } : null
                          )
                        }
                        className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Summary Excerpt
                    </label>
                    <textarea
                      value={editingPost.excerpt}
                      onChange={(e) =>
                        setEditingPost((prev) => (prev ? { ...prev, excerpt: e.target.value } : null))
                      }
                      rows={2}
                      placeholder="Brief excerpt displayed on blog index and card previews..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Markdown Content with Formatting Toolbar */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Markdown Content & Visual Designer
                      </label>
                      {/* Markdown Toolbar */}
                      <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => insertMarkdown('## ', '\n')}
                          title="Heading 2"
                          className="px-1.5 py-1 text-[11px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('### ', '\n')}
                          title="Heading 3"
                          className="px-1.5 py-1 text-[11px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          H3
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('**', '**')}
                          title="Bold Text"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          <Bold className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('*', '*')}
                          title="Italic Text"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          <Italic className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('- ', '\n')}
                          title="Bullet List"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          <List className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('1. ', '\n')}
                          title="Ordered List"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          <ListOrdered className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('> ', '\n')}
                          title="Quote / Callout"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          <Quote className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('```\n', '\n```')}
                          title="Code Block"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          <Code className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('| Feature | Description |\n|---|---|\n| Item 1 | Value 1 |\n')}
                          title="Table"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          <Table className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('[', '](https://...)')}
                          title="Link"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          <Link2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('\n---\n\n')}
                          title="Divider"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      id="blog-content-textarea"
                      value={editingPost.content}
                      onChange={(e) =>
                        setEditingPost((prev) => (prev ? { ...prev, content: e.target.value } : null))
                      }
                      rows={14}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 leading-relaxed placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 max-h-[550px] overflow-y-auto space-y-4 text-xs">
                  {editingPost.coverImage && (
                    <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-800">
                      <img src={editingPost.coverImage} alt="Cover" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-primary/20 text-primary border-primary/30">
                      {editingPost.category}
                    </Badge>
                    <span className="text-slate-500">• {editingPost.readingTimeMinutes || 5} min read</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">{editingPost.title || 'Untitled Post'}</h1>
                  <p className="text-slate-400 italic text-sm">{editingPost.excerpt}</p>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-slate-400">
                    <div className="h-6 w-6 rounded-full bg-primary/30 text-primary flex items-center justify-center font-bold text-[10px]">
                      {editingPost.author?.name ? editingPost.author.name[0] : 'A'}
                    </div>
                    <span>{editingPost.author?.name || 'Author'}</span>
                    {editingPost.author?.role && <span className="text-slate-600">({editingPost.author.role})</span>}
                  </div>
                  <hr className="border-slate-800" />
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-300 font-sans text-xs">
                    {editingPost.content}
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Meta Title
                    </label>
                    <Input
                      value={editingPost.seo?.metaTitle || ''}
                      onChange={(e) =>
                        setEditingPost((prev) =>
                          prev
                            ? {
                                ...prev,
                                seo: {
                                  metaTitle: e.target.value,
                                  metaDescription: prev.seo?.metaDescription || '',
                                  keywords: prev.seo?.keywords || [],
                                },
                              }
                            : null
                        )
                      }
                      placeholder="Custom page title for search engines..."
                      className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Meta Description
                    </label>
                    <textarea
                      value={editingPost.seo?.metaDescription || ''}
                      onChange={(e) =>
                        setEditingPost((prev) =>
                          prev
                            ? {
                                ...prev,
                                seo: {
                                  metaTitle: prev.seo?.metaTitle || '',
                                  metaDescription: e.target.value,
                                  keywords: prev.seo?.keywords || [],
                                },
                              }
                            : null
                        )
                      }
                      rows={3}
                      placeholder="Custom 150-160 character snippet for Google search results..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Tags (Comma Separated)
                    </label>
                    <Input
                      value={editingPost.tags?.join(', ') || ''}
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                        setEditingPost((prev) => (prev ? { ...prev, tags } : null));
                      }}
                      placeholder="GST, Invoicing, Taxes, Compliance"
                      className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPost(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="text-xs font-semibold bg-primary hover:bg-primary-hover text-white flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="h-3.5 w-3.5" /> Save Article
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
