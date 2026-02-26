// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  image?: string;
}

// ─── Product Variant ──────────────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color?: string;
  stock: number;
  sku?: string;
  additionalPrice: number; // price adjustment relative to base
  createdAt: string;
  updatedAt: string;
}

export interface CreateVariantDto {
  size: string;
  color?: string;
  stock: number;
  sku?: string;
  additionalPrice?: number;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  basePrice: number;
  salePrice?: number;
  images: string[];
  status: ProductStatus;
  categoryId: string;
  category: Category;
  variants: ProductVariant[];
  totalStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  brand: string;
  basePrice: number;
  salePrice?: number;
  images?: string[];
  status?: ProductStatus;
  categoryId: string;
  variants: CreateVariantDto[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  lowStock?: boolean;
}
