import { BlogPost } from '@invoice/core';
export declare const SEEDED_BLOG_POSTS: BlogPost[];
export declare class BlogApi {
    private static getStorageKey;
    static getPosts(): BlogPost[];
    static getPublishedPosts(): BlogPost[];
    static getPostBySlug(slug: string): BlogPost | undefined;
    static savePost(post: BlogPost): BlogPost;
    static deletePost(id: string): boolean;
}
