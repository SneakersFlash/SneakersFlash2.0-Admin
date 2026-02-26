/**
 * src/services/products.service.ts
 */
import api from '@/lib/api';
import type { Product, CreateProductDto, UpdateProductDto, ProductFilters } from '@/types/product.types';
import type { Category, CreateCategoryDto } from '@/types/product.types';
import type { PaginatedResponse, PaginationParams } from '@/types/api.types';

const ProductService = {
  // ─── Products ──────────────────────────────────────────────────────────────

  async getAll(params?: PaginationParams & ProductFilters): Promise<PaginatedResponse<Product>> {
    const { data } = await api.get<PaginatedResponse<Product>>('/products/admin', { params });
    return data;
  },

  async getById(id: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },

  async create(dto: CreateProductDto): Promise<Product> {
    const { data } = await api.post<Product>('/products', dto);
    return data;
  },

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const { data } = await api.patch<Product>(`/products/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ url: string }>('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },

  // ─── Categories ────────────────────────────────────────────────────────────

  async getCategories(): Promise<Category[]> {
    const { data } = await api.get<Category[]>('/categories');
    return data;
  },

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const { data } = await api.post<Category>('/categories', dto);
    return data;
  },

  async updateCategory(id: string, dto: Partial<CreateCategoryDto>): Promise<Category> {
    const { data } = await api.patch<Category>(`/categories/${id}`, dto);
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};

export default ProductService;
