"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/components/module/product/ProductForm";
import { ProductFormValues } from "@/lib/validators/product";
import { toast } from "sonner";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { Brand, Category } from "@/types/master.types";
import CategoriesService from "@/services/categories.service";
import BrandsService from "@/services/brands.service";

export default function CreateProductPage() {
    const router = useRouter();
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    
    useEffect(() => {
        // Ambil data dari service yang sudah kita buat sebelumnya
        CategoriesService.getAll().then(setCategories);
        BrandsService.getAll().then(setBrands);
    }, []);

    const handleCreate = async (data: ProductFormValues) => {
        const toastId = toast.loading("Membuat produk baru...");

        try {
        await api.post("/products", data);

        toast.success("Produk berhasil dibuat!", {
            id: toastId,
        });

        router.push("/dashboard/products"); 
        } catch (error: any) {
        console.error("Create error:", error);
        
        const errorMessage = error.response?.data?.message || "Gagal membuat produk";
        
        toast.error(errorMessage, {
            id: toastId,
        });
        }
    };

    return (
        <div className="container mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Tambah Produk Baru
        </h1>
        
        <div className="max-w-4xl mx-auto">
            <ProductForm 
                onSubmit={handleCreate} 
                categories={categories} 
                brands={brands}
            />
        </div>
        </div>
    );
}