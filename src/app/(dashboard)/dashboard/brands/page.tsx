'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api';
import BrandsService from '@/services/brands.service';
import { Brand } from '@/types/master.types';
import BrandModal from '@/components/module/brand/BrandModal';

// TODO: Pastikan Anda menyesuaikan nama komponen modal ini di file Anda
// import BrandModal from './BrandModal'; 

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const data = await BrandsService.getAll(); 
      setBrands(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleDelete = async (id: string | number) => {
    if (!confirm('Apakah kamu yakin ingin menghapus brand ini?')) return;
    try {
      await BrandsService.delete(id);
      toast.success('Brand berhasil dihapus');
      fetchBrands();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Brand" 
        description="Atur data brand untuk produk Anda."
        icon={Tag}
        actions={
          <Button onClick={() => { setSelectedBrand(null); setIsModalOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Brand
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium w-32 text-center">Logo</th>
                <th className="px-6 py-4 font-medium">Detail Brand</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Memuat data brand...</td></tr>
              ) : brands.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Belum ada brand.</td></tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="relative h-16 w-16 mx-auto rounded-md overflow-hidden bg-gray-100 border flex items-center justify-center">
                        {brand.logoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={brand.logoUrl} alt={brand.name} className="object-contain p-1 w-full h-full" />
                        ) : (
                          <span className="text-[10px] text-gray-400">No Logo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="font-medium text-gray-900">{brand.name}</div>
                      <div className="text-xs text-gray-500">Slug: {brand.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 items-center">
                        <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600" onClick={() => { setSelectedBrand(brand); setIsModalOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(brand.id)}>
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

      {/* Catatan: Pastikan Anda telah mengubah komponen BannerModal menjadi BrandModal */}
      <BrandModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchBrands} 
        initialData={selectedBrand} 
      />      
    </div>
  );
}