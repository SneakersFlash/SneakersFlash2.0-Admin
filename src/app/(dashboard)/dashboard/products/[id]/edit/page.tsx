"use client";

import { useEffect, useState, use } from "react"; 
import { useRouter } from "next/navigation"; // PENTING: Gunakan ini untuk App Router
import ProductForm from "@/components/module/product/ProductForm";
import { ProductFormValues } from "@/lib/validators/product";
import { toast } from "sonner";
import api from "@/lib/api"; // Gunakan instance axios yang sudah dibuat
import CategoriesService from "@/services/categories.service";
import BrandsService from "@/services/brands.service";
import { Brand, Category } from "@/types/master.types";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditPageProps) {
  // 1. Unwrap params (Next.js 15)
  const { id } = use(params); 
  
  // 2. Init Router Hook
  const router = useRouter();

  const [productData, setProductData] = useState<ProductFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    CategoriesService.getAll().then(setCategories);
    BrandsService.getAll().then(setBrands);
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        const data = response.data;
        
        const formattedData = {
            ...data,
            basePrice: Number(data.basePrice),
            weightGrams: Number(data.weightGrams),
            categoryId: Number(data.categoryId),
            brandId: data.brandId ? Number(data.brandId) : 0,
            variants: data.variants.map((v: any) => ({
                ...v,
                price: Number(v.price),
                stockQuantity: Number(v.stockQuantity)
            }))
        };

        setProductData(formattedData);
      } catch (error: any) {
        console.error("Error fetching product:", error);
        toast.error("Gagal mengambil data produk.");
        router.push('/dashboard/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]); 


  const handleUpdate = async (data: ProductFormValues) => {
    if (!id) {
        toast.error("ID Produk tidak valid.");
        return;
    }

    const toastId = toast.loading("Menyimpan perubahan...");

    try {
        await api.patch(`/products/${id}`, data);

        toast.success("Produk berhasil diupdate!", {
            id: toastId,
        });

        router.push('/dashboard/products'); 
        
    } catch (error: any) {
        console.error("Update error:", error);

        const errorMessage = error.response?.data?.message || "Gagal mengupdate produk";
        
        toast.error(errorMessage, {
            id: toastId,
        });
    }
  };

  if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <p className="text-gray-500">Memuat data produk...</p>
        </div>
      );
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Produk (ID: {id})</h1>
      
      {productData ? (
        <ProductForm 
          initialData={productData} 
          onSubmit={handleUpdate} 
          categories={categories} 
          brands={brands}
        />
      ) : (
        <div className="text-center text-red-500">
            Data produk tidak ditemukan.
        </div>
      )}
    </div>
  );
}