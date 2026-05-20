export type BannerPosition = 'home_top' | 'home_middle' | 'category_page';

export interface Banner {
  id: number | string;
  title: string;
  imageDesktopUrl: string;
  imageMobileUrl?: string | null;
  targetUrl?: string | null;
  position: BannerPosition;
  sortOrder: number;
  isActive: boolean;
  startAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerPayload {
  title: string;
  imageDesktopUrl: string;
  imageMobileUrl?: string;
  targetUrl?: string;
  position: BannerPosition;
  sortOrder?: number;
  isActive?: boolean;
}

// ─── Blog ─────────────────────────────────────────────────────────────────────

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogCategory {
  id: string | number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  postCount?: number;
}

export interface BlogPostAuthor {
  name: string | null;
}

export interface BlogPostCategoryRef {
  id: string | number;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string | number;
  categoryId: string | number;
  authorId: string | number;
  title: string;
  slug: string;
  excerpt?: string | null;
  contentHtml?: string;
  thumbnailUrl?: string | null;
  coverImageUrl?: string | null;
  tags: string[];
  isFeatured: boolean;
  viewCount: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  status: BlogPostStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: BlogPostCategoryRef | null;
  author?: BlogPostAuthor | null;
}

export interface BlogPostListResponse {
  data: BlogPost[];
  meta: { total: number; page: number; limit: number; lastPage: number };
}

export interface CreateBlogPostPayload {
  title: string;
  slug: string;
  excerpt?: string;
  contentHtml?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  tags?: string[];
  isFeatured?: boolean;
  categoryId: number;
  status?: BlogPostStatus;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

export interface CreateBlogCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}