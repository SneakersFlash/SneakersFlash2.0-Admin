// lib/validators/product.ts
import { z } from "zod";

// Schema Varian (Child)
export const productVariantSchema = z.object({
    sku: z.string().min(1, "SKU wajib diisi"),
    price: z.coerce.number().min(0, "Harga minimal 0"), // coerce mengubah string input ke number
    stockQuantity: z.coerce.number().min(0, "Stok minimal 0"),
    imageUrl: z.array(z.string().url("Invalid URL")).optional().default([]),
});

// Schema Produk (Parent)
export const productSchema = z.object({
    categoryId: z.coerce.number().min(1, "Kategori wajib dipilih"),
    brandId: z.coerce.number().optional(),
    name: z.string().min(1, "Nama produk wajib diisi"),
    description: z.string().optional(),
    basePrice: z.coerce.number().min(0, "Harga dasar minimal 0"),
    weightGrams: z.coerce.number().min(1, "Berat minimal 1 gram"),
    // Nested Array Validation
    variants: z
        .array(productVariantSchema)
        .min(1, "Minimal harus ada 1 varian produk"),
});

export type ProductFormValues = z.infer<typeof productSchema>;