'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, FolderTree, ArrowLeft, ImageOff } from 'lucide-react';
import { toast } from 'sonner';
import BlogService from '@/services/blog.service';
import type { BlogCategory } from '@/types/cms.types';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { getErrorMessage } from '@/lib/api';
import BlogCategoryModal from '@/components/module/blog/BlogCategoryModal';

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setCategories(await BlogService.getCategories());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: BlogCategory) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Apakah kamu yakin ingin menghapus kategori ini?')) return;
    try {
      await BlogService.deleteCategory(id);
      toast.success('Kategori berhasil dihapus');
      fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggleStatus = async (category: BlogCategory) => {
    try {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, isActive: !c.isActive } : c,
        ),
      );
      await BlogService.updateCategory(category.id, {
        isActive: !category.isActive,
      });
      toast.success('Status kategori diperbarui');
    } catch (error) {
      toast.error(getErrorMessage(error));
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/blog"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Artikel
      </Link>

      <PageHeader
        title="Kategori Blog"
        description="Kelompokkan artikel: Berita, Rilis, Interview, dan lainnya."
        icon={FolderTree}
        actions={
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium w-24">Gambar</th>
                <th className="px-6 py-4 font-medium">Nama Kategori</th>
                <th className="px-6 py-4 font-medium">Slug</th>
                <th className="px-6 py-4 font-medium text-center">Urutan</th>
                <th className="px-6 py-4 font-medium text-center">Artikel</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Memuat data kategori...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Belum ada kategori blog.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-gray-100 border flex items-center justify-center">
                        {category.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <ImageOff className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                          {category.description}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      /{category.slug}
                    </td>

                    <td className="px-6 py-4 text-center font-mono text-gray-700">
                      {category.sortOrder}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {category.postCount ?? 0}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() => toggleStatus(category)}
                        />
                        <span
                          className={`text-[10px] font-medium uppercase ${
                            category.isActive ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {category.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => handleEdit(category)}
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <BlogCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCategories}
        initialData={selectedCategory}
      />
    </div>
  );
}
