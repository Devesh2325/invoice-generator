export type BlogCategory =
  | 'Billing Guides'
  | 'GST & Taxes'
  | 'Fintech & Payments'
  | 'Business Growth'
  | 'Product Updates'
  | (string & {});

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown or rich text
  coverImage?: string;
  category: BlogCategory;
  tags: string[];
  author: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  isPublished: boolean;
  featured?: boolean;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}
