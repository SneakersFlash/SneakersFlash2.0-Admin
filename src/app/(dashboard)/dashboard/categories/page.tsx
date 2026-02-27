'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Tags } from 'lucide-react';
import { toast } from 'sonner';
import CategoriesService from '@/services/categories.service';
import type { Category } from '@/types/master.types';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api';
// IMPORT KOMPONEN MODAL YANG BARU DIBUAT
import CategoryModal from '@/components/module/category/CategoryModal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // STATE UNTUK MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await CategoriesService.getAll();
      setCategories(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string | number) => {
    if (!confirm('Apakah kamu yakin ingin menghapus kategori ini?')) return;
    try {
      await CategoriesService.delete(id);
      toast.success('Kategori berhasil dihapus');
      fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  // Fungsi untuk membuka modal Tambah
  const handleOpenAddModal = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  // Fungsi untuk membuka modal Edit
  const handleOpenEditModal = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Kategori" 
        description="Kelola kategori produk yang tersedia di toko."
        icon={Tags}
        actions={
          <Button onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">Nama Kategori</th>
                <th className="px-6 py-4 font-medium">Slug</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Memuat data kategori...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Belum ada data kategori.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 text-gray-500">{category.slug}</td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600"
                        onClick={() => handleOpenEditModal(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RENDER MODAL */}
      <CategoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCategories} 
        initialData={selectedCategory} 
        categories={categories} // <--- TAMBAHKAN BARIS INI
      />
    </div>
  );
}