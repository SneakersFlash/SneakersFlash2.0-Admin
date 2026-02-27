'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Image as ImageIcon, Link as LinkIcon, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import BannersService from '@/services/banners.service';
import type { Banner } from '@/types/cms.types';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getErrorMessage } from '@/lib/api';
import BannerModal from '@/components/module/banner/BannerModal';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      const data = await BannersService.getAllAdmin();
      setBanners(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id: string | number) => {
    if (!confirm('Apakah kamu yakin ingin menghapus banner ini?')) return;
    try {
      await BannersService.delete(id);
      toast.success('Banner berhasil dihapus');
      fetchBanners();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleOpenAddModal = () => {
    setSelectedBanner(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsModalOpen(true);
  };

  const toggleStatus = async (id: string | number, currentStatus: boolean) => {
    try {
      // Optimistic update di UI
      setBanners(banners.map(b => b.id === id ? { ...b, isActive: !currentStatus } : b));
      await BannersService.update(id, { isActive: !currentStatus });
      toast.success('Status banner diperbarui');
    } catch (error) {
      toast.error(getErrorMessage(error));
      fetchBanners(); // Rollback jika error
    }
  };

  // Helper untuk memformat nama posisi
  const formatPosition = (pos: string) => {
    return pos.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Banner" 
        description="Atur gambar banner promo yang akan tampil di halaman beranda pelanggan."
        icon={ImageIcon}
        actions={
          <Button onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Banner
          </Button>
        }
      />

      <Card className="p-0 overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium w-48">Gambar Desktop</th>
                <th className="px-6 py-4 font-medium">Informasi Banner</th>
                <th className="px-6 py-4 font-medium text-center">Posisi & Urutan</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat data banner...</td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada banner yang ditambahkan.</td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50/50 transition-colors">
                    
                    {/* Kolom 1: Gambar */}
                    <td className="px-6 py-4">
                      {/* Pastikan parent div memiliki class 'relative' agar 'fill' pada Image berfungsi dengan baik */}
                      <div className="h-20 w-40 rounded-md overflow-hidden bg-gray-100 border relative flex items-center justify-center">
                        <Image 
                          src={banner.imageDesktopUrl} 
                          alt={banner.title} 
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    </td>

                    {/* Kolom 2: Informasi Banner (Judul, Link, Tanggal Dibuat) */}
                    <td className="px-6 py-4 space-y-2">
                      <div className="font-semibold text-gray-900">{banner.title}</div>
                      
                      {banner.targetUrl ? (
                        <div className="flex items-center text-xs text-blue-600 hover:underline">
                          <LinkIcon className="w-3 h-3 mr-1" />
                          <a href={banner.targetUrl} target="_blank" rel="noreferrer" className="truncate max-w-[200px] inline-block">
                            {banner.targetUrl}
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-gray-400">
                          <LinkIcon className="w-3 h-3 mr-1" /> Tanpa Tautan
                        </div>
                      )}

                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(banner.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </td>

                    {/* Kolom 3: Posisi dan Urutan Sortir */}
                    <td className="px-6 py-4 text-center space-y-2">
                      <div>
                        <Badge variant="outline" className="bg-gray-50">
                          {formatPosition(banner.position)}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        Urutan: <span className="font-bold text-gray-900">{banner.sortOrder}</span>
                      </div>
                    </td>

                    {/* Kolom 4: Toggle Status */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Switch 
                          checked={banner.isActive} 
                          onCheckedChange={() => toggleStatus(banner.id, banner.isActive)} 
                        />
                        <span className={`text-[10px] font-medium uppercase ${banner.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                          {banner.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </td>

                    {/* Kolom 5: Aksi */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 items-center">
                        <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleOpenEditModal(banner)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(banner.id)}
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
      
      <BannerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchBanners} 
        initialData={selectedBanner} 
      />
    </div>
  );
}