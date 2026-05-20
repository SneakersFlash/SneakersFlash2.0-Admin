import api from '@/lib/api';
import type {
  BlogCategory,
  BlogPost,
  BlogPostListResponse,
  BlogPostStatus,
  CreateBlogCategoryPayload,
  CreateBlogPostPayload,
} from '@/types/cms.types';

export interface AdminPostQuery {
  page?: number;
  limit?: number;
  status?: BlogPostStatus;
  category?: string;
  search?: string;
}

const BlogService = {
  // ─── Artikel ────────────────────────────────────────────────────────────────
  async getPosts(query: AdminPostQuery = {}): Promise<BlogPostListResponse> {
    const { data } = await api.get<BlogPostListResponse>('/blog/admin/posts', {
      params: query,
    });
    return data;
  },

  async getPost(id: string | number): Promise<BlogPost> {
    const { data } = await api.get<BlogPost>(`/blog/admin/posts/${id}`);
    return data;
  },

  async createPost(payload: CreateBlogPostPayload): Promise<BlogPost> {
    const { data } = await api.post<BlogPost>('/blog/posts', payload);
    return data;
  },

  async updatePost(
    id: string | number,
    payload: Partial<CreateBlogPostPayload>,
  ): Promise<BlogPost> {
    const { data } = await api.patch<BlogPost>(`/blog/posts/${id}`, payload);
    return data;
  },

  async deletePost(id: string | number): Promise<void> {
    await api.delete(`/blog/posts/${id}`);
  },

  // ─── Kategori ───────────────────────────────────────────────────────────────
  async getCategories(): Promise<BlogCategory[]> {
    const { data } = await api.get<BlogCategory[]>('/blog/admin/categories');
    return data;
  },

  async createCategory(
    payload: CreateBlogCategoryPayload,
  ): Promise<BlogCategory> {
    const { data } = await api.post<BlogCategory>('/blog/categories', payload);
    return data;
  },

  async updateCategory(
    id: string | number,
    payload: Partial<CreateBlogCategoryPayload>,
  ): Promise<BlogCategory> {
    const { data } = await api.patch<BlogCategory>(
      `/blog/categories/${id}`,
      payload,
    );
    return data;
  },

  async deleteCategory(id: string | number): Promise<void> {
    await api.delete(`/blog/categories/${id}`);
  },
};

export default BlogService;
